import axiosClient from './axiosClient';

const orderApi = {
  getAll: (params) => axiosClient.get('/orders', { params }),
  getById: (id) => axiosClient.get(`/orders/${id}`),
  create: (data) => axiosClient.post('/orders', data),
  update: (id, data) => axiosClient.put(`/orders/${id}`, data),
  assignWorker: (orderId, data) => axiosClient.post(`/orders/${orderId}/assign-worker`, data),
  removeWorker: (orderId, assignmentId) => axiosClient.delete(`/orders/${orderId}/remove-worker/${assignmentId}`),
  remove: (id) => axiosClient.delete(`/orders/${id}`),
  changeStatus: (id, status) => axiosClient.patch(`/orders/${id}/status`, { status }),
};

export default orderApi;
