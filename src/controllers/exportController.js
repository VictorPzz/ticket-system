const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Ticket = require('../models/Ticket');

exports.exportPDF = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 30 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-tickets.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Reporte de Tickets', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Fecha: ${new Date().toLocaleDateString()}`);
    doc.text(`Total de tickets: ${tickets.length}`);
    doc.moveDown();

    const headers = ['#', 'Ticket', 'Título', 'Estado', 'Prioridad', 'Categoría', 'Creado por', 'Asignado a', 'Fecha'];
    const colWidths = [25, 70, 120, 60, 55, 60, 80, 80, 70];
    
    let y = doc.y;
    let x = 30;
    
    doc.fontSize(8).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.text(header, x, y, { width: colWidths[i], align: 'left' });
      x += colWidths[i];
    });
    
    y += 20;
    doc.font('Helvetica').fontSize(7);
    
    const statusLabels = { open: 'Abierto', in_progress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado' };
    const priorityLabels = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

    tickets.forEach((ticket, index) => {
      if (y > 750) {
        doc.addPage();
        y = 30;
      }
      
      x = 30;
      const rowData = [
        index + 1,
        ticket.ticketNumber,
        ticket.title.substring(0, 30),
        statusLabels[ticket.status],
        priorityLabels[ticket.priority],
        ticket.category,
        ticket.createdBy?.name || 'N/A',
        ticket.assignedTo?.name || 'Sin asignar',
        new Date(ticket.createdAt).toLocaleDateString()
      ];
      
      rowData.forEach((data, i) => {
        doc.text(String(data), x, y, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      
      y += 15;
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: 'Error al exportar PDF' });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tickets');

    worksheet.columns = [
      { header: '#', key: 'number', width: 5 },
      { header: 'Ticket', key: 'ticketNumber', width: 15 },
      { header: 'Título', key: 'title', width: 35 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Prioridad', key: 'priority', width: 12 },
      { header: 'Categoría', key: 'category', width: 12 },
      { header: 'Creado por', key: 'createdBy', width: 20 },
      { header: 'Asignado a', key: 'assignedTo', width: 20 },
      { header: 'Fecha creación', key: 'createdAt', width: 15 },
      { header: 'Fecha límite', key: 'dueBy', width: 15 }
    ];

    const statusLabels = { open: 'Abierto', in_progress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado' };
    const priorityLabels = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

    tickets.forEach((ticket, index) => {
      worksheet.addRow({
        number: index + 1,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: statusLabels[ticket.status],
        priority: priorityLabels[ticket.priority],
        category: ticket.category,
        createdBy: ticket.createdBy?.name || 'N/A',
        assignedTo: ticket.assignedTo?.name || 'Sin asignar',
        createdAt: new Date(ticket.createdAt).toLocaleDateString(),
        dueBy: ticket.sla?.dueBy ? new Date(ticket.sla.dueBy).toLocaleDateString() : 'N/A'
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-tickets.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Error al exportar Excel' });
  }
};
