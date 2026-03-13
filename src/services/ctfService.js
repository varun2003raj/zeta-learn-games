import api from "./api";

const asList = (payload) => (Array.isArray(payload) ? payload : payload?.results || []);
const lifecycleBase = "/ctf/challenges/admin/ctf";

const withApiError = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.detail ||
  error?.message ||
  fallback;

const ctfService = {
  async getCtfState() {
    const response = await api.get(`${lifecycleBase}/state/`);
    return response.data || {};
  },

  async startCtf() {
    const response = await api.post(`${lifecycleBase}/start/`);
    return response.data || {};
  },

  async finishCtf() {
    const response = await api.post(`${lifecycleBase}/finish/`);
    return response.data || {};
  },

  async resetCtf(historyName) {
    const response = await api.post(`${lifecycleBase}/reset/`, {
      history_name: historyName,
    });
    return response.data || {};
  },

  async listCategories() {
    const response = await api.get("/ctf/challenges/admin/categories/");
    return asList(response.data);
  },

  async createCategory(payload) {
    const response = await api.post("/ctf/challenges/admin/categories/", payload);
    return response.data;
  },

  async updateCategory(id, payload) {
    const response = await api.put(`/ctf/challenges/admin/categories/${id}/`, payload);
    return response.data;
  },

  async deleteCategory(id) {
    await api.delete(`/ctf/challenges/admin/categories/${id}/`);
  },

  async ensureTieBreakerCategory() {
    return this.createCategory({ name: "Tie Breaker" });
  },

  async listChallenges() {
    const response = await api.get("/ctf/challenges/admin/challenges/");
    return asList(response.data);
  },

  async createChallenge(payload) {
    const response = await api.post("/ctf/challenges/admin/challenges/", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async updateChallenge(id, payload) {
    const response = await api.patch(`/ctf/challenges/admin/challenges/${id}/`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async deleteChallenge(id) {
    await api.delete(`/ctf/challenges/admin/challenges/${id}/`);
  },

  async toggleTieBreakerVisibility(id) {
    const response = await api.post(
      `/ctf/challenges/admin/challenges/${id}/toggle-tiebreaker/`
    );
    return response.data;
  },

  async listTeams() {
    const response = await api.get("/teams/admin/all/");
    return asList(response.data);
  },

  async getLeaderboardTimeline() {
    const response = await api.get("/ctf/leaderboard/admin/timeline/");
    return response.data || { series: [], time_start: null, time_end: null, max_score: 0 };
  },

  async listHistory() {
    const response = await api.get(`${lifecycleBase}/history/`);
    return asList(response.data);
  },

  async listAnnouncements() {
    const response = await api.get("/ctf/announcements/admin/");
    return asList(response.data);
  },

  async createAnnouncement(payload) {
    const response = await api.post("/ctf/announcements/admin/", payload);
    return response.data;
  },

  async updateAnnouncement(id, payload) {
    const response = await api.put(`/ctf/announcements/admin/${id}/`, payload);
    return response.data;
  },

  async deleteAnnouncement(id) {
    await api.delete(`/ctf/announcements/admin/${id}/`);
  },

  withApiError,
};

export default ctfService;
