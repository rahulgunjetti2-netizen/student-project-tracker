const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const message = document.querySelector('#message');

// The exact key under which the saved text is kept in this browser.
const STORAGE_KEY = 'workshop-projects-v1';

// Turns the stored status value into the text people see.
const statusLabels = {
  'planned': 'Planned',
  'in-progress': 'In Progress',
  'completed': 'Completed'
};

// true = it is safe to write to storage; false = stored data is unreadable, so we leave it alone.
let canSave = true;

// A saved record is only accepted if it has the shape we expect.
function isValidProject(item) {
  return item !== null &&
    typeof item === 'object' &&
    Number.isInteger(item.id) &&
    typeof item.name === 'string' &&
    item.name.trim() !== '' &&
    Object.prototype.hasOwnProperty.call(statusLabels, item.status);
}

// Reads the saved text and turns it back into our collection (JSON.parse).
// Returns { projects, problem }. A problem means the stored data was NOT used and NOT changed.
function loadProjects() {
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return { projects: [], problem: 'Saved projects could not be read from this browser.' };
  }

  if (saved === null) {
    return { projects: [], problem: '' }; // nothing saved yet: start empty
  }

  let parsed;
  try {
    parsed = JSON.parse(saved);
  } catch (error) {
    return { projects: [], problem: 'Saved projects are damaged and could not be loaded.' };
  }

  // Every record must be valid and ids must be unique, otherwise we do not trust the data.
  const ids = new Set();
  const allValid = Array.isArray(parsed) && parsed.every(item => {
    if (!isValidProject(item) || ids.has(item.id)) {
      return false;
    }
    ids.add(item.id);
    return true;
  });
  if (!allValid) {
    return { projects: [], problem: 'Saved projects are not in the expected format and could not be loaded.' };
  }

  return {
    projects: parsed.map(item => ({ id: item.id, name: item.name, status: item.status })),
    problem: ''
  };
}

// Turns our collection into text (JSON.stringify) and keeps it in this browser.
function saveProjects() {
  if (!canSave) {
    message.textContent = 'Changes could not be saved because the stored data is unreadable. ' +
      'Delete the key ' + STORAGE_KEY + ' in your browser tools and refresh.';
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    message.textContent = 'Changes could not be saved in this browser. They will be lost on refresh.';
  }
}

// Start-up: read once. Nothing is written to storage here.
const loadResult = loadProjects();
const projects = loadResult.projects;
let nextId = projects.reduce((highest, item) => Math.max(highest, item.id), 0) + 1; // unique id for the next new project
let editingId = null; // null = Add mode; otherwise the id of the project being edited

if (loadResult.problem !== '') {
  canSave = false;
  message.textContent = loadResult.problem + ' The stored data was left untouched, so the list is empty and new changes will not be saved.';
}

// Puts the form back into Add mode.
function setAddMode() {
  editingId = null;
  form.reset();
  saveButton.textContent = 'Save project';
  cancelButton.hidden = true;
}

// Puts the form into Edit mode for one project.
function startEdit(id) {
  const project = projects.find(item => item.id === id);
  if (!project) {
    return;
  }
  editingId = id;
  nameInput.value = project.name;
  statusInput.value = project.status;
  saveButton.textContent = 'Save changes';
  cancelButton.hidden = false;
  message.textContent = '';
  nameInput.focus();
}

// Deletes one project (found by its id) after the user confirms.
function deleteProject(id) {
  const index = projects.findIndex(item => item.id === id);
  if (index === -1) {
    return;
  }

  const project = projects[index];
  const label = statusLabels[project.status] || project.status;
  const confirmed = window.confirm('Delete "' + project.name + '" (' + label + ')?');
  if (!confirmed) {
    return; // Cancel: leave everything unchanged, including the stored copy
  }

  projects.splice(index, 1); // remove only this project

  if (editingId === id) {
    setAddMode(); // the project being edited is gone, so leave Edit mode
  }

  message.textContent = '';
  saveProjects();
  render();
}

// Rebuilds the whole list from the projects array.
function render() {
  projectList.textContent = ''; // clear old items so nothing is duplicated

  projects.forEach(project => {
    const item = document.createElement('li');
    const label = statusLabels[project.status] || project.status;
    item.textContent = project.name + ' - ' + label + ' '; // textContent keeps user text safe
    item.dataset.id = project.id;

    const editButton = document.createElement('button');
    editButton.type = 'button'; // not a submit button
    editButton.textContent = 'Edit';
    editButton.setAttribute('aria-label', 'Edit ' + project.name);
    editButton.addEventListener('click', () => startEdit(project.id));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button'; // not a submit button
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', 'Delete ' + project.name);
    deleteButton.addEventListener('click', () => deleteProject(project.id));

    item.appendChild(editButton);
    item.appendChild(document.createTextNode(' '));
    item.appendChild(deleteButton);
    projectList.appendChild(item);
  });

  emptyState.textContent = projects.length === 0 ? 'No projects yet.' : '';
}

// The one and only submit listener: Add or Save changes.
form.addEventListener('submit', event => {
  event.preventDefault(); // stop the browser from reloading the page

  const name = nameInput.value.trim();
  const status = statusInput.value;

  if (name === '') {
    message.textContent = 'Please enter a project name.';
    nameInput.focus();
    return;
  }

  message.textContent = '';

  if (editingId === null) {
    // Add mode: create a new project
    projects.push({ id: nextId, name: name, status: status });
    nextId += 1;
    nameInput.value = '';
  } else {
    // Edit mode: update the selected project, keeping its id
    const project = projects.find(item => item.id === editingId);
    if (project) {
      project.name = name;
      project.status = status;
    }
    setAddMode();
  }

  saveProjects();
  nameInput.focus();
  render();
});

// Cancel edit: throw away unsaved changes and go back to Add mode. Nothing is stored.
cancelButton.addEventListener('click', () => {
  message.textContent = '';
  setAddMode();
  nameInput.focus();
});

render(); // show the saved projects (or the empty state) when the page first loads