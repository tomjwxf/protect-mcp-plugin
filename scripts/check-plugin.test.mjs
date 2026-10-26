import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(root, path), 'utf8');
const manifest = JSON.parse(read('.claude-plugin/plugin.json'));
const walk = path => readdirSync(path, { withFileTypes: true }).flatMap(entry => {
  const child = join(path, entry.name);
  return entry.isDirectory() ? walk(child) : [child];
});
const guidance = ['README.md', ...['commands', 'skills'].filter(dir => existsSync(join(root, dir))).flatMap(dir => walk(join(root, dir)).map(path => relative(root, path)))];

test('published identity is preserved and directs users to public maintained sources', () => {
  assert.equal(manifest.name, 'protect-mcp');
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.notEqual(manifest.version, '1.0.0', 'A changed plugin must have a new plugin version');
  assert.equal(manifest.repository, 'https://github.com/tomjwxf/protect-mcp-plugin');
  assert.equal(manifest.homepage, 'https://scopeblind.com/protect-mcp');
  assert.equal(manifest.license, 'MIT');
  assert.ok(existsSync(join(root, 'LICENSE')));
});

test('installing this guidance plugin cannot silently install an execution hook or MCP server', () => {
  for (const path of ['hooks', '.mcp.json', 'mcp.json', '.claude/settings.json', '.claude/settings.local.json']) {
    assert.equal(existsSync(join(root, path)), false, `${path} would change the guidance-only installation contract`);
  }
  for (const key of ['hooks', 'mcpServers', 'lspServers']) assert.equal(manifest[key], undefined);
});

test('all executable package examples use reviewed pins or the already installed binary', () => {
  for (const path of guidance) {
    const text = read(path);
    for (const line of text.split('\n').filter(line => /\bnpx\b/.test(line))) {
      if (/\bnpx\s+--no-install\s+(protect-mcp|verify)\b/.test(line)) continue;
      if (/\bprotect-mcp\b/.test(line)) assert.match(line, /protect-mcp@0\.32\.4\b/, `${path}: unpinned gateway: ${line}`);
      if (/@veritasacta\/verify/.test(line)) assert.match(line, /@veritasacta\/verify@0\.11\.1\b/, `${path}: unpinned verifier: ${line}`);
    }
    assert.doesNotMatch(text, /(?:protect-mcp|@veritasacta\/verify)@latest\b/, path);
    assert.doesNotMatch(text, /https:\/\/github\.com\/[^\s)]+\/ScopeBlindD2\b/i, path);
    assert.doesNotMatch(text, /--(?:dangerously-skip-permissions|allow-dangerously-skip-permissions)\b/, path);
    assert.doesNotMatch(text, /permissionDecision\s*[:=]\s*['"]allow['"]/, path);
    assert.doesNotMatch(text, /Tool call wrapped/, path);
  }
});

test('enforcement example uses supported policy fields and refuses unlisted tools', () => {
  const source = read('skills/enforce/SKILL.md');
  const policies = [...source.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map(match => JSON.parse(match[1])).filter(value => value.tools);
  assert.equal(policies.length, 1, 'Keep one complete, runnable example policy');
  const policy = policies[0];
  assert.equal(policy.tools['*'].block, true);
  const supported = new Set(['block', 'rate_limit', 'require_approval', 'min_tier', 'require', 'rate_limits']);
  for (const [name, rule] of Object.entries(policy.tools)) {
    for (const key of Object.keys(rule)) assert.ok(supported.has(key), `Unknown ${name} policy field: ${key}`);
    if (rule.rate_limit !== undefined) assert.match(rule.rate_limit, /^[1-9]\d*\/(second|minute|hour|day)$/);
    for (const key of ['block', 'require_approval']) if (rule[key] !== undefined) assert.equal(typeof rule[key], 'boolean');
  }
  assert.equal(policy.signing.enabled, true);
  assert.equal(policy.signing.key_path, './keys/gateway.json');
});

test('verification guidance requires an expected key and separates checking from execution', () => {
  for (const path of ['skills/verify/SKILL.md', 'commands/verify.md'].filter(path => existsSync(join(root, path)))) {
    const text = read(path);
    assert.match(text, /--key/);
    assert.match(text, /trusted|independent/i);
    assert.match(text, /execution|executed|complete|coverage/i);
    assert.doesNotMatch(text, /verify@0\.11\.1\s+\.\/receipts\/\s*$/m, 'Directory arguments are not receipt verification');
  }
});
