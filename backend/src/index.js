const app = require('./app');
const config = require('./config');
const { pool } = require('./db');

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (${config.env})`);
});

async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
}
['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => shutdown(s)));
