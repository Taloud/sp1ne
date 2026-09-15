#!/usr/bin/env node
// PreToolUse hook: denies working-tree/history-destroying git commands:
//   - reset --hard (any position after the subcommand);
//   - clean with a force flag: -f, --force, or a short cluster containing
//     f (-fd, -df, -fdx, -ffd, …); git clean -n / --dry-run stays allowed;
//   - branch -D, or --delete combined with --force/-f (also cluster forms
//     like -Df); plain branch -d stays allowed;
//   - checkout / restore whose pathspec is "." (git checkout ., git checkout
//     -- ., git restore ., git restore --worktree .); named files stay
//     allowed;
//   - stash drop and stash clear.
// Same strict string-based parsing as deny-ssh and deny-risky-git-push:
// quoted forms (`bash -c "git reset --hard"`) are caught too, and the git
// subcommand is resolved the same way as deny-risky-git-push, so
// `git -C dir reset --hard` is caught as well.
// Registered by the sp1ne-hooks plugin via hooks/hooks.json.

const GIT_OPTS_WITH_VALUE = ['-C', '-c', '--git-dir', '--work-tree', '--exec-path', '--namespace'];

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

let input;
try {
  input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
} catch {
  process.exit(0); // unreadable payload: stay out of the way
}

if (input.tool_name !== 'Bash') process.exit(0);
const command = input.tool_input?.command;
if (typeof command !== 'string') process.exit(0);

const tokens = command
  .split(/[\s;|&`(){}<>]+/)
  .map((t) => t.replace(/^["']+|["']+$/g, ''))
  .filter(Boolean);

function isForceCluster(tok) {
  // a short-option cluster like -f, -fd, -df, -fdx that includes f
  return /^-[a-zA-Z]+$/.test(tok) && tok.includes('f');
}

function denyReason() {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== 'git' && !tokens[i].endsWith('/git')) continue;

    // resolve the git subcommand, skipping global options and their values
    let j = i + 1;
    while (j < tokens.length) {
      if (GIT_OPTS_WITH_VALUE.includes(tokens[j])) { j += 2; continue; }
      if (tokens[j].startsWith('-')) { j += 1; continue; }
      break;
    }
    const subcommand = tokens[j];
    const rest = tokens.slice(j + 1);
    if (!subcommand) continue;

    if (subcommand === 'reset') {
      if (rest.includes('--hard')) {
        return '"git reset --hard" discards working-tree changes irreversibly, use git stash or a named branch first';
      }
    }

    if (subcommand === 'clean') {
      const hasDryRun = rest.some((a) => a === '-n' || a === '--dry-run');
      const hasForce = rest.some((a) => a === '--force' || isForceCluster(a));
      if (hasForce && !hasDryRun) {
        return '"git clean" with a force flag deletes untracked files permanently, use git clean -n to preview first';
      }
    }

    if (subcommand === 'branch') {
      if (rest.includes('-D')) {
        return '"git branch -D" force-deletes a branch even with unmerged commits, use git branch -d instead';
      }
      const hasDelete = rest.includes('--delete');
      const hasForce = rest.some((a) => a === '--force' || isForceCluster(a));
      if (hasDelete && hasForce) {
        return '"git branch --delete --force" force-deletes a branch even with unmerged commits, use git branch -d instead';
      }
    }

    if (subcommand === 'checkout' || subcommand === 'restore') {
      const pathspecs = rest.filter((a) => a !== '--' && !a.startsWith('-'));
      if (pathspecs.length > 0 && pathspecs.every((a) => a === '.')) {
        return `"git ${subcommand} ." discards all working-tree changes in the current directory, use git stash first`;
      }
    }

    if (subcommand === 'stash') {
      if (rest[0] === 'drop') {
        return '"git stash drop" permanently deletes a stash entry, use git stash list to check it is no longer needed first';
      }
      if (rest[0] === 'clear') {
        return '"git stash clear" permanently deletes every stash entry, use git stash list to check first';
      }
    }
  }
  return null;
}

const reason = denyReason();
if (reason) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `Command denied by the deny-destructive-git hook: ${reason}.`,
      },
    }),
  );
}
process.exit(0);
