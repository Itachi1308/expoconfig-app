// /js/trabajos.js
import { executeQuery, executeUpdate } from './db.js';

export async function loadTrabajosTerminales() {
  return await executeQuery(`
    SELECT tt.*, p.nombre as profesor_nombre, e.nombre as estudiante_nombre
    FROM TrabajosTerminales tt
    JOIN Profesor p ON tt.id_profesor = p.id
    JOIN EstudiantesTT ett ON tt.id = ett.id_trabajosTerminales
    JOIN Estudiante e ON ett.id_estudiante = e.id
    ORDER BY tt.fecha DESC
  `);
}

export async function saveTrabajoTerminal(trabajo) {
  const { nombre, fecha, id_profesor, estudiantes } = trabajo;
  
  // Guardar trabajo terminal
  const trabajoId = await executeUpdate(
    `INSERT INTO TrabajosTerminales (nombre, fecha, id_profesor) 
     VALUES (?, ?, ?)`,
    [nombre, fecha, id_profesor]
  );
  
  // Asignar estudiantes
  for (const estudianteId of estudiantes) {
    await executeUpdate(
      `INSERT INTO EstudiantesTT (id_trabajosTerminales, id_estudiante)
       VALUES (?, ?)`,
      [trabajoId, estudianteId]
    );
  }
  
  return trabajoId;
}
