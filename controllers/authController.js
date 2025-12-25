const User = require('../models/User');
const bcrypt = require('bcrypt');

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
