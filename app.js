// ===================== TASK MANAGER =====================
const taskList = document.getElementById('task-list');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let currentFilter = 'all';
let currentSubFilter = 'all';

function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }
function setTypeFilter(type) { currentFilter = type; renderTasks(); }
function setSubFilter(sub) { currentSubFilter = sub; renderTasks(); }

// Modal / Add-Edit task support
let editingTaskIndex = null;
function showTaskPanel() {
  const panel = document.getElementById('taskPanel');
  if (!panel) return;
  panel.classList.add('active');
  panel.style.display = 'flex';
  // focus first input
  setTimeout(() => document.getElementById('title').focus(), 100);
}
function hideTaskPanel() {
  const panel = document.getElementById('taskPanel');
  if (!panel) return;
  panel.classList.remove('active');
  panel.style.display = 'none';
  editingTaskIndex = null;
  const form = document.getElementById('popup-task-form'); if (form) form.reset();
  document.getElementById('taskPanelTitle').textContent = 'Add Task';
}
function openAddTask() { editingTaskIndex = null; document.getElementById('taskPanelTitle').textContent = 'Add Task'; const form = document.getElementById('popup-task-form'); if (form) form.reset(); showTaskPanel(); }

function renderTasks(list = tasks) {
  taskList.innerHTML = '';
  let filtered = list.filter(task => {
    if (currentFilter !== 'all' && task.type !== currentFilter) return false;
    if (currentSubFilter === 'soon') {
      const diff = (new Date(task.dueDate + 'T' + task.dueTime) - new Date()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }
    if (currentSubFilter === 'done') return task.done;
    return true;
  });

  filtered.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = task.done ? 'completed' : '';
    li.innerHTML = `<strong>${task.title}</strong> (${task.dueDate} ${task.dueTime})<br>
      Type: ${task.type}, Priority: ${task.priority}<br>${task.description}<br>${task.notes}
      <button onclick="toggleDone(${index})">${task.done ? 'Undo' : 'Done'}</button>
      <button onclick="editTask(${index})">Edit</button>
      <button onclick="deleteTask(${index})">Delete</button>`;
    taskList.appendChild(li);
  });

  const doneCount = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  progressBar.style.width = percent + '%';
  progressText.textContent = `Completed ${doneCount} of ${total} tasks (${percent}%)`;
}
function toggleDone(index) { tasks[index].done = !tasks[index].done; saveTasks(); renderTasks(); }
function editTask(index) {
  const t = tasks[index];
  editingTaskIndex = index;
  document.getElementById('taskPanelTitle').textContent = 'Edit Task';
  document.getElementById('title').value = t.title;
  document.getElementById('dueDate').value = t.dueDate;
  document.getElementById('dueTime').value = t.dueTime;
  document.getElementById('description').value = t.description;
  document.getElementById('type').value = t.type;
  document.getElementById('priority').value = t.priority;
  document.getElementById('notes').value = t.notes;
  showTaskPanel();
}
function deleteTask(index) { if (confirm('Delete this task?')) { tasks.splice(index, 1); saveTasks(); renderTasks(); } }

// Wire Add Task button and popup form
document.getElementById('openTaskPanelBtn').addEventListener('click', openAddTask);
const popupForm = document.getElementById('popup-task-form');
if (popupForm) {
  popupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTask = {
      title: document.getElementById('title').value,
      dueDate: document.getElementById('dueDate').value,
      dueTime: document.getElementById('dueTime').value,
      description: document.getElementById('description').value,
      type: document.getElementById('type').value,
      priority: document.getElementById('priority').value,
      notes: document.getElementById('notes').value,
      done: false
    };
    if (editingTaskIndex !== null && editingTaskIndex !== undefined) {
      tasks[editingTaskIndex] = newTask;
    } else {
      tasks.push(newTask);
    }
    saveTasks(); renderTasks(); hideTaskPanel();
  });
}
const cancelBtn = document.getElementById('popup-cancel-btn');
if (cancelBtn) cancelBtn.addEventListener('click', hideTaskPanel);
// Close modal on ESC
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTaskPanel(); });

function searchTasks() {
  const query = document.getElementById('searchTasks').value.toLowerCase();
  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(query) ||
    t.description.toLowerCase().includes(query) ||
    t.notes.toLowerCase().includes(query)
  );
  renderTasks(filtered);
}

renderTasks();

// ===================== CALENDAR =====================
const calendarGrid = document.getElementById('calendar-grid');
const calendarMonthYear = document.getElementById('calendar-month-year');
const calendarTasks = document.getElementById('calendar-tasks');

let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let selectedDate = null;

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

function renderCalendar() {
  calendarGrid.innerHTML = '';
  calendarMonthYear.textContent = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) calendarGrid.appendChild(document.createElement('div'));
  for (let date = 1; date <= daysInMonth; date++) {
    const cell = document.createElement('div'); cell.className = 'calendar-cell';
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    cell.innerHTML = `<strong>${date}</strong>`;
    tasks.filter(t => t.dueDate === dateStr).forEach(task => {
      const taskDiv = document.createElement('div'); taskDiv.className = 'cell-task'; taskDiv.textContent = task.title;
      taskDiv.onclick = (e) => { e.stopPropagation(); editTask(tasks.indexOf(task)); };
      cell.appendChild(taskDiv);
    });
    cell.onclick = () => selectDate(date);
    calendarGrid.appendChild(cell);
  }
}

function selectDate(date) {
  selectedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  document.getElementById('selected-date-title').textContent = `Tasks on ${selectedDate}`;
  renderCalendarTasks();
}

function renderCalendarTasks() {
  calendarTasks.innerHTML = '';
  if (!selectedDate) return;
  const dateTasks = tasks.filter(t => t.dueDate === selectedDate);
  if (dateTasks.length === 0) { calendarTasks.textContent = 'No tasks on this date.'; return; }
  dateTasks.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${t.title}</strong> (${t.dueTime})<br>Type: ${t.type}, Priority: ${t.priority}<br>${t.description}<br>${t.notes}`;
    calendarTasks.appendChild(li);
  });
}

renderCalendar();

// ===================== NOTES & REFERENCES =====================
let notesData = JSON.parse(localStorage.getItem('notesData') || '{}');
let currentFolder = null;
let recycleBin = JSON.parse(localStorage.getItem('recycleBin') || '[]');
const RECYCLE_RETENTION_DAYS = 30; // items older than this will be auto-removed
function saveNotesData() { localStorage.setItem('notesData', JSON.stringify(notesData)); }
function saveRecycle() { localStorage.setItem('recycleBin', JSON.stringify(recycleBin)); }

function purgeOldRecycleItems() {
  if (!Array.isArray(recycleBin) || recycleBin.length === 0) return;
  const now = Date.now();
  const msPerDay = 1000 * 60 * 60 * 24;
  const beforeCount = recycleBin.length;
  recycleBin = recycleBin.filter(entry => {
    if (!entry || !entry.deletedAt) return true; // keep entries without timestamp
    const t = new Date(entry.deletedAt).getTime();
    if (!isFinite(t)) return true;
    const ageDays = (now - t) / msPerDay;
    return ageDays <= RECYCLE_RETENTION_DAYS;
  });
  const removed = beforeCount - recycleBin.length;
  if (removed > 0) {
    saveRecycle();
    console.info(`Recycle Bin: purged ${removed} item(s) older than ${RECYCLE_RETENTION_DAYS} days.`);
  }
}

function createFolder() {
  const name = document.getElementById('newFolderInput').value.trim();
  if (!name) return alert('Enter subject name');
  if (!notesData[name]) notesData[name] = [];
  saveNotesData();
  document.getElementById('newFolderInput').value = '';
  selectFolder(name);
}

function selectFolder(folder) {
  currentFolder = folder;
  document.getElementById('currentFolderTitle').textContent = `Folder: ${folder}`;
  document.getElementById('uploadBtn').disabled = false;
  document.getElementById('newNoteBtn').disabled = false;
  renderFolders();
}

function renderFolders() {
  const container = document.getElementById('foldersContainer');
  container.innerHTML = '';
  Object.keys(notesData).forEach(folder => {
    const folderDiv = document.createElement('div');
    folderDiv.className = folder === currentFolder ? 'active' : '';

    const headerDiv = document.createElement('div');
    headerDiv.style.display = 'flex';
    headerDiv.style.justifyContent = 'space-between';

    const folderName = document.createElement('span');
    folderName.textContent = folder;
    folderName.style.cursor = 'pointer';
    folderName.onclick = () => selectFolder(folder);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete Folder';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Delete folder "${folder}" and all its notes?`)) {
        // move folder to recycle bin instead of permanent delete
        recycleBin.push({ type: 'folder', name: folder, content: notesData[folder], deletedAt: new Date().toISOString() });
        delete notesData[folder];
        if (currentFolder === folder) currentFolder = null;
        saveNotesData(); saveRecycle(); renderFolders(); renderRecycle();
      }
    };

    headerDiv.appendChild(folderName);
    headerDiv.appendChild(delBtn);
    folderDiv.appendChild(headerDiv);

    if (notesData[folder].length > 0) {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      thead.innerHTML = `<tr><th>File Name</th><th>Uploaded On</th><th>Actions</th></tr>`;
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      notesData[folder].forEach((note, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><a href="${note.content}" download="${note.name}">${note.name}</a></td>
                        <td>${note.uploadDate}</td>
                        <td><button onclick="deleteNote('${folder}',${index})">Delete</button></td>`;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      folderDiv.appendChild(table);
    }

    container.appendChild(folderDiv);
  });
}

function deleteNote(folder, index) {
  // move note to recycle bin
  const note = notesData[folder].splice(index, 1)[0];
  recycleBin.push({ type: 'file', folder, item: note, deletedAt: new Date().toISOString() });
  if (notesData[folder].length === 0) {
    // keep empty folder or remove? we'll keep empty folder record
  }
  saveNotesData(); saveRecycle(); renderFolders(); renderRecycle();
}

function uploadNotes(event) {
  const files = event.target.files;
  if (!currentFolder) return;
  for (let file of files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      notesData[currentFolder].push({ name: file.name, content: e.target.result, uploadDate: new Date().toLocaleString() });
      saveNotesData(); renderFolders();
    };
    reader.readAsDataURL(file);
  }
}

function triggerFileInput() { document.getElementById('fileInput').click(); }
function openWriteNote() { window.open('write-note.html', '_blank'); }

function searchNotesAndFolders() {
  const query = document.getElementById('searchNotes').value.toLowerCase();
  const container = document.getElementById('foldersContainer');
  container.innerHTML = '';
  Object.keys(notesData).forEach(folder => {
    if (folder.toLowerCase().includes(query) ||
        notesData[folder].some(note => note.name.toLowerCase().includes(query))) {
      const folderDiv = document.createElement('div');
      folderDiv.innerHTML = `<strong>${folder}</strong>`;
      container.appendChild(folderDiv);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  renderFolders();
  if (Object.keys(notesData).length > 0) selectFolder(Object.keys(notesData)[0]);
  purgeOldRecycleItems();
  renderRecycle();
  initCloudUI();
});

// ===================== TIMERS =====================
let timer; let seconds = 0; let sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

function updateTimerDisplay() {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  document.getElementById('timer-display').textContent = `${mins}:${secs}`;
}

document.getElementById('start-timer').onclick = () => {
  if (timer) return;
  timer = setInterval(() => { seconds++; updateTimerDisplay(); }, 1000);
};
document.getElementById('pause-timer').onclick = () => { clearInterval(timer); timer = null; };
document.getElementById('reset-timer').onclick = () => {
  clearInterval(timer); timer = null;
  const sessionName = document.getElementById('session-name').value || 'Untitled Session';
  if (seconds > 0) {
    sessions.push({ name: sessionName, duration: seconds, date: new Date().toLocaleDateString() });
    localStorage.setItem('sessions', JSON.stringify(sessions));
    renderSessions();
  }
  seconds = 0; updateTimerDisplay();
};

function renderSessions() {
  const history = document.getElementById('session-history');
  history.innerHTML = '';
  if (sessions.length === 0) { history.innerHTML = '<li>No sessions completed yet.</li>'; return; }
  sessions.forEach(s => {
    const mins = Math.floor(s.duration / 60);
    const secs = s.duration % 60;
    const li = document.createElement('li');
    li.innerHTML = `<strong>${s.name}</strong> - ${mins}m ${secs}s (${s.date})`;
    history.appendChild(li);
  });
  const today = new Date().toLocaleDateString();
  const todayCount = sessions.filter(s => s.date === today).length;
  document.getElementById('daily-progress').textContent = `Sessions completed today: ${todayCount}`;
}
renderSessions();
updateTimerDisplay();

// ===================== GENERAL =====================
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  if (sectionId === 'notes-section') { renderFolders(); if (currentFolder) selectFolder(currentFolder); }
  if (sectionId === 'recycle-section') { purgeOldRecycleItems(); renderRecycle(); }
}

// ===================== RECYCLE BIN FUNCTIONS =====================
function renderRecycle() {
  const container = document.getElementById('recycleContainer');
  if (!container) return;
  container.innerHTML = '';
  if (!recycleBin || recycleBin.length === 0) { container.innerHTML = '<p>Recycle bin is empty.</p>'; return; }
  recycleBin.slice().reverse().forEach((entry, idx) => {
    const div = document.createElement('div');
    const header = document.createElement('div'); header.className = 'recycle-item-header';
    const title = document.createElement('span');
    title.innerHTML = entry.type === 'folder' ? `<strong>Folder:</strong> ${entry.name}` : `<strong>File:</strong> ${entry.item.name} <em>(${entry.folder})</em>`;
    const meta = document.createElement('small'); meta.textContent = new Date(entry.deletedAt).toLocaleString();
    const actions = document.createElement('div'); actions.className = 'recycle-actions';
    const restoreBtn = document.createElement('button'); restoreBtn.textContent = 'Restore';
    restoreBtn.onclick = () => restoreFromRecycle(recycleBin.length - 1 - idx);
    const permBtn = document.createElement('button'); permBtn.textContent = 'Delete Permanently'; permBtn.style.background = '#dc3545';
    permBtn.onclick = () => { if (confirm('Permanently delete this item?')) { permanentDelete(recycleBin.length - 1 - idx); } };
    actions.appendChild(restoreBtn); actions.appendChild(permBtn);
    header.appendChild(title); header.appendChild(meta);
    div.appendChild(header);
    const contentDiv = document.createElement('div');
    if (entry.type === 'folder') {
      contentDiv.innerHTML = `<em>${(entry.content || []).length} file(s)</em>`;
    } else {
      contentDiv.innerHTML = `<a href="${entry.item.content}" download="${entry.item.name}">${entry.item.name}</a>`;
    }
    div.appendChild(contentDiv);
    div.appendChild(actions);
    container.appendChild(div);
  });
}

function restoreFromRecycle(index) {
  const entry = recycleBin[index];
  if (!entry) return;
  if (entry.type === 'folder') {
    // restore folder if name not taken; if taken, append suffix
    let name = entry.name;
    if (notesData[name]) {
      let i = 1; while (notesData[`${name}_restored_${i}`]) i++; name = `${name}_restored_${i}`;
    }
    notesData[name] = entry.content || [];
  } else if (entry.type === 'file') {
    const folder = entry.folder || 'Restored';
    if (!notesData[folder]) notesData[folder] = [];
    notesData[folder].push(entry.item);
  }
  recycleBin.splice(index, 1);
  saveNotesData(); saveRecycle(); renderFolders(); renderRecycle();
}

function permanentDelete(index) {
  recycleBin.splice(index, 1);
  saveRecycle(); renderRecycle();
}

function emptyRecycle() {
  if (!confirm('Empty recycle bin? This will permanently delete all items.')) return;
  recycleBin = [];
  saveRecycle(); renderRecycle();
}

// ===================== CLOUD SYNC (optional) =====================
let cloudEnabled = false;
let firebaseApp = null;
let firestore = null;

function initCloudUI() {
  const toggleBtn = document.getElementById('cloud-toggle-btn');
  const syncBtn = document.getElementById('cloud-sync-btn');
  const status = document.getElementById('cloud-status');
  if (!toggleBtn) return;
  // show hint if no config present
  if (!window.cloudConfig) {
    status.textContent = 'No cloud-config found. See README.';
    return;
  }
  status.textContent = 'Cloud available';
}

async function loadFirebase() {
  if (firebaseApp) return;
  // dynamic import via script tag to avoid bundling credentials
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js';
    s.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js';
      s2.onload = res; s2.onerror = rej;
      document.head.appendChild(s2);
    };
    s.onerror = rej;
    document.head.appendChild(s);
  });
  try {
    firebaseApp = window.firebase.initializeApp(window.cloudConfig);
    firestore = window.firebase.firestore();
  } catch (err) { console.error('Firebase init error', err); }
}

async function toggleCloud() {
  if (!window.cloudConfig) { alert('No cloud-config provided. Create `cloud-config.js` with your Firebase config.'); return; }
  if (!cloudEnabled) {
    await loadFirebase();
    cloudEnabled = !!firestore;
    document.getElementById('cloud-sync-btn').disabled = !cloudEnabled;
    document.getElementById('cloud-status').textContent = cloudEnabled ? 'Cloud enabled' : 'Cloud failed';
  } else {
    cloudEnabled = false;
    document.getElementById('cloud-sync-btn').disabled = true;
    document.getElementById('cloud-status').textContent = 'Cloud disabled';
  }
}

async function uploadAllToCloud() {
  if (!cloudEnabled || !firestore) { alert('Cloud not enabled'); return; }
  try {
    const docRef = firestore.collection('protracker').doc('notesData');
    await docRef.set({ notesData, updatedAt: new Date().toISOString() });
    alert('Notes uploaded to cloud');
  } catch (err) { console.error(err); alert('Upload failed'); }
}

async function downloadFromCloud() {
  if (!cloudEnabled || !firestore) { alert('Cloud not enabled'); return; }
  try {
    const docRef = firestore.collection('protracker').doc('notesData');
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      if (data && data.notesData) {
        notesData = data.notesData;
        saveNotesData();
        renderFolders();
        alert('Notes downloaded from cloud');
      }
    } else alert('No cloud data found');
  } catch (err) { console.error(err); alert('Download failed'); }
}

// Dark mode toggle
document.getElementById('darkModeToggle').onclick = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
};