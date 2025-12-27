const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ------ SIGNUP ------
exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  const errors = {};

  try {
    // Validate all fields
    if (!name || name.trim() === '') errors.name = 'Name is required';
    if (!email || email.trim() === '') errors.email = 'Email is required';
    if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!role) errors.role = 'Role is required';

    // Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) errors.email = 'Email already exists';

    // If any errors, re-render with previous input
    if (Object.keys(errors).length > 0) {
      return res.render('auth/register', {
        errors,
        oldInput: req.body
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save user
    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();
    console.log('User saved successfully:', newUser);

    // Redirect to login after success
    res.redirect('/auth/login');

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};



// --- LOGIN ---
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1️⃣ Find user in DB
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('auth/login', { errors: { email: 'Email not found' }, email });
        }

        // 2️⃣ Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('auth/login',  { errors: { password: 'Incorrect password' }, email });
        }

        // 3️⃣ Generate JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 4️⃣ Set JWT in HTTP-only cookie
        res.cookie('token', token, { httpOnly: true /*, secure: true in production */ });

        // 5️⃣ Redirect based on role
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
        return res.status(500).render('auth/login', { errors: { general: 'Server error' }, email });
    }
};