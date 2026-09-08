const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  namedPlaceholders: true,
  timezone: 'Z',
});

/** Run a query, return rows. */
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/** Run a query, return the first row or null. */
async function one(sql, params) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/** Run fn inside a transaction with a dedicated connection. */
async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, one, transaction };
