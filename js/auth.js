async function login(email, password) {
    try {
        const users = await executeQuery(
            'SELECT * FROM Usuario WHERE correo = ? AND contraseña = ?',
            [email, password]
        );
        
        if (users.length > 0) {
            localStorage.setItem('currentUser', JSON.stringify(users[0]));
            return true;
        }
        return false;
    } catch (err) {
        console.error("Error en login:", err);
        return false;
    }
}

function checkAuth() {
    return localStorage.getItem('currentUser') !== null;
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}