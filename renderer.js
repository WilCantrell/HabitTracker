// Habit Tracker Renderer

// State
let habits = [];
let completions = {};
let currentWeekStart = getWeekStart(new Date());
let editingHabitId = null;

// DOM Elements
const habitInput = document.getElementById('habit-input');
const addHabitBtn = document.getElementById('add-habit-btn');
const habitsBody = document.getElementById('habits-body');
const tableHeader = document.getElementById('table-header');
const emptyState = document.getElementById('empty-state');
const habitsTable = document.getElementById('habits-table');
const dateRange = document.getElementById('date-range');
const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');
const editModal = document.getElementById('edit-modal');
const editHabitInput = document.getElementById('edit-habit-input');
const saveEditBtn = document.getElementById('save-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const deleteHabitBtn = document.getElementById('delete-habit-btn');

// Stats elements
const totalHabitsEl = document.getElementById('total-habits');
const todayCompletedEl = document.getElementById('today-completed');
const bestStreakEl = document.getElementById('best-streak');
const completionRateEl = document.getElementById('completion-rate');

// Utility Functions
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getWeekDates(weekStart) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function isToday(date) {
  const today = new Date();
  return formatDate(date) === formatDate(today);
}

function isFuture(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

// Calculate streak for a habit
function calculateStreak(habitId) {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let checkDate = new Date(today);
  
  // Check if today is completed, if not start from yesterday
  const todayKey = formatDate(today);
  if (!completions[habitId]?.[todayKey]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  while (true) {
    const dateKey = formatDate(checkDate);
    if (completions[habitId]?.[dateKey]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

// Calculate best streak across all habits
function calculateBestStreak() {
  let best = 0;
  for (const habit of habits) {
    const streak = calculateStreak(habit.id);
    if (streak > best) best = streak;
  }
  return best;
}

// Calculate weekly completion rate
function calculateWeeklyRate() {
  const weekDates = getWeekDates(currentWeekStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let total = 0;
  let completed = 0;
  
  for (const habit of habits) {
    for (const date of weekDates) {
      if (date <= today) {
        total++;
        const dateKey = formatDate(date);
        if (completions[habit.id]?.[dateKey]) {
          completed++;
        }
      }
    }
  }
  
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Count today's completions
function countTodayCompleted() {
  const todayKey = formatDate(new Date());
  let count = 0;
  for (const habit of habits) {
    if (completions[habit.id]?.[todayKey]) {
      count++;
    }
  }
  return count;
}

// Update stats display
function updateStats() {
  totalHabitsEl.textContent = habits.length;
  todayCompletedEl.textContent = countTodayCompleted();
  bestStreakEl.textContent = calculateBestStreak();
  completionRateEl.textContent = calculateWeeklyRate() + '%';
}

// Render Functions
function renderHeader() {
  const weekDates = getWeekDates(currentWeekStart);
  
  // Clear existing day headers
  while (tableHeader.children.length > 1) {
    tableHeader.removeChild(tableHeader.lastChild);
  }
  
  // Add day headers
  for (const date of weekDates) {
    const th = document.createElement('th');
    th.textContent = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    if (isToday(date)) {
      th.classList.add('today-col');
    }
    tableHeader.appendChild(th);
  }
  
  // Update date range display
  const endDate = new Date(currentWeekStart);
  endDate.setDate(endDate.getDate() + 6);
  dateRange.textContent = `${formatShortDate(currentWeekStart)} - ${formatShortDate(endDate)}`;
}

function renderHabits() {
  habitsBody.innerHTML = '';
  
  if (habits.length === 0) {
    emptyState.classList.add('visible');
    habitsTable.style.display = 'none';
    return;
  }
  
  emptyState.classList.remove('visible');
  habitsTable.style.display = 'table';
  
  const weekDates = getWeekDates(currentWeekStart);
  
  for (const habit of habits) {
    const tr = document.createElement('tr');
    const streak = calculateStreak(habit.id);
    
    // Habit name cell
    const nameTd = document.createElement('td');
    nameTd.className = 'habit-name';
    nameTd.innerHTML = `
      <span onclick="openEditModal('${habit.id}')">${habit.name}</span>
      <span class="streak-badge ${streak === 0 ? 'zero' : ''}">${streak}🔥</span>
    `;
    tr.appendChild(nameTd);
    
    // Day checkboxes
    for (const date of weekDates) {
      const td = document.createElement('td');
      if (isToday(date)) {
        td.classList.add('today-col');
      }
      
      const dateKey = formatDate(date);
      const isChecked = completions[habit.id]?.[dateKey] || false;
      const isFutureDate = isFuture(date);
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'day-checkbox';
      checkbox.checked = isChecked;
      checkbox.disabled = isFutureDate;
      if (isFutureDate) {
        checkbox.classList.add('future');
      }
      
      checkbox.addEventListener('change', () => toggleCompletion(habit.id, dateKey, checkbox.checked));
      
      td.appendChild(checkbox);
      tr.appendChild(td);
    }
    
    habitsBody.appendChild(tr);
  }
  
  updateStats();
}

// Data Functions
async function loadData() {
  habits = await window.electronAPI.getHabits();
  completions = await window.electronAPI.getCompletions();
  renderHeader();
  renderHabits();
}

async function saveHabits() {
  await window.electronAPI.saveHabits(habits);
}

async function saveCompletions() {
  await window.electronAPI.saveCompletions(completions);
}

// Action Functions
async function addHabit() {
  const name = habitInput.value.trim();
  if (!name) return;
  
  const habit = {
    id: generateId(),
    name: name,
    createdAt: new Date().toISOString()
  };
  
  habits.push(habit);
  completions[habit.id] = {};
  
  await saveHabits();
  await saveCompletions();
  
  habitInput.value = '';
  renderHabits();
}

async function toggleCompletion(habitId, dateKey, isCompleted) {
  if (!completions[habitId]) {
    completions[habitId] = {};
  }
  
  if (isCompleted) {
    completions[habitId][dateKey] = true;
  } else {
    delete completions[habitId][dateKey];
  }
  
  await saveCompletions();
  renderHabits();
}

function openEditModal(habitId) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;
  
  editingHabitId = habitId;
  editHabitInput.value = habit.name;
  editModal.classList.add('active');
  editHabitInput.focus();
}

function closeEditModal() {
  editModal.classList.remove('active');
  editingHabitId = null;
}

async function saveEdit() {
  const newName = editHabitInput.value.trim();
  if (!newName || !editingHabitId) return;
  
  const habit = habits.find(h => h.id === editingHabitId);
  if (habit) {
    habit.name = newName;
    await saveHabits();
    renderHabits();
  }
  
  closeEditModal();
}

async function deleteHabit() {
  if (!editingHabitId) return;
  
  habits = habits.filter(h => h.id !== editingHabitId);
  delete completions[editingHabitId];
  
  await saveHabits();
  await saveCompletions();
  
  closeEditModal();
  renderHabits();
}

function navigateWeek(direction) {
  currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
  renderHeader();
  renderHabits();
}

// Event Listeners
addHabitBtn.addEventListener('click', addHabit);
habitInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addHabit();
});

prevWeekBtn.addEventListener('click', () => navigateWeek(-1));
nextWeekBtn.addEventListener('click', () => navigateWeek(1));

saveEditBtn.addEventListener('click', saveEdit);
cancelEditBtn.addEventListener('click', closeEditModal);
deleteHabitBtn.addEventListener('click', deleteHabit);

editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

editHabitInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') saveEdit();
});

// Initialize
loadData();
