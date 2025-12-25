const User = require('../models/user');

// Signup controller
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    // Create new user
    const newUser = new User({ name, email, password });
    const savedUser = await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: savedUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
