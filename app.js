require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const pageAuthRoutes = require('./routes/auth');
const apiAuthRoutes = require('./routes/api/authApi');

// for JWT
const cookieParser = require('cookie-parser');
const authenticateToken = require('./middlewares/authenticateToken');
const authorizeRole = require('./middlewares/authorizeRole');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.urlencoded({ extended: true })); // to read form data from POST
app.use(express.json()); // parse JSON request body from backend (for API)

// _______Tailwind
app.use(express.static("public"));

// _________Routes
app.use('/auth', pageAuthRoutes);      // Page routes
app.use('/api/auth', apiAuthRoutes);   // API routes

// Middleware to parse cookies (needed for JWT in cookies)
app.use(cookieParser());


// View engine
app.set("view engine", "ejs");

// Adding middeware 
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/register", (req, res) => {
  res.render("auth/register");
});

// Dashboards
app.get( '/admin/dashboard', authenticateToken, authorizeRole('admin'),
    (req, res) => {
        res.render('admin/adminDashboard');
    }
);

app.get( '/donor/dashboard', authenticateToken, authorizeRole('donor'),
    (req, res) => {
        res.render('donor/donorDashboard');
    }
);

app.get( '/volunteer/dashboard', authenticateToken, authorizeRole('volunteer'),
    (req, res) => {
        res.render('volunteer/volunteerDashboard');
    }
);


// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
