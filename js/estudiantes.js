import { executeQuery, executeUpdate } from './db.js';
import { checkPermission } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('estudiantesTable')) return;

  try {
    const canManage = await checkPermission('gestionar_estudiantes');
    if (!canManage) {
      window.location.href = 'dashboard.html';
      return;
    }

    await loadEstudiantes();
    setupEventListeners();
  } catch (error) {
    console.error('Error loading students:', error);
    showError('Error al cargar los estudiantes');
  }
});

async function loadEstudiantes() {
  const estudiantes = await executeQuery('SELECT * FROM Estudiante ORDER BY nombre');
  renderEstudiantes(estudiantes);
}

function renderEstudiantes(estudiantes) {
  const tbody = document.getElementById('estudiantesTableBody');
  tbody.innerHTML = '';

  if (estudiantes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No hay estudiantes registrados</td></tr>';
    return;
  }

  estudiantes.forEach(est => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${est.nombre}</td>
      <td>${est.grupo || 'N/A'}</td>
      <td>
        <button onclick="editEstudiante(${est.id})" class="btn btn-primary">Editar</button>
        <button onclick="deleteEstudiante(${est.id})" class="btn btn-danger">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function setupEventListeners() {
  document.getElementById('addEstudianteBtn').addEventListener('click', () => {
    showEstudianteForm();
  });

  document.getElementById('estudianteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveEstudiante();
  });
}

async function showEstudianteForm(estudianteId = null) {
  const form = document.getElementById('estudianteForm');
  form.reset();

  if (estudianteId) {
    const [est] = await executeQuery('SELECT * FROM Estudiante WHERE id = ?', [estudianteId]);
    document.getElementById('estudianteId').value = est.id;
    document.getElementById('estudianteNombre').value = est.nombre;
    document.getElementById('estudianteGrupo').value = est.grupo || '';
    document.getElementById('modalTitle').textContent = 'Editar Estudiante';
  } else {
    document.getElementById('estudianteId').value = '';
    document.getElementById('modalTitle').textContent = 'Agregar Estudiante';
  }

  document.getElementById('estudianteModal').style.display = 'block';
}

async function saveEstudiante() {
  const id = document.getElementById('estudianteId').value;
  const nombre = document.getElementById('estudianteNombre').value;
  const grupo = document.getElementById('estudianteGrupo').value;

  if (!nombre) {
    showError('El nombre es obligatorio');
    return;
  }

  try {
    if (id) {
      await executeUpdate(
        'UPDATE Estudiante SET nombre = ?, grupo = ? WHERE id = ?',
        [nombre, grupo, id]
      );
    } else {
      await executeUpdate(
        'INSERT INTO Estudiante (nombre, grupo) VALUES (?, ?)',
        [nombre, grupo]
      );
    }

    await loadEstudiantes();
    document.getElementById('estudianteModal').style.display = 'none';
  } catch (error) {
    console.error('Error saving student:', error);
    showError('Error al guardar el estudiante');
  }
}

window.editEstudiante = async function(id) {
  await showEstudianteForm(id);
};

window.deleteEstudiante = async function(id) {
  if (confirm('¿Eliminar este estudiante?')) {
    try {
      // Verificar si el estudiante está asignado a algún proyecto
      const proyectos = await executeQuery(
        'SELECT COUNT(*) as count FROM ProyectoAlumno WHERE id_alumno = ?',
        [id]
      );

      if (proyectos[0].count > 0) {
        showError('No se puede eliminar: el estudiante está asignado a proyectos');
        return;
      }

      await executeUpdate('DELETE FROM Estudiante WHERE id = ?', [id]);
      await loadEstudiantes();
    } catch (error) {
      console.error('Error deleting student:', error);
      showError('Error al eliminar el estudiante');
    }
  }
};

function showError(message) {
  const errorDiv = document.getElementById('estudianteError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}
