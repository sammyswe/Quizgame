#!/usr/bin/env node
/**
 * Frees Treasure Trap dev ports before `pnpm dev` starts.
 * Stale vite/tsx/concurrently processes from a previous session cause EADDRINUSE
 * on 3001 and silently bump the client from 5173 → 5174, breaking the socket proxy.
 *
 * Run manually anytime: `pnpm dev:stop`
 */
import { execSync } from "node:child_process";

const PORTS = [3001, 5173, 5174];

/** Patterns for orphaned treasure-trap dev processes (match pgrep -f output). */
const DEV_PATTERNS = [
  "concurrently.*pnpm dev:server",
  "vite/bin/vite.js --host",
  "tsx/dist/cli.mjs watch src/index.ts",
  "tsx watch src/index.ts",
  "@treasure-trap/server dev",
  "@treasure-trap/client dev",
];

function run(cmd) {
  try {
    execSync(cmd, { stdio: "pipe" });
  } catch {
    // expected when nothing matches
  }
}

/** Collect PIDs listening on a port — tries lsof first (most reliable), then ss. */
function pidsOnPort(port) {
  const pids = new Set();

  // lsof is the most reliable on macOS/Linux dev machines.
  try {
    const out = execSync(`lsof -ti :${port} -sTCP:LISTEN 2>/dev/null || true`, { encoding: "utf8" });
    for (const line of out.trim().split("\n")) {
      const pid = Number(line.trim());
      if (pid > 0) pids.add(pid);
    }
  } catch {
    // lsof unavailable
  }

  // ss fallback (Linux containers).
  if (pids.size === 0) {
    try {
      const out = execSync(`ss -tlnp 'sport = :${port}' 2>/dev/null || true`, { encoding: "utf8" });
      for (const m of out.matchAll(/pid=(\d+)/g)) {
        if (m[1]) pids.add(Number(m[1]));
      }
    } catch {
      // ss unavailable
    }
  }

  return [...pids];
}

function killPid(pid, signal) {
  try {
    process.kill(pid, signal);
    return true;
  } catch {
    return false;
  }
}

let stopped = 0;

// 1. Kill known dev-stack process trees (SIGTERM first).
for (const pattern of DEV_PATTERNS) {
  run(`pkill -f '${pattern.replace(/'/g, "'\\''")}' 2>/dev/null`);
}

// 2. Free ports (SIGTERM).
for (const port of PORTS) {
  for (const pid of pidsOnPort(port)) {
    if (killPid(pid, "SIGTERM")) {
      console.log(`[dev] stopped process on :${port} (pid ${pid})`);
      stopped += 1;
    }
  }
}

// 3. Brief grace, then force-kill anything still hanging around.
run("sleep 0.4");
for (const pattern of DEV_PATTERNS) {
  run(`pkill -9 -f '${pattern.replace(/'/g, "'\\''")}' 2>/dev/null`);
}

for (const port of PORTS) {
  for (const pid of pidsOnPort(port)) {
    if (killPid(pid, "SIGKILL")) {
      console.log(`[dev] force-killed process on :${port} (pid ${pid})`);
      stopped += 1;
    }
  }
}

if (stopped === 0) {
  console.log("[dev] ports 3001 and 5173 are free — ready to sail");
} else {
  console.log(`[dev] cleaned up ${stopped} stale process(es). Run \`pnpm dev\` again.`);
}
