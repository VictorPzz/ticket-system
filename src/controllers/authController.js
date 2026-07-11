const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('al menos 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('una mayúscula');
  if (!/[a-z]/.test(password)) errors.push('una minúscula');
  if (!/[0-9]/.test(password)) errors.push('un número');
  return errors;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        error: `La contraseña debe tener: ${passwordErrors.join(', ')}` 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const user = new User({ name, email, password, department });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generateToken(user._id);
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

exports.getProfile = async (req, res) => {
  res.json({ user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    if (updates.password) {
      const passwordErrors = validatePassword(updates.password);
      if (passwordErrors.length > 0) {
        return res.status(400).json({ 
          error: `La contraseña debe tener: ${passwordErrors.join(', ')}` 
        });
      }
    }
    
    delete updates.role;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
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
