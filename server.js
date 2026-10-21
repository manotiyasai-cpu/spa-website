
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (
  process.env.FRONTEND_URLS || "http://localhost:5173"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header for local tools.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    }
  })
);

app.use(express.json({ limit: "100kb" }));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "spa_database",
  waitForConnections: true,
  connectionLimit: 10
});

app.get("/", (req, res) => {
  res.send("Spa assessment API is running.");
});

app.post("/api/assessments", async (req, res) => {
  try {
    const data = req.body;

    if (
      !data ||
      typeof data.fullName !== "string" ||
      !data.fullName.trim() ||
      !data.age ||
      !data.phone ||
      data.consent !== true
    ) {
      return res.status(400).json({
        message: "Please provide the required details and consent."
      });
    }

    const fullName = data.fullName.trim().split(/\s+/);
    const firstName = fullName.shift();
    const lastName = fullName.join(" ");

    const age = Number(data.age);

    if (!Number.isInteger(age) || age < 1 || age > 120) {
      return res.status(400).json({
        message: "Please enter a valid age."
      });
    }

    // Store all answers, therapist details and consent together.
    const answers = {
      ...(data.answers || {}),
      consent: true
    };

    const [result] = await pool.execute(
      `INSERT INTO client_assessments
      (first_name, last_name, age, email, country,
       contact_number, gender, assessment_answers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName,
        lastName,
        age,
        data.email || null,
        data.country || null,
        data.phone,
        data.gender || null,
        JSON.stringify(answers)
      ]
    );

    return res.status(201).json({
      message: "Assessment saved successfully.",
      id: result.insertId
    });
  } catch (error) {
    console.error("Assessment submission failed:", error.message);

    return res.status(500).json({
      message: "Unable to save the assessment. Please try again."
    });
  }
});

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to MySQL successfully.");

    app.listen(PORT, () => {
      console.log(`Spa API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exit(1);
  }
}

startServer();

