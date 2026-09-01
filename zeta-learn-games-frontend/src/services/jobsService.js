import axios from "axios";

const JOBS_API_BASE =
  import.meta.env.VITE_LOCAL_JOBS_API_URL ||
  "https://news-job-g73a.onrender.com/api/local-jobs/";

const jobsApi = axios.create({
  baseURL: JOBS_API_BASE,
  timeout: 45000,
});

const extractRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

async function fetchAllPages(initialPath) {
  const rows = [];
  const visited = new Set();
  let nextRef = initialPath;

  while (nextRef && !visited.has(nextRef)) {
    visited.add(nextRef);
    const response = await jobsApi.get(nextRef);
    const payload = response.data || {};
    rows.push(...extractRows(payload));
    nextRef = payload?.next || null;
  }

  return rows;
}

const jobsService = {
  async listCompanies() {
    return fetchAllPages("companies/");
  },

  async createCompany(payload) {
    const response = await jobsApi.post("companies/", payload);
    return response.data || {};
  },

  async listJobs() {
    return fetchAllPages("jobs/");
  },

  async scrapeCompany(companyId) {
    const response = await jobsApi.post(`scrape/${companyId}/`);
    return response.data || {};
  },

  async scrapeJobs(companies = []) {
    try {
      const response = await jobsApi.post("scrape/");
      return {
        mode: "direct",
        data: response.data || {},
      };
    } catch (error) {
      const status = error?.response?.status;
      if (![404, 405].includes(status)) {
        throw error;
      }

      const validCompanies = companies.filter((company) => company?.id);
      if (validCompanies.length === 0) {
        throw error;
      }

      const results = await Promise.allSettled(
        validCompanies.map((company) => jobsService.scrapeCompany(company.id))
      );

      return {
        mode: "by-company",
        total: validCompanies.length,
        successCount: results.filter((result) => result.status === "fulfilled")
          .length,
        failed: results.filter((result) => result.status === "rejected"),
      };
    }
  },

  withApiError(error, fallback) {
    return (
      error?.response?.data?.detail ||
      error?.response?.data?.error ||
      error?.message ||
      fallback
    );
  },
};

export default jobsService;
