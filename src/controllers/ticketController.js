const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { notifyTicketCreated, notifyTicketAssigned, notifyStatusChanged } = require('../utils/notifier');
const { createNotification } = require('../controllers/notificationController');

exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate } = req.body;

    const ticket = new Ticket({
      title,
      description,
      priority,
      category,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: req.user._id,
      history: [{ action: 'Ticket creado', user: req.user._id }]
    });

    if (req.files && req.files.length > 0) {
      ticket.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));
    }

    await ticket.save();
    await notifyTicketCreated(ticket, req.user);

    const technicians = await User.find({ role: 'technician', active: true });
    for (const tech of technicians) {
      await createNotification(
        tech._id,
        'Nuevo ticket disponible',
        `Se creó el ticket ${ticket.ticketNumber}: ${ticket.title}`,
        'ticket_created',
        ticket._id
      );
    }

    res.status(201).json({ ticket });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear ticket' });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const { status, priority, category, assignedTo, search, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.user.role === 'user') {
      filter.createdBy = req.user._id;
    }

    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Ticket.countDocuments(filter);

    res.json({
      tickets,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ticket' });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const updates = req.body;
    const historyEntry = { user: req.user._id };

    if (updates.status && updates.status !== ticket.status) {
      historyEntry.action = `Estado cambiado de ${ticket.status} a ${updates.status}`;
      ticket.history.push(historyEntry);
      
      if (updates.status === 'in_progress' && !ticket.sla.firstResponseAt) {
        ticket.sla.firstResponseAt = new Date();
        ticket.sla.responseTimeMinutes = Math.round((new Date() - ticket.createdAt) / 60000);
      }
      
      if (updates.status === 'resolved' || updates.status === 'closed') {
        ticket.sla.resolvedAt = new Date();
        ticket.sla.resolutionTimeMinutes = Math.round((new Date() - ticket.createdAt) / 60000);
      }
      
      if (ticket.assignedTo) {
        const assignedUser = await User.findById(ticket.assignedTo);
        await notifyStatusChanged(ticket, assignedUser, updates.status);
        await createNotification(
          ticket.assignedTo,
          'Estado del ticket actualizado',
          `El ticket ${ticket.ticketNumber} cambió a: ${updates.status}`,
          'status_changed',
          ticket._id
        );
      }
      
      await createNotification(
        ticket.createdBy,
        'Estado de tu ticket actualizado',
        `Tu ticket ${ticket.ticketNumber} cambió a: ${updates.status}`,
        'status_changed',
        ticket._id
      );
    }

    if (updates.assignedTo !== undefined && updates.assignedTo !== ticket.assignedTo?.toString()) {
      const assignedUser = updates.assignedTo ? await User.findById(updates.assignedTo) : null;
      const assignedBy = req.user;
      
      if (assignedUser) {
        ticket.history.push({
          action: `Ticket asignado a ${assignedUser.name}`,
          user: req.user._id
        });
        await notifyTicketAssigned(ticket, assignedUser, assignedBy);
        await createNotification(
          updates.assignedTo,
          'Ticket asignado',
          `Se te asignó el ticket ${ticket.ticketNumber}: ${ticket.title}`,
          'ticket_assigned',
          ticket._id
        );
      } else {
        ticket.history.push({
          action: 'Ticket desasignado',
          user: req.user._id
        });
      }
    }

    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));
      ticket.attachments = [...ticket.attachments, ...newAttachments];
      ticket.history.push({
        action: `${req.files.length} archivo(s) adjunto(s)`,
        user: req.user._id
      });
    }

    Object.assign(ticket, updates);
    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json({ ticket: updatedTicket });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar ticket' });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    if (status !== ticket.status) {
      ticket.history.push({
        action: `Estado cambiado de ${ticket.status} a ${status}`,
        user: req.user._id
      });
      
      if (status === 'in_progress' && !ticket.sla.firstResponseAt) {
        ticket.sla.firstResponseAt = new Date();
        ticket.sla.responseTimeMinutes = Math.round((new Date() - ticket.createdAt) / 60000);
      }
      
      if (status === 'resolved' || status === 'closed') {
        ticket.sla.resolvedAt = new Date();
        ticket.sla.resolutionTimeMinutes = Math.round((new Date() - ticket.createdAt) / 60000);
      }
      
      if (ticket.assignedTo) {
        const assignedUser = await User.findById(ticket.assignedTo);
        await notifyStatusChanged(ticket, assignedUser, status);
        await createNotification(
          ticket.assignedTo,
          'Estado del ticket actualizado',
          `El ticket ${ticket.ticketNumber} cambió a: ${status}`,
          'status_changed',
          ticket._id
        );
      }
      
      await createNotification(
        ticket.createdBy,
        'Estado de tu ticket actualizado',
        `Tu ticket ${ticket.ticketNumber} cambió a: ${status}`,
        'status_changed',
        ticket._id
      );
    }

    ticket.status = status;
    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json({ ticket: updatedTicket });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

exports.assignTicket = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const previousAssignee = ticket.assignedTo;
    ticket.assignedTo = assignedTo || null;

    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      ticket.history.push({
        action: `Ticket asignado a ${assignedUser.name}`,
        user: req.user._id
      });
      await notifyTicketAssigned(ticket, assignedUser, req.user);
      await createNotification(
        assignedTo,
        'Ticket asignado',
        `Se te asignó el ticket ${ticket.ticketNumber}: ${ticket.title}`,
        'ticket_assigned',
        ticket._id
      );
    } else {
      ticket.history.push({
        action: 'Ticket desasignado',
        user: req.user._id
      });
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json({ ticket: updatedTicket });
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar ticket' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    ticket.comments.push({
      user: req.user._id,
      text: req.body.text
    });

    ticket.history.push({
      action: 'Comentario agregado',
      user: req.user._id
    });

    if (!ticket.sla.firstResponseAt && ticket.assignedTo?.toString() === req.user._id.toString()) {
      ticket.sla.firstResponseAt = new Date();
      ticket.sla.responseTimeMinutes = Math.round((new Date() - ticket.createdAt) / 60000);
    }

    await ticket.save();

    const recipientId = ticket.createdBy.toString() === req.user._id.toString() 
      ? ticket.assignedTo 
      : ticket.createdBy;
    
    if (recipientId) {
      await createNotification(
        recipientId,
        'Nuevo comentario',
        `Hay un nuevo comentario en el ticket ${ticket.ticketNumber}`,
        'comment_added',
        ticket._id
      );
    }

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('comments.user', 'name email');

    res.json({ ticket: updatedTicket });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar comentario' });
  }
};

exports.autoAssign = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const technician = await User.findOne({ role: 'technician', active: true });
    
    if (!technician) {
      return res.status(404).json({ error: 'No hay técnicos disponibles' });
    }

    ticket.assignedTo = technician._id;
    ticket.history.push({
      action: `Asignado automáticamente a ${technician.name}`,
      user: req.user._id
    });
    
    await ticket.save();
    
    await createNotification(
      technician._id,
      'Ticket asignado automáticamente',
      `Se te asignó el ticket ${ticket.ticketNumber} por prioridad ${ticket.priority}`,
      'ticket_assigned',
      ticket._id
    );

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json({ ticket: updatedTicket });
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar ticket' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const filter = req.user.role === 'user' ? { createdBy: req.user._id } : {};

    const stats = await Ticket.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const priorityStats = await Ticket.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const categoryStats = await Ticket.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const recentTickets = await Ticket.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const totalTickets = await Ticket.countDocuments(filter);
    const openTickets = await Ticket.countDocuments({ ...filter, status: 'open' });
    const resolvedTickets = await Ticket.countDocuments({ ...filter, status: 'resolved' });
    const overdueTickets = await Ticket.countDocuments({
      ...filter,
      status: { $nin: ['resolved', 'closed'] },
      'sla.dueBy': { $lt: new Date() }
    });

    const slaStats = await Ticket.aggregate([
      { $match: { ...filter, 'sla.responseTimeMinutes': { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$sla.responseTimeMinutes' },
          avgResolutionTime: { $avg: '$sla.resolutionTimeMinutes' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statusStats: stats,
      priorityStats,
      categoryStats,
      recentTickets,
      summary: {
        total: totalTickets,
        open: openTickets,
        resolved: resolvedTickets,
        overdue: overdueTickets
      },
      sla: slaStats[0] || { avgResponseTime: 0, avgResolutionTime: 0, count: 0 }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};
