import { executeQuery, executeUpdate } from './db.js';
import { checkPermission } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('profesoresTable')) return;

  try {
    const canManage = await checkPermission('gestionar_profesores');
    if (!canManage) {
      window.location.href = 'dashboard.html';
      return;
    }

    await loadProfesores();
    setupEventListeners();
  } catch (error) {
    console.error('Error loading teachers:', error);
    showError('Error al cargar los profesores');
  }
});

async function loadProfesores() {
  const profesores = await executeQuery('SELECT * FROM Profesor ORDER BY nombre');
  renderProfesores(profesores);
}

function renderProfesores(profesores) {
  const tbody = document.getElementById('profesoresTableBody');
  tbody.innerHTML = '';

  if (profesores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No hay profesores registrados</td></tr>';
    return;
  }

  profesores.forEach(prof => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${prof.nombre}</td>
      <td>${prof.materia || 'N/A'}</td>
      <td>
        <button onclick="editProfesor(${prof.id})" class="btn btn-primary">Editar</button>
        <button onclick="deleteProfesor(${prof.id})" class="btn btn-danger">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function setupEventListeners() {
  document.getElementById('addProfesorBtn').addEventListener('click', () => {
    showProfesorForm();
  });

  document.getElementById('profesorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProfesor();
  });
}

async function showProfesorForm(profesorId = null) {
  const form = document.getElementById('profesorForm');
  form.reset();

  if (profesorId) {
    const [prof] = await executeQuery('SELECT * FROM Profesor WHERE id = ?', [profesorId]);
    document.getElementById('profesorId').value = prof.id;
    document.getElementById('profesorNombre').value = prof.nombre;
    document.getElementById('profesorMateria').value = prof.materia || '';
    document.getElementById('modalTitle').textContent = 'Editar Profesor';
  } else {
    document.getElementById('profesorId').value = '';
    document.getElementById('modalTitle').textContent = 'Agregar Profesor';
  }

  document.getElementById('profesorModal').style.display = 'block';
}

async function saveProfesor() {
  const id = document.getElementById('profesorId').value;
  const nombre = document.getElementById('profesorNombre').value;
  const materia = document.getElementById('profesorMateria').value;

  if (!nombre) {
    showError('El nombre es obligatorio');
    return;
  }

  try {
    if (id) {
      await executeUpdate(
        'UPDATE Profesor SET nombre = ?, materia = ? WHERE id = ?',
        [nombre, materia, id]
      );
    } else {
      await executeUpdate(
        'INSERT INTO Profesor (nombre, materia) VALUES (?, ?)',
        [nombre, materia]
      );
    }

    await loadProfesores();
    document.getElementById('profesorModal').style.display = 'none';
  } catch (error) {
    console.error('Error saving teacher:', error);
    showError('Error al guardar el profesor');
  }
}

window.editProfesor = async function(id) {
  await showProfesorForm(id);
};

window.deleteProfesor = async function(id) {
  if (confirm('¿Eliminar este profesor?')) {
    try {
      // Verificar si el profesor está asignado a algún proyecto
      const proyectos = await executeQuery(
        'SELECT COUNT(*) as count FROM Proyecto WHERE id_profesor = ?',
        [id]
      );

      if (proyectos[0].count > 0) {
        showError('No se puede eliminar: el profesor tiene proyectos asignados');
        return;
      }

      await executeUpdate('DELETE FROM Profesor WHERE id = ?', [id]);
      await loadProfesores();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      showError('Error al eliminar el profesor');
    }
  }
};

function showError(message) {
  const errorDiv = document.getElementById('profesorError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}
