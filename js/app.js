// ============================================================
//  LÓGICA DE LA APLICACIÓN (UI)
// ============================================================

let allTasks = [];   // caché de tareas descargadas
let activeType = ''; // tipo seleccionado desde Inicio (Trabajo / Personal / Educación)

// Icono de cada tipo, usado en el título de la vista "Mis tareas"
const TYPE_ICON = {
  'Trabajo': '💼',
  'Personal': '👤',
  'Educación': '🎓'
};

// Colores del borde izquierdo de cada tarjeta según el tipo
const TYPE_BORDER_COLOR = {
  'Personal': 'border-indigo-500',
  'Educación': 'border-purple-500',
  'Trabajo': 'border-blue-500'
};

// Estilos del cuadro de mensajes del formulario
const MESSAGE_STYLES = {
  info: 'bg-blue-50 border border-blue-200 text-blue-700',
  success: 'bg-green-50 border border-green-200 text-green-700',
  warning: 'bg-yellow-50 border border-yellow-200 text-yellow-700',
  danger: 'bg-red-50 border border-red-200 text-red-700'
};

document.addEventListener('DOMContentLoaded', () => {
  initTypeSelect();
  initHome();
  initBackButtons();
  initForm();
  document.getElementById('refresh-btn').addEventListener('click', loadTasks);
});

// ---------- Desplegable de tipos (formulario) ----------
function initTypeSelect() {
  const select = document.getElementById('task-type');
  TASK_TYPES.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    select.appendChild(option);
  });
}

// ---------- Pantalla de inicio ----------
function initHome() {
  document.getElementById('home-registro').addEventListener('click', () => showView('registro'));

  document.querySelectorAll('.home-btn-type').forEach(btn => {
    btn.addEventListener('click', () => {
      activeType = btn.dataset.type;
      openTareas();
    });
  });
}

function openTareas() {
  const title = document.getElementById('tareas-title');
  title.textContent = (TYPE_ICON[activeType] || '') + ' ' + activeType;
  showView('tareas');
  loadTasks();
}

// ---------- Botones circulares de regreso / registro rápido ----------
function initBackButtons() {
  document.getElementById('btn-home-from-registro').addEventListener('click', () => showView('home'));
  document.getElementById('btn-home-from-tareas').addEventListener('click', () => showView('home'));
  document.getElementById('btn-add-from-tareas').addEventListener('click', () => showView('registro'));
}

// ---------- Navegación entre vistas ----------
function showView(name) {
  document.getElementById('view-home').classList.toggle('hidden', name !== 'home');
  document.getElementById('view-registro').classList.toggle('hidden', name !== 'registro');
  document.getElementById('view-tareas').classList.toggle('hidden', name !== 'tareas');
}

// ---------- Formulario de registro ----------
function initForm() {
  const form = document.getElementById('task-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const type = document.getElementById('task-type').value;
    const task = document.getElementById('task-name').value.trim();
    const subTask = document.getElementById('task-subtask').value.trim();

    if (!task) {
      showMessage('Por favor escribe la tarea.', 'warning');
      return;
    }

    setSubmitLoading(true);
    showMessage('Guardando...', 'info');

    try {
      await apiCreateTask(type, task, subTask);
      showMessage('✓ Tarea guardada correctamente.', 'success');
      form.reset();
    } catch (error) {
      showMessage('Error al guardar: ' + error.message, 'danger');
    } finally {
      setSubmitLoading(false);
    }
  });
}

function setSubmitLoading(isLoading) {
  const submitBtn = document.getElementById('submit-btn');
  const spinner = document.getElementById('submit-spinner');
  const label = document.getElementById('submit-btn-text');

  submitBtn.disabled = isLoading;
  spinner.classList.toggle('hidden', !isLoading);
  label.textContent = isLoading ? 'Guardando...' : 'Guardar tarea';
}

function showMessage(text, type) {
  const box = document.getElementById('form-message');
  box.className = 'mt-4 rounded-lg px-4 py-3 text-sm font-medium ' + MESSAGE_STYLES[type];
  box.textContent = text;
  box.classList.remove('hidden');

  if (type === 'success') {
    setTimeout(() => box.classList.add('hidden'), 4000);
  }
}

// ---------- Carga y renderizado de tareas ----------
async function loadTasks() {
  const loader = document.getElementById('tasks-loading');
  const errorBox = document.getElementById('tasks-error');
  loader.classList.remove('hidden');
  errorBox.classList.add('hidden');

  try {
    allTasks = await apiGetTasks();
    renderTasks();
  } catch (error) {
    errorBox.textContent = 'No se pudieron cargar las tareas: ' + error.message;
    errorBox.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
  }
}

function renderTasks() {
  const container = document.getElementById('tasks-list');
  container.innerHTML = '';

  const tasks = allTasks
    .filter(t => t.type === activeType)
    .sort((a, b) => new Date(b.date_create) - new Date(a.date_create));

  if (tasks.length === 0) {
    container.innerHTML =
      '<p class="text-center text-gray-400 py-10">No hay tareas de tipo <strong class="text-gray-500">' +
      escapeHtml(activeType) + '</strong>.</p>';
    return;
  }

  tasks.forEach(t => container.appendChild(buildTaskCard(t)));
}

function buildTaskCard(t) {
  const isDone = Boolean(t.date_done);
  const borderColor = isDone ? 'border-green-500' : (TYPE_BORDER_COLOR[t.type] || 'border-gray-400');

  const wrapper = document.createElement('div');
  wrapper.className = 'swipe-wrapper';

  wrapper.innerHTML = `
    <div class="swipe-bg" data-swipe-bg>
      <span class="swipe-icon" data-swipe-icon-complete>✓</span>
      <span class="swipe-icon" data-swipe-icon-delete>✕</span>
    </div>
    <div class="task-card bg-white rounded-xl shadow-sm hover:shadow-md border-l-4 ${borderColor}${isDone ? ' opacity-70' : ''} p-4" data-swipe-card>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-gray-800 ${isDone ? 'line-through' : ''}">${escapeHtml(t.task)}</p>
          ${t.sub_task ? `<p class="text-sm text-gray-500 mt-0.5">${escapeHtml(t.sub_task)}</p>` : ''}
          <div class="flex flex-wrap gap-2 mt-2">
            <span class="inline-block bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">Creada: ${formatDate(t.date_create)}</span>
            ${isDone ? `<span class="inline-block bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full">Completada: ${formatDate(t.date_done)}</span>` : ''}
          </div>
        </div>
        <div class="flex-shrink-0">
          ${isDone
            ? '<span class="text-green-500 text-2xl leading-none">✓</span>'
            : `<button class="btn-done text-xs font-semibold bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full transition" data-row="${t.row}">Completar</button>`}
        </div>
      </div>
    </div>
  `;

  const cardEl = wrapper.querySelector('[data-swipe-card]');
  const bgEl = wrapper.querySelector('[data-swipe-bg]');
  const checkIcon = wrapper.querySelector('[data-swipe-icon-complete]');
  const xIcon = wrapper.querySelector('[data-swipe-icon-delete]');

  const doneBtn = cardEl.querySelector('.btn-done');
  if (doneBtn) {
    doneBtn.addEventListener('click', () => completeTask(t, doneBtn));
  }

  attachSwipeHandlers(cardEl, bgEl, checkIcon, xIcon, t, isDone);

  return wrapper;
}

// ---------- Completar / eliminar (compartido entre botón y swipe) ----------
async function completeTask(t, doneBtn) {
  if (doneBtn) {
    doneBtn.disabled = true;
    doneBtn.classList.add('opacity-60', 'cursor-not-allowed');
    doneBtn.textContent = '...';
  }
  try {
    await apiMarkDone(t.row);
    t.date_done = new Date().toISOString();
    renderTasks();
  } catch (error) {
    alert('Error al completar la tarea: ' + error.message);
    renderTasks(); // por si el swipe dejó la tarjeta desplazada
  }
}

async function deleteTask(t) {
  try {
    await apiDeleteTask(t.row);
    const deletedRow = t.row;
    // Al borrar una fila, todas las filas posteriores del Sheet se recorren
    // una posición hacia arriba: hay que reflejar eso en la caché local.
    allTasks = allTasks.filter(task => task !== t);
    allTasks.forEach(task => {
      if (task.row > deletedRow) task.row -= 1;
    });
    renderTasks();
  } catch (error) {
    alert('Error al eliminar la tarea: ' + error.message);
    renderTasks();
  }
}

// ---------- Gesto de arrastre (swipe) para completar / eliminar ----------
function attachSwipeHandlers(cardEl, bgEl, checkIcon, xIcon, t, isDone) {
  const THRESHOLD_RATIO = 1 / 3;
  let dragging = false;
  let axisLocked = null; // 'x' | 'y' | null
  let startX = 0;
  let startY = 0;
  let currentX = 0;

  cardEl.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.btn-done')) return; // no interferir con el botón
    dragging = true;
    axisLocked = null;
    currentX = 0;
    startX = e.clientX;
    startY = e.clientY;
    cardEl.classList.remove('is-snapping');
    cardEl.setPointerCapture(e.pointerId);
  });

  cardEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (axisLocked === null) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
      axisLocked = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
    }
    if (axisLocked === 'y') return; // deja que la página haga scroll vertical

    let dx = deltaX;
    if (isDone && dx > 0) dx = 0; // una tarea ya completada no se puede "completar" de nuevo

    const maxDrag = cardEl.offsetWidth;
    currentX = Math.max(-maxDrag, Math.min(maxDrag, dx));
    cardEl.style.transform = `translateX(${currentX}px)`;
    updateSwipeBackground(bgEl, checkIcon, xIcon, currentX, maxDrag * THRESHOLD_RATIO);
  });

  const endDrag = async (e) => {
    if (!dragging) return;
    dragging = false;
    cardEl.classList.add('is-snapping');

    const threshold = cardEl.offsetWidth * THRESHOLD_RATIO;
    let handled = false;

    if (!isDone && currentX >= threshold) {
      cardEl.style.transform = `translateX(${cardEl.offsetWidth}px)`;
      handled = true;
      await completeTask(t, cardEl.querySelector('.btn-done'));
    } else if (currentX <= -threshold) {
      if (confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) {
        cardEl.style.transform = `translateX(-${cardEl.offsetWidth}px)`;
        handled = true;
        await deleteTask(t);
      }
    }

    if (!handled) {
      currentX = 0;
      cardEl.style.transform = 'translateX(0)';
      updateSwipeBackground(bgEl, checkIcon, xIcon, 0, threshold);
    }
  };

  cardEl.addEventListener('pointerup', endDrag);
  cardEl.addEventListener('pointercancel', endDrag);
}

function updateSwipeBackground(bgEl, checkIcon, xIcon, deltaX, threshold) {
  if (deltaX > 0) {
    bgEl.classList.add('swipe-bg-complete');
    bgEl.classList.remove('swipe-bg-delete');
    checkIcon.style.opacity = String(Math.min(deltaX / threshold, 1));
    xIcon.style.opacity = '0';
  } else if (deltaX < 0) {
    bgEl.classList.add('swipe-bg-delete');
    bgEl.classList.remove('swipe-bg-complete');
    xIcon.style.opacity = String(Math.min(Math.abs(deltaX) / threshold, 1));
    checkIcon.style.opacity = '0';
  } else {
    bgEl.classList.remove('swipe-bg-complete', 'swipe-bg-delete');
    checkIcon.style.opacity = '0';
    xIcon.style.opacity = '0';
  }
}

// ---------- Utilidades ----------
function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d)) return isoString;
  return d.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
