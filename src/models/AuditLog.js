const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true
  },
  method: String,
  path: String,
  statusCode: Number,
  ipAddress: String,
  userAgent: String,
  details: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 90 * 24 * 60 * 60
  }
});

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
