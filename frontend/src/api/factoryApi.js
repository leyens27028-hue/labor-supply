import axiosClient from './axiosClient';

const factoryApi = {
  getAll: (params) => axiosClient.get('/factories', { params }),
  getById: (id) => axiosClient.get(`/factories/${id}`),
  create: (data) => axiosClient.post('/factories', data),
  update: (id, data) => axiosClient.put(`/factories/${id}`, data),
  remove: (id) => axiosClient.delete(`/factories/${id}`),
  toggleActive: (id) => axiosClient.patch(`/factories/${id}/toggle-active`),
};

export default factoryApi;
