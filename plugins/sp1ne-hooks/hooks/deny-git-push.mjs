#!/usr/bin/env node
// PreToolUse hook: denies every `git push` from Bash commands, whatever the
// remote, branch, flags or refspec (`--dry-run` included, on purpose).
// Pushing publishes work outside the machine and is the user's call: the
// agent prepares the commit, the user pushes from their own terminal.
// Same strict string-based parsing as the other hooks: quoted forms (`bash -c
// "git push"`) are caught too, and the git subcommand is resolved past global
// options (`git -C dir push`, `git -c key=value push`).
// Opt-in allowlist: when SP1NE_GIT_PUSH_ALLOW_BRANCHES holds a regex (set it
// in the "env" block of a project's settings), a push passes only if it names
// the remote origin and at least one branch, every branch matching the regex,
// with no flag outside ALLOWED_FLAGS. A bare push, HEAD, a +refspec, a
// deletion, a tag, --force, --all, --mirror, a shell variable, `git -c` or an
// env assignment before git stay denied, and so do the PROTECTED branches,
// whatever the regex says. An invalid regex denies everything.
// Registered by the sp1ne-hooks plugin via hooks/hooks.json.

const GIT_OPTS_WITH_VALUE = ['-C', '-c', '--git-dir', '--work-tree', '--exec-path', '--namespace', '--config-env'];
const PROTECTED = ['main', 'master', 'develop'];
const ALLOWED_FLAGS = [
  '-u', '--set-upstream', '-n', '--dry-run', '-q', '--quiet', '-v', '--verbose',
  '--atomic', '--porcelain', '--progress', '--no-progress', '--force-if-includes',
];

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

const allowSource = process.env.SP1NE_GIT_PUSH_ALLOW_BRANCHES;
let allowRe = null;
if (allowSource) {
  try {
    allowRe = new RegExp(allowSource);
  } catch {
    // invalid regex: no allowlist, every push is denied
  }
}

function tokenize(text) {
  return text
    .split(/[\s;|&`(){}<>]+/)
    .map((t) => t.replace(/^["']+|["']+$/g, ''))
    .filter(Boolean);
}

// Every `git push` in a token list: the tokens before git, git's global
// options, and the push arguments up to the next git.
function findPushes(tokens) {
  const pushes = [];
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

    let end = j + 1;
    while (end < tokens.length && tokens[end] !== 'git' && !tokens[end].endsWith('/git')) end += 1;
    pushes.push({ before: tokens.slice(0, i), globals: tokens.slice(i + 1, j), args: tokens.slice(j + 1, end) });
  }
  return pushes;
}

function refspecReason(refspec) {
  if (refspec.startsWith('+')) return `${refspec} forces the push`;
  if (/[$*`\\]/.test(refspec)) return `${refspec} is not a literal branch name`;
  let dst = refspec;
  if (refspec.includes(':')) {
    const [src, ...rest] = refspec.split(':');
    if (!src) return `${refspec} deletes a remote branch`;
    dst = rest.join(':');
  }
  if (!dst || dst === 'HEAD' || dst === '@') return `${refspec} does not name its branch`;
  if (dst.startsWith('refs/heads/')) dst = dst.slice('refs/heads/'.length);
  else if (dst.startsWith('refs/')) return `${refspec} is not a branch`;
  if (PROTECTED.includes(dst)) return `${dst} is a protected branch`;
  if (!allowRe.test(dst)) return `${dst} does not match SP1NE_GIT_PUSH_ALLOW_BRANCHES`;
  return null;
}

function pushReason({ before, globals, args }) {
  if (before.some((t) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(t))) return 'an environment assignment precedes git push';
  if (globals.some((t) => t === '-c' || t.startsWith('--config-env'))) return 'git -c can rewrite the remote';

  const positional = [];
  for (const arg of args) {
    if (!arg.startsWith('-')) { positional.push(arg); continue; }
    if (ALLOWED_FLAGS.includes(arg) || arg === '--force-with-lease' || arg.startsWith('--force-with-lease=')) continue;
    return `${arg} is not an allowed push flag`;
  }
  const [remote, ...refspecs] = positional;
  if (remote !== 'origin') return 'the remote must be origin, spelled out';
  if (refspecs.length === 0) return 'the branch must be spelled out';
  for (const refspec of refspecs) {
    const reason = refspecReason(refspec);
    if (reason) return reason;
  }
  return null;
}

function denyReason() {
  if (findPushes(tokenize(command)).length === 0) return null;
  if (!allowRe) return '"git push" publishes commits to a remote';

  // Allowlist: read each shell segment on its own, redirections (`2>&1`,
  // `> out.log`) dropped with their target so they are not taken for refspecs.
  const pushes = command
    .replace(/(?:\d*|&)(?:>>?|<)(?:&\d+|&-|\s*[^\s;|&()<>`{}]+)/g, ' ')
    .split(/[;|&`(){}\n]+/)
    .flatMap((segment) => findPushes(tokenize(segment)));
  if (pushes.length === 0) return 'this "git push" could not be parsed';
  for (const push of pushes) {
    const reason = pushReason(push);
    if (reason) return `${reason} (only pushes of an allowed branch to origin may run)`;
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
          `Command denied by the deny-git-push hook: ${reason}. No other push may run ` +
          'from this session. Leave the commit in place and ask the user to push themselves ' +
          'from their own terminal.',
      },
    }),
  );
}
process.exit(0);
