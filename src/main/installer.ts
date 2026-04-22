import { spawn, execSync, execFile } from "child_process";
import { existsSync, readFileSync, readdirSync, cpSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { getModelConfig } from "./config";
import { stripAnsi } from "./utils";

const _isWindows = process.platform === "win32";
// Windows: %LOCALAPPDATA%\hermes  (e.g. C:\Users\f8785\AppData\Local\hermes)
// Unix: ~/.hermes
export const HERMES_HOME = _isWindows
  ? join(process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"), "hermes")
  : join(homedir(), ".hermes");
export const HERMES_REPO = join(HERMES_HOME, "hermes-agent");
export const HERMES_VENV = join(HERMES_REPO, "venv");
export const HERMES_PYTHON = join(HERMES_VENV, _isWindows ? "Scripts" : "bin", _isWindows ? "python.exe" : "python");
export const HERMES_SCRIPT = join(HERMES_VENV, _isWindows ? "Scripts" : "bin", _isWindows ? "hermes.exe" : "hermes");
export const HERMES_ENV_FILE = join(HERMES_HOME, ".env");
export const HERMES_CONFIG_FILE = join(HERMES_HOME, "config.yaml");

export interface InstallStatus {
  installed: boolean;
  configured: boolean;
  hasApiKey: boolean;
  verified: boolean;
}

export interface InstallProgress {
  step: number;
  totalSteps: number;
  title: string;
  detail: string;
  log: string;
}

export function getEnhancedPath(): string {
  const home = homedir();
  const isWin = process.platform === "win32";
  const extra = [
    join(home, ".local", "bin"),
    join(home, ".cargo", "bin"),
    join(HERMES_VENV, isWin ? "Scripts" : "bin"),
    // Node version manager shim directories
    join(home, ".volta", "bin"),
    join(home, ".asdf", "shims"),
    join(home, ".local", "share", "fnm", "aliases", "default", "bin"),
    join(home, ".fnm", "aliases", "default", "bin"),
    ...resolveNvmBin(home),
    "/usr/local/bin",
    "/opt/homebrew/bin",
    "/opt/homebrew/sbin",
  ];
  return [...extra, process.env.PATH || ""].join(isWin ? ";" : ":");
}

/** Resolve the active nvm node version's bin directory. */
function resolveNvmBin(home: string): string[] {
  const nvmDir = process.env.NVM_DIR || join(home, ".nvm");
  const versionsDir = join(nvmDir, "versions", "node");
  if (!existsSync(versionsDir)) return [];
  try {
    // Try to read the default alias to find the active version
    const aliasFile = join(nvmDir, "alias", "default");
    if (existsSync(aliasFile)) {
      const alias = readFileSync(aliasFile, "utf-8").trim();
      // alias can be a full version "v20.11.0" or a partial "20" or "lts/*"
      if (alias.startsWith("v")) {
        const bin = join(versionsDir, alias, "bin");
        if (existsSync(bin)) return [bin];
      }
    }
    // Fallback: pick the latest installed version
    const versions = (readdirSync(versionsDir) as string[])
      .filter((d: string) => d.startsWith("v"))
      .sort()
      .reverse();
    if (versions.length > 0) {
      return [join(versionsDir, versions[0], "bin")];
    }
  } catch {
    /* non-fatal */
  }
  return [];
}

export function checkInstallStatus(): InstallStatus {
  const installed = existsSync(HERMES_PYTHON) && existsSync(HERMES_SCRIPT);
  const configured = existsSync(HERMES_ENV_FILE);
  let hasApiKey = false;
  let verified = false;

  if (installed) {
    try {
      execSync(`"${HERMES_PYTHON}" "${HERMES_SCRIPT}" --version`, {
        cwd: HERMES_REPO,
        env: {
          ...process.env,
          PATH: getEnhancedPath(),
          HOME: homedir(),
          HERMES_HOME,
        },
        stdio: "ignore",
        timeout: 15000,
      });
      verified = true;
    } catch {
      verified = false;
    }
  }

  // Local/custom providers don't need an API key
  try {
    const mc = getModelConfig();
    const localProviders = ["custom", "lmstudio", "ollama", "vllm", "llamacpp"];
    if (localProviders.includes(mc.provider)) {
      hasApiKey = true;
    }
  } catch {
    /* ignore */
  }

  if (!hasApiKey && configured) {
    try {
      const content = readFileSync(HERMES_ENV_FILE, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
        if (!match) continue;
        const [, key, value] = match;
        // Match any known provider API key / token / secret
        if (
          /API_KEY|TOKEN|SECRET|KEY$/.test(key) &&
          value.trim() &&
          !['""', "''", ""].includes(value.trim())
        ) {
          hasApiKey = true;
          break;
        }
      }
    } catch {
      /* ignore read errors */
    }
  }

  return { installed, configured, hasApiKey, verified };
}

// Cached version to avoid re-running the Python process
let _cachedVersion: string | null = null;
let _versionFetching = false;

export async function getHermesVersion(): Promise<string | null> {
  if (_cachedVersion !== null) return _cachedVersion;
  if (!existsSync(HERMES_PYTHON) || !existsSync(HERMES_SCRIPT)) return null;
  if (_versionFetching) {
    // Wait for in-flight fetch
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (!_versionFetching) {
          clearInterval(check);
          resolve(_cachedVersion);
        }
      }, 100);
    });
  }
  _versionFetching = true;
  return new Promise((resolve) => {
    execFile(
      HERMES_PYTHON,
      [HERMES_SCRIPT, "--version"],
      {
        cwd: HERMES_REPO,
        env: {
          ...process.env,
          PATH: getEnhancedPath(),
          HOME: homedir(),
          HERMES_HOME,
        },
        timeout: 15000,
      },
      (error, stdout) => {
        _versionFetching = false;
        if (error) {
          resolve(null);
        } else {
          _cachedVersion = stdout.toString().trim();
          resolve(_cachedVersion);
        }
      },
    );
  });
}

export function clearVersionCache(): void {
  _cachedVersion = null;
}

export function runHermesDoctor(): string {
  if (!existsSync(HERMES_PYTHON) || !existsSync(HERMES_SCRIPT)) {
    return "Hermes is not installed.";
  }
  try {
    const output = execSync(`"${HERMES_PYTHON}" "${HERMES_SCRIPT}" doctor`, {
      cwd: HERMES_REPO,
      env: {
        ...process.env,
        PATH: getEnhancedPath(),
        HOME: homedir(),
        HERMES_HOME,
      },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30000,
    });
    return stripAnsi(output.toString());
  } catch (err) {
    const stderr = (err as { stderr?: Buffer }).stderr?.toString() || "";
    return stripAnsi(stderr) || "Doctor check failed.";
  }
}

const OPENCLAW_DIR_NAMES = [".openclaw", ".clawdbot", ".moldbot"];

export function checkOpenClawExists(): { found: boolean; path: string | null } {
  for (const name of OPENCLAW_DIR_NAMES) {
    const dir = join(homedir(), name);
    if (existsSync(dir)) {
      return { found: true, path: dir };
    }
  }
  return { found: false, path: null };
}

export async function runClawMigrate(
  onProgress: (progress: InstallProgress) => void,
): Promise<void> {
  if (!existsSync(HERMES_PYTHON) || !existsSync(HERMES_SCRIPT)) {
    throw new Error("Hermes is not installed.");
  }

  const openclaw = checkOpenClawExists();
  if (!openclaw.found) {
    throw new Error("No OpenClaw installation found.");
  }

  let log = "";
  function emit(text: string): void {
    log += text;
    onProgress({
      step: 1,
      totalSteps: 1,
      title: "Migrating from OpenClaw",
      detail: text.trim().slice(0, 120),
      log,
    });
  }

  emit(`Migrating from ${openclaw.path}...\n`);

  return new Promise((resolve, reject) => {
    const args = [HERMES_SCRIPT, "claw", "migrate", "--preset", "full"];

    const proc = spawn(HERMES_PYTHON, args, {
      cwd: HERMES_REPO,
      env: {
        ...process.env,
        PATH: getEnhancedPath(),
        HOME: homedir(),
        HERMES_HOME,
        TERM: "dumb",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout?.on("data", (data: Buffer) => {
      emit(stripAnsi(data.toString("utf-8")));
    });

    proc.stderr?.on("data", (data: Buffer) => {
      emit(stripAnsi(data.toString("utf-8")));
    });

    proc.on("close", (code) => {
      if (code === 0) {
        emit("\nMigration complete!\n");
        resolve();
      } else {
        reject(new Error(`Migration failed (exit code ${code}).`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to run migration: ${err.message}`));
    });
  });
}

export async function runHermesUpdate(
  onProgress: (progress: InstallProgress) => void,
): Promise<void> {
  if (!existsSync(HERMES_PYTHON) || !existsSync(HERMES_SCRIPT)) {
    throw new Error("Hermes is not installed. Please install it first.");
  }

  let log = "";
  function emit(text: string): void {
    log += text;
    onProgress({
      step: 1,
      totalSteps: 1,
      title: "Updating Hermes Agent",
      detail: text.trim().slice(0, 120),
      log,
    });
  }

  emit("Running hermes update...\n");

  return new Promise((resolve, reject) => {
    const proc = spawn(HERMES_PYTHON, [HERMES_SCRIPT, "update"], {
      cwd: HERMES_REPO,
      env: {
        ...process.env,
        PATH: getEnhancedPath(),
        HOME: homedir(),
        HERMES_HOME,
        TERM: "dumb",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout?.on("data", (data: Buffer) => {
      emit(stripAnsi(data.toString("utf-8")));
    });

    proc.stderr?.on("data", (data: Buffer) => {
      emit(stripAnsi(data.toString("utf-8")));
    });

    proc.on("close", (code) => {
      if (code === 0) {
        emit("\nUpdate complete!\n");
        resolve();
      } else {
        reject(new Error(`Update failed (exit code ${code}).`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to run update: ${err.message}`));
    });
  });
}

function getShellProfile(home: string): string | null {
  // Check for the user's shell profile to source their PATH
  const candidates = [
    join(home, ".zshrc"),
    join(home, ".bashrc"),
    join(home, ".bash_profile"),
    join(home, ".profile"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

// Parse install.sh output to detect progress stages
const STAGE_MARKERS: { pattern: RegExp; step: number; title: string }[] = [
  {
    pattern: /Checking for (git|uv|python)/i,
    step: 1,
    title: "Checking prerequisites",
  },
  {
    pattern: /Installing uv|uv found/i,
    step: 2,
    title: "Setting up package manager",
  },
  {
    pattern: /Installing Python|Python .* found/i,
    step: 3,
    title: "Setting up Python",
  },
  {
    pattern: /Cloning|cloning|Updating.*repository|Repository/i,
    step: 4,
    title: "Downloading Hermes Agent",
  },
  {
    pattern: /Creating virtual|virtual environment|venv/i,
    step: 5,
    title: "Creating Python environment",
  },
  {
    pattern: /pip install|Installing.*packages|dependencies/i,
    step: 6,
    title: "Installing dependencies",
  },
  {
    pattern: /Configuration|config|Setup complete|Installation complete/i,
    step: 7,
    title: "Finishing setup",
  },
];

export async function runInstall(
  onProgress: (progress: InstallProgress) => void,
): Promise<void> {
  const totalSteps = 7;
  let log = "";
  let currentStep = 1;
  let currentTitle = "Starting installation...";

  function emit(text: string): void {
    log += text;
    // Try to detect which stage we're in from the output
    for (const marker of STAGE_MARKERS) {
      if (marker.pattern.test(text)) {
        if (marker.step >= currentStep) {
          currentStep = marker.step;
          currentTitle = marker.title;
        }
        break;
      }
    }
    onProgress({
      step: currentStep,
      totalSteps,
      title: currentTitle,
      detail: text.trim().slice(0, 120),
      log,
    });
  }

  emit("Running official Hermes install script...\n");

  return new Promise((resolve, reject) => {
    const home = homedir();
    const isWindows = process.platform === "win32";
    const installCmd = isWindows
      ? `irm https://res1.hermesagent.org.cn/install.ps1 | iex`
      : [
          `source "${getShellProfile(home)}" 2>/dev/null;`,
          `curl -fsSL https://res1.hermesagent.org.cn/install.sh | bash -s -- --skip-setup`,
        ].join(" ");

    const shell = isWindows ? "powershell" : "bash";
    const shellArgs = isWindows
      ? ["-NoProfile", "-Command", installCmd]
      : ["-c", installCmd];

    const proc = spawn(shell, shellArgs, {
      cwd: home,
      env: {
        ...process.env,
        PATH: getEnhancedPath(),
        HOME: home,
        TERM: "dumb",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout?.on("data", (data: Buffer) => {
      emit(stripAnsi(data.toString("utf-8")));
    });

    proc.stderr?.on("data", (data: Buffer) => {
      emit(stripAnsi(data.toString("utf-8")));
    });

    proc.on("close", (code) => {
      if (code === 0) {
        emit("\nInstallation complete!\n");
        resolve();
      } else {
        // The install script can exit non-zero due to benign issues
        // (e.g. git stash pop failure on already-clean repo).
        // If Hermes is actually installed and working, treat as success.
        if (existsSync(HERMES_PYTHON) && existsSync(HERMES_SCRIPT)) {
          emit(
            "\nInstall script exited with warnings, but Hermes is installed successfully.\n",
          );
          resolve();
        } else {
          reject(
            new Error(
              `Installation failed (exit code ${code}). You can try installing via terminal instead.`,
            ),
          );
        }
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start installer: ${err.message}`));
    });
  });
}

// ────────────────────────────────────────────────────
//  Docs Skill & Documentation Installation
// ────────────────────────────────────────────────────

/**
 * Install the PoH Docs Skill and copy official docs to ~/.hermes/.
 * Called after Hermes installation completes.
 */
export function installDocsSkill(): void {
  // Resolve resources path (works in both dev and packaged app)
  const isDev = !process.env["ELECTRON_IS_PACKAGED"];

  let resourceBase: string;
  if (isDev) {
    resourceBase = join(__dirname, "..", "..", "resources");
  } else {
    // In packaged app, resources are unpacked to app.asar.unpacked/resources/
    resourceBase = join(process.resourcesPath, "app.asar.unpacked", "resources");
  }

  const skillSrcDir = join(resourceBase, "poh-docs-skill");
  const docsSrcDir = join(resourceBase, "docs");

  // Destination paths
  const skillsDestDir = join(HERMES_HOME, "skills", "docs", "poh-docs");
  const docsDestDir = join(HERMES_HOME, "docs");

  // Copy skill (SKILL.md and references/)
  if (existsSync(skillSrcDir)) {
    mkdirSync(skillsDestDir, { recursive: true });
    cpSync(skillSrcDir, skillsDestDir, { recursive: true });
  }

  // Copy official docs
  if (existsSync(docsSrcDir)) {
    mkdirSync(docsDestDir, { recursive: true });
    cpSync(docsSrcDir, docsDestDir, { recursive: true });
  }
}

// ────────────────────────────────────────────────────
//  Backup & Import
// ────────────────────────────────────────────────────

export async function runHermesBackup(
  profile?: string,
): Promise<{ success: boolean; path?: string; error?: string }> {
  if (!existsSync(HERMES_PYTHON) || !existsSync(HERMES_SCRIPT)) {
    return { success: false, error: "Hermes is not installed." };
  }
  const args = [HERMES_SCRIPT, "backup"];
  if (profile && profile !== "default") args.push("-p", profile);

  return new Promise((resolve) => {
    execFile(
      HERMES_PYTHON,
      args,
      {
        cwd: HERMES_REPO,
        env: {
          ...process.env,
          PATH: getEnhancedPath(),
          HOME: homedir(),
          HERMES_HOME,
          TERM: "dumb",
        },
        timeout: 120000,
      },
      (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: stripAnsi(stderr || error.message).slice(0, 500),
          });
          return;
        }
        const output = stripAnsi(stdout);
        // Try to extract the backup file path from output
        const pathMatch = output.match(
          /(?:Backup saved|Written|Created).*?(\S+\.(?:tar\.gz|zip|tgz))/i,
        );
        resolve({
          success: true,
          path: pathMatch?.[1] || output.trim().split("\n").pop()?.trim(),
        });
      },
    );
  });
}

export async function runHermesImport(
  archivePath: string,
  profile?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!existsSync(HERMES_PYTHON) || !existsSync(HERMES_SCRIPT)) {
    return { success: false, error: "Hermes is not installed." };
  }
  const args = [HERMES_SCRIPT, "import", archivePath];
  if (profile && profile !== "default") args.push("-p", profile);

  return new Promise((resolve) => {
    execFile(
      HERMES_PYTHON,
      args,
      {
        cwd: HERMES_REPO,
        env: {
          ...process.env,
          PATH: getEnhancedPath(),
          HOME: homedir(),
          HERMES_HOME,
          TERM: "dumb",
        },
        timeout: 120000,
      },
      (error, _stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: stripAnsi(stderr || error.message).slice(0, 500),
          });
          return;
        }
        resolve({ success: true });
      },
    );
  });
}

// ────────────────────────────────────────────────────
//  Debug dump
// ────────────────────────────────────────────────────

export function runHermesDump(): Promise<string> {
  if (!existsSync(HERMES_PYTHON) || !existsSync(HERMES_SCRIPT)) {
    return Promise.resolve("Hermes is not installed.");
  }
  return new Promise((resolve) => {
    execFile(
      HERMES_PYTHON,
      [HERMES_SCRIPT, "dump"],
      {
        cwd: HERMES_REPO,
        env: {
          ...process.env,
          PATH: getEnhancedPath(),
          HOME: homedir(),
          HERMES_HOME,
          TERM: "dumb",
        },
        timeout: 30000,
      },
      (error, stdout, stderr) => {
        if (error) {
          resolve(stripAnsi(stderr || error.message));
        } else {
          resolve(stripAnsi(stdout));
        }
      },
    );
  });
}

// ────────────────────────────────────────────────────
//  Memory provider discovery
// ────────────────────────────────────────────────────

export interface MemoryProviderInfo {
  name: string;
  description: string;
  installed: boolean;
  active: boolean;
  envVars: string[];
}

/**
 * Discover available memory providers by scanning the plugins directory
 * and reading config.yaml for the active provider.
 */
export function discoverMemoryProviders(
  profile?: string,
): MemoryProviderInfo[] {
  const pluginsDir = join(HERMES_REPO, "plugins", "memory");
  if (!existsSync(pluginsDir)) return [];

  const activeProvider = getActiveMemoryProvider(profile);

  // Known providers with their metadata (from plugin.yaml files)
  const KNOWN_PROVIDERS: Record<
    string,
    { description: string; envVars: string[]; pip?: string }
  > = {
    honcho: {
      description:
        "AI-native cross-session user modeling with dialectic Q&A and semantic search",
      envVars: ["HONCHO_API_KEY"],
      pip: "honcho-ai",
    },
    hindsight: {
      description:
        "Long-term memory with knowledge graph and multi-strategy retrieval",
      envVars: ["HINDSIGHT_API_KEY", "HINDSIGHT_API_URL", "HINDSIGHT_BANK_ID"],
      pip: "hindsight-client",
    },
    mem0: {
      description:
        "Server-side LLM fact extraction with semantic search and auto-deduplication",
      envVars: ["MEM0_API_KEY"],
      pip: "mem0ai",
    },
    retaindb: {
      description: "Cloud memory API with hybrid search and 7 memory types",
      envVars: ["RETAINDB_API_KEY"],
    },
    supermemory: {
      description:
        "Semantic long-term memory with profile recall and entity extraction",
      envVars: ["SUPERMEMORY_API_KEY"],
      pip: "supermemory",
    },
    holographic: {
      description:
        "Local SQLite fact store with FTS5 search and trust scoring (no API key needed)",
      envVars: [],
    },
    openviking: {
      description:
        "Session-managed memory with tiered retrieval and knowledge browsing",
      envVars: ["OPENVIKING_ENDPOINT", "OPENVIKING_API_KEY"],
    },
    byterover: {
      description:
        "Persistent knowledge tree with tiered retrieval via brv CLI",
      envVars: ["BRV_API_KEY"],
    },
  };

  const results: MemoryProviderInfo[] = [];

  try {
    const dirs = readdirSync(pluginsDir, { withFileTypes: true });
    for (const d of dirs) {
      if (!d.isDirectory() || d.name.startsWith("_")) continue;
      const name = d.name;
      const known = KNOWN_PROVIDERS[name];
      const initFile = join(pluginsDir, name, "__init__.py");
      const installed = existsSync(initFile);

      results.push({
        name,
        description: known?.description || name,
        installed,
        active: name === activeProvider,
        envVars: known?.envVars || [],
      });
    }
  } catch {
    /* non-fatal */
  }

  // Sort: active first, then installed, then alphabetical
  results.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (a.installed !== b.installed) return a.installed ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return results;
}

/**
 * Read the active memory provider from config.yaml.
 */
export function getActiveMemoryProvider(profile?: string): string {
  try {
    const configDir =
      profile && profile !== "default"
        ? join(HERMES_HOME, "profiles", profile)
        : HERMES_HOME;
    const configPath = join(configDir, "config.yaml");
    if (!existsSync(configPath)) return "";
    const content = readFileSync(configPath, "utf-8");
    const match = content.match(/^\s*provider:\s*["']?(\w+)["']?\s*$/m);
    return match?.[1] || "";
  } catch {
    return "";
  }
}

// ────────────────────────────────────────────────────
//  MCP server management
// ────────────────────────────────────────────────────

export function listMcpServers(
  profile?: string,
): Array<{ name: string; type: string; enabled: boolean; detail: string }> {
  try {
    const configPath = join(
      profile && profile !== "default"
        ? join(HERMES_HOME, "profiles", profile)
        : HERMES_HOME,
      "config.yaml",
    );
    if (!existsSync(configPath)) return [];
    const content = readFileSync(configPath, "utf-8");
    // Simple YAML parse for mcp_servers section
    const match = content.match(/^mcp_servers:\s*\n((?:[ \t]+.+\n)*)/m);
    if (!match) return [];

    const servers: Array<{
      name: string;
      type: string;
      enabled: boolean;
      detail: string;
    }> = [];
    const block = match[1];
    // Each top-level key under mcp_servers is a server name (2-space indent)
    const nameRe = /^[ ]{2}(\w[\w-]*):\s*$/gm;
    let m: RegExpExecArray | null;
    while ((m = nameRe.exec(block)) !== null) {
      const name = m[1];
      // Extract following indented block for this server.
      // Find the next line at exactly 2-space indent (next server name).
      const start = m.index + m[0].length;
      const nextMatch = /\n {2}\w/g;
      nextMatch.lastIndex = start;
      const next = nextMatch.exec(block);
      const serverBlock = block.slice(start, next ? next.index : undefined);
      const hasUrl = /url:/.test(serverBlock);
      const hasCommand = /command:/.test(serverBlock);
      const enabledMatch = serverBlock.match(/enabled:\s*(true|false)/i);
      const enabled =
        enabledMatch === null || enabledMatch[1].toLowerCase() === "true";

      let detail = "";
      if (hasUrl) {
        const urlMatch = serverBlock.match(/url:\s*["']?([^\s"']+)/);
        detail = urlMatch?.[1] || "HTTP";
      } else if (hasCommand) {
        const cmdMatch = serverBlock.match(/command:\s*["']?([^\s"']+)/);
        detail = cmdMatch?.[1] || "stdio";
      }

      servers.push({
        name,
        type: hasUrl ? "http" : "stdio",
        enabled,
        detail,
      });
    }
    return servers;
  } catch {
    return [];
  }
}

// ────────────────────────────────────────────────────
//  Log viewer
// ────────────────────────────────────────────────────

export function readLogs(
  logFile = "agent.log",
  lines = 200,
): { content: string; path: string } {
  const logsDir = join(HERMES_HOME, "logs");
  // Sanitize: only allow known log file names
  const allowed = ["agent.log", "errors.log", "gateway.log"];
  const file = allowed.includes(logFile) ? logFile : "agent.log";
  const fullPath = join(logsDir, file);

  if (!existsSync(fullPath)) {
    return { content: "", path: fullPath };
  }
  try {
    const content = readFileSync(fullPath, "utf-8");
    // Return the last N lines
    const allLines = content.split("\n");
    const tail = allLines.slice(-lines).join("\n");
    return { content: tail, path: fullPath };
  } catch {
    return { content: "", path: fullPath };
  }
}
