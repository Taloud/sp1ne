#!/usr/bin/env node
// PreToolUse hook: denies every `git push` from Bash commands, whatever the
// remote, branch, flags or refspec (`--dry-run` included, on purpose).
// Pushing publishes work outside the machine and is the user's call: the
// agent prepares the commit, the user pushes from their own terminal.
// Same strict string-based parsing as the other hooks: quoted forms (`bash -c
// "git push"`) are caught too, and the git subcommand is resolved past global
// options (`git -C dir push`, `git -c key=value push`).
// Registered by the sp1ne-hooks plugin via hooks/hooks.json.

const GIT_OPTS_WITH_VALUE = ['-C', '-c', '--git-dir', '--work-tree', '--exec-path', '--namespace', '--config-env'];

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
    if (tokens[j] === 'push') return '"git push" publishes commits to a remote';
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
          `Command denied by the deny-git-push hook: ${reason}. No push of any kind may run ` +
          'from this session. Leave the commit in place and ask the user to push themselves ' +
          'from their own terminal.',
      },
    }),
  );
}
process.exit(0);
