// Catch accidental network use by the Node CLI and its Node child fixture
// after installation. This is a test assertion, not an OS sandbox claim.
const refuse = () => { throw new Error('The plugin smoke test forbids network access after installation'); };
for (const name of ['http', 'https']) {
  const module = require(`node:${name}`);
  module.request = refuse;
  module.get = refuse;
}
const net = require('node:net');
net.connect = refuse;
net.createConnection = refuse;
net.Socket.prototype.connect = refuse;
require('node:tls').connect = refuse;
globalThis.fetch = refuse;
