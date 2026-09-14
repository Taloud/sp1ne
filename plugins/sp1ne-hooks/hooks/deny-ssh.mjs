#!/usr/bin/env node
// PreToolUse hook — denies any Bash command that invokes ssh.
//
// Strict by design: a standalone `ssh` token anywhere in the command line is
// denied, including inside quotes (`bash -c "ssh host"`), behind wrappers
// (`sudo ssh`, `xargs ssh`) or spelled as a path (`/usr/bin/ssh`). The cost is
// the occasional innocent mention (e.g. `echo ssh`) being denied too.
// Out of scope: ssh-the-protocol used implicitly (git push/pull over an ssh
// remote never spells `ssh` in the command and stays allowed).
//
// Registered by the sp1ne-hooks plugin via hooks/hooks.json — see the main
// README's "Hooks" section.

const BLOCKED = ['ssh'];

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

const tokens = command.split(/[\s;|&`(){}<>]+/);
const hit = tokens
  .map((t) => t.replace(/^["']+|["']+$/g, ''))
  .find((t) => BLOCKED.some((name) => t === name || t.endsWith(`/${name}`)));

if (hit) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          `Command denied by the deny-ssh hook: "${hit}" invokes ssh, and no ssh ` +
          'command may run from this session. Ask the user to run it themselves ' +
          'in their own terminal.',
      },
    }),
  );
}
process.exit(0);
