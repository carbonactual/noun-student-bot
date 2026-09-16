module.exports = function health(req, res) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    ok: true,
    status: 'ok',
    name: 'ABBA Being Agent',
    service: 'noun-student-bot',
    timestamp: new Date().toISOString()
  });
};
