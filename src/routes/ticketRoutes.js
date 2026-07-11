const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ticketController = require('../controllers/ticketController');
const notificationController = require('../controllers/notificationController');
const exportController = require('../controllers/exportController');
const { auth, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|log/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Tipo de archivo no permitido'));
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/export/pdf', auth, exportController.exportPDF);
router.get('/export/excel', auth, exportController.exportExcel);

router.get('/', auth, ticketController.getTickets);
router.get('/stats', auth, ticketController.getStats);
router.get('/users', auth, ticketController.getUsers);
router.get('/notifications/list', auth, notificationController.getNotifications);
router.put('/notifications/read-all', auth, notificationController.markAllAsRead);
router.put('/notifications/:id/read', auth, notificationController.markAsRead);

router.post('/', auth, upload.array('files', 5), ticketController.createTicket);
router.get('/:id', auth, ticketController.getTicketById);
router.put('/:id/status', auth, ticketController.updateTicketStatus);
router.put('/:id/assign', auth, ticketController.assignTicket);
router.post('/:id/auto-assign', auth, ticketController.autoAssign);
router.post('/:id/comments', auth, ticketController.addComment);
router.put('/:id', auth, upload.array('files', 5), ticketController.updateTicket);
router.put('/users/:id/role', auth, authorize('admin'), ticketController.updateUserRole);

module.exports = router;
