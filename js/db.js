let db;
let sqlLoaded = false;

async function initDB() {
    if (sqlLoaded) return true;
    
    try {
        const SQL = await initSqlJs({
            locateFile: file => `lib/${file}`
        });
        
        const response = await fetch('expoconfig.db');
        const buffer = await response.arrayBuffer();
        const uInt8Array = new Uint8Array(buffer);
        
        db = new SQL.Database(uInt8Array);
        sqlLoaded = true;
        
        // Verificar tablas esenciales
        const tables = await executeQuery("SELECT name FROM sqlite_master WHERE type='table'");
        if (!tables.some(t => t.name === 'Usuario')) {
            await setupInitialData();
        }
        
        return true;
    } catch (err) {
        console.error("Error inicializando DB:", err);
        return false;
    }
}

async function setupInitialData() {
    // Crear usuario admin por defecto
    await executeUpdate(
        `INSERT INTO Usuario (nombre, correo, contraseña, id_rol) 
         VALUES (?, ?, ?, ?)`,
        ['Admin', 'admin@expoconfig.com', 'admin123', 1]
    );
    
    // Crear roles básicos
    await executeUpdate(`INSERT INTO Rol (nombre) VALUES ('Administrador')`);
    await executeUpdate(`INSERT INTO Rol (nombre) VALUES ('Profesor')`);
    await executeUpdate(`INSERT INTO Rol (nombre) VALUES ('Estudiante')`);
}