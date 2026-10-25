// A deliberately harmless stand-in for a user's MCP server. Recording a name
// proves whether the gateway forwarded the call; no proposed command is run.
import { appendFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const output = process.argv[2];
const names = ['safe_lookup', 'expensive_lookup', 'sensitive_tool', 'unlisted_tool'];
for await (const line of createInterface({ input: process.stdin })) {
  const request = JSON.parse(line);
  if (request.id === undefined) continue;
  let result;
  if (request.method === 'initialize') {
    result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'local-fixture', version: '1.0.0' } };
  } else if (request.method === 'tools/list') {
    result = { tools: names.map(name => ({ name, description: 'Synthetic local check', inputSchema: { type: 'object', properties: {} } })) };
  } else if (request.method === 'tools/call') {
    appendFileSync(output, `${request.params.name}\n`);
    result = { content: [{ type: 'text', text: `fixture reached: ${request.params.name}` }] };
  } else {
    result = {};
  }
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: request.id, result })}\n`);
}
