import { executeQuery, executeUpdate } from './db.js';
import { getCurrentUser } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initProyectos();
});

async function initProyectos() {
    if (!document.getElementById('proyectosTable')) return;

    try {
        await loadProyectos();
        setupEventListeners();
    } catch (error) {
        showError('Error al cargar proyectos: ' + error.message);
    }
}

async function loadProyectos() {
    const proyectos = await executeQuery(`
        SELECT p.*, pr.nombre as profesor_nombre 
        FROM Proyecto p
        LEFT JOIN Profesor pr ON p.id_profesor = pr.id
        ORDER BY p.titulo
    `);
    
    renderProyectos(proyectos);
}

function renderProyectos(proyectos) {
    const tableBody = document.getElementById('proyectosTableBody');
    tableBody.innerHTML = '';
    
    if (proyectos.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">No hay proyectos registrados</td>
            </tr>
        `;
        return;
    }
    
    proyectos.forEach(proyecto => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${proyecto.titulo}</td>
            <td>${proyecto.descripcion ? proyecto.descripcion.substring(0, 50) + '...' : 'N/A'}</td>
            <td>${proyecto.profesor_nombre || 'N/A'}</td>
            <td>
                <button onclick="viewProyecto(${proyecto.id})" class="btn btn-info">Ver</button>
                <button onclick="editProyecto(${proyecto.id})" class="btn btn-primary">Editar</button>
                <button onclick="deleteProyecto(${proyecto.id})" class="btn btn-danger">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function setupEventListeners() {
    document.getElementById('addProyectoBtn').addEventListener('click', () => {
        showProyectoForm();
    });
    
    document.getElementById('proyectoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProyecto();
    });
    
    loadProfesoresForSelect();
}

async function loadProfesoresForSelect() {
    const profesores = await executeQuery('SELECT id, nombre FROM Profesor ORDER BY nombre');
    const select = document.getElementById('proyectoProfesor');
    
    select.innerHTML = '<option value="">Seleccione un profesor</option>';
    profesores.forEach(prof => {
        const option = document.createElement('option');
        option.value = prof.id;
        option.textContent = prof.nombre;
        select.appendChild(option);
    });
}

async function showProyectoForm(proyectoId = null) {
    const form = document.getElementById('proyectoForm');
    form.reset();
    
    if (proyectoId) {
        const [proyecto] = await executeQuery('SELECT * FROM Proyecto WHERE id = ?', [proyectoId]);
        
        document.getElementById('proyectoId').value = proyecto.id;
        document.getElementById('proyectoTitulo').value = proyecto.titulo;
        document.getElementById('proyectoDescripcion').value = proyecto.descripcion || '';
        document.getElementById('proyectoResumen').value = proyecto.resumen || '';
        document.getElementById('proyectoProfesor').value = proyecto.id_profesor || '';
        
        document.getElementById('modalTitle').textContent = 'Editar Proyecto';
    } else {
        document.getElementById('proyectoId').value = '';
        document.getElementById('modalTitle').textContent = 'Agregar Nuevo Proyecto';
    }
    
    document.getElementById('proyectoModal').style.display = 'block';
}

async function saveProyecto() {
    const id = document.getElementById('proyectoId').value;
    const titulo = document.getElementById('proyectoTitulo').value;
    const descripcion = document.getElementById('proyectoDescripcion').value;
    const resumen = document.getElementById('proyectoResumen').value;
    const profesorId = document.getElementById('proyectoProfesor').value;
    
    if (!titulo || !profesorId) {
        showError('Título y profesor son campos obligatorios');
        return;
    }
    
    try {
        if (id) {
            await executeUpdate(
                `UPDATE Proyecto SET 
                 titulo = ?, descripcion = ?, resumen = ?, id_profesor = ?
                 WHERE id = ?`,
                [titulo, descripcion, resumen, profesorId, id]
            );
        } else {
            await executeUpdate(
                `INSERT INTO Proyecto 
                 (titulo, descripcion, resumen, id_profesor)
                 VALUES (?, ?, ?, ?)`,
                [titulo, descripcion, resumen, profesorId]
            );
        }
        
        await loadProyectos();
        document.getElementById('proyectoModal').style.display = 'none';
        
    } catch (error) {
        console.error('Error al guardar proyecto:', error);
        showError('Error al guardar el proyecto: ' + error.message);
    }
}

window.viewProyecto = async function(id) {
    const [proyecto] = await executeQuery(`
        SELECT p.*, pr.nombre as profesor_nombre 
        FROM Proyecto p
        LEFT JOIN Profesor pr ON p.id_profesor = pr.id
        WHERE p.id = ?
    `, [id]);
    
    if (!proyecto) {
        showError('Proyecto no encontrado');
        return;
    }
    
    document.getElementById('viewTitulo').textContent = proyecto.titulo;
    document.getElementById('viewProfesor').textContent = proyecto.profesor_nombre || 'N/A';
    document.getElementById('viewDescripcion').textContent = proyecto.descripcion || 'No disponible';
    document.getElementById('viewResumen').textContent = proyecto.resumen || 'No disponible';
    
    // Cargar estudiantes asociados
    const estudiantes = await executeQuery(`
        SELECT e.nombre, e.grupo 
        FROM ProyectoAlumno pa
        JOIN Estudiante e ON pa.id_alumno = e.id
        WHERE pa.id_proyecto = ?
    `, [id]);
    
    const estudiantesList = document.getElementById('viewEstudiantes');
    estudiantesList.innerHTML = '';
    
    if (estudiantes.length > 0) {
        estudiantes.forEach(est => {
            const li = document.createElement('li');
            li.textContent = `${est.nombre} (${est.grupo})`;
            estudiantesList.appendChild(li);
        });
    } else {
        estudiantesList.innerHTML = '<li>No hay estudiantes asignados</li>';
    }
    
    document.getElementById('viewModal').style.display = 'block';
};

window.editProyecto = async function(id) {
    await showProyectoForm(id);
};

window.deleteProyecto = async function(id) {
    if (confirm('¿Está seguro de eliminar este proyecto?')) {
        try {
            await executeUpdate('DELETE FROM Proyecto WHERE id = ?', [id]);
            await loadProyectos();
        } catch (error) {
            console.error('Error al eliminar proyecto:', error);
            showError('Error al eliminar el proyecto');
        }
    }
};

function showError(message) {
    const errorDiv = document.getElementById('proyectoError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}
