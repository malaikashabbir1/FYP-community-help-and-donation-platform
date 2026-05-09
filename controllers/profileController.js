const User = require('../models/user');
const Campaign = require('../models/campaign');


// ___________ navbar Profile _______________

exports.getProfile = (req, res) => {

  const user = req.user;

  let dashboardUrl = '/';

  if (user.role === 'admin') {
    dashboardUrl = '/admin/dashboard';
  } 
  else if (user.role === 'donor') {
    dashboardUrl = '/donor/dashboard';
  } 
  else if (user.role === 'volunteer') {
    dashboardUrl = '/volunteer/dashboard';
  }

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
};

exports.getEditProfile = (req, res) => {
  res.render('common/editProfile', {
    user: req.user
  });
};


exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      name,
      email
    });

    res.redirect('/profile');

  } catch (err) {
    console.log(err);
    res.redirect('/profile');
  }
};