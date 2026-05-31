const Application = require('../models/application');

exports.myApplications = async (req, res) => {
  try {

    const statusFilter = req.query.status;

    // base query
    let query = {
      user: req.user._id
    };

    // apply filter if exists
    if (statusFilter) {
      query.status = statusFilter;
    }

    // fetch applications
    const applications = await Application.find(query)
      .populate('campaign')
      .sort({ createdAt: -1 });

    // 🔥 COUNTS (IMPORTANT PART FOR STATS)
    const totalApplications = await Application.countDocuments({
      user: req.user._id
    });

    const pendingCount = await Application.countDocuments({
      user: req.user._id,
      status: 'pending'
    });

    const approvedCount = await Application.countDocuments({
      user: req.user._id,
      status: 'approved'
    });

    const rejectedCount = await Application.countDocuments({
      user: req.user._id,
      status: 'rejected'
    });

    return res.render('volunteer/applications/list', {
      applications,
      user: req.user,
      message: req.session.message || null,
      activeStatus: statusFilter || null,
      totalApplications,
      pendingCount,
      approvedCount,
      rejectedCount
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send('Error loading applications');
  }
};