const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: "./config.env" });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
const ATLAS_URI = process.env.ATLAS_URI;

mongoose.connect(ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch(err => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

// Import Routes
const authRoutes = require("./routes/auth");

// Use Routes
app.use("/api", authRoutes);

// Test Route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});