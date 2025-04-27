import { executeQuery, executeUpdate } from './db.js';
import { getCurrentUser, checkPermission } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initUsuarios();
});

async function initUsuarios() {
    if (!document.getElementById('usuariosTable')) return;

    try {
        // Verificar permisos
        const canManageUsers = await checkPermission('gestionar_usuarios');
        if (!canManageUsers) {
            window.location.href = 'dashboard.html';
            return;
        }

        await loadUsuarios();
        await loadRolesForSelect();
        setupEventListeners();
    } catch (error) {
        showError('Error al cargar usuarios: ' + error.message);
    }
}

async function loadUsuarios() {
    const usuarios = await executeQuery(`
        SELECT u.*, r.nombre as rol_nombre 
        FROM Usuario u
        LEFT JOIN Rol r ON u.id_rol = r.id
        ORDER BY u.nombre
    `);
    
    renderUsuarios(usuarios);
}

function renderUsuarios(usuarios) {
    const tableBody = document.getElementById('usuariosTableBody');
    tableBody.innerHTML = '';
    
    if (usuarios.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">No hay usuarios registrados</td>
            </tr>
        `;
        return;
    }
    
    usuarios.forEach(usuario => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${usuario.nombre}</td>
            <td>${usuario.correo}</td>
            <td>${usuario.rol_nombre || 'N/A'}</td>
            <td>
                <button onclick="editUsuario(${usuario.id})" class="btn btn-primary">Editar</button>
                ${usuario.correo !== 'admin@expoconfig.com' ? 
                    `<button onclick="deleteUsuario(${usuario.id})" class="btn btn-danger">Eliminar</button>` : 
                    '<button class="btn btn-secondary" disabled>Eliminar</button>'}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function loadRolesForSelect() {
    const roles = await executeQuery('SELECT id, nombre FROM Rol ORDER BY nombre');
    const select = document.getElementById('usuarioRol');
    
    select.innerHTML = '<option value="">Seleccione un rol</option>';
    roles.forEach(rol => {
        const option = document.createElement('option');
        option.value = rol.id;
        option.textContent = rol.nombre;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    document.getElementById('addUsuarioBtn').addEventListener('click', () => {
        showUsuarioForm();
    });
    
    document.getElementById('usuarioForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveUsuario();
    });
}

async function showUsuarioForm(usuarioId = null) {
    const form = document.getElementById('usuarioForm');
    form.reset();
    
    if (usuarioId) {
        const [usuario] = await executeQuery('SELECT * FROM Usuario WHERE id = ?', [usuarioId]);
        
        document.getElementById('usuarioId').value = usuario.id;
        document.getElementById('usuarioNombre').value = usuario.nombre;
        document.getElementById('usuarioCorreo').value = usuario.correo;
        document.getElementById('usuarioRol').value = usuario.id_rol || '';
        
        // No permitir editar correo del admin
        if (usuario.correo === 'admin@expoconfig.com') {
            document.getElementById('usuarioCorreo').readOnly = true;
        }
        
        document.getElementById('modalTitle').textContent = 'Editar Usuario';
    } else {
        document.getElementById('usuarioId').value = '';
        document.getElementById('modalTitle').textContent = 'Agregar Nuevo Usuario';
    }
    
    document.getElementById('usuarioModal').style.display = 'block';
}

async function saveUsuario() {
    const id = document.getElementById('usuarioId').value;
    const nombre = document.getElementById('usuarioNombre').value;
    const correo = document.getElementById('usuarioCorreo').value;
    const rolId = document.getElementById('usuarioRol').value;
    const password = document.getElementById('usuarioPassword').value;
    const confirmPassword = document.getElementById('usuarioConfirmPassword').value;
    
    // Validaciones
    if (!nombre || !correo || !rolId) {
        showError('Nombre, correo y rol son campos obligatorios');
        return;
    }
    
    if (!id && (!password || !confirmPassword)) {
        showError('Para nuevos usuarios, la contraseña es obligatoria');
        return;
    }
    
    if (password && password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }
    
    try {
        // Verificar si el correo ya existe (excepto para el usuario actual)
        const existing = await executeQuery(
            'SELECT id FROM Usuario WHERE correo = ? AND id != ?',
            [correo, id || 0]
        );
        
        if (existing.length > 0) {
            showError('Este correo ya está registrado');
            return;
        }
        
        // Guardar usuario
        if (id) {
            // Actualizar usuario existente
            if (password) {
                await executeUpdate(
                    `UPDATE Usuario SET 
                     nombre = ?, correo = ?, contraseña = ?, id_rol = ?
                     WHERE id = ?`,
                    [nombre, correo, password, rolId, id]
                );
            } else {
                await executeUpdate(
                    `UPDATE Usuario SET 
                     nombre = ?, correo = ?, id_rol = ?
                     WHERE id = ?`,
                    [nombre, correo, rolId, id]
                );
            }
        } else {
            // Crear nuevo usuario
            await executeUpdate(
                `INSERT INTO Usuario 
                 (nombre, correo, contraseña, id_rol)
                 VALUES (?, ?, ?, ?)`,
                [nombre, correo, password, rolId]
            );
        }
        
        await loadUsuarios();
        document.getElementById('usuarioModal').style.display = 'none';
        
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        showError('Error al guardar el usuario: ' + error.message);
    }
}

window.editUsuario = async function(id) {
    await showUsuarioForm(id);
};

window.deleteUsuario = async function(id) {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
        try {
            await executeUpdate('DELETE FROM Usuario WHERE id = ?', [id]);
            await loadUsuarios();
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            showError('Error al eliminar el usuario');
        }
    }
};

function showError(message) {
    const errorDiv = document.getElementById('usuarioError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}
