// SQL.js configuration
let db;
let sqlLoaded = false;

// Initialize SQL.js and load the database
async function initDB() {
    if (sqlLoaded) return true;

    try {
        // Load SQL.js
        const SQL = await initSqlJs({
            locateFile: file => `../lib/${file}`
        });

        // Fetch the database file
        const response = await fetch('../expoconfig.db');
        if (!response.ok) {
            throw new Error('Failed to load database file');
        }

        const buffer = await response.arrayBuffer();
        const uInt8Array = new Uint8Array(buffer);

        // Create the database
        db = new SQL.Database(uInt8Array);
        sqlLoaded = true;

        // Verify essential tables exist
        const tables = await executeQuery("SELECT name FROM sqlite_master WHERE type='table'");
        const requiredTables = ['Usuario', 'Rol', 'ExpoConfig'];
        
        for (const table of requiredTables) {
            if (!tables.some(t => t.name === table)) {
                console.error(`Missing table: ${table}`);
                await setupInitialData();
                break;
            }
        }

        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        return false;
    }
}

// Setup initial data if tables are empty
async function setupInitialData() {
    try {
        // Create tables if they don't exist
        await executeUpdate(`
            CREATE TABLE IF NOT EXISTS Rol (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL
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

        // Insert default roles
        await executeUpdate(`INSERT INTO Rol (nombre) VALUES ('Administrador')`);
        await executeUpdate(`INSERT INTO Rol (nombre) VALUES ('Profesor')`);
        await executeUpdate(`INSERT INTO Rol (nombre) VALUES ('Estudiante')`);

        // Create default admin user
        await executeUpdate(
            `INSERT INTO Usuario (nombre, correo, contraseña, id_rol) 
             VALUES (?, ?, ?, ?)`,
            ['Admin', 'admin@expoconfig.com', 'admin123', 1]
        );

        console.log('Initial data setup completed');
    } catch (error) {
        console.error('Error setting up initial data:', error);
    }
}

// Execute a SELECT query
async function executeQuery(sql, params = []) {
    if (!sqlLoaded) {
        const initialized = await initDB();
        if (!initialized) {
            throw new Error('Database not initialized');
        }
    }

    try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const result = [];
        
        while (stmt.step()) {
            result.push(stmt.getAsObject());
        }
        
        stmt.free();
        return result;
    } catch (error) {
        console.error('Query error:', error, 'SQL:', sql);
        throw error;
    }
}

// Execute an INSERT, UPDATE, or DELETE query
async function executeUpdate(sql, params = []) {
    if (!sqlLoaded) {
        const initialized = await initDB();
        if (!initialized) {
            throw new Error('Database not initialized');
        }
    }

    try {
        db.run(sql, params);
        
        // For INSERT queries, return the last inserted ID
        if (sql.trim().toUpperCase().startsWith('INSERT')) {
            const result = db.exec("SELECT last_insert_rowid() AS id");
            return result[0].values[0][0];
        }
        
        return true;
    } catch (error) {
        console.error('Update error:', error, 'SQL:', sql);
        throw error;
    }
}

// Export functions for use in other modules
export { initDB, executeQuery, executeUpdate };