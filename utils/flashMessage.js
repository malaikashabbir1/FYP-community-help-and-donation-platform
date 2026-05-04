exports.setMessage = (req, type, text) => {
  req.session.message = { type, text };
};