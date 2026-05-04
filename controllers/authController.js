const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ActivityLog = require('../models/activityLog');

// ============== SIGNUP ==============
exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  const errors = {};

  try {
    // Validation
    if (!name || name.trim() === '') errors.name = 'Name is required';
    if (!email || email.trim() === '') errors.email = 'Email is required';
    if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!role) errors.role = 'Role is required';

    const existingUser = await User.findOne({ email });
    if (existingUser) errors.email = 'Email already exists';

    // Single admin restriction
    if (role === 'admin') {
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        errors.role = 'Admin already exists. Only one admin allowed.';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.render('auth/register', {
        errors,
        oldInput: { name, email, role }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();

    // Activity log (fixed _id consistency)
    await ActivityLog.create({
      type: 'user',
      refId: newUser._id,
      userId: newUser._id,
      description: `${newUser.name} registered as ${newUser.role}`
    });

    res.redirect('/auth/login');

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};


// ============== LOGIN ==============
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).render('auth/login', {
        errors: { email: 'Email not found' },
        oldInput: { email }
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).render('auth/login', {
        errors: { password: 'Incorrect password' },
        oldInput: { email }
      });
    }

    // 🔥 FIX: use _id instead of userId
    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict'
    });

    switch (user.role) {
      case 'admin':
        return res.redirect('/admin/dashboard');
      case 'donor':
        return res.redirect('/donor/dashboard');
      case 'volunteer':
        return res.redirect('/volunteer/dashboard');
      default:
        return res.redirect('/auth/login');
    }

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).render('auth/login', {
      errors: { general: 'Server error' },
      oldInput: { email }
    });
  }
};


// ============== LOGOUT ==============
exports.logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/'
  });

  res.redirect('/auth/login');
};