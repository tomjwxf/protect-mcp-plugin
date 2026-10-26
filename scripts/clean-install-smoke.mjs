// Download only the documented releases, then check local synthetic work.
// Run from any directory: node scripts/clean-install-smoke.mjs
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = mkdtempSync(join(tmpdir(), 'protect-mcp-plugin-smoke-'));
const pins = { 'protect-mcp': '0.32.4', '@veritasacta/verify': '0.11.1' };
const installEnv = { ...process.env, NO_COLOR: '1', npm_config_audit: 'false', npm_config_fund: 'false', PROTECT_MCP_TELEMETRY: 'off' };
const localEnv = { ...installEnv, npm_config_offline: 'true', PATH: `${dirname(process.execPath)}:${process.env.PATH}`, NODE_OPTIONS: `--require ${JSON.stringify(join(root, 'tests/fixtures/no-network.cjs'))}` };
const gateway = join(temporary, 'node_modules/protect-mcp/dist/cli.js');
const verifier = join(temporary, 'node_modules/@veritasacta/verify/cli.js');

function run(bin, args, { cwd = temporary, expected = 0, env = localEnv, timeout = 30_000 } = {}) {
  const result = spawnSync(bin, args, { cwd, env, input: '', encoding: 'utf8', timeout, maxBuffer: 4 * 1024 * 1024 });
  assert.equal(result.error, undefined, `Could not run ${args[0]}: ${result.error?.message}`);
  assert.equal(result.status, expected, `${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  return result;
}
const cli = (bin, args, options) => run(process.execPath, [bin, ...args], options);
const readJSON = path => JSON.parse(readFileSync(path, 'utf8'));
const readLines = path => existsSync(path) ? readFileSync(path, 'utf8').trim().split('\n').filter(Boolean) : [];

async function wrapper(mode, policy) {
  const cwd = join(temporary, mode);
  mkdirSync(cwd);
  cli(gateway, ['init'], { cwd });
  writeFileSync(join(cwd, 'protect-mcp.json'), JSON.stringify(policy));
  const key = readJSON(join(cwd, 'keys/gateway.json')).publicKey;
  const forwarded = join(cwd, 'forwarded.txt');
  const args = [gateway, '--policy', './protect-mcp.json', ...(mode === 'enforce' ? ['--enforce'] : []), '--', process.execPath, join(root, 'tests/fixtures/mcp-server.mjs'), forwarded];
  const child = spawn(process.execPath, args, { cwd, env: localEnv, stdio: ['pipe', 'pipe', 'pipe'] });
  const lines = createInterface({ input: child.stdout });
  const pending = new Map();
  let stderr = '';
  let sequence = 0;
  const abort = error => { for (const item of pending.values()) item.reject(error); pending.clear(); };
  child.on('error', abort);
  child.stdin.on('error', abort);
  child.stderr.on('data', chunk => { stderr += chunk; });
  child.on('exit', code => abort(new Error(`Gateway exited ${code}: ${stderr.slice(-1500)}`)));
  lines.on('line', line => {
    try {
      const response = JSON.parse(line);
      const item = pending.get(response.id);
      if (item) { pending.delete(response.id); item.resolve(response); }
    } catch (error) { abort(new Error(`Non-JSON protocol output: ${error.message}`)); }
  });
  const request = (method, params) => new Promise((resolveRequest, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve: resolveRequest, reject });
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  });
  const call = name => request('tools/call', { name, arguments: {} });
  const deadline = setTimeout(() => { abort(new Error('Gateway fixture exceeded 30 seconds')); child.kill('SIGTERM'); }, 30_000);
  try {
    const initialized = await request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'plugin-smoke', version: '1.0.0' } });
    assert.equal(initialized.result.serverInfo.name, 'local-fixture');
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
    const discovered = await request('tools/list', {});
    assert.equal(discovered.result.tools.length, 4);
    assert.match((await call('safe_lookup')).result.content[0].text, /fixture reached/);
    const blocked = await call('unlisted_tool');
    const held = await call('sensitive_tool');
    if (mode === 'shadow') {
      assert.match(blocked.result.content[0].text, /fixture reached/);
      assert.match(held.result.content[0].text, /fixture reached/);
      assert.deepEqual(readLines(forwarded), ['safe_lookup', 'unlisted_tool', 'sensitive_tool']);
    } else {
      assert.match(blocked.error.message, /blocked by policy/);
      assert.equal(held.result.isError, true);
      assert.match(held.result.content[0].text, /REQUIRES_APPROVAL/);
      const count = Number(policy.tools.expensive_lookup.rate_limit.split('/')[0]);
      assert.ok(count <= 20, 'Keep the synthetic rate-limit test bounded');
      for (let index = 0; index < count; index++) assert.match((await call('expensive_lookup')).result.content[0].text, /fixture reached/);
      assert.match((await call('expensive_lookup')).error.message, /rate limit exceeded/);
      assert.deepEqual(readLines(forwarded), ['safe_lookup', ...Array(count).fill('expensive_lookup')]);
    }
    const records = readLines(join(cwd, '.protect-mcp-receipts.jsonl')).map(JSON.parse);
    const configuredLimit = Number(policy.tools.expensive_lookup.rate_limit.split('/')[0]);
    assert.equal(records.length, mode === 'shadow' ? 3 : configuredLimit + 4);
    assert.deepEqual(records.slice(0, 3).map(record => record.payload.decision), ['allow', 'deny', 'require_approval']);
    const verified = JSON.parse(cli(verifier, ['--replay-chain', './.protect-mcp-receipts.jsonl', '--key', key, '--json'], { cwd }).stdout);
    assert.equal(verified.verified, records.length);
    assert.equal(verified.failed, 0);
    assert.equal(verified.undecidable, 0);
    assert.equal(verified.chainBreaks, 0);
    console.log(`PASS ${mode}: actual forwarding, policy decisions and ${records.length} signed receipts`);
  } finally {
    clearTimeout(deadline);
    lines.close();
    const exited = once(child, 'exit');
    child.stdin.end();
    const cleanup = setTimeout(() => child.kill('SIGKILL'), 2000);
    try { if (child.exitCode === null && child.signalCode === null) await exited; } finally { clearTimeout(cleanup); }
  }
}

try {
  writeFileSync(join(temporary, 'package.json'), JSON.stringify({ name: 'protect-mcp-plugin-smoke', version: '0.0.0', private: true }));
  run('npm', ['install', '--registry=https://registry.npmjs.org', '--save-exact', '--ignore-scripts', ...Object.entries(pins).map(([name, version]) => `${name}@${version}`)], { env: installEnv, timeout: 180_000 });
  for (const [name, version] of Object.entries(pins)) assert.equal(readJSON(join(temporary, 'node_modules', name, 'package.json')).version, version);
  console.log(`PASS clean install: ${Object.entries(pins).map(([name, version]) => `${name}@${version}`).join(', ')}`);

  const enforceSource = readFileSync(join(root, 'skills/enforce/SKILL.md'), 'utf8');
  const policy = [...enforceSource.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map(match => JSON.parse(match[1])).find(value => value.tools);
  assert.ok(policy, 'Missing documented example policy');
  await wrapper('shadow', policy);
  await wrapper('enforce', policy);

  const cwd = join(temporary, 'cedar');
  mkdirSync(cwd);
  // Execute the actual published walkthrough, not a reimplementation of its
  // command lines. Shell failures stop the run; the assertions below also
  // inspect the artifacts so an expected nonzero exit cannot mask a bad rule.
  const guide = readFileSync(join(root, 'skills/red-team/SKILL.md'), 'utf8');
  const marked = guide.split('<!-- smoke:start -->')[1]?.split('<!-- smoke:end -->')[0];
  assert.ok(marked, 'Missing runnable red-team walkthrough markers');
  const blocks = [...marked.matchAll(/```(?:sh|bash)\s*\n([\s\S]*?)\n```/g)];
  assert.equal(blocks.length, 1, 'Keep the tested walkthrough in one shell block');
  run('bash', ['-euo', 'pipefail', '-c', blocks[0][1]], { cwd, timeout: 90_000 });
  const key = readJSON(join(cwd, 'protect-mcp.key')).publicKey;
  const receipts = readLines(join(cwd, 'receipts/receipts.jsonl')).map(JSON.parse);
  assert.deepEqual(receipts.map(record => record.payload.decision), ['allow', 'deny']);
  const replay = JSON.parse(cli(verifier, ['--replay-chain', './receipts/receipts.jsonl', '--key', key, '--json'], { cwd }).stdout);
  assert.equal(replay.verified, 2);
  assert.equal(replay.chainBreaks, 0);
  assert.equal(replay.failed, 0);
  writeFileSync(join(cwd, 'original.json'), JSON.stringify(receipts[0]));
  const noKey = JSON.parse(cli(verifier, ['original.json', '--json'], { cwd, expected: 2 }).stdout);
  assert.equal(noKey.error, 'embedded_key_rejected');
  cli(verifier, ['original.json', '--key', '00'.repeat(32), '--json'], { cwd, expected: 1 });
  const altered = structuredClone(receipts[1]);
  altered.payload.decision = 'allow';
  writeFileSync(join(cwd, 'tampered.json'), JSON.stringify(altered));
  const invalid = JSON.parse(cli(verifier, ['tampered.json', '--key', key, '--json'], { cwd, expected: 1 }).stdout);
  assert.match(JSON.stringify(invalid), /invalid_signature/);
  cli(verifier, ['--self-test'], { cwd });
  console.log('PASS Cedar allow/deny, signing, trusted-key replay, no-key rejection, wrong-key rejection, tamper rejection and verifier self-test');
  console.log('All checks used synthetic local work. No real tool command or production API was executed.');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
