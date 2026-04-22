// This file controls how images are stored

const multer = require('multer');
const path = require('path');

// 1. Storage configuration
const storage = multer.diskStorage({
  
  // Where to store files
  destination: function (req, file, cb) {
    // cb(null, ...) means “no error, save it here”
    cb(null, 'uploads/'); // your uploads folder
  },

  // How to name files
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

// 2. File filter (optional but good practice)
const fileFilter = (req, file, cb) => {
  
  // Allow only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// 3. Create upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

// 4. Export single image upload handler
module.exports = upload;