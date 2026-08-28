import { authClient } from './auth.js';

async function getToken() {
  const { data } = await authClient.getSession();
  return data?.session?.token || null;
}

async function request(method, path, body) {
  const token = await getToken();
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(path, opts);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `${res.status} ${res.statusText}`);
  return data;
}

// Goals
export const listGoals = (archived = false) =>
  request('GET', `/api/goals${archived ? '?archived=true' : ''}`);
export const createGoal = (goal) => request('POST', '/api/goals', goal);
export const getGoal = (id) => request('GET', `/api/goals/${id}`);
export const patchGoal = (id, action) => request('PATCH', `/api/goals/${id}`, action);
export const deleteGoal = (id) => request('DELETE', `/api/goals/${id}`);
export const archiveGoal = (id) => request('POST', `/api/goals/${id}/archive`);
export const unarchiveGoal = (id) => request('POST', `/api/goals/${id}/unarchive`);

// Images
export async function uploadImage(file) {
  const token = await getToken();
  const form = new FormData();
  form.append('file', file);
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch('/api/images', { method: 'POST', body: form, headers, credentials: 'same-origin' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Upload failed');
  return data.url;
}
