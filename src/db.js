const { Pool } = require("pg");

// Render and Railway supply DATABASE_URL as a full connection string.
// Fall back to individual variables for local development.
// Render, Railway, and most managed-PostgreSQL providers use self-signed TLS
// certificates, so rejectUnauthorized must be false when using DATABASE_URL.
// Set DB_SSL_VERIFIED=true in your environment only when your PostgreSQL server
// has a certificate signed by a trusted CA.
const sslForDatabaseUrl =
  String(process.env.DB_SSL_VERIFIED || "false").toLowerCase() === "true"
    ? true
    : { rejectUnauthorized: false };

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslForDatabaseUrl
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "practice_for_practice",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
      ssl: String(process.env.DB_SSL || "false").toLowerCase() === "true" ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

async function query(text, params = []) {
  return pool.query(text, params);
}

async function closePool() {
  await pool.end();
}

module.exports = {
  query,
  closePool
};
