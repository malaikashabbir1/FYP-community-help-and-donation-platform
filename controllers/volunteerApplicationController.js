const Application = require('../models/application');

exports.myApplications = async (req, res) => {
  try {

    const statusFilter = req.query.status; // 🔥 get filter from URL

    // base query
    let query = {
      user: req.user._id
    };

    // apply filter if exists
    if (statusFilter) {
      query.status = statusFilter;
    }

    const applications = await Application.find(query)
      .populate('campaign')
      .sort({ createdAt: -1 });

    return res.render('volunteer/applications/list', {
      applications,
      user: req.user,
      message: req.session.message || null,
      activeStatus: statusFilter || null // 🔥 for UI highlighting
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send('Error loading applications');
  }
};