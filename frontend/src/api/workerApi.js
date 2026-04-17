import axiosClient from './axiosClient';

const workerApi = {
  getAll: (params) => axiosClient.get('/workers', { params }),
  getById: (id) => axiosClient.get(`/workers/${id}`),
  create: (data) => axiosClient.post('/workers', data),
  update: (id, data) => axiosClient.put(`/workers/${id}`, data),
  remove: (id) => axiosClient.delete(`/workers/${id}`),
  toggleStatus: (id, status) => axiosClient.patch(`/workers/${id}/status`, { status }),
};

export default workerApi;
