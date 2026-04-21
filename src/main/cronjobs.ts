import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { execFile } from "child_process";
import { HERMES_HOME, HERMES_PYTHON, HERMES_SCRIPT } from "./installer";
import { profileHome } from "./utils";

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  prompt: string;
  state: "active" | "paused" | "completed";
  enabled: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  repeat: { times: number | null; completed: number } | null;
  deliver: string[];
  skills: string[];
  script: string | null;
}

function jobsFilePath(profile?: string): string {
  return join(profileHome(profile), "cron", "jobs.json");
}

/**
 * Read cron jobs from the jobs.json file (async to avoid blocking the main process).
 */
export async function listCronJobs(
  includeDisabled = true,
  profile?: string,
): Promise<CronJob[]> {
  const filePath = jobsFilePath(profile);
  if (!existsSync(filePath)) return [];

  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(content);
    const raw = Array.isArray(parsed) ? parsed : parsed.jobs || [];
    const jobs: CronJob[] = [];

    for (const job of raw) {
      if (!job.id) continue; // skip malformed entries

      const enabled = job.enabled !== false;
      if (!includeDisabled && !enabled) continue;

      let state: CronJob["state"] = "active";
      if (job.state === "paused" || !enabled) state = "paused";
      else if (job.state === "completed") state = "completed";

      jobs.push({
        id: job.id,
        name: job.name || "(unnamed)",
        schedule: job.schedule_display || job.schedule?.value || "?",
        prompt: job.prompt || "",
        state,
        enabled,
        next_run_at: job.next_run_at || null,
        last_run_at: job.last_run_at || null,
        last_status: job.last_status || null,
        last_error: job.last_error || null,
        repeat: job.repeat || null,
        deliver: Array.isArray(job.deliver)
          ? job.deliver
          : job.deliver
            ? [job.deliver]
            : ["local"],
        skills: job.skills || (job.skill ? [job.skill] : []),
        script: job.script || null,
      });
    }

    return jobs;
  } catch (err) {
    console.error("[CRON] Failed to read jobs file:", err);
    return [];
  }
}

/**
 * Run a hermes cron CLI command and return the result.
 */
function runCronCommand(
  args: string[],
  profile?: string,
): Promise<{ success: boolean; output: string; error?: string }> {
  const cliArgs = [HERMES_SCRIPT];
  if (profile && profile !== "default") {
    cliArgs.push("-p", profile);
  }
  cliArgs.push("cron", ...args);

  return new Promise((resolve) => {
    execFile(
      HERMES_PYTHON,
      cliArgs,
      { cwd: join(HERMES_HOME, "hermes-agent"), timeout: 15000 },
      (err, stdout, stderr) => {
        if (err) {
          resolve({
            success: false,
            output: stdout || "",
            error: stderr || err.message,
          });
        } else {
          resolve({ success: true, output: stdout || "" });
        }
      },
    );
  });
}

export async function createCronJob(
  schedule: string,
  prompt?: string,
  name?: string,
  deliver?: string,
  profile?: string,
): Promise<{ success: boolean; error?: string }> {
  // Use -- to prevent prompt from being parsed as a flag
  const args = ["create", schedule];
  if (name) args.push("--name", name);
  if (deliver) args.push("--deliver", deliver);
  if (prompt) {
    args.push("--");
    args.push(prompt);
  }

  const result = await runCronCommand(args, profile);
  return { success: result.success, error: result.error };
}

export async function removeCronJob(
  jobId: string,
  profile?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!jobId) return { success: false, error: "Missing job ID" };
  const result = await runCronCommand(["remove", jobId], profile);
  return { success: result.success, error: result.error };
}

export async function pauseCronJob(
  jobId: string,
  profile?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!jobId) return { success: false, error: "Missing job ID" };
  const result = await runCronCommand(["pause", jobId], profile);
  return { success: result.success, error: result.error };
}

export async function resumeCronJob(
  jobId: string,
  profile?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!jobId) return { success: false, error: "Missing job ID" };
  const result = await runCronCommand(["resume", jobId], profile);
  return { success: result.success, error: result.error };
}

export async function triggerCronJob(
  jobId: string,
  profile?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!jobId) return { success: false, error: "Missing job ID" };
  const result = await runCronCommand(["run", jobId], profile);
  return { success: result.success, error: result.error };
}
