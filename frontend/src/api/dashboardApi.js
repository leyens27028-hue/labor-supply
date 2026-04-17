import axiosClient from './axiosClient';

const dashboardApi = {
  getStats: () => axiosClient.get('/dashboard/stats'),
};

export default dashboardApi;
