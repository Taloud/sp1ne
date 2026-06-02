#!/usr/bin/env node

/**
 * Claude Code Statusline (bundle)
 *
 * Single line:
 *   [branch+sha+worktree+stash] [ticket] | [project ctx] | [model] | $cost | duration | +added -removed |
 *   [context bar] tokens used/max pct% | rate limits (if available)
 *
 * Features:
 * - Git info cached with 5s TTL (avoids lag on large repos)
 * - Generic ticket extraction: matches any [A-Z]+-\d+ in the branch (Jira/Linear/etc.)
 * - Detached HEAD displayed as HEAD@<short-sha>
 * - Worktree indicator (wt:) when inside a linked worktree
 * - Stash indicator [N] when stashes exist
 * - Optional "project context" read from .env.local / .env via CURRENT_APPLICATION
 *   (a multi-site convention — harmless if missing, just falls back to nothing)
 * - Color-coded context window usage (green < 50% < yellow < 75% < orange < 90% < red)
 * - Rate limit display for Claude.ai Pro/Max users
 * - Graceful fallback when no data available yet
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// ANSI Colors & Symbols
// ---------------------------------------------------------------------------

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  orange: '\x1b[38;5;208m',
  brightGreen: '\x1b[92m',
  brightCyan: '\x1b[96m',
};

const sym = {
  branch: '⎇',
  dirty: '●',
  ticket: '▸',
  separator: '│',
  blockFull: '█',
  blockEmpty: '░',
  warning: '⚠',
  context: '◆',
  stash: '⚑',
};

// ---------------------------------------------------------------------------
// Git Info (cached 5s)
// ---------------------------------------------------------------------------

const GIT_CACHE_TTL_MS = 5000;

// One cache file per cwd: concurrent sessions in different repos would
// otherwise thrash a single shared file and defeat the TTL entirely.
function gitCacheFile(cwd) {
  const h = createHash('sha256').update(cwd).digest('hex').slice(0, 12);
  return join(tmpdir(), `claude-statusline-git-${h}.json`);
}

function getGitInfoCached(cwd) {
  const cacheFile = gitCacheFile(cwd);
  try {
    if (existsSync(cacheFile)) {
      const stat = statSync(cacheFile);
      if (Date.now() - stat.mtimeMs < GIT_CACHE_TTL_MS) {
        const cached = JSON.parse(readFileSync(cacheFile, 'utf-8'));
        if (cached.cwd === cwd) return cached;
      }
    }
  } catch {
    // Cache miss, compute fresh
  }

  const info = getGitInfo(cwd);
  try {
    writeFileSync(cacheFile, JSON.stringify({ ...info, cwd }), 'utf-8');
  } catch {
    // Ignore write errors
  }
  return info;
}

function safeExec(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function getGitInfo(cwd) {
  try {
    let branch = safeExec('git branch --show-current', cwd);
    let shortSha = '';
    if (!branch) {
      // Detached HEAD — use short SHA for context
      branch = 'HEAD';
      shortSha = safeExec('git rev-parse --short HEAD', cwd);
    }

    let dirty = false;
    try {
      execSync('git diff-index --quiet HEAD --', { cwd, stdio: 'ignore' });
    } catch {
      dirty = true;
    }
    if (!dirty) {
      try {
        execSync('git diff-index --quiet --cached HEAD --', { cwd, stdio: 'ignore' });
      } catch {
        dirty = true;
      }
    }

    // Worktree detection: linked worktrees report a non-empty common dir != git dir
    const gitDir = safeExec('git rev-parse --git-dir', cwd);
    const commonDir = safeExec('git rev-parse --git-common-dir', cwd);
    const isWorktree = gitDir && commonDir && gitDir !== commonDir;

    // Stash count
    const stashList = safeExec('git stash list', cwd);
    const stashCount = stashList ? stashList.split('\n').filter(Boolean).length : 0;

    // Ticket: first [A-Z]+-\d+ found in branch name (Jira/Linear/etc.)
    const ticketMatch = branch.match(/([A-Z]+-\d+)/);
    const ticket = ticketMatch ? ticketMatch[1] : null;

    return { branch, shortSha, dirty, ticket, isWorktree, stashCount };
  } catch {
    return { branch: 'no-git', shortSha: '', dirty: false, ticket: null, isWorktree: false, stashCount: 0 };
  }
}

// ---------------------------------------------------------------------------
// Project context (optional multi-site convention via CURRENT_APPLICATION, harmless elsewhere)
// ---------------------------------------------------------------------------

// Reads an optional CURRENT_APPLICATION key from .env.local/.env — a convention
// for multi-site monorepos. Falls back to nothing when absent.
function getProjectContext(cwd) {
  for (const filename of ['.env.local', '.env']) {
    const filepath = join(cwd, filename);
    if (!existsSync(filepath)) continue;
    try {
      const content = readFileSync(filepath, 'utf-8');
      const match = content.match(/^CURRENT_APPLICATION\s*=\s*(.+)$/m);
      if (match) {
        const value = match[1].trim().replace(/^["']|["']$/g, '');
        if (value) return value;
      }
    } catch {
      // Ignore read errors
    }
  }
  return null;
}

function formatProjectContext(ctx) {
  if (!ctx) return '';
  if (ctx.includes(',')) {
    return `${c.bold}${c.yellow}multi[${ctx}]${c.reset}`;
  }
  return `${c.bold}${ctx}${c.reset}`;
}

// ---------------------------------------------------------------------------
// Formatting Helpers
// ---------------------------------------------------------------------------

function formatCost(usd) {
  if (usd === undefined || usd === null) return null;
  if (usd < 0.005) return '$0.00';
  if (usd < 10) return `$${usd.toFixed(2)}`;
  return `$${usd.toFixed(1)}`;
}

function formatDuration(ms) {
  if (!ms) return null;
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const totalMin = Math.floor(totalSec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h${m > 0 ? `${m}m` : ''}`;
}

function formatTokens(tokens) {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 10_000) return `${(tokens / 1_000).toFixed(0)}k`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return `${tokens}`;
}

function pctColor(pct) {
  if (pct < 50) return c.green;
  if (pct < 75) return c.yellow;
  if (pct < 90) return c.orange;
  return c.red;
}

function progressBar(pct, width = 15) {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;
  const color = pctColor(clamped);
  return `${color}${sym.blockFull.repeat(filled)}${c.gray}${sym.blockEmpty.repeat(empty)}${c.reset}`;
}

function colorPct(pct) {
  return `${pctColor(pct)}${pct}%${c.reset}`;
}

function sep() {
  return `${c.gray} ${sym.separator} ${c.reset}`;
}

// ---------------------------------------------------------------------------
// Model Display
// ---------------------------------------------------------------------------

function formatModel(model) {
  if (!model) return '';
  const name = model.display_name || model.id || '';
  if (!name) return '';

  const lower = name.toLowerCase();
  if (lower.includes('opus')) return `${c.magenta}${c.bold}Opus${c.reset}`;
  if (lower.includes('sonnet')) return `${c.blue}Sonnet${c.reset}`;
  if (lower.includes('haiku')) return `${c.cyan}Haiku${c.reset}`;
  return `${c.magenta}${name}${c.reset}`;
}

// ---------------------------------------------------------------------------
// Rate Limits
// ---------------------------------------------------------------------------

function formatRateLimits(rateLimits) {
  if (!rateLimits) return '';

  const parts = [];

  if (rateLimits.five_hour) {
    const pct = Math.round(rateLimits.five_hour.used_percentage || 0);
    const resetMs = (rateLimits.five_hour.resets_at || 0) * 1000;
    const remainMin = resetMs > Date.now()
      ? Math.ceil((resetMs - Date.now()) / 60000)
      : 0;
    const label = remainMin > 0 ? `5h:${colorPct(pct)}(${remainMin}m)` : `5h:${colorPct(pct)}`;
    parts.push(label);
  }

  if (rateLimits.seven_day) {
    const pct = Math.round(rateLimits.seven_day.used_percentage || 0);
    parts.push(`7d:${colorPct(pct)}`);
  }

  return parts.length > 0 ? parts.join(' ') : '';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function readStdin() {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    try {
      return readFileSync('/dev/stdin', 'utf-8');
    } catch {
      return '';
    }
  }
}

function main() {
  const raw = readStdin();
  let input = {};
  if (raw && raw.trim()) {
    try {
      input = JSON.parse(raw);
    } catch {
      input = {};
    }
  }

  const cwd = input.cwd || input.workspace?.current_dir || process.cwd();
  const cost = input.cost || {};
  const contextWindow = input.context_window || {};

  // -- Git --
  const git = getGitInfoCached(cwd);
  const dirtyMark = git.dirty
    ? `${c.yellow}${sym.dirty}${c.reset}`
    : `${c.green}${sym.dirty}${c.reset}`;
  let branchDisplay = git.branch;
  if (git.shortSha) branchDisplay += `@${git.shortSha}`;
  if (branchDisplay.length > 36) branchDisplay = branchDisplay.slice(0, 33) + '...';

  const worktreePrefix = git.isWorktree ? `${c.dim}wt:${c.reset}` : '';
  let gitStr = `${worktreePrefix}${c.cyan}${sym.branch} ${branchDisplay}${c.reset} ${dirtyMark}`;

  if (git.stashCount > 0) {
    gitStr += ` ${c.dim}${sym.stash}${git.stashCount}${c.reset}`;
  }
  if (git.ticket) {
    gitStr += ` ${c.brightCyan}${sym.ticket}${git.ticket}${c.reset}`;
  }

  // -- Project context (multi-site convention) --
  const projectCtx = getProjectContext(cwd);
  const projectCtxStr = formatProjectContext(projectCtx);

  // -- Model --
  const modelStr = formatModel(input.model);

  // -- Cost --
  const costVal = formatCost(cost.total_cost_usd);
  const costStr = costVal ? `${c.green}${costVal}${c.reset}` : '';

  // -- Duration --
  const durationVal = formatDuration(cost.total_duration_ms);
  const durationStr = durationVal ? `${c.dim}${durationVal}${c.reset}` : '';

  // -- Lines changed --
  let linesStr = '';
  const added = cost.total_lines_added || 0;
  const removed = cost.total_lines_removed || 0;
  if (added || removed) {
    linesStr = `${c.brightGreen}+${added}${c.reset}${c.red}-${removed}${c.reset}`;
  }

  // ===== LINE 1 =====
  const line1Parts = [gitStr, projectCtxStr, modelStr, costStr, durationStr, linesStr].filter(Boolean);
  const line1 = line1Parts.join(sep());

  // ===== LINE 2: context bar + rate limits =====
  let line2 = '';

  const usedPct = contextWindow.used_percentage;
  if (usedPct !== null && usedPct !== undefined) {
    const maxTokens = contextWindow.context_window_size || 200000;
    const pct = Math.round(usedPct);
    const totalTokens =
      (contextWindow.total_input_tokens || 0) +
      (contextWindow.total_output_tokens || 0) +
      (contextWindow.total_cache_read_input_tokens || 0) +
      (contextWindow.total_cache_creation_input_tokens || 0);

    line2 = `${c.gray}${sym.context}${c.reset} ${progressBar(pct)} ${formatTokens(totalTokens)}/${formatTokens(maxTokens)} ${colorPct(pct)}`;

    if (pct >= 80) {
      line2 += ` ${c.orange}${sym.warning} compaction soon${c.reset}`;
    }
  } else if (contextWindow.current_usage) {
    const usage = contextWindow.current_usage;
    const totalTokens =
      (usage.input_tokens || 0) +
      (usage.output_tokens || 0) +
      (usage.cache_read_input_tokens || 0) +
      (usage.cache_creation_input_tokens || 0);
    const maxTokens = contextWindow.context_window_size || 200000;
    const pct = Math.min(100, Math.round((totalTokens / maxTokens) * 100));

    line2 = `${c.gray}${sym.context}${c.reset} ${progressBar(pct)} ${formatTokens(totalTokens)}/${formatTokens(maxTokens)} ${colorPct(pct)}`;
  }

  const rateLimitStr = formatRateLimits(input.rate_limits);
  if (rateLimitStr && line2) {
    line2 += sep() + rateLimitStr;
  } else if (rateLimitStr) {
    line2 = rateLimitStr;
  }

  const combined = line2 ? `${line1}${sep()}${line2}` : line1;
  process.stdout.write(`${combined}\n`);
}

main();
