import axiosClient from './axiosClient';

const vendorApi = {
  getAll: (params) => axiosClient.get('/vendors', { params }),
  getById: (id) => axiosClient.get(`/vendors/${id}`),
  create: (data) => axiosClient.post('/vendors', data),
  update: (id, data) => axiosClient.put(`/vendors/${id}`, data),
  addFactory: (vendorId, data) => axiosClient.post(`/vendors/${vendorId}/factories`, data),
  removeFactory: (vendorId, linkId) => axiosClient.delete(`/vendors/${vendorId}/factories/${linkId}`),
};

export default vendorApi;
