'use strict';

const STORAGE_KEY = 'ynote_notes';

let notes = [];
let activeId = null;
let saveTimer = null;

// --- Persistence ---

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    notes = raw ? JSON.parse(raw) : [];
  } catch {
    notes = [];
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// --- Helpers ---

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getTitle(content) {
  const firstLine = content.split('\n')[0].trim();
  return firstLine || 'Untitled';
}

function getPreview(content) {
  const lines = content.split('\n').filter(l => l.trim());
  return lines.length > 1 ? lines[1].trim() : '';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// --- DOM refs ---

const noteList = document.getElementById('note-list');
const editor = document.getElementById('editor');
const editorPanel = document.getElementById('editor-panel');
const noteDate = document.getElementById('note-date');
const newNoteBtn = document.getElementById('new-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const emptyNewBtn = document.getElementById('empty-new-btn');

// --- Render ---

function renderNoteList() {
  noteList.innerHTML = '';
  if (notes.length === 0) {
    const li = document.createElement('li');
    li.style.cssText = 'padding:16px;color:var(--text-muted);font-size:0.8rem;text-align:center;cursor:default';
    li.textContent = 'No notes yet';
    noteList.appendChild(li);
    return;
  }

  const sorted = [...notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  sorted.forEach(note => {
    const li = document.createElement('li');
    if (note.id === activeId) li.classList.add('active');

    const titleEl = document.createElement('div');
    titleEl.className = 'note-item-title';
    titleEl.textContent = getTitle(note.content);

    const previewEl = document.createElement('div');
    previewEl.className = 'note-item-preview';
    previewEl.textContent = getPreview(note.content);

    li.appendChild(titleEl);
    li.appendChild(previewEl);
    li.addEventListener('click', () => selectNote(note.id));
    noteList.appendChild(li);
  });
}

function renderEditor() {
  const note = notes.find(n => n.id === activeId);
  if (!note) {
    editorPanel.classList.add('empty');
    editor.value = '';
    noteDate.textContent = '';
    return;
  }
  editorPanel.classList.remove('empty');
  editor.value = note.content;
  noteDate.textContent = formatDate(note.updatedAt);
  editor.focus();
}

// --- Actions ---

function createNote() {
  const note = {
    id: generateId(),
    content: '',
    updatedAt: new Date().toISOString(),
  };
  notes.unshift(note);
  saveNotes();
  activeId = note.id;
  renderNoteList();
  renderEditor();
}

function deleteNote(id) {
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return;
  notes.splice(idx, 1);
  saveNotes();

  // Select adjacent note
  const sorted = [...notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  activeId = sorted.length > 0 ? sorted[0].id : null;
  renderNoteList();
  renderEditor();
}

function selectNote(id) {
  activeId = id;
  renderNoteList();
  renderEditor();
}

// --- Event handlers ---

newNoteBtn.addEventListener('click', createNote);
emptyNewBtn.addEventListener('click', createNote);

deleteNoteBtn.addEventListener('click', () => {
  if (activeId) deleteNote(activeId);
});

editor.addEventListener('input', () => {
  const note = notes.find(n => n.id === activeId);
  if (!note) return;
  note.content = editor.value;
  note.updatedAt = new Date().toISOString();

  // Debounce save + list re-render
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveNotes();
    renderNoteList();
    noteDate.textContent = formatDate(note.updatedAt);
  }, 300);
});

// --- Init ---

loadNotes();
const sorted = [...notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
activeId = sorted.length > 0 ? sorted[0].id : null;
renderNoteList();
renderEditor();
