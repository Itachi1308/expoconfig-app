// En db.js, modificar la función setupInitialData()
async function setupInitialData() {
    try {
        // Crear todas las tablas si no existen
        await executeUpdate(`
            CREATE TABLE IF NOT EXISTS Rol (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL UNIQUE
            )
        `);

        await executeUpdate(`
            CREATE TABLE IF NOT EXISTS Permiso (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL UNIQUE,
                descripcion TEXT
            )
        `);

        await executeUpdate(`
            CREATE TABLE IF NOT EXISTS RolPermiso (
                id_rol INTEGER,
                id_permiso INTEGER,
                PRIMARY KEY (id_rol, id_permiso),
                FOREIGN KEY (id_rol) REFERENCES Rol(id),
                FOREIGN KEY (id_permiso) REFERENCES Permiso(id)
            )
        `);

        await executeUpdate(`
            CREATE TABLE IF NOT EXISTS Usuario (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                correo TEXT NOT NULL UNIQUE,
                contraseña TEXT NOT NULL,
                id_rol INTEGER,
                FOREIGN KEY (id_rol) REFERENCES Rol(id)
            )
        `);

        // Insertar datos iniciales
        await executeUpdate(`INSERT OR IGNORE INTO Rol (nombre) VALUES ('Administrador')`);
        await executeUpdate(`INSERT OR IGNORE INTO Rol (nombre) VALUES ('Profesor')`);
        await executeUpdate(`INSERT OR IGNORE INTO Rol (nombre) VALUES ('Estudiante')`);
        
        // Permisos básicos
        const permisos = [
            'gestionar_usuarios', 'gestionar_roles', 'gestionar_exposiciones',
            'gestionar_proyectos', 'gestionar_eventos', 'gestionar_estudiantes'
        ];
        
        for (const permiso of permisos) {
            await executeUpdate(
                `INSERT OR IGNORE INTO Permiso (nombre) VALUES (?)`,
                [permiso]
            );
        }
        
        // Asignar todos los permisos al rol Administrador
        const [adminRol] = await executeQuery(`SELECT id FROM Rol WHERE nombre = 'Administrador'`);
        const allPermisos = await executeQuery(`SELECT id FROM Permiso`);
        
        for (const permiso of allPermisos) {
            await executeUpdate(
                `INSERT OR IGNORE INTO RolPermiso (id_rol, id_permiso) VALUES (?, ?)`,
                [adminRol.id, permiso.id]
            );
        }
        
        // Crear usuario admin por defecto si no existe
        const adminExists = await executeQuery(
            `SELECT COUNT(*) as count FROM Usuario WHERE correo = 'admin@expoconfig.com'`
        );
        
        if (adminExists[0].count === 0) {
            await executeUpdate(
                `INSERT INTO Usuario (nombre, correo, contraseña, id_rol) 
                 VALUES (?, ?, ?, ?)`,
                ['Admin', 'admin@expoconfig.com', 'admin123', adminRol.id]
            );
        }
        
        console.log('Base de datos inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    }
}
