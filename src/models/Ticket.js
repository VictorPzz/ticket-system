const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['hardware', 'software', 'network', 'email', 'access', 'other'],
    required: true
  },
  ticketNumber: {
    type: String,
    unique: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: Date,
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  history: [{
    action: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  sla: {
    firstResponseAt: Date,
    resolvedAt: Date,
    responseTimeMinutes: Number,
    resolutionTimeMinutes: Number,
    dueBy: Date
  }
}, {
  timestamps: true
});

ticketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(5, '0')}`;
  }
  
  if (this.isNew || this.isModified('priority')) {
    const slaHours = { low: 72, medium: 48, high: 24, critical: 4 };
    this.sla.dueBy = new Date(Date.now() + (slaHours[this.priority] || 48) * 60 * 60 * 1000);
  }
  
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
