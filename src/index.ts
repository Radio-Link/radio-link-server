import express, { Request, Response } from "express";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Client } = pkg;

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize a Postgres client using the DATABASE_URL from .env
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Try connecting to the database
async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL database successfully!");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1); // stop the app if DB connection fails
  }
}

// Test route
app.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await client.query("SELECT NOW()");
    res.send(`🚀 Hello from Express + TypeScript! <br>🕒 Server time: ${result.rows[0].now}`);
  } catch (error) {
    res.status(500).send("Database query failed ❌");
  }
});

app.listen(PORT, async () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  await connectDB();
});
