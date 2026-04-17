import axiosClient from './axiosClient';

const collaboratorApi = {
  getAll: (params) => axiosClient.get('/collaborators', { params }),
  getById: (id) => axiosClient.get(`/collaborators/${id}`),
  create: (data) => axiosClient.post('/collaborators', data),
  update: (id, data) => axiosClient.put(`/collaborators/${id}`, data),
  remove: (id) => axiosClient.delete(`/collaborators/${id}`),
  toggleActive: (id) => axiosClient.patch(`/collaborators/${id}/toggle-active`),
};

export default collaboratorApi;
