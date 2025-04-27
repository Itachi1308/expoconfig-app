import { executeQuery, executeUpdate } from './db.js';
import { getCurrentUser } from './auth.js';

// DOM elements
const expoTableBody = document.getElementById('expoTableBody');
const addExpoBtn = document.getElementById('addExpoBtn');
const expoModal = document.getElementById('expoModal');
const closeModal = document.querySelector('.close');
const expoForm = document.getElementById('expoForm');
const modalTitle = document.getElementById('modalTitle');
const expoIdInput = document.getElementById('expoId');
const errorAlert = document.getElementById('expoFormError');

// Load expositions on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (!expoTableBody) return;

    try {
        await loadExposiciones();
        setupEventListeners();
    } catch (error) {
        showError('Error al cargar la página: ' + error.message);
    }
});

// Load all expositions
async function loadExposiciones() {
    try {
        const exposiciones = await executeQuery(`
            SELECT * FROM ExpoConfig 
            ORDER BY fechaInicio DESC
        `);

        renderExposiciones(exposiciones);
    } catch (error) {
        console.error('Error loading expositions:', error);
        throw error;
    }
}

// Render expositions to the table
function renderExposiciones(exposiciones) {
    expoTableBody.innerHTML = '';

    if (exposiciones.length === 0) {
        expoTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No hay exposiciones registradas</td>
            </tr>
        `;
        return;
    }

    exposiciones.forEach(expo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${expo.nombreExpo || ''}</td>
            <td>${formatDate(expo.fechaInicio)}</td>
            <td>${formatDate(expo.fechaFin)}</td>
            <td>${expo.lugar || ''}</td>
            <td>
                <button onclick="editExpo(${expo.id})" class="btn btn-primary">Editar</button>
                <button onclick="deleteExpo(${expo.id})" class="btn btn-danger">Eliminar</button>
                <a href="expo-detalle.html?id=${expo.id}" class="btn btn-info">Detalles</a>
            </td>
        `;
        expoTableBody.appendChild(row);
    });
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add exposition button
    if (addExpoBtn) {
        addExpoBtn.addEventListener('click', () => {
            modalTitle.textContent = 'Agregar Nueva Exposición';
            expoIdInput.value = '';
            expoForm.reset();
            expoModal.style.display = 'block';
            hideError();
        });
    }

    // Close modal button
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            expoModal.style.display = 'none';
        });
    }

    // Click outside modal to close
    window.addEventListener('click', (event) => {
        if (event.target === expoModal) {
            expoModal.style.display = 'none';
        }
    });

    // Form submission
    if (expoForm) {
        expoForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            await handleFormSubmit();
        });
    }
}

// Handle form submission
async function handleFormSubmit() {
    const id = expoIdInput.value;
    const nombre = document.getElementById('expoNombre').value;
    const fechaInicio = document.getElementById('expoFechaInicio').value;
    const fechaFin = document.getElementById('expoFechaFin').value;
    const lugar = document.getElementById('expoLugar').value;

    // Basic validation
    if (!nombre || !fechaInicio || !fechaFin || !lugar) {
        showError('Todos los campos son obligatorios');
        return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
        showError('La fecha de inicio no puede ser posterior a la fecha de fin');
        return;
    }

    try {
        const user = getCurrentUser();
        if (!user) {
            showError('No se pudo verificar el usuario');
            return;
        }

        if (id) {
            // Update existing exposition
            await executeUpdate(
                `UPDATE ExpoConfig SET 
                 nombreExpo = ?, fechaInicio = ?, fechaFin = ?, lugar = ?
                 WHERE id = ?`,
                [nombre, fechaInicio, fechaFin, lugar, id]
            );
        } else {
            // Create new exposition
            await executeUpdate(
                `INSERT INTO ExpoConfig 
                 (nombreExpo, fechaInicio, fechaFin, lugar) 
                 VALUES (?, ?, ?, ?)`,
                [nombre, fechaInicio, fechaFin, lugar]
            );
        }

        // Reload the list
        await loadExposiciones();
        
        // Close modal
        expoModal.style.display = 'none';
        
        // Show success message (you can implement a toast or alert)
        alert('Exposición guardada exitosamente');
    } catch (error) {
        console.error('Error saving exposition:', error);
        showError('Error al guardar la exposición: ' + error.message);
    }
}

// Edit exposition
window.editExpo = async function(id) {
    try {
        const [expo] = await executeQuery(
            'SELECT * FROM ExpoConfig WHERE id = ?',
            [id]
        );

        if (!expo) {
            showError('No se encontró la exposición');
            return;
        }

        // Fill the form
        modalTitle.textContent = 'Editar Exposición';
        expoIdInput.value = expo.id;
        document.getElementById('expoNombre').value = expo.nombreExpo || '';
        document.getElementById('expoFechaInicio').value = expo.fechaInicio || '';
        document.getElementById('expoFechaFin').value = expo.fechaFin || '';
        document.getElementById('expoLugar').value = expo.lugar || '';

        // Show modal
        expoModal.style.display = 'block';
        hideError();
    } catch (error) {
        console.error('Error editing exposition:', error);
        showError('Error al cargar la exposición: ' + error.message);
    }
};

// Delete exposition
window.deleteExpo = async function(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta exposición?')) {
        return;
    }

    try {
        await executeUpdate(
            'DELETE FROM ExpoConfig WHERE id = ?',
            [id]
        );

        // Reload the list
        await loadExposiciones();
        
        // Show success message
        alert('Exposición eliminada exitosamente');
    } catch (error) {
        console.error('Error deleting exposition:', error);
        alert('Error al eliminar la exposición: ' + error.message);
    }
};

// Show error message
function showError(message) {
    errorAlert.textContent = message;
    errorAlert.style.display = 'block';
}

// Hide error message
function hideError() {
    errorAlert.style.display = 'none';
}