exports.setMessage = (req, type, text) => {
  req.session.message = { type, text };
};

exports.getMessage = (req) => {
  const message = req.session.message;
  delete req.session.message; // clear after showing once
  return message;
};