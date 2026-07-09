const checkSecret = (req, res, next) => {
  const secret = req.headers['x-api-secret'];
  const expectedSecret = process.env.BACKEND_API_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

module.exports = checkSecret;
