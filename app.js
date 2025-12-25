const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json()); // parse JSON request body from backend (for API)

// Tailwind
app.use(express.static("public"));

// Routes
app.use('/api/auth', authRoutes);


app.set("view engine", "ejs");

// Adding middeware 
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/register", (req, res) => {
  res.render("auth/register");
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
