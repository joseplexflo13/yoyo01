// ============================================================
//  API: comunicación con Google Apps Script
// ============================================================

/**
 * Envía una nueva tarea al backend (POST + no-cors).
 * Con mode 'no-cors' no se puede leer la respuesta,
 * por eso solo confiamos en que la petición se envió.
 */
async function apiCreateTask(type, task, subTask) {
  await fetch(WEB_APP_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'create',
      type: type,
      task: task,
      sub_task: subTask
    })
  });
}

/**
 * Marca una tarea como completada (escribe date_done en el Sheet).
 * @param {number} row - fila real en el Sheet
 */
async function apiMarkDone(row) {
  await fetch(WEB_APP_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'markDone', row: row })
  });
}

/**
 * Elimina una tarea del Sheet (deleteRow en el backend).
 * @param {number} row - fila real en el Sheet
 */
async function apiDeleteTask(row) {
  await fetch(WEB_APP_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'delete', row: row })
  });
}

/**
 * Obtiene todas las tareas del Sheet (GET sí permite leer la respuesta).
 * @returns {Promise<Array>} lista de tareas
 */
async function apiGetTasks() {
  const response = await fetch(WEB_APP_URL);
  if (!response.ok) {
    throw new Error('Error al obtener las tareas (' + response.status + ')');
  }
  const data = await response.json();
  if (data.status !== 'success') {
    throw new Error(data.message || 'Error desconocido del servidor');
  }
  return data.tasks;
}
