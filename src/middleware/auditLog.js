const AuditLog = require('../models/AuditLog');

const auditLog = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      AuditLog.create({
        user: req.user?._id,
        action,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: {
          params: req.params,
          query: req.query,
          body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined
        }
      }).catch(err => console.error('Error logging audit:', err));
      
      originalSend.call(this, body);
    };
    
    next();
  };
};

const sanitizeBody = (body) => {
  if (!body) return body;
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.token;
  return sanitized;
};

module.exports = auditLog;
