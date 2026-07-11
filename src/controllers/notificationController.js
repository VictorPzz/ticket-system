const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { user: req.user._id };
    
    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .populate('ticket', 'ticketNumber title')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      read: false 
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Marcada como leída' });
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar notificación' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'Todas marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
};

exports.createNotification = async (userId, title, message, type, ticketId = null) => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      ticket: ticketId
    });
  } catch (error) {
    console.error('Error creando notificación:', error);
  }
};
