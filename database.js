
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const file = process.env.DB_FILE || './projects.json';

let projects = [];
let nextId = 1;

if (existsSync(file)) {
  try {
    projects = JSON.parse(readFileSync(file, 'utf8'));
    nextId = projects.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  } catch {
    projects = [];
  }
}

function save() {
  writeFileSync(file, JSON.stringify(projects, null, 2));
}

export const db = {
  async list() {
    return projects;
  },

  async create(project) {
    const row = { id: nextId++, ...project };
    projects.push(row);
    save();
    return row;
  },

  async update(id, project) {
    const index = projects.findIndex(p => p.id === id);
    if (index < 0) return null;
    projects[index] = { id, ...project };
    save();
    return projects[index];
  },

  async remove(id) {
    const found = projects.some(p => p.id === id);
    projects = projects.filter(p => p.id !== id);
    if (found) save();
    return found;
  }
};
