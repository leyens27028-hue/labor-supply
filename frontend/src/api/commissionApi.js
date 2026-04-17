import axiosClient from './axiosClient';

const commissionApi = {
  getTiers: () => axiosClient.get('/commission/tiers'),
  createTier: (data) => axiosClient.post('/commission/tiers', data),
  updateTier: (id, data) => axiosClient.put(`/commission/tiers/${id}`, data),
  removeTier: (id) => axiosClient.delete(`/commission/tiers/${id}`),
  toggleTierActive: (id) => axiosClient.patch(`/commission/tiers/${id}/toggle-active`),
  getConfigs: () => axiosClient.get('/commission/configs'),
  updateConfig: (key, data) => axiosClient.put(`/commission/configs/${key}`, data),
};

export default commissionApi;
