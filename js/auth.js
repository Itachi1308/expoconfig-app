import { executeQuery } from './db.js';

// Check if user is logged in
function checkAuth() {
    return localStorage.getItem('currentUser') !== null;
}

// Get current user data
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Get user role
function getUserRole() {
    const user = getCurrentUser();
    return user ? user.id_rol : null;
}

// Login function
async function login(email, password) {
    try {
        const users = await executeQuery(
            'SELECT * FROM Usuario WHERE correo = ? AND contraseña = ?',
            [email, password]
        );

        if (users.length === 0) {
            return { success: false, message: 'Credenciales incorrectas' };
        }

        const user = users[0];
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        return { success: true, user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Error al iniciar sesión' };
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../login.html';
}

// ... (código anterior permanece igual)

// Función para verificar permisos
async function checkPermission(permissionName) {
    try {
        const user = getCurrentUser();
        if (!user) return false;

        // El admin tiene todos los permisos
        if (user.id_rol === 1) return true;

        const result = await executeQuery(`
            SELECT COUNT(*) AS hasPermission
            FROM RolPermiso rp
            JOIN Permiso p ON rp.id_permiso = p.id
            WHERE rp.id_rol = ? AND p.nombre = ?
        `, [user.id_rol, permissionName]);

        return result[0].hasPermission > 0;
    } catch (error) {
        console.error('Permission check error:', error);
        return false;
    }
}

// Middleware para proteger rutas
async function protectRoute(requiredPermission) {
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return false;
    }

    if (requiredPermission) {
        const hasPermission = await checkPermission(requiredPermission);
        if (!hasPermission) {
            window.location.href = 'dashboard.html';
            return false;
        }
    }

    return true;
}

export { 
    checkAuth, 
    getCurrentUser, 
    getUserRole, 
    login, 
    logout, 
    checkPermission,
    protectRoute
};
