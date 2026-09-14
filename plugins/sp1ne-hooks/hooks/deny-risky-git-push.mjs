#!/usr/bin/env node
// PreToolUse hook — denies risky git pushes from Bash commands:
//   - any force push, to any branch: -f, --force, --force-with-lease[=…],
//     --force-if-includes, a +refspec, --mirror;
//   - any push targeting a protected branch (main, master, develop), spelled
//     as a refspec (`git push origin main`, `HEAD:master`, `--delete origin
//     main`, `--all`) or implicit (`git push` while the current branch is
//     protected — resolved by running git in the hook's cwd, best effort);
//   - any tag push: --tags, --follow-tags, a refs/tags/… refspec, or a
//     refspec naming a local tag (resolved via git in the hook's cwd).
// Same strict string-based parsing as deny-ssh: quoted forms (`bash -c "git
// push -f"`) are caught too, at the cost of the occasional innocent mention.
// Registered by the sp1ne-hooks plugin via hooks/hooks.json.

import { execFileSync } from 'node:child_process';

const PROTECTED = ['main', 'master', 'develop'];
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

function gitQuery(args) {
  try {
    return execFileSync('git', ['-C', input.cwd ?? process.cwd(), ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return ''; // not a repo / git missing: stay out of the way
  }
}

const currentBranch = () => gitQuery(['branch', '--show-current']);
const isLocalTag = (name) => gitQuery(['tag', '-l', '--', name]) !== '';

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
    if (tokens[j] !== 'push') continue;

    const refs = []; // non-flag args: remote first (usually), then refspecs
    for (const a of tokens.slice(j + 1)) {
      if (a.startsWith('--')) {
        if (a.startsWith('--force')) return `"${a}" is a force push`;
        if (a === '--mirror') return '"--mirror" force-updates every remote ref';
        if (a === '--all' || a === '--branches') return `"${a}" pushes every branch, protected ones included`;
        if (a === '--tags' || a === '--follow-tags') return `"${a}" pushes tags`;
        continue;
      }
      if (a.startsWith('-')) {
        if (a.includes('f')) return `"${a}" is a force push`;
        continue;
      }
      if (a.startsWith('+')) return `"${a}" is a force push (leading +)`;
      refs.push(a);
    }

    // explicit refspec check, remote included (cheap, errs safe): protected
    // branch on the dst side, tag on either side
    for (const r of refs) {
      const [src, dst] = r.includes(':')
        ? [r.slice(0, r.indexOf(':')), r.slice(r.indexOf(':') + 1)]
        : [r, r];
      const name = dst.replace(/^refs\/heads\//, '');
      if (PROTECTED.includes(name)) return `it targets protected branch "${name}"`;
      for (const side of [src, dst]) {
        if (side.startsWith('refs/tags/')) return `"${r}" pushes a tag`;
        if (side && isLocalTag(side)) return `"${side}" is a tag`;
      }
    }

    // implicit push (at most a remote, no refspec): the current branch is the target
    if (refs.length <= 1) {
      const branch = currentBranch();
      if (PROTECTED.includes(branch)) {
        return `the current branch "${branch}" is protected (implicit push target)`;
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
        permissionDecisionReason:
          `Command denied by the deny-risky-git-push hook: ${reason}. Force pushes, tag ` +
          `pushes and pushes to ${PROTECTED.join('/')} are not allowed from this session. ` +
          'Push to a feature branch instead, or ask the user to push themselves.',
      },
    }),
  );
}
process.exit(0);
