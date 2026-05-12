const User = require('../models/user');
const Campaign = require('../models/campaign');
const { setMessage } = require('../utils/flashMessage');
const bcrypt = require('bcrypt');


// ___________ navbar Profile _______________
exports.getProfile = async (req, res) => {
  try {

    const user = await User.findById(req.user._id);

    if (!user) {
      setMessage(req, "error", "User not found!");
      return res.redirect('/auth/login');
    }

    let dashboardUrl = '/';

    if (user.role === 'admin') dashboardUrl = '/admin/dashboard';
    else if (user.role === 'donor') dashboardUrl = '/donor/dashboard';
    else if (user.role === 'volunteer') dashboardUrl = '/volunteer/dashboard';

    const safeUser = {
      _id: user._id,
      role: user.role,
      name: user.name || "User",
      email: user.email || ""
    };

    res.render('common/profile', {
      user: safeUser,
      dashboardUrl
    });

  } catch (err) {
    console.log(err);
    setMessage(req, "error", "Something went wrong!");
    return res.redirect('/auth/login');
  }
};


// ================= EDIT PAGE =================
exports.getEditProfile = async (req, res) => {
  try {

    const user = await User.findById(req.user._id);

    if (!user) {
      setMessage(req, "error", "User not found!");
      return res.redirect('/profile');
    }

    res.render('common/editProfile', {
      user,
      errors: {} 
    });

  } catch (err) {
    console.log(err);
    setMessage(req, "error", "Error loading edit page!");
    return res.redirect('/profile');
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    let errors = {};

    // ================= VALIDATION =================
    if (!name || name.trim() === "") {
      errors.name = "Name is required!";
    }

    if (!email || email.trim() === "") {
      errors.email = "Email is required!";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      errors.email = "Invalid email format!";
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.redirect('/profile');
    }

    // no changes check
    if (user.name === name && user.email === email) {
      errors.general = "No changes were made!";
    }

    // email duplicate check
    const emailExists = await User.findOne({
      email,
      _id: { $ne: req.user._id }
    });

    if (emailExists) {
      errors.email = "Email already in use!";
    }

    // ================= IF ERRORS =================
    if (Object.keys(errors).length > 0) {
      return res.render('common/editProfile', {
        user: { ...user._doc, name, email },
        errors
      });
    }

    // ================= UPDATE =================
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true }
    );

    req.user.name = updatedUser.name;
    req.user.email = updatedUser.email;

    setMessage(req, "success", "Profile updated successfully!");
    return res.redirect('/profile');

  } catch (err) {
    console.log(err);

    setMessage(req, "error", "Something went wrong while updating profile!");
    return res.redirect('/profile/edit');
  }
};


// ============== GET CHANGE PASSWORD PAGE ==============
exports.getChangePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.render('common/changePassword', {
      user,
      errors: {},
      message: null
    });

  } catch (err) {
    console.log(err);
    setMessage(req, "error", "Something went wrong!");
    res.redirect('/profile');
  }
};

// ============== UPDATE PASSWORD ==============
exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const errors = {};

    // 1. empty validation
    if (!oldPassword?.trim()) errors.oldPassword = "Old password is required";
    if (!newPassword?.trim()) errors.newPassword = "New password is required";
    if (!confirmPassword?.trim()) errors.confirmPassword = "Confirm password is required";

    if (Object.keys(errors).length > 0) {
      return res.render('common/changePassword', {
        errors
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.render('common/changePassword', {
        errors: { general: "User not found" }
      });
    }

    // 2. check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.render('common/changePassword', {
        errors: { oldPassword: "Old password is incorrect" }
      });
    }

    // 3. length check
    if (newPassword.length < 6) {
      return res.render('common/changePassword', {
        errors: { newPassword: "Password must be at least 6 characters" }
      });
    }

    // 4. match check
    if (newPassword !== confirmPassword) {
      return res.render('common/changePassword', {
        errors: { confirmPassword: "Passwords do not match" }
      });
    }

    // 5. no change check
    if (oldPassword === newPassword) {
      return res.render('common/changePassword', {
        errors: { newPassword: "New password cannot be same as old password" }
      });
    }

    // 6. update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    setMessage(req, "success", "Password updated successfully!");
    return res.redirect('/profile');

  } catch (err) {
    console.log(err);

    return res.render('common/changePassword', {
      errors: { general: "Something went wrong!" }
    });
  }
};