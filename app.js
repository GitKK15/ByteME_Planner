// ===================== TASK MANAGER =====================
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let currentFilter = 'all';
let currentSubFilter = 'all';

taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const dueDate = document.getElementById('dueDate').value;
  const dueTime = document.getElementById('dueTime').value;
  const description = document.getElementById('description').value.trim();
  const type = document.getElementById('type').value;
  const priority = document.getElementById('priority').value;
  const notes = document.getElementById('notes').value.trim();
  if (!title || !dueDate || !dueTime) return;
  tasks.push({ title, dueDate, dueTime, description, type, priority, notes, done: false });
  saveTasks(); renderTasks(); taskForm.reset();
});

function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }
function setTypeFilter(type) { currentFilter = type; renderTasks(); }
function setSubFilter(sub) { currentSubFilter = sub; renderTasks(); }

function renderTasks() {
  taskList.innerHTML = '';
  let filtered = tasks.filter(task => {
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
  document.getElementById('title').value = t.title;
  document.getElementById('dueDate').value = t.dueDate;
  document.getElementById('dueTime').value = t.dueTime;
  document.getElementById('description').value = t.description;
  document.getElementById('type').value = t.type;
  document.getElementById('priority').value = t.priority;
  document.getElementById('notes').value = t.notes;
  tasks.splice(index, 1); saveTasks(); renderTasks();
}
function deleteTask(index) { if (confirm('Delete this task?')) { tasks.splice(index, 1); saveTasks(); renderTasks(); } }
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
      taskDiv.onclick = (e) => { e.stopPropagation(); editCalendarTask(task.dueDate, task.dueTime, task.title); };
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
    li.innerHTML = `<strong>${t.title}</strong> (${t.dueTime})<br>Type: ${t.type}, Priority: ${t.priority}<br>${t.description}<br>${t.notes}
      <button onclick="editCalendarTask('${t.dueDate}','${t.dueTime}','${t.title}')">Edit</button>
      <button onclick="deleteCalendarTask('${t.dueDate}','${t.dueTime}','${t.title}')">Delete</button>`;
    calendarTasks.appendChild(li);
  });
}

function editCalendarTask(dueDate, dueTime, title) {
  const index = tasks.findIndex(t => t.dueDate === dueDate && t.dueTime === dueTime && t.title === title);
  if (index !== -1) { editTask(index); showSection('tasks-section'); }
}

function deleteCalendarTask(dueDate, dueTime, title) {
  const index = tasks.findIndex(t => t.dueDate === dueDate && t.dueTime === dueTime && t.title === title);
  if (index !== -1 && confirm('Delete this task?')) { tasks.splice(index, 1); saveTasks(); renderTasks(); renderCalendarTasks(); }
}

renderCalendar();

// ===================== NOTES & REFERENCES =====================
let notesData = JSON.parse(localStorage.getItem('notesData') || '{}');
let currentFolder = null;

function saveNotesData() { localStorage.setItem('notesData', JSON.stringify(notesData)); }

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
}

function createFolder() {
  const name = document.getElementById('newFolderInput').value.trim();
  if (!name) { alert('Enter subject name'); return; }
  if (!notesData[name]) notesData[name] = [];
  saveNotesData(); document.getElementById('newFolderInput').value = '';
  selectFolder(name); renderFolders();
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
    folderDiv.textContent = folder;
    folderDiv.className = folder === currentFolder ? 'active' : '';
    folderDiv.onclick = () => selectFolder(folder);

    // Table of notes
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['File Name', 'Uploaded On', 'Actions'].forEach(h => { const th = document.createElement('th'); th.textContent = h; headRow.appendChild(th); });
    thead.appendChild(headRow); table.appendChild(thead);

    const tbody = document.createElement('tbody');
    notesData[folder].forEach((note, index) => {
      const tr = document.createElement('tr');
      const nameTd = document.createElement('td');
      const link = document.createElement('a'); link.href = note.content; link.download = note.name; link.textContent = note.name; nameTd.appendChild(link);
      const dateTd = document.createElement('td'); dateTd.textContent = note.uploadDate;
      const actionTd = document.createElement('td'); 
      const delBtn = document.createElement('button'); delBtn.textContent = 'Delete';
      delBtn.onclick = () => { if(confirm('Delete this note?')) { notesData[folder].splice(index,1); saveNotesData(); renderFolders(); } };
      actionTd.appendChild(delBtn);
      tr.appendChild(nameTd); tr.appendChild(dateTd); tr.appendChild(actionTd); tbody.appendChild(tr);
    });
    table.appendChild(tbody); folderDiv.appendChild(table);
    container.appendChild(folderDiv);
  });
}

// ===================== FILE UPLOAD =====================
function triggerFileInput() { if (currentFolder) document.getElementById('fileInput').click(); }

function uploadNotes(event) {
  if (!currentFolder) return;
  const files = Array.from(event.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      const uploadDate = new Date().toISOString().split('T')[0];
      notesData[currentFolder].push({ name: file.name, content: reader.result, uploadDate });
      saveNotesData(); renderFolders();
    }
    reader.readAsDataURL(file);
  });
  event.target.value = '';
}

// ===================== WRITE NOTE =====================
function openWriteNote() {
  if (!currentFolder) { alert('Select a folder first'); return; }
  window.open(`write-note.html?folder=${encodeURIComponent(currentFolder)}`, '_blank', 'width=800,height=600');
}

// INITIAL RENDER
renderFolders();
renderTasks();