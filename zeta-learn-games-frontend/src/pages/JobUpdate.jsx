import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import jobsService from "../services/jobsService";
import { truncate } from "../utils/admin";
import "./JobUpdate.css";

const initialForm = {
  name: "",
  career_page_url: "",
};

export default function JobUpdate() {
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [fetchingAllJobs, setFetchingAllJobs] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("companies");
  const [form, setForm] = useState(initialForm);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [companyRows, jobRows] = await Promise.all([
        jobsService.listCompanies(),
        jobsService.listJobs(),
      ]);
      setCompanies(companyRows);
      setJobs(jobRows);
    } catch (errorValue) {
      setError(jobsService.withApiError(errorValue, "Unable to load jobs data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const jobsByCompanyId = useMemo(() => {
    const counts = new Map();
    jobs.forEach((job) => {
      const companyId = job?.company_id;
      if (companyId === undefined || companyId === null) return;
      counts.set(companyId, (counts.get(companyId) || 0) + 1);
    });
    return counts;
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesCompany =
        companyFilter === "all" || String(job?.company_id) === companyFilter;
      if (!matchesCompany) return false;

      if (!keyword) return true;

      const haystack = [
        job?.company,
        job?.title,
        job?.location,
        job?.description,
        job?.job_url,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [jobs, companyFilter, search]);

  const submitCompany = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      career_page_url: form.career_page_url.trim(),
    };

    if (!payload.name || !payload.career_page_url) {
      return;
    }

    try {
      setCreating(true);
      await jobsService.createCompany(payload);
      toast.success("Company created");
      setForm(initialForm);
      await loadData();
    } catch (errorValue) {
      toast.error(jobsService.withApiError(errorValue, "Unable to create company."));
    } finally {
      setCreating(false);
    }
  };

  const fetchAllJobs = async () => {
    if (companies.length === 0) {
      toast.error("No companies available to fetch.");
      return;
    }

    try {
      setFetchingAllJobs(true);
      const result = await jobsService.scrapeJobs(companies);

      if (result?.mode === "direct") {
        const detail =
          result?.data?.detail || result?.data?.message || "Jobs fetched successfully.";
        toast.success(detail);
      } else if ((result?.failed || []).length === 0) {
        toast.success(`Fetched jobs for ${result?.successCount || 0} companies.`);
      } else {
        const firstError = jobsService.withApiError(
          result.failed[0].reason,
          "Unable to fetch some jobs."
        );
        toast.error(
          `${result?.successCount || 0} succeeded, ${
            result?.failed?.length || 0
          } failed. ${firstError}`
        );
      }

      await loadData();
    } catch (errorValue) {
      toast.error(jobsService.withApiError(errorValue, "Unable to fetch jobs."));
    } finally {
      setFetchingAllJobs(false);
    }
  };

  if (loading && companies.length === 0 && jobs.length === 0) {
    return <LoadingSpinner label="Loading job update data..." />;
  }

  return (
    <section className="job-update-page">
      <div className="job-update-header">
        <div>
          <p className="job-update-eyebrow">Job Update</p>
          <h1>Jobs API</h1>
        </div>

        <div className="job-update-header-actions">
          <button
            type="button"
            onClick={fetchAllJobs}
            disabled={fetchingAllJobs || companies.length === 0}
            className="job-update-primary"
          >
            {fetchingAllJobs ? "Fetching Jobs..." : "Fetch Jobs"}
          </button>

          <div className="job-update-tabs">
            <button
              type="button"
              onClick={() => setActiveTab("companies")}
              className={`job-update-tab ${
                activeTab === "companies" ? "job-update-tab-active" : ""
              }`}
            >
              Companies
              <span>{companies.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("jobs")}
              className={`job-update-tab ${
                activeTab === "jobs" ? "job-update-tab-active" : ""
              }`}
            >
              Jobs
              <span>{jobs.length}</span>
            </button>
          </div>
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={loadData} /> : null}

      {activeTab === "companies" ? (
        <>
          <form className="job-update-form" onSubmit={submitCompany}>
            <div className="job-update-section-head">
              <div>
                <p className="job-update-eyebrow">Companies</p>
                <h2>Create company</h2>
                <p>Add a company source for the jobs scraper.</p>
              </div>

              <div className="job-update-actions">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="job-update-secondary"
                >
                  Refresh
                </button>
              </div>
            </div>

            <p className="job-update-note">
              The current backend supports company create and list only. Edit and
              delete are not available from this API yet.
            </p>

            <div className="job-update-fields job-update-fields-inline">
              <label className="job-update-field">
                <span>Company name</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Company name"
                  required
                />
              </label>

              <label className="job-update-field">
                <span>Career page URL</span>
                <input
                  type="url"
                  value={form.career_page_url}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      career_page_url: event.target.value,
                    }))
                  }
                  placeholder="https://company.com/careers"
                  required
                />
              </label>
            </div>

            <div className="job-update-actions">
              <button
                type="submit"
                disabled={creating}
                className="job-update-primary"
              >
                {creating ? "Creating..." : "Create Company"}
              </button>
              <button
                type="button"
                onClick={() => setForm(initialForm)}
                disabled={creating}
                className="job-update-secondary"
              >
                Reset
              </button>
            </div>
          </form>

          <div className="job-list-card">
            <div className="job-update-section-head">
              <div>
                <p className="job-update-eyebrow">Companies</p>
                <h2>Company list</h2>
                <p>List view for company sources.</p>
              </div>
            </div>

            {companies.length === 0 ? (
              <div className="job-update-empty">
                <EmptyState
                  title="No companies"
                  description="Create a company source to start fetching jobs."
                />
              </div>
            ) : (
              <div className="job-jobs-table-wrap">
                <table className="job-jobs-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Career Page</th>
                      <th>Jobs Found</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id}>
                        <td className="job-job-title">{company?.name || "-"}</td>
                        <td>{truncate(company?.career_page_url || "-", 70)}</td>
                        <td>{jobsByCompanyId.get(company?.id) || 0}</td>
                        <td>
                          <div className="job-table-actions">
                            <a
                              className="job-update-link"
                              href={company?.career_page_url || "#"}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="job-update-filters">
            <div className="job-update-section-head">
              <div>
                <p className="job-update-eyebrow">Jobs</p>
                <h2>Job list</h2>
                <p>All fetched jobs from every company source.</p>
              </div>
            </div>

            <div className="job-update-filter-group">
              <label>
                <span>Search jobs</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, company, location, description..."
                />
              </label>
              <label>
                <span>Company filter</span>
                <select
                  value={companyFilter}
                  onChange={(event) => setCompanyFilter(event.target.value)}
                >
                  <option value="all">All companies</option>
                  {companies.map((company) => (
                    <option key={company.id} value={String(company.id)}>
                      {company?.name || "-"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="job-update-actions">
              <button
                type="button"
                onClick={loadData}
                disabled={loading || fetchingAllJobs}
                className="job-update-secondary"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="job-jobs-card">
            {visibleJobs.length === 0 ? (
              <div className="job-update-empty">
                <EmptyState
                  title="No jobs found"
                  description="Use the fetch jobs button from companies or change the current filters."
                />
              </div>
            ) : (
              <div className="job-jobs-table-wrap">
                <table className="job-jobs-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Job</th>
                      <th>Location</th>
                      <th>Description</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleJobs.map((job) => (
                      <tr key={job.id}>
                        <td>{job?.company || "-"}</td>
                        <td>
                          <div className="job-job-title">{job?.title || "-"}</div>
                        </td>
                        <td>{job?.location || "-"}</td>
                        <td>{truncate(job?.description || "-", 120)}</td>
                        <td>
                          {job?.job_url ? (
                            <a
                              className="job-update-link"
                              href={job.job_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open Job
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
