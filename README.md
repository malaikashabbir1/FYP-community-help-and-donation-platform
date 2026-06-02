🤝 Helping Hands Community Support System

The Helping Hands Community Support System is a Final Year Project (FYP) developed as a web-based platform to connect Donors, Volunteers, and Administrators for managing community support activities, donation campaigns, and volunteer participation in an organized and transparent way.

🎯 Project Objective

The main objective of this system is to digitize and streamline NGO operations by providing a centralized platform for:

Campaign management
Donation tracking
Volunteer coordination
User management
Fraud detection and monitoring
Recommendation-based campaign suggestions
🚀 Key Features
👥 User Roles

Admin

Approves or rejects campaigns
Manages users and system activities
Monitors donation activities
Reviews fraud alerts

Volunteer

Creates and manages campaigns (subject to admin approval)
Applies for campaigns and field activities
Participates in community support work

Donor

Views active campaigns
Donates to campaigns
Tracks donation history
⚙️ System Features
Secure Login & Registration system
Campaign creation and approval workflow
Donation management system
Campaign recommendation system (based on user activity)
Fraud detection system for suspicious donations
Admin dashboard for full system control
Notification system for updates and alerts
🛠️ Tech Stack
Frontend: HTML, CSS, JavaScript, Tailwind CSS, EJS
Backend: Node.js, Express.js
Database: MongoDB (Mongoose)
Authentication: bcrypt.js, JWT / Express Sessions
Architecture: MVC (Model–View–Controller)
Version Control: Git & GitHub
🏗️ System Architecture

The system follows MVC architecture:

Model → MongoDB schemas (Users, Campaigns, Donations, Applications, etc.)
View → EJS templates for UI
Controller → Business logic handling requests
📂 Project Modules
Authentication Module
User Management Module
Campaign Management Module
Donation Module
Volunteer Application Module
Recommendation System Module
Fraud Detection Module
Notification Module
Admin Dashboard Module
🗄️ Database Collections
Users (Admin / Donor / Volunteer)
Campaigns
Donations
Applications
Fraud Alerts
Notifications
Activity Logs
⚙️ Installation & Setup
1. Clone repository
git clone https://github.com/malaikashabbir1/FYP-community-help-and-donation-platform.git
2. Move to project folder
cd FYP-community-help-and-donation-platform
3. Install dependencies
npm install
4. Create .env file
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
5. Run project
npm start
6. Open in browser
http://localhost:3000


📈 Future Improvements
Mobile application version
Real-time chat system
Location-based campaign suggestions
Push notifications system
Advanced analytics dashboard
Improved recommendation system

📌 License

This project is for academic purposes only.
