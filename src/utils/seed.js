const mongoose = require('mongoose');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
require('dotenv').config();

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket-system');
  
  await User.deleteMany({});
  await Ticket.deleteMany({});

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    department: 'TI'
  });

  const tech = await User.create({
    name: 'Técnico',
    email: 'tecnico@example.com',
    password: 'tecnico123',
    role: 'technician',
    department: 'TI'
  });

  const user = await User.create({
    name: 'Usuario',
    email: 'usuario@example.com',
    password: 'usuario123',
    role: 'user',
    department: 'Ventas'
  });

  await Ticket.create([
    {
      title: 'Computadora no enciende',
      description: 'El equipo de la estación 5 no enciende al presionar el botón de encendido.',
      category: 'hardware',
      priority: 'high',
      createdBy: user._id,
      assignedTo: tech._id,
      history: [{ action: 'Ticket creado', user: user._id }]
    },
    {
      title: 'Error al abrir Outlook',
      description: 'Al abrir Outlook aparece un error de configuración de perfil.',
      category: 'email',
      priority: 'medium',
      createdBy: user._id,
      history: [{ action: 'Ticket creado', user: user._id }]
    },
    {
      title: 'No conecta a internet',
      description: 'El equipo no tiene acceso a la red. Ya verifiqué el cable de red.',
      category: 'network',
      priority: 'critical',
      createdBy: user._id,
      status: 'in_progress',
      assignedTo: tech._id,
      history: [{ action: 'Ticket creado', user: user._id }]
    }
  ]);

  console.log('Datos de prueba creados:');
  console.log('Admin: admin@example.com / admin123');
  console.log('Técnico: tecnico@example.com / tecnico123');
  console.log('Usuario: usuario@example.com / usuario123');
  
  process.exit();
};

seed();
