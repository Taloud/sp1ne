#!/usr/bin/env node
// PreToolUse hook: denies Bash commands that change who the agent acts as, or
// how git and gh authenticate, so a denied push cannot be worked around by
// switching account or rewiring credentials:
//   - `gh auth <anything but status>`: switch, login, logout, setup-git,
//     refresh, token, git-credential;
//   - `git config` writes to identity, credential, remote or transport keys
//     (user.*, credential.*, remote.*, url.*, http.*, https.*, include.*,
//     includeIf.*, core.sshCommand, core.askPass, gpg.*, commit.gpgsign), and
//     `git config --edit`; reads (--get, --get-all, --list, --show-origin, a
//     bare `git config <key>`) stay allowed;
//   - the same keys passed inline: `git -c key=value …`, `--config-env=key=…`;
//   - `git credential*` (fill, approve, reject, store, cache, osxkeychain);
//   - `git remote add | remove | rm | rename | set-url`;
//   - environment overrides of the same things: GH_TOKEN=, GITHUB_TOKEN=,
//     GIT_ASKPASS=, GIT_SSH_COMMAND=, GIT_CONFIG_*=, GIT_AUTHOR_*=,
//     GIT_COMMITTER_*=, GIT_CREDENTIAL_*=;
//   - any mention of a credential store file: .git-credentials, .netrc,
//     _netrc, gh/hosts.yml.
// Known gap: editing ~/.gitconfig or .git/config with sed/echo is not caught
// (the tokenizer cannot tell a read from a write on a path).
// Same strict string-based parsing as the other hooks: quoted forms are caught
// too, at the cost of the occasional innocent mention.
// Registered by the sp1ne-hooks plugin via hooks/hooks.json.

const GIT_OPTS_WITH_VALUE = ['-C', '--git-dir', '--work-tree', '--exec-path', '--namespace'];
const GH_AUTH_ALLOWED = ['status'];
const DENIED_KEY_PREFIXES = [
  'user.', 'credential.', 'remote.', 'url.', 'http.', 'https.', 'include.', 'includeif.',
  'core.sshcommand', 'core.askpass', 'gpg.', 'commit.gpgsign',
];
const CONFIG_READ_FLAGS = [
  '--get', '--get-all', '--get-regexp', '--get-urlmatch', '--get-color', '--get-colorbool',
  '--list', '-l', '--show-origin', '--show-scope',
];
const CONFIG_WRITE_FLAGS = ['--add', '--unset', '--unset-all', '--replace-all', '--remove-section', '--rename-section'];
const CONFIG_OPTS_WITH_VALUE = ['--file', '-f', '--blob', '--default', '--type', '--worktree'];
const REMOTE_WRITE_SUBCOMMANDS = ['add', 'remove', 'rm', 'rename', 'set-url'];
const ENV_OVERRIDE = /^(GH_TOKEN|GH_ENTERPRISE_TOKEN|GITHUB_TOKEN|GITHUB_ENTERPRISE_TOKEN|GH_HOST|GIT_ASKPASS|SSH_ASKPASS|GIT_SSH|GIT_SSH_COMMAND|GIT_CONFIG[A-Z0-9_]*|GIT_AUTHOR_NAME|GIT_AUTHOR_EMAIL|GIT_COMMITTER_NAME|GIT_COMMITTER_EMAIL|GIT_CREDENTIAL[A-Z0-9_]*)=/;
const CREDENTIAL_FILES = ['.git-credentials', '.netrc', '_netrc', 'gh/hosts.yml'];

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

// an empty quoted value (`git config credential.helper ""`) must survive as a
// token, otherwise the write looks like a bare read of the key
const tokens = command
  .split(/[\s;|&`(){}<>]+/)
  .filter(Boolean)
  .map((t) => t.replace(/^["'!]+|["']+$/g, '') || '""');

const isDeniedKey = (key) => {
  const k = key.toLowerCase();
  return DENIED_KEY_PREFIXES.some((p) => k.startsWith(p) || `${k}.`.startsWith(p));
};
const isBinary = (tok, name) => tok === name || tok.endsWith(`/${name}`);

function denyReason() {
  for (const t of tokens) {
    if (ENV_OVERRIDE.test(t)) return `"${t.slice(0, t.indexOf('='))}=" overrides git/gh identity or credentials`;
    if (CREDENTIAL_FILES.some((f) => t.endsWith(f) || t.includes(`${f}/`) || t.includes(`/${f}`))) {
      return `"${t}" is a credential store`;
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    if (isBinary(tokens[i], 'gh')) {
      if (tokens[i + 1] === 'auth' && !GH_AUTH_ALLOWED.includes(tokens[i + 2] ?? '')) {
        return `"gh auth ${tokens[i + 2] ?? ''}" changes the active GitHub account or its credentials`;
      }
      continue;
    }

    if (!isBinary(tokens[i], 'git')) continue;

    // resolve the git subcommand, skipping global options; inspect inline config on the way
    let j = i + 1;
    while (j < tokens.length) {
      if (tokens[j] === '-c' || tokens[j] === '--config-env') {
        const key = (tokens[j + 1] ?? '').split('=')[0];
        if (isDeniedKey(key)) return `"git ${tokens[j]} ${key}=…" overrides identity or credential config inline`;
        j += 2;
        continue;
      }
      if (tokens[j].startsWith('--config-env=')) {
        const key = tokens[j].slice('--config-env='.length).split('=')[0];
        if (isDeniedKey(key)) return `"${tokens[j]}" overrides identity or credential config inline`;
        j += 1;
        continue;
      }
      if (GIT_OPTS_WITH_VALUE.includes(tokens[j])) { j += 2; continue; }
      if (tokens[j].startsWith('-')) { j += 1; continue; }
      break;
    }
    const subcommand = tokens[j];
    const rest = tokens.slice(j + 1);
    if (!subcommand) continue;

    if (subcommand === 'credential' || subcommand.startsWith('credential-')) {
      return `"git ${subcommand}" reads or writes stored credentials`;
    }

    if (subcommand === 'remote' && REMOTE_WRITE_SUBCOMMANDS.includes(rest[0])) {
      return `"git remote ${rest[0]}" changes where commits are pushed`;
    }

    if (subcommand === 'config') {
      if (rest.some((a) => CONFIG_READ_FLAGS.includes(a))) continue; // read-only query
      if (rest.some((a) => a === '--edit' || a === '-e')) return '"git config --edit" opens the config for writing';
      const positionals = [];
      for (let k = 0; k < rest.length; k++) {
        if (CONFIG_OPTS_WITH_VALUE.includes(rest[k])) { k += 1; continue; }
        if (rest[k].startsWith('-')) continue;
        positionals.push(rest[k]);
      }
      // `git config <key>` alone is a read; a value or a write flag makes it a write
      const isWrite = positionals.length >= 2 || rest.some((a) => CONFIG_WRITE_FLAGS.includes(a));
      const key = positionals[0];
      if (isWrite && key && isDeniedKey(key)) return `"git config … ${key}" rewrites identity, credential or remote config`;
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
          `Command denied by the deny-credential-tampering hook: ${reason}. Changing the git ` +
          'identity, credential helpers, remotes or the active gh account is not allowed from ' +
          'this session. Ask the user to do it themselves in their own terminal.',
      },
    }),
  );
}
process.exit(0);
