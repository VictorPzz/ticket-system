const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.get('/users', auth, authorize('admin'), authController.getUsers);
router.put('/users/:id/role', auth, authorize('admin'), authController.updateUserRole);

module.exports = router;
