require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const pageAuthRoutes = require('./routes/auth');
const apiAuthRoutes = require('./routes/api/authApi');
 
// _____________ ROLES ROUTES ______________
const adminRoutes = require('./routes/adminRoutes');
const donorRoutes = require('./routes/donorRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');

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

//  ____________Make JWT user available in all EJS pages_____________
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      res.locals.user = decoded;
    } catch (err) {
      req.user = null;
      res.locals.user = null;
    }
  } else {
    req.user = null;
    res.locals.user = null;
  }
  next();
});



// View engine
app.set("view engine", "ejs");

// Adding middeware 
app.get("/", (req, res) => {
  res.render("homePage");
});

app.get("/register", (req, res) => {
  res.render("auth/register");
});

// ____________ Roles Routes for Dashboards ______________
app.use('/admin', adminRoutes);
app.use('/donor', donorRoutes);
app.use('/volunteer', volunteerRoutes);

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
