import axiosClient from './axiosClient';

const userApi = {
  getAll: (params) => axiosClient.get('/users', { params }),
  getById: (id) => axiosClient.get(`/users/${id}`),
  create: (data) => axiosClient.post('/users', data),
  update: (id, data) => axiosClient.put(`/users/${id}`, data),
  resetPassword: (id, data) => axiosClient.put(`/users/${id}/reset-password`, data),
};

export default userApi;
