import { executeQuery, executeUpdate } from './db.js';
import { getCurrentUser } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initEventos();
});

async function initEventos() {
    if (!document.getElementById('eventosTable')) return;

    try {
        await loadEventos();
        setupEventListeners();
    } catch (error) {
        showError('Error al cargar eventos: ' + error.message);
    }
}

async function loadEventos() {
    const eventos = await executeQuery(`
        SELECT e.*, a.fecha as agenda_fecha, ex.nombreExpo 
        FROM Evento e
        LEFT JOIN Agenda a ON e.id_agenda = a.id
        LEFT JOIN ExpoConfig ex ON a.id_expoConfig = ex.id
        ORDER BY e.fecha DESC, e.hora DESC
    `);
    
    renderEventos(eventos);
}

function renderEventos(eventos) {
    const tableBody = document.getElementById('eventosTableBody');
    tableBody.innerHTML = '';
    
    if (eventos.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">No hay eventos registrados</td>
            </tr>
        `;
        return;
    }
    
    eventos.forEach(evento => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${evento.nombre}</td>
            <td>${evento.descripcion || 'N/A'}</td>
            <td>${formatDateTime(evento.fecha, evento.hora)}</td>
            <td>${evento.ubicacion || 'N/A'}</td>
            <td>${evento.nombreExpo || 'N/A'}</td>
            <td>
                <button onclick="editEvento(${evento.id})" class="btn btn-primary">Editar</button>
                <button onclick="deleteEvento(${evento.id})" class="btn btn-danger">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function formatDateTime(date, time) {
    const fecha = new Date(date + 'T' + (time || '00:00'));
    return fecha.toLocaleString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function setupEventListeners() {
    // Botón para agregar evento
    document.getElementById('addEventoBtn').addEventListener('click', () => {
        showEventoForm();
    });
    
    // Formulario de evento
    document.getElementById('eventoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveEvento();
    });
    
    // Cargar exposiciones para el select
    loadExposicionesForSelect();
}

async function loadExposicionesForSelect() {
    const exposiciones = await executeQuery('SELECT id, nombreExpo FROM ExpoConfig ORDER BY fechaInicio DESC');
    const select = document.getElementById('eventoExposicion');
    
    select.innerHTML = '<option value="">Seleccione una exposición</option>';
    exposiciones.forEach(expo => {
        const option = document.createElement('option');
        option.value = expo.id;
        option.textContent = expo.nombreExpo;
        select.appendChild(option);
    });
}

async function showEventoForm(eventoId = null) {
    const form = document.getElementById('eventoForm');
    form.reset();
    
    if (eventoId) {
        // Modo edición
        const [evento] = await executeQuery('SELECT * FROM Evento WHERE id = ?', [eventoId]);
        
        document.getElementById('eventoId').value = evento.id;
        document.getElementById('eventoNombre').value = evento.nombre;
        document.getElementById('eventoDescripcion').value = evento.descripcion || '';
        document.getElementById('eventoFecha').value = evento.fecha;
        document.getElementById('eventoHora').value = evento.hora || '12:00';
        document.getElementById('eventoUbicacion').value = evento.ubicacion || '';
        
        // Obtener agenda relacionada con la exposición
        if (evento.id_agenda) {
            const [agenda] = await executeQuery('SELECT id_expoConfig FROM Agenda WHERE id = ?', [evento.id_agenda]);
            if (agenda) {
                document.getElementById('eventoExposicion').value = agenda.id_expoConfig;
            }
        }
        
        document.getElementById('modalTitle').textContent = 'Editar Evento';
    } else {
        // Modo creación
        document.getElementById('eventoId').value = '';
        document.getElementById('modalTitle').textContent = 'Agregar Nuevo Evento';
    }
    
    // Mostrar modal
    document.getElementById('eventoModal').style.display = 'block';
}

async function saveEvento() {
    const id = document.getElementById('eventoId').value;
    const nombre = document.getElementById('eventoNombre').value;
    const descripcion = document.getElementById('eventoDescripcion').value;
    const fecha = document.getElementById('eventoFecha').value;
    const hora = document.getElementById('eventoHora').value;
    const ubicacion = document.getElementById('eventoUbicacion').value;
    const exposicionId = document.getElementById('eventoExposicion').value;
    
    // Validaciones
    if (!nombre || !fecha || !exposicionId) {
        showError('Nombre, fecha y exposición son campos obligatorios');
        return;
    }
    
    try {
        // Obtener o crear agenda
        let agendaId;
        const [agenda] = await executeQuery(
            'SELECT id FROM Agenda WHERE id_expoConfig = ? AND fecha = ?',
            [exposicionId, fecha]
        );
        
        if (agenda) {
            agendaId = agenda.id;
        } else {
            agendaId = await executeUpdate(
                'INSERT INTO Agenda (fecha, horarios, id_expoConfig) VALUES (?, ?, ?)',
                [fecha, 'Horario del evento: ' + hora, exposicionId]
            );
        }
        
        // Guardar evento
        if (id) {
            // Actualizar
            await executeUpdate(
                `UPDATE Evento SET 
                 nombre = ?, descripcion = ?, fecha = ?, hora = ?, ubicacion = ?, id_agenda = ?
                 WHERE id = ?`,
                [nombre, descripcion, fecha, hora, ubicacion, agendaId, id]
            );
        } else {
            // Crear nuevo
            await executeUpdate(
                `INSERT INTO Evento 
                 (nombre, descripcion, fecha, hora, ubicacion, id_agenda)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [nombre, descripcion, fecha, hora, ubicacion, agendaId]
            );
        }
        
        // Recargar lista y cerrar modal
        await loadEventos();
        document.getElementById('eventoModal').style.display = 'none';
        
    } catch (error) {
        console.error('Error al guardar evento:', error);
        showError('Error al guardar el evento: ' + error.message);
    }
}

function showError(message) {
    const errorDiv = document.getElementById('eventoError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Funciones globales para los botones
window.editEvento = async function(id) {
    await showEventoForm(id);
};

window.deleteEvento = async function(id) {
    if (confirm('¿Está seguro de eliminar este evento?')) {
        try {
            await executeUpdate('DELETE FROM Evento WHERE id = ?', [id]);
            await loadEventos();
        } catch (error) {
            console.error('Error al eliminar evento:', error);
            showError('Error al eliminar el evento');
        }
    }
};
