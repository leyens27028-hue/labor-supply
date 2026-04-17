import axiosClient from './axiosClient';

const workingHoursApi = {
  getAll: (params) => axiosClient.get('/working-hours', { params }),
  create: (data) => axiosClient.post('/working-hours', data),
  batchCreate: (data) => axiosClient.post('/working-hours/batch', data),
  update: (id, data) => axiosClient.put(`/working-hours/${id}`, data),
  remove: (id) => axiosClient.delete(`/working-hours/${id}`),
};

export default workingHoursApi;
