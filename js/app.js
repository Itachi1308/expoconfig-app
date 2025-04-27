document.addEventListener('DOMContentLoaded', () => {
    // Navegación entre páginas
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.target.getAttribute('data-page');
            showPage(pageId);
        });
    });

    // Modal
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Mostrar página inicial
    showPage('dashboard');
    loadDashboard();

    // Eventos
    document.getElementById('add-expo').addEventListener('click', () => {
        showExpoForm();
    });
});

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageId}-page`).classList.add('active');
}

async function loadDashboard() {
    await initDB();
    
    try {
        const expos = await executeQuery('SELECT COUNT(*) as count FROM ExpoConfig');
        const projects = await executeQuery('SELECT COUNT(*) as count FROM Proyecto');
        const students = await executeQuery('SELECT COUNT(*) as count FROM Estudiante');
        const professors = await executeQuery('SELECT COUNT(*) as count FROM Profesor');
        
        const statsContainer = document.querySelector('.stats-container');
        statsContainer.innerHTML = `
            <div class="stat-card">
                <h3>Exposiciones</h3>
                <p>${expos[0].count}</p>
            </div>
            <div class="stat-card">
                <h3>Proyectos</h3>
                <p>${projects[0].count}</p>
            </div>
            <div class="stat-card">
                <h3>Estudiantes</h3>
                <p>${students[0].count}</p>
            </div>
            <div class="stat-card">
                <h3>Profesores</h3>
                <p>${professors[0].count}</p>
            </div>
        `;
    } catch (err) {
        console.error('Error al cargar dashboard:', err);
    }
}

async function showExpoForm() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Agregar Nueva Exposición</h3>
        <form id="expo-form">
            <div class="form-group">
                <label for="nombre">Nombre:</label>
                <input type="text" id="nombre" required>
            </div>
            <div class="form-group">
                <label for="fechaInicio">Fecha Inicio:</label>
                <input type="date" id="fechaInicio" required>
            </div>
            <div class="form-group">
                <label for="fechaFin">Fecha Fin:</label>
                <input type="date" id="fechaFin" required>
            </div>
            <div class="form-group">
                <label for="lugar">Lugar:</label>
                <input type="text" id="lugar" required>
            </div>
            <button type="submit">Guardar</button>
        </form>
    `;

    document.getElementById('modal').style.display = 'block';

    document.getElementById('expo-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('nombre').value;
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        const lugar = document.getElementById('lugar').value;
        
        try {
            await executeUpdate(
                'INSERT INTO ExpoConfig (nombreExpo, fechaInicio, fechaFin, lugar) VALUES (?, ?, ?, ?)',
                [nombre, fechaInicio, fechaFin, lugar]
            );
            
            alert('Exposición agregada con éxito');
            document.getElementById('modal').style.display = 'none';
            loadExposList();
        } catch (err) {
            console.error('Error al guardar exposición:', err);
            alert('Error al guardar la exposición');
        }
    });
}

async function loadExposList() {
    try {
        const expos = await executeQuery('SELECT * FROM ExpoConfig ORDER BY fechaInicio DESC');
        const expoList = document.querySelector('.expo-list');
        
        let html = '<table><tr><th>Nombre</th><th>Fecha Inicio</th><th>Fecha Fin</th><th>Lugar</th><th>Acciones</th></tr>';
        
        expos.forEach(expo => {
            html += `
                <tr>
                    <td>${expo.nombreExpo}</td>
                    <td>${expo.fechaInicio}</td>
                    <td>${expo.fechaFin}</td>
                    <td>${expo.lugar}</td>
                    <td>
                        <button onclick="viewExpoDetails(${expo.id})">Ver</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</table>';
        expoList.innerHTML = html;
    } catch (err) {
        console.error('Error al cargar exposiciones:', err);
    }
}

// Añadir al objeto window para que sea accesible desde HTML
window.viewExpoDetails = async function(id) {
    try {
        const expo = await executeQuery('SELECT * FROM ExpoConfig WHERE id = ?', [id]);
        if (expo.length === 0) return;
        
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h3>Detalles de Exposición</h3>
            <p><strong>Nombre:</strong> ${expo[0].nombreExpo}</p>
            <p><strong>Fecha Inicio:</strong> ${expo[0].fechaInicio}</p>
            <p><strong>Fecha Fin:</strong> ${expo[0].fechaFin}</p>
            <p><strong>Lugar:</strong> ${expo[0].lugar}</p>
            
            <h4>Agenda</h4>
            <div id="expo-agenda"></div>
            
            <h4>Área de Impresión</h4>
            <div id="expo-arealmpresion"></div>
        `;
        
        document.getElementById('modal').style.display = 'block';
        
        // Cargar agenda
        const agenda = await executeQuery('SELECT * FROM Agenda WHERE id_expoConfig = ?', [id]);
        const agendaContainer = document.getElementById('expo-agenda');
        
        if (agenda.length > 0) {
            let agendaHtml = '<ul>';
            agenda.forEach(item => {
                agendaHtml += `<li>${item.fecha}: ${item.horarios}</li>`;
            });
            agendaHtml += '</ul>';
            agendaContainer.innerHTML = agendaHtml;
        } else {
            agendaContainer.innerHTML = '<p>No hay agenda registrada</p>';
        }
        
        // Cargar área de impresión
        const area = await executeQuery('SELECT * FROM Arealmpresion WHERE id_expoConfig = ?', [id]);
        const areaContainer = document.getElementById('expo-arealmpresion');
        
        if (area.length > 0) {
            let areaHtml = '<ul>';
            area.forEach(item => {
                areaHtml += `<li>Responsable: ${item.responsable}, Ubicación: ${item.ubicacion}</li>`;
            });
            areaHtml += '</ul>';
            areaContainer.innerHTML = areaHtml;
        } else {
            areaContainer.innerHTML = '<p>No hay área de impresión registrada</p>';
        }
    } catch (err) {
        console.error('Error al cargar detalles de exposición:', err);
    }
};