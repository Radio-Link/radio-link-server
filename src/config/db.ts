// src/config/db.ts
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // These optional settings help prevent Supabase timeout issues
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30s
  connectionTimeoutMillis: 2000, // timeout for a new connection
});

// ✅ Log pool connection events (useful for debugging)
pool.on("connect", () => {
  console.log("🟢 New PostgreSQL client connected");
});

pool.on("remove", () => {
  console.log("🔴 PostgreSQL client removed from pool");
});

// ✅ Capture unexpected errors (don’t crash the app)
pool.on("error", (err) => {
  console.error("⚠️  Unexpected PG pool error", err);
});

// ✅ Test connection helper
export async function testDBConnection() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL ooooooahhh connected:", res.rows[0].now);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
}
 