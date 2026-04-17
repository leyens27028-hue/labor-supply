import axiosClient from './axiosClient';

const salaryApi = {
  getAll: (params) => axiosClient.get('/salaries', { params }),
  calculate: (data) => axiosClient.post('/salaries/calculate', data),
  addBonus: (salaryId, data) => axiosClient.post(`/salaries/${salaryId}/bonus`, data),
  updateStatus: (salaryId, data) => axiosClient.put(`/salaries/${salaryId}/status`, data),
  getMyPreview: () => axiosClient.get('/salaries/my-preview'),
  remove: (id) => axiosClient.delete(`/salaries/${id}`),
  exportCSV: (params) => axiosClient.get('/salaries/export', { params, responseType: 'blob' }),
};

export default salaryApi;
