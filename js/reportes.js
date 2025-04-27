import { executeQuery } from './db.js';
import { getCurrentUser } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('reportesContainer')) return;

  try {
    await loadReportes();
  } catch (error) {
    console.error('Error loading reports:', error);
    document.getElementById('reportesContainer').innerHTML = 
      '<div class="alert alert-danger">Error al cargar los reportes</div>';
  }
});

async function loadReportes() {
  const user = getCurrentUser();
  if (!user) return;

  // Reporte de asistencia a eventos
  const eventosConAsistencia = await executeQuery(`
    SELECT e.nombre, COUNT(a.id) as asistentes
    FROM Evento e
    LEFT JOIN Asistencia a ON e.id = a.id_evento
    GROUP BY e.id
    ORDER BY asistentes DESC
    LIMIT 10
  `);

  renderChart('asistenciaChart', eventosConAsistencia, 'Eventos con más asistencia', 'nombre', 'asistentes');

  // Reporte de proyectos por profesor
  const proyectosPorProfesor = await executeQuery(`
    SELECT p.nombre, COUNT(pr.id) as proyectos
    FROM Profesor p
    LEFT JOIN Proyecto pr ON p.id = pr.id_profesor
    GROUP BY p.id
    ORDER BY proyectos DESC
    LIMIT 10
  `);

  renderChart('proyectosChart', proyectosPorProfesor, 'Proyectos por profesor', 'nombre', 'proyectos');

  // Reporte de estudiantes por grupo
  const estudiantesPorGrupo = await executeQuery(`
    SELECT grupo, COUNT(*) as estudiantes
    FROM Estudiante
    WHERE grupo IS NOT NULL AND grupo != ''
    GROUP BY grupo
    ORDER BY estudiantes DESC
  `);

  renderChart('gruposChart', estudiantesPorGrupo, 'Estudiantes por grupo', 'grupo', 'estudiantes');
}

function renderChart(canvasId, data, label, labelField, valueField) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const labels = data.map(item => item[labelField] || 'N/A');
  const values = data.map(item => item[valueField] || 0);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
