document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    loadExposiciones();
    
    // Configurar modal
    const modal = document.getElementById('expoModal');
    const closeBtn = document.querySelector('.close');
    const addBtn = document.getElementById('addExpoBtn');
    
    addBtn.addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Agregar Nueva Exposición';
        document.getElementById('expoId').value = '';
        document.getElementById('expoForm').reset();
        modal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Manejar formulario
    document.getElementById('expoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('expoId').value;
        const nombre = document.getElementById('expoNombre').value;
        const fechaInicio = document.getElementById('expoFechaInicio').value;
        const fechaFin = document.getElementById('expoFechaFin').value;
        const lugar = document.getElementById('expoLugar').value;
        
        try {
            if (id) {
                // Editar
                await executeUpdate(
                    `UPDATE ExpoConfig SET 
                     nombreExpo = ?, fechaInicio = ?, fechaFin = ?, lugar = ?
                     WHERE id = ?`,
                    [nombre, fechaInicio, fechaFin, lugar, id]
                );
            } else {
                // Crear
                await executeUpdate(
                    `INSERT INTO ExpoConfig 
                     (nombreExpo, fechaInicio, fechaFin, lugar) 
                     VALUES (?, ?, ?, ?)`,
                    [nombre, fechaInicio, fechaFin, lugar]
                );
            }
            
            modal.style.display = 'none';
            loadExposiciones();
        } catch (err) {
            showError('Error al guardar la exposición: ' + err.message);
        }
    });
});

async function loadExposiciones() {
    try {
        const expos = await executeQuery('SELECT * FROM ExpoConfig ORDER BY fechaInicio DESC');
        const tbody = document.getElementById('expoTableBody');
        tbody.innerHTML = '';
        
        expos.forEach(expo => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${expo.nombreExpo}</td>
                <td>${formatDate(expo.fechaInicio)}</td>
                <td>${formatDate(expo.fechaFin)}</td>
                <td>${expo.lugar}</td>
                <td>
                    <button onclick="editExpo(${expo.id})" class="btn btn-primary">Editar</button>
                    <button onclick="deleteExpo(${expo.id})" class="btn btn-danger">Eliminar</button>
                    <a href="expo-detalle.html?id=${expo.id}" class="btn">Detalles</a>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        showError('Error al cargar exposiciones: ' + err.message);
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

function showError(message) {
    const errorDiv = document.getElementById('expoFormError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

window.editExpo = async function(id) {
    try {
        const [expo] = await executeQuery('SELECT * FROM ExpoConfig WHERE id = ?', [id]);
        
        document.getElementById('modalTitle').textContent = 'Editar Exposición';
        document.getElementById('expoId').value = expo.id;
        document.getElementById('expoNombre').value = expo.nombreExpo;
        document.getElementById('expoFechaInicio').value = expo.fechaInicio;
        document.getElementById('expoFechaFin').value = expo.fechaFin;
        document.getElementById('expoLugar').value = expo.lugar;
        
        document.getElementById('expoModal').style.display = 'block';
    } catch (err) {
        showError('Error al cargar exposición: ' + err.message);
    }
};

window.deleteExpo = async function(id) {
    if (confirm('¿Estás seguro de eliminar esta exposición?')) {
        try {
            await executeUpdate('DELETE FROM ExpoConfig WHERE id = ?', [id]);
            loadExposiciones();
        } catch (err) {
            showError('Error al eliminar exposición: ' + err.message);
        }
    }
};