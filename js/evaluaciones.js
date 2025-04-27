// /js/evaluaciones.js
import { executeQuery, executeUpdate } from './db.js';

export async function createEvaluacion(evaluacion) {
  const { calificacion, comentarios, id_proyecto, id_evaluador, criterios } = evaluacion;
  
  // Crear evaluación
  const evaluacionId = await executeUpdate(
    `INSERT INTO Evaluacion (calificacion, comentarios, id_proyecto, id_evaluador)
     VALUES (?, ?, ?, ?)`,
    [calificacion, comentarios, id_proyecto, id_evaluador]
  );
  
  // Guardar criterios evaluados
  for (const criterio of criterios) {
    await executeUpdate(
      `INSERT INTO RubricaTT (criterios, ponderacion, id_trabajosTerminales)
       VALUES (?, ?, ?)`,
      [criterio.descripcion, criterio.ponderacion, evaluacionId]
    );
  }
  
  return evaluacionId;
}

export async function getEvaluacionesByProyecto(proyectoId) {
  return await executeQuery(`
    SELECT e.*, ev.nombre as evaluador_nombre
    FROM Evaluacion e
    JOIN Evaluador ev ON e.id_evaluador = ev.id
    WHERE e.id_proyecto = ?
    ORDER BY e.id DESC
  `, [proyectoId]);
}
