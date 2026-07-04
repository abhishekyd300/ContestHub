import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

const LANGUAGE_CONFIG = {
  python: {
    label: "Python 3",
    aliases: ["python", "python3", "py", "py3"],
    fileName: "main.py"
  },
  cpp: {
    label: "C++ 17",
    aliases: ["c++", "cpp", "g++"],
    fileName: "main.cpp"
  },
  c: {
    label: "C",
    aliases: ["c", "gcc"],
    fileName: "main.c"
  },
  java: {
    label: "Java 21",
    aliases: ["java"],
    fileName: "Main.java"
  },
  javascript: {
    label: "JavaScript (Node)",
    aliases: ["javascript", "js", "node", "node.js"],
    fileName: "main.js"
  },
  typescript: {
    label: "TypeScript",
    aliases: ["typescript", "ts"],
    fileName: "main.ts"
  },
  go: {
    label: "Go",
    aliases: ["go", "golang"],
    fileName: "main.go"
  },
  rust: {
    label: "Rust",
    aliases: ["rust", "rs"],
    fileName: "main.rs"
  },
  csharp: {
    label: "C#",
    aliases: ["csharp", "c#", "cs", "dotnet"],
    fileName: "Main.cs"
  },
  ruby: {
    label: "Ruby",
    aliases: ["ruby", "rb"],
    fileName: "main.rb"
  },
  php: {
    label: "PHP",
    aliases: ["php"],
    fileName: "main.php"
  },
  kotlin: {
    label: "Kotlin",
    aliases: ["kotlin", "kt"],
    fileName: "Main.kt"
  },
  swift: {
    label: "Swift",
    aliases: ["swift"],
    fileName: "main.swift"
  },
  r: {
    label: "R",
    aliases: ["r", "rlang"],
    fileName: "main.r"
  },
  perl: {
    label: "Perl",
    aliases: ["perl", "pl"],
    fileName: "main.pl"
  }
};

let runtimeCache;
const MAX_OUTPUT_LENGTH = 64000;

function normalizeOutput(value = "") {
  return value.replace(/\r\n/g, "\n").trim();
}

function runnerEndpoint(path) {
  return `${process.env.PISTON_API_URL.replace(/\/$/, "")}/${path}`;
}

function runnerConfigError() {
  const error = new Error(
    "Code runner is not configured. Set PISTON_API_URL in backend/.env to a Piston-compatible API."
  );
  error.status = 503;
  return error;
}

async function loadRuntimes() {
  if (!process.env.PISTON_API_URL) {
    throw runnerConfigError();
  }

  if (runtimeCache) return runtimeCache;

  const response = await fetch(runnerEndpoint("runtimes"));
  if (!response.ok) {
    const error = new Error("Code runner is not reachable");
    error.status = 503;
    throw error;
  }

  runtimeCache = await response.json();
  return runtimeCache;
}

async function findRuntime(language) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    const error = new Error("Unsupported programming language");
    error.status = 400;
    throw error;
  }

  const runtimes = await loadRuntimes();
  const runtime = runtimes.find((item) => {
    const names = [item.language, ...(item.aliases || [])].map((name) => name.toLowerCase());
    return config.aliases.some((alias) => names.includes(alias));
  });

  if (!runtime) {
    const error = new Error(`${config.label} is not available in the configured code runner`);
    error.status = 503;
    throw error;
  }

  return runtime;
}

async function executeOne({ code, language, input }) {
  const config = LANGUAGE_CONFIG[language];
  const runtime = await findRuntime(language);
  const response = await fetch(runnerEndpoint("execute"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: runtime.language,
      version: runtime.version,
      files: [{ name: config.fileName, content: code }],
      stdin: input || "",
      compile_timeout: 10000,
      run_timeout: 5000
    })
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body.message || JSON.stringify(body);
    } catch {
      detail = await response.text().catch(() => "");
    }
    const error = new Error(
      `Code runner rejected the execution request (HTTP ${response.status}${
        detail ? ": " + detail : ""
      })`
    );
    error.status = 503;
    throw error;
  }

  return response.json();
}

function appendChunk(current, chunk) {
  if (current.length >= MAX_OUTPUT_LENGTH) return current;
  return `${current}${chunk}`.slice(0, MAX_OUTPUT_LENGTH);
}

function runProcess(command, args, { cwd, input = "", timeoutMs = 5000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout = appendChunk(stdout, chunk.toString());
    });

    child.stderr.on("data", (chunk) => {
      stderr = appendChunk(stderr, chunk.toString());
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: error.message, code: 1, timedOut });
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code, signal, timedOut });
    });

    child.stdin.end(input);
  });
}

async function prepareLocalExecution(language, code) {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "contesthub-"));
  const isWin = process.platform === "win32";
  const exeName = isWin ? "main.exe" : "main";

  if (language === "python") {
    await fs.writeFile(path.join(workDir, "main.py"), code);
    return { workDir, command: "python", args: ["main.py"] };
  }

  if (language === "cpp") {
    await fs.writeFile(path.join(workDir, "main.cpp"), code);
    const compile = await runProcess(
      "g++",
      ["main.cpp", "-O2", "-std=c++17", "-o", exeName],
      { cwd: workDir, timeoutMs: 10000 }
    );
    if (compile.code !== 0 || compile.timedOut) {
      return { workDir, compileError: compile.timedOut ? "Compilation timed out" : compile.stderr || "Compilation failed" };
    }
    return { workDir, command: path.join(workDir, exeName), args: [] };
  }

  if (language === "c") {
    await fs.writeFile(path.join(workDir, "main.c"), code);
    const compile = await runProcess(
      "gcc",
      ["main.c", "-O2", "-o", exeName],
      { cwd: workDir, timeoutMs: 10000 }
    );
    if (compile.code !== 0 || compile.timedOut) {
      return { workDir, compileError: compile.timedOut ? "Compilation timed out" : compile.stderr || "Compilation failed" };
    }
    return { workDir, command: path.join(workDir, exeName), args: [] };
  }

  if (language === "java") {
    await fs.writeFile(path.join(workDir, "Main.java"), code);
    const compile = await runProcess("javac", ["Main.java"], { cwd: workDir, timeoutMs: 10000 });
    if (compile.code !== 0 || compile.timedOut) {
      return { workDir, compileError: compile.timedOut ? "Compilation timed out" : compile.stderr || "Compilation failed" };
    }
    return { workDir, command: "java", args: ["-cp", workDir, "Main"] };
  }

  if (language === "javascript") {
    await fs.writeFile(path.join(workDir, "main.js"), code);
    return { workDir, command: "node", args: ["main.js"] };
  }

  if (language === "typescript") {
    await fs.writeFile(path.join(workDir, "main.ts"), code);
    // Try ts-node first, fallback to npx tsx
    return { workDir, command: "npx", args: ["tsx", "main.ts"] };
  }

  if (language === "go") {
    await fs.writeFile(path.join(workDir, "main.go"), code);
    return { workDir, command: "go", args: ["run", "main.go"] };
  }

  if (language === "rust") {
    await fs.writeFile(path.join(workDir, "main.rs"), code);
    const compile = await runProcess(
      "rustc",
      ["main.rs", "-o", exeName],
      { cwd: workDir, timeoutMs: 15000 }
    );
    if (compile.code !== 0 || compile.timedOut) {
      return { workDir, compileError: compile.timedOut ? "Compilation timed out" : compile.stderr || "Compilation failed" };
    }
    return { workDir, command: path.join(workDir, exeName), args: [] };
  }

  if (language === "csharp") {
    await fs.writeFile(path.join(workDir, "Main.cs"), code);
    // Use dotnet-script or csi; fallback to Piston if not available
    return { workDir, command: "dotnet-script", args: ["Main.cs"] };
  }

  if (language === "ruby") {
    await fs.writeFile(path.join(workDir, "main.rb"), code);
    return { workDir, command: "ruby", args: ["main.rb"] };
  }

  if (language === "php") {
    await fs.writeFile(path.join(workDir, "main.php"), code);
    return { workDir, command: "php", args: ["main.php"] };
  }

  if (language === "kotlin") {
    await fs.writeFile(path.join(workDir, "Main.kt"), code);
    const compile = await runProcess(
      "kotlinc",
      ["Main.kt", "-include-runtime", "-d", "main.jar"],
      { cwd: workDir, timeoutMs: 30000 }
    );
    if (compile.code !== 0 || compile.timedOut) {
      return { workDir, compileError: compile.timedOut ? "Compilation timed out" : compile.stderr || "Compilation failed" };
    }
    return { workDir, command: "java", args: ["-jar", path.join(workDir, "main.jar")] };
  }

  if (language === "swift") {
    await fs.writeFile(path.join(workDir, "main.swift"), code);
    return { workDir, command: "swift", args: ["main.swift"] };
  }

  if (language === "r") {
    await fs.writeFile(path.join(workDir, "main.r"), code);
    return { workDir, command: "Rscript", args: ["main.r"] };
  }

  if (language === "perl") {
    await fs.writeFile(path.join(workDir, "main.pl"), code);
    return { workDir, command: "perl", args: ["main.pl"] };
  }

  const error = new Error("Unsupported programming language");
  error.status = 400;
  throw error;
}

async function runLocalCodeForQuestion({ code, language, testCases }) {
  const execution = await prepareLocalExecution(language, code);

  try {
    if (execution.compileError) {
      const results = testCases.map((testCase) => ({
        input: testCase.input || "",
        expectedOutput: testCase.expectedOutput || "",
        actualOutput: "",
        passed: false,
        error: execution.compileError
      }));

      return { results, allPassed: false };
    }

    const results = [];

    for (const testCase of testCases) {
      const run = await runProcess(execution.command, execution.args, {
        cwd: execution.workDir,
        input: testCase.input || "",
        timeoutMs: 5000
      });
      const error = run.timedOut
        ? "Execution timed out"
        : run.stderr || (run.code ? `Process exited with code ${run.code}` : "");
      const passed = !error && normalizeOutput(run.stdout) === normalizeOutput(testCase.expectedOutput);

      results.push({
        input: testCase.input || "",
        expectedOutput: testCase.expectedOutput || "",
        actualOutput: run.stdout,
        passed,
        error
      });
    }

    return {
      results,
      allPassed: results.length > 0 && results.every((result) => result.passed)
    };
  } finally {
    await fs.rm(execution.workDir, { recursive: true, force: true });
  }
}

async function runPistonCodeForQuestion({ code, language, testCases }) {
  const results = [];

  for (const testCase of testCases) {
    const execution = await executeOne({ code, language, input: testCase.input });
    const compileError = execution.compile?.stderr || "";
    const runError = execution.run?.stderr || "";
    const actualOutput = execution.run?.stdout || "";
    const error = compileError || runError;
    const passed = !error && normalizeOutput(actualOutput) === normalizeOutput(testCase.expectedOutput);

    results.push({
      input: testCase.input || "",
      expectedOutput: testCase.expectedOutput || "",
      actualOutput,
      passed,
      error
    });
  }

  return {
    results,
    allPassed: results.length > 0 && results.every((result) => result.passed)
  };
}

export function getSupportedLanguages() {
  return Object.entries(LANGUAGE_CONFIG).map(([value, config]) => ({
    value,
    label: config.label
  }));
}

export async function runCodeForQuestion({ code = "", language = "python", testCases = [] }) {
  if (!code.trim()) {
    const error = new Error("Code is required");
    error.status = 400;
    throw error;
  }

  if (process.env.CODE_RUNNER_MODE === "piston") {
    return runPistonCodeForQuestion({ code, language, testCases });
  }

  return runLocalCodeForQuestion({ code, language, testCases });
}
