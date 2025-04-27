import { executeQuery } from './db.js';
import { getCurrentUser } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('statsContainer')) return;

  try {
    await loadDashboardData();
  } catch (error) {
    console.error('Error loading dashboard:', error);
    document.getElementById('statsContainer').innerHTML = 
      '<div class="alert alert-danger">Error al cargar los datos del dashboard</div>';
  }
});

async function loadDashboardData() {
  const user = getCurrentUser();
  if (!user) return;

  const [
    exposiciones,
    proyectos,
    estudiantes,
    profesores,
    eventos,
    trabajosTerminales
  ] = await Promise.all([
    executeQuery('SELECT COUNT(*) as count FROM ExpoConfig'),
    executeQuery('SELECT COUNT(*) as count FROM Proyecto'),
    executeQuery('SELECT COUNT(*) as count FROM Estudiante'),
    executeQuery('SELECT COUNT(*) as count FROM Profesor'),
    executeQuery('SELECT COUNT(*) as count FROM Evento'),
    executeQuery('SELECT COUNT(*) as count FROM TrabajosTerminales')
  ]);

  const statsContainer = document.getElementById('statsContainer');
  statsContainer.innerHTML = `
    <div class="stat-card">
      <h3>Exposiciones</h3>
      <p>${exposiciones[0].count}</p>
      <a href="exposiciones.html" class="btn btn-sm btn-primary">Ver todas</a>
    </div>
    <div class="stat-card">
      <h3>Proyectos</h3>
      <p>${proyectos[0].count}</p>
      <a href="proyectos.html" class="btn btn-sm btn-primary">Ver todos</a>
    </div>
    <div class="stat-card">
      <h3>Estudiantes</h3>
      <p>${estudiantes[0].count}</p>
      <a href="estudiantes.html" class="btn btn-sm btn-primary">Ver todos</a>
    </div>
    <div class="stat-card">
      <h3>Profesores</h3>
      <p>${profesores[0].count}</p>
      <a href="profesores.html" class="btn btn-sm btn-primary">Ver todos</a>
    </div>
    <div class="stat-card">
      <h3>Eventos</h3>
      <p>${eventos[0].count}</p>
      <a href="eventos.html" class="btn btn-sm btn-primary">Ver todos</a>
    </div>
    <div class="stat-card">
      <h3>Trabajos Terminales</h3>
      <p>${trabajosTerminales[0].count}</p>
      <a href="proyectos.html?type=tt" class="btn btn-sm btn-primary">Ver todos</a>
    </div>
  `;

  // Cargar próximos eventos
  const proximosEventos = await executeQuery(`
    SELECT * FROM Evento 
    WHERE fecha >= date('now') 
    ORDER BY fecha, hora 
    LIMIT 5
  `);

  const eventosContainer = document.getElementById('proximosEventos');
  if (proximosEventos.length > 0) {
    let html = '<ul class="event-list">';
    proximosEventos.forEach(evento => {
      html += `
        <li>
          <strong>${evento.nombre}</strong>
          <span>${formatDateTime(evento.fecha, evento.hora)}</span>
          <span>${evento.ubicacion || ''}</span>
        </li>
      `;
    });
    html += '</ul>';
    eventosContainer.innerHTML = html;
  } else {
    eventosContainer.innerHTML = '<p>No hay eventos próximos</p>';
  }
}

function formatDateTime(date, time) {
  const fecha = new Date(`${date}T${time || '00:00'}`);
  return fecha.toLocaleString('es-MX', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
