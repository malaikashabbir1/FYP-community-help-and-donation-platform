// volunteerController.js
exports.getVolunteerDashboard = async (req, res) => {
    try {
        // Placeholder stats — can be replaced with real DB queries later
        const stats = {
            totalTasks: 0,
            pendingTasks: 0,
            completedTasks: 0,
            upcomingEvents: 0
        };

        res.render('volunteer/volunteerDashboard', { 
            user: req.user,  // contains id, role, name
            stats 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
