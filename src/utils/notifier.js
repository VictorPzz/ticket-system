const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log('Email enviado a:', to);
  } catch (error) {
    console.error('Error enviando email:', error);
  }
};

const notifyTicketCreated = async (ticket, user) => {
  const html = `
    <h2>Nuevo Ticket Creado</h2>
    <p><strong>Número:</strong> ${ticket.ticketNumber}</p>
    <p><strong>Título:</strong> ${ticket.title}</p>
    <p><strong>Prioridad:</strong> ${ticket.priority}</p>
    <p><strong>Categoría:</strong> ${ticket.category}</p>
    <p><strong>Creado por:</strong> ${user.name}</p>
  `;
  await sendEmail(user.email, `Ticket ${ticket.ticketNumber} - Creado`, html);
};

const notifyTicketAssigned = async (ticket, assignedUser, assignedBy) => {
  const html = `
    <h2>Ticket Asignado a Ti</h2>
    <p><strong>Número:</strong> ${ticket.ticketNumber}</p>
    <p><strong>Título:</strong> ${ticket.title}</p>
    <p><strong>Asignado por:</strong> ${assignedBy.name}</p>
  `;
  await sendEmail(assignedUser.email, `Ticket ${ticket.ticketNumber} - Asignado`, html);
};

const notifyStatusChanged = async (ticket, user, newStatus) => {
  const html = `
    <h2>Estado del Ticket Actualizado</h2>
    <p><strong>Número:</strong> ${ticket.ticketNumber}</p>
    <p><strong>Título:</strong> ${ticket.title}</p>
    <p><strong>Nuevo Estado:</strong> ${newStatus}</p>
  `;
  await sendEmail(user.email, `Ticket ${ticket.ticketNumber} - Estado Actualizado`, html);
};

module.exports = {
  sendEmail,
  notifyTicketCreated,
  notifyTicketAssigned,
  notifyStatusChanged
};
