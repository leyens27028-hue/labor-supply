import axiosClient from './axiosClient';

const teamApi = {
  getAll: () => axiosClient.get('/teams'),
  create: (data) => axiosClient.post('/teams', data),
  update: (id, data) => axiosClient.put(`/teams/${id}`, data),
  remove: (id) => axiosClient.delete(`/teams/${id}`),
  toggleActive: (id) => axiosClient.patch(`/teams/${id}/toggle-active`),
};

export default teamApi;
