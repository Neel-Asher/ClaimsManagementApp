import { springApi } from './api';

export const customerService = {
  async getAll() {
    const res = await springApi.get('/customers');
    return res.data;
  },
  async create(data) {
    const res = await springApi.post('/customers', data);
    return res.data;
  },
  async update(id, data) {
    const res = await springApi.put(`/customers/${id}`, data);
    return res.data;
  },
  async delete(id) {
    const res = await springApi.delete(`/customers/${id}`);
    return res.data;
  }
};

export const agentService = {
  async getAll() {
    const res = await springApi.get('/agents');
    return res.data;
  },
  async create(data) {
    const res = await springApi.post('/agents', data);
    return res.data;
  },
  async update(id, data) {
    const res = await springApi.put(`/agents/${id}`, data);
    return res.data;
  }
};

export const productService = {
  async getAll() {
    const res = await springApi.get('/products');
    return res.data;
  },
  async create(data) {
    const res = await springApi.post('/products', data);
    return res.data;
  },
  async update(id, data) {
    const res = await springApi.put(`/products/${id}`, data);
    return res.data;
  }
};

export const policyService = {
  async getAll() {
    const res = await springApi.get('/policies');
    return res.data;
  },
  async create(data) {
    const res = await springApi.post('/policies', data);
    return res.data;
  },
  async update(id, data) {
    const res = await springApi.put(`/policies/${id}`, data);
    return res.data;
  },
  async delete(id) {
    const res = await springApi.delete(`/policies/${id}`);
    return res.data;
  }
};

export const claimService = {
  async getAll() {
    const res = await springApi.get('/claims');
    return res.data;
  },
  async create(data) {
    const res = await springApi.post('/claims', data);
    return res.data;
  },
  async update(id, data) {
    const res = await springApi.put(`/claims/${id}`, data);
    return res.data;
  },
  async delete(id) {
    const res = await springApi.delete(`/claims/${id}`);
    return res.data;
  }
};

export const paymentService = {
  async getAll() {
    const res = await springApi.get('/payments');
    return res.data;
  }
};

export const fraudService = {
  async predict(claimId) {
    const res = await springApi.post(`/predict/fraud/${claimId}`);
    return res.data;
  },
  async getAllPredictions() {
    const res = await springApi.get('/analytics/fraud-flagged-claims');
    return res.data;
  }
};

export const analyticsService = {
  async getDashboardSummary() {
    const res = await springApi.get('/analytics/dashboard-summary');
    return res.data;
  },
  async getClaimsTrend() {
    const res = await springApi.get('/analytics/claims-trend');
    return res.data;
  },
  async getTopAgents() {
    const res = await springApi.get('/analytics/top-agents');
    return res.data;
  },
  async getFraudDistribution() {
    const res = await springApi.get('/analytics/fraud-distribution');
    return res.data;
  },
  async getPolicyByType() {
    const res = await springApi.get('/analytics/policy-by-type');
    return res.data;
  },
  async getRenewalTrend() {
    const res = await springApi.get('/analytics/renewal-trend');
    return res.data;
  },
  async getCommissionData() {
    const res = await springApi.get('/analytics/commission-data');
    return res.data;
  }
};
