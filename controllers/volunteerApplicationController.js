const Application = require('../models/application');

exports.myApplications = async (req, res) => {
  try {

    const applications = await Application.find({
      user: req.user._id
    })
    .populate('campaign')
    .sort({ createdAt: -1 });

    return res.render('volunteer/applications/list', {
      applications,
      user: req.user,
      message: req.session.message || null
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send('Error loading applications');
  }
};