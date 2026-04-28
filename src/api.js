import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Auto attach token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// AUTH
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);

// EMPLOYEES
export const getEmployees = () => API.get('/employees');
export const addEmployee = (data) => API.post('/employees', data);
export const updateEmployee = (id, data) => API.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => API.delete(`/employees/${id}`);

// TASKS
export const getTasks = () => API.get('/tasks');
export const addTask = (data) => API.post('/tasks', data);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);

// WORKFLOWS
export const getWorkflows = () => API.get('/workflows');
export const addWorkflow = (data) => API.post('/workflows', data);
export const assignWorkflow = (id, empId) => API.post(`/workflows/${id}/assign/${empId}`);
