import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3001;

// Allow frontend to talk to backend
app.use(cors());
app.use(express.json());

console.log("DATABASE_URL is:", process.env.DATABASE_URL); // TEMP: for debugging

// Postgres pool (Supabase connection string)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase usually needs SSL
});

// Simple test route
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
