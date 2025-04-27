// Configuración inicial de SQLite
let db;
let sqlLoaded = false;

// Cargar SQL.js y la base de datos
function initDB() {
    if (sqlLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const sqlPromise = initSqlJs({
            locateFile: file => `lib/${file}`
        });

        const dataPromise = fetch('expoconfig.db').then(res => res.arrayBuffer());

        Promise.all([sqlPromise, dataPromise]).then(([SQL, buf]) => {
            const uInt8Array = new Uint8Array(buf);
            db = new SQL.Database(uInt8Array);
            sqlLoaded = true;
            resolve();
        }).catch(reject);
    });
}

// Ejecutar consultas SQL
function executeQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        if (!sqlLoaded) {
            initDB().then(() => {
                try {
                    const stmt = db.prepare(sql);
                    stmt.bind(params);
                    const result = [];
                    while (stmt.step()) {
                        result.push(stmt.getAsObject());
                    }
                    stmt.free();
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            }).catch(reject);
        } else {
            try {
                const stmt = db.prepare(sql);
                stmt.bind(params);
                const result = [];
                while (stmt.step()) {
                    result.push(stmt.getAsObject());
                }
                stmt.free();
                resolve(result);
            } catch (err) {
                reject(err);
            }
        }
    });
}

// Ejecutar consultas que modifican la base de datos
function executeUpdate(sql, params = []) {
    return new Promise((resolve, reject) => {
        if (!sqlLoaded) {
            initDB().then(() => {
                try {
                    db.run(sql, params);
                    resolve(db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0]);
                } catch (err) {
                    reject(err);
                }
            }).catch(reject);
        } else {
            try {
                db.run(sql, params);
                resolve(db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0]);
            } catch (err) {
                reject(err);
            }
        }
    });
}