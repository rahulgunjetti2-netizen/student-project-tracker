// All projects live in this array. It starts empty on every page load.
const projects = [];
let nextId = 1; // simple counter: each new project gets a unique id

const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const message = document.querySelector('#message');

// Turns the stored status value into the text people see.
const statusLabels = {
  'planned': 'Planned',
  'in-progress': 'In Progress',
  'completed': 'Completed'
};

// Rebuilds the whole list from the projects array.
function render() {
  projectList.textContent = ''; // clear old items so nothing is duplicated

  projects.forEach(project => {
    const item = document.createElement('li');
    const label = statusLabels[project.status] || project.status;
    item.textContent = project.name + ' - ' + label; // textContent keeps user text safe
    item.dataset.id = project.id;
    projectList.appendChild(item);
  });

  emptyState.textContent = projects.length === 0 ? 'No projects yet.' : '';
}

// The one and only submit listener.
form.addEventListener('submit', event => {
  event.preventDefault(); // stop the browser from reloading the page

  const name = nameInput.value.trim();
  const status = statusInput.value;

  if (name === '') {
    message.textContent = 'Please enter a project name.';
    nameInput.focus();
    return;
  }

  projects.push({ id: nextId, name: name, status: status });
  nextId += 1;

  message.textContent = '';
  nameInput.value = '';
  nameInput.focus();
  render();
});

render(); // show the empty state when the page first loads
