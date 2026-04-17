import axiosClient from './axiosClient';

const authApi = {
  login: (data) => axiosClient.post('/auth/login', data),
  getMe: () => axiosClient.get('/auth/me'),
  changePassword: (data) => axiosClient.put('/auth/change-password', data),
};

export default authApi;
