let currentUser = null;
let currentPage = 1;

const API_URL = '/api';

const authHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem('token', data.token);
      currentUser = data.user;
      showApp();
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('Error al iniciar sesión');
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const department = document.getElementById('register-department').value;

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, department })
    });
    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem('token', data.token);
      currentUser = data.user;
      showApp();
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('Error al registrar');
  }
});

document.getElementById('create-ticket-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('title', document.getElementById('ticket-title').value);
  formData.append('description', document.getElementById('ticket-description').value);
  formData.append('category', document.getElementById('ticket-category').value);
  formData.append('priority', document.getElementById('ticket-priority').value);
  
  const dueDate = document.getElementById('ticket-due-date').value;
  if (dueDate) formData.append('dueDate', dueDate);
  
  const files = document.getElementById('ticket-files').files;
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  try {
    const res = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: authHeader(),
      body: formData
    });
    
    if (res.ok) {
      alert('Ticket creado exitosamente');
      document.getElementById('create-ticket-form').reset();
      showSection('tickets');
    } else {
      const data = await res.json();
      alert(data.error);
    }
  } catch (error) {
    alert('Error al crear ticket');
  }
});

function showAuthTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(form => form.style.display = 'none');
  
  event.target.classList.add('active');
  document.getElementById(`${tab}-form`).style.display = 'block';
}

function showApp() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('navbar').style.display = 'flex';
  document.getElementById('dashboard-section').style.display = 'block';
  setupNavigation();
  loadDashboard();
}

function setupNavigation() {
  const navLinks = document.getElementById('nav-links');
  const role = currentUser.role;
  
  let html = '';
  
  html += `<button onclick="showSection('dashboard')" class="nav-btn active" data-section="dashboard">Dashboard</button>`;
  html += `<button onclick="showSection('tickets')" class="nav-btn" data-section="tickets">Tickets</button>`;
  html += `<button onclick="showSection('create')" class="nav-btn" data-section="create">Nuevo Ticket</button>`;
  
  if (role === 'admin') {
    html += `<button onclick="showSection('users')" class="nav-btn" data-section="users">Usuarios</button>`;
  }
  
  html += `<button onclick="showNotifications()" class="nav-btn" id="notif-btn">🔔 <span id="notif-count">0</span></button>`;
  html += `<span class="user-info">${currentUser.name} (${getRoleText(role)})</span>`;
  html += `<button onclick="logout()" class="nav-btn logout">Salir</button>`;
  
  navLinks.innerHTML = html;
  loadNotificationCount();
}

function getRoleText(role) {
  const roles = { user: 'Empleado', technician: 'Técnico', admin: 'Administrador' };
  return roles[role] || role;
}

function showSection(section) {
  document.querySelectorAll('section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.nav-btn[data-section]').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(`${section}-section`).style.display = 'block';
  document.querySelector(`.nav-btn[data-section="${section}"]`)?.classList.add('active');
  
  if (section === 'dashboard') loadDashboard();
  if (section === 'tickets') loadTickets();
  if (section === 'users') loadUsers();
}

function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  document.querySelectorAll('section').forEach(s => s.style.display = 'none');
  document.getElementById('navbar').style.display = 'none';
  document.getElementById('auth-section').style.display = 'block';
}

async function loadNotificationCount() {
  try {
    const res = await fetch(`${API_URL}/tickets/notifications/list?unreadOnly=true`, { headers: authHeader() });
    const data = await res.json();
    document.getElementById('notif-count').textContent = data.unreadCount;
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

async function showNotifications() {
  try {
    const res = await fetch(`${API_URL}/tickets/notifications/list`, { headers: authHeader() });
    const data = await res.json();
    
    let html = '<div class="notifications-panel"><h3>Notificaciones</h3>';
    
    if (data.notifications.length === 0) {
      html += '<p class="empty-state">No hay notificaciones</p>';
    } else {
      html += `<button class="btn btn-secondary" onclick="markAllNotificationsRead()">Marcar todas como leídas</button>`;
      data.notifications.forEach(n => {
        html += `
          <div class="notification-item ${n.read ? '' : 'unread'}" onclick="markNotificationRead('${n._id}', '${n.ticket?._id || ''}')">
            <strong>${n.title}</strong>
            <p>${n.message}</p>
            <small>${new Date(n.createdAt).toLocaleString()}</small>
          </div>
        `;
      });
    }
    
    html += '</div>';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = html;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

async function markNotificationRead(id, ticketId) {
  try {
    await fetch(`${API_URL}/tickets/notifications/${id}/read`, {
      method: 'PUT',
      headers: authHeader()
    });
    document.querySelector('.modal')?.remove();
    loadNotificationCount();
    if (ticketId) showTicketDetail(ticketId);
  } catch (error) {
    console.error('Error marking notification:', error);
  }
}

async function markAllNotificationsRead() {
  try {
    await fetch(`${API_URL}/tickets/notifications/read-all`, {
      method: 'PUT',
      headers: authHeader()
    });
    document.querySelector('.modal')?.remove();
    loadNotificationCount();
  } catch (error) {
    console.error('Error marking notifications:', error);
  }
}

async function loadDashboard() {
  try {
    const res = await fetch(`${API_URL}/tickets/stats`, { headers: authHeader() });
    const data = await res.json();
    
    const role = currentUser.role;
    
    document.getElementById('dashboard-title').textContent = 
      role === 'user' ? 'Mis Tickets' : 'Dashboard de Soporte';
    
    let statsHTML = `
      <div class="stat-card">
        <h3>${data.summary.total}</h3>
        <p>${role === 'user' ? 'Mis Tickets' : 'Total Tickets'}</p>
      </div>
      <div class="stat-card">
        <h3>${data.summary.open}</h3>
        <p>Abiertos</p>
      </div>
      <div class="stat-card">
        <h3>${data.summary.resolved}</h3>
        <p>Resueltos</p>
      </div>
    `;
    
    if (role !== 'user') {
      statsHTML += `
        <div class="stat-card ${data.summary.overdue > 0 ? 'stat-warning' : ''}">
          <h3>${data.summary.overdue}</h3>
          <p>Vencidos</p>
        </div>
      `;
      
      if (data.sla.count > 0) {
        statsHTML += `
          <div class="stat-card">
            <h3>${Math.round(data.sla.avgResponseTime)}min</h3>
            <p>Promoedio Respuesta</p>
          </div>
        `;
      }
      
      statsHTML += `
        <div class="stat-card export-buttons">
          <a href="${API_URL}/tickets/export/pdf" class="btn btn-secondary" target="_blank">📄 PDF</a>
          <a href="${API_URL}/tickets/export/excel" class="btn btn-secondary" target="_blank">📊 Excel</a>
        </div>
      `;
    }
    
    document.getElementById('stats-grid').innerHTML = statsHTML;

    if (role !== 'user') {
      document.getElementById('admin-charts').style.display = 'block';
      document.getElementById('sla-card').style.display = 'block';
      
      const statusLabels = { open: 'Abierto', in_progress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado' };
      document.getElementById('status-chart').innerHTML = data.statusStats.map(s => `
        <div class="bar-item">
          <span class="bar-label">${statusLabels[s._id]}</span>
          <div class="bar" style="width: ${Math.max(s.count * 30, 30)}px">${s.count}</div>
        </div>
      `).join('');
      
      if (data.sla.count > 0) {
        document.getElementById('sla-info').innerHTML = `
          <p><strong>Promoedio primera respuesta:</strong> ${Math.round(data.sla.avgResponseTime)} minutos</p>
          <p><strong>Promoedio resolución:</strong> ${Math.round(data.sla.avgResolutionTime)} minutos</p>
          <p><strong>Tickets con SLA:</strong> ${data.sla.count}</p>
        `;
      }
    }

    document.getElementById('recent-tickets').innerHTML = data.recentTickets.length ? 
      data.recentTickets.map(t => `
        <div class="history-item" onclick="showTicketDetail('${t._id}')" style="cursor: pointer;">
          <strong>${t.ticketNumber}</strong> - ${t.title}
          <br><small>${new Date(t.createdAt).toLocaleDateString()} | ${t.createdBy?.name || 'N/A'}</small>
        </div>
      `).join('') : '<p class="empty-state">No hay tickets recientes</p>';
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

async function loadTickets(page = 1) {
  currentPage = page;
  const status = document.getElementById('filter-status')?.value || '';
  const priority = document.getElementById('filter-priority')?.value || '';
  const category = document.getElementById('filter-category')?.value || '';
  const search = document.getElementById('search-input')?.value || '';
  
  let url = `${API_URL}/tickets?page=${page}&limit=10`;
  if (status) url += `&status=${status}`;
  if (priority) url += `&priority=${priority}`;
  if (category) url += `&category=${category}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url, { headers: authHeader() });
    const data = await res.json();
    
    document.getElementById('tickets-title').textContent = 
      currentUser.role === 'user' ? 'Mis Tickets' : 'Todos los Tickets';
    
    const ticketsList = document.getElementById('tickets-list');
    
    if (data.tickets.length === 0) {
      ticketsList.innerHTML = '<p class="empty-state">No hay tickets para mostrar</p>';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    ticketsList.innerHTML = data.tickets.map(t => {
      const isOverdue = t.sla?.dueBy && new Date(t.sla.dueBy) < new Date() && !['resolved', 'closed'].includes(t.status);
      const slaWarning = isOverdue ? '<span class="sla-warning">⚠️ VENCIDO</span>' : 
        (t.sla?.responseTimeMinutes > 60 ? '<span class="sla-warning">SLA vencido</span>' : '');
      return `
        <div class="ticket-card priority-${t.priority}" onclick="showTicketDetail('${t._id}')">
          <div class="ticket-header">
            <span class="ticket-number">${t.ticketNumber}</span>
            <span class="badge badge-${t.status}">${getStatusText(t.status)}</span>
          </div>
          <div class="ticket-title">${t.title} ${slaWarning}</div>
          <div class="ticket-meta">
            <span>${getCategoryText(t.category)}</span>
            <span>${new Date(t.createdAt).toLocaleDateString()}</span>
            <span>Creado por: ${t.createdBy?.name || 'N/A'}</span>
            ${t.assignedTo ? `<span>TEC: ${t.assignedTo.name}</span>` : '<span>Sin asignar</span>'}
          </div>
        </div>
      `;
    }).join('');

    let paginationHTML = '';
    for (let i = 1; i <= data.totalPages; i++) {
      paginationHTML += `<button class="${i === data.currentPage ? 'active' : ''}" onclick="loadTickets(${i})">${i}</button>`;
    }
    document.getElementById('pagination').innerHTML = paginationHTML;
  } catch (error) {
    console.error('Error loading tickets:', error);
  }
}

function searchTickets() {
  loadTickets(1);
}

async function showTicketDetail(id) {
  try {
    const res = await fetch(`${API_URL}/tickets/${id}`, { headers: authHeader() });
    const data = await res.json();
    const t = data.ticket;
    const role = currentUser.role;
    const isAssigned = t.assignedTo?._id === currentUser._id;
    const canManage = role === 'admin' || (role === 'technician' && isAssigned);

    let html = `
      <div class="detail-header">
        <div>
          <h2>${t.ticketNumber} - ${t.title}</h2>
          <span class="badge badge-${t.status}">${getStatusText(t.status)}</span>
          ${t.sla?.responseTimeMinutes ? `<span class="sla-info-badge">Respuesta en ${t.sla.responseTimeMinutes}min</span>` : ''}
          ${t.sla?.dueBy ? `<span class="sla-info-badge">Vence: ${new Date(t.sla.dueBy).toLocaleString()}</span>` : ''}
        </div>
    `;

    if (canManage) {
      html += `
        <div>
          <select id="update-status" onchange="updateTicketStatus('${t._id}')">
            <option value="open" ${t.status === 'open' ? 'selected' : ''}>Abierto</option>
            <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>En Progreso</option>
            <option value="resolved" ${t.status === 'resolved' ? 'selected' : ''}>Resuelto</option>
            <option value="closed" ${t.status === 'closed' ? 'selected' : ''}>Cerrado</option>
          </select>
        </div>
      `;
    }

    html += `</div>
      <div class="detail-info">
        <div class="detail-info-item">
          <label>Prioridad</label>
          <span class="priority-badge priority-${t.priority}">${getPriorityText(t.priority)}</span>
        </div>
        <div class="detail-info-item">
          <label>Categoría</label>
          <span>${getCategoryText(t.category)}</span>
        </div>
        <div class="detail-info-item">
          <label>Creado por</label>
          <span>${t.createdBy?.name || 'N/A'}</span>
        </div>
        <div class="detail-info-item">
          <label>Técnico asignado</label>
          <span>${t.assignedTo ? 'TEC ' + t.assignedTo.name : 'Sin asignar'}</span>
        </div>
        <div class="detail-info-item">
          <label>Fecha</label>
          <span>${new Date(t.createdAt).toLocaleString()}</span>
        </div>
      </div>

      <div class="detail-info-item" style="margin-bottom: 1.5rem;">
        <label>Descripción</label>
        <p>${t.description}</p>
      </div>
    `;

    if (role === 'admin') {
      html += `
        <div class="assign-section">
          <label>Asignar a técnico:</label>
          <select id="assign-user" onchange="assignTicket('${t._id}')">
            <option value="">Sin asignar</option>
          </select>
        </div>
      `;
    } else if (role === 'technician' && !isAssigned) {
      html += `
        <div class="assign-section">
          <button class="btn btn-primary" onclick="autoAssignTicket('${t._id}')">📝 Auto-asignarme este ticket</button>
        </div>
      `;
    }

    if (t.attachments && t.attachments.length > 0) {
      html += `
        <div class="attachments-section">
          <h3>Archivos Adjuntos (${t.attachments.length})</h3>
          <div class="attachments-list">
            ${t.attachments.map(a => `
              <div class="attachment-item">
                <span class="attachment-icon">📎</span>
                <a href="/uploads/${a.filename}" target="_blank">${a.originalName}</a>
                <span class="attachment-size">(${formatFileSize(a.size)})</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (canManage) {
      html += `
        <div class="form-group" style="margin-top: 1rem;">
          <label>Agregar archivos adjuntos:</label>
          <input type="file" id="detail-files" multiple accept="image/*,.pdf,.doc,.docx,.txt,.log">
        </div>
        <button class="btn btn-secondary" onclick="uploadFiles('${t._id}')" style="margin-top: 0.5rem;">Subir Archivos</button>
      `;
    }

    html += `
      <div class="comments-section">
        <h3>Comentarios (${t.comments?.length || 0})</h3>
        ${t.comments?.map(c => `
          <div class="comment">
            <div class="comment-header">
              <span class="comment-author">${c.user?.name || 'N/A'}</span>
              <span class="comment-date">${new Date(c.createdAt).toLocaleString()}</span>
            </div>
            <p>${c.text}</p>
          </div>
        `).join('') || '<p>No hay comentarios</p>'}
        
        <div class="add-comment">
          <textarea id="new-comment" placeholder="Agregar comentario..."></textarea>
          <button class="btn btn-primary" onclick="addComment('${t._id}')">Enviar</button>
        </div>
      </div>

      <div class="history-section">
        <h3>Historial</h3>
        ${t.history?.map(h => `
          <div class="history-item">${h.action}</div>
        `).join('') || '<p>No hay historial</p>'}
      </div>
    `;

    document.getElementById('ticket-detail').innerHTML = html;
    showSection('detail');
    
    if (role === 'admin') {
      loadUsersForAssign(t.assignedTo?._id);
    }
  } catch (error) {
    console.error('Error loading ticket:', error);
  }
}

async function loadUsersForAssign(selectedId) {
  try {
    const res = await fetch(`${API_URL}/tickets/users`, { headers: authHeader() });
    const data = await res.json();
    const select = document.getElementById('assign-user');
    
    if (select) {
      data.users.filter(u => u.role === 'technician').forEach(u => {
        const option = document.createElement('option');
        option.value = u._id;
        option.textContent = `TEC ${u.name}`;
        if (u._id === selectedId) option.selected = true;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

async function updateTicketStatus(id) {
  const status = document.getElementById('update-status').value;
  try {
    const res = await fetch(`${API_URL}/tickets/${id}/status`, {
      method: 'PUT',
      headers: {
        ...authHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (res.ok) {
      showTicketDetail(id);
    } else {
      const data = await res.json();
      alert(data.error || 'Error al actualizar');
    }
  } catch (error) {
    alert('Error al actualizar');
  }
}

async function assignTicket(id) {
  const assignedTo = document.getElementById('assign-user').value;
  try {
    const res = await fetch(`${API_URL}/tickets/${id}/assign`, {
      method: 'PUT',
      headers: {
        ...authHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ assignedTo: assignedTo || null })
    });
    
    if (res.ok) {
      showTicketDetail(id);
    } else {
      const data = await res.json();
      alert(data.error || 'Error al asignar');
    }
  } catch (error) {
    alert('Error al asignar');
  }
}

async function autoAssignTicket(id) {
  try {
    const res = await fetch(`${API_URL}/tickets/${id}/auto-assign`, {
      method: 'POST',
      headers: authHeader()
    });
    if (res.ok) {
      showTicketDetail(id);
    } else {
      const data = await res.json();
      alert(data.error || 'Error al auto-asignar');
    }
  } catch (error) {
    alert('Error al auto-asignar');
  }
}

async function addComment(id) {
  const text = document.getElementById('new-comment').value;
  if (!text.trim()) return alert('Escribe un comentario');
  
  try {
    const res = await fetch(`${API_URL}/tickets/${id}/comments`, {
      method: 'POST',
      headers: {
        ...authHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    
    if (res.ok) {
      document.getElementById('new-comment').value = '';
      showTicketDetail(id);
    }
  } catch (error) {
    alert('Error al agregar comentario');
  }
}

async function uploadFiles(id) {
  const filesInput = document.getElementById('detail-files');
  if (!filesInput.files.length) return alert('Selecciona archivos');
  
  const formData = new FormData();
  for (let i = 0; i < filesInput.files.length; i++) {
    formData.append('files', filesInput.files[i]);
  }
  
  try {
    await fetch(`${API_URL}/tickets/${id}`, {
      method: 'PUT',
      headers: authHeader(),
      body: formData
    });
    showTicketDetail(id);
  } catch (error) {
    alert('Error al subir archivos');
  }
}

async function loadUsers() {
  try {
    const res = await fetch(`${API_URL}/tickets/users`, { headers: authHeader() });
    const data = await res.json();
    
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = data.users.map(u => {
      const isCurrentUser = u._id === currentUser._id;
      return `
        <div class="ticket-card">
          <div class="ticket-header">
            <span class="ticket-number">${u.name} ${isCurrentUser ? '(Tú)' : ''}</span>
            <span class="badge badge-${u.role === 'admin' ? 'critical' : u.role === 'technician' ? 'in_progress' : 'open'}">${getRoleText(u.role)}</span>
          </div>
          <div class="ticket-meta">
            <span>${u.email}</span>
            <span>${u.department || 'Sin departamento'}</span>
          </div>
          <div class="assign-section" style="margin-top: 1rem;">
            <select id="role-${u._id}" onchange="updateUserRole('${u._id}')" ${isCurrentUser ? 'disabled' : ''}>
              <option value="user" ${u.role === 'user' ? 'selected' : ''}>Empleado</option>
              <option value="technician" ${u.role === 'technician' ? 'selected' : ''}>Técnico</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
            </select>
            ${isCurrentUser ? '<small style="color: #999;">No puedes cambiar tu propio rol</small>' : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

async function updateUserRole(id) {
  const role = document.getElementById(`role-${id}`).value;
  try {
    const res = await fetch(`${API_URL}/tickets/users/${id}/role`, {
      method: 'PUT',
      headers: {
        ...authHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Rol actualizado');
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('Error al actualizar rol');
  }
}

function getStatusText(status) {
  const statuses = { open: 'Abierto', in_progress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado' };
  return statuses[status] || status;
}

function getPriorityText(priority) {
  const priorities = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };
  return priorities[priority] || priority;
}

function getCategoryText(category) {
  const categories = { hardware: 'Hardware', software: 'Software', network: 'Red', email: 'Email', access: 'Acceso', other: 'Otro' };
  return categories[category] || category;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    document.getElementById('auth-section').style.display = 'block';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/profile`, { headers: authHeader() });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      showApp();
    } else {
      localStorage.removeItem('token');
      document.getElementById('auth-section').style.display = 'block';
    }
  } catch (error) {
    localStorage.removeItem('token');
    document.getElementById('auth-section').style.display = 'block';
  }
}

checkAuth();
