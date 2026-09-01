import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./Projects.css";
import useLockBodyScroll from "../hooks/useLockBodyScroll";

const API_URL = "https://zetamind-hub-node-backend.onrender.com/api/projects";

const createEmptyForm = () => ({
  name: "",
  title: "",
  description: "",
  imageUrl: "",
  codeUrl: "",
  videoUrl: "",
  abstractUrl: "",
  userType: "students",
  status: true,
  serialNo: "",
  parentAdminUserId: "",
});

const normalizeProject = (project) => ({
  ...project,
  name: project?.name || "",
  title: project?.title || "",
  description: project?.description || "",
  imageUrl: project?.imageUrl || "",
  codeUrl: project?.codeUrl || "",
  videoUrl: project?.videoUrl || "",
  abstractUrl: project?.abstractUrl || "",
  userType: project?.userType || "students",
  status: typeof project?.status === "boolean" ? project.status : true,
  serialNo: project?.serialNo ?? "",
  parentAdminUserId: project?.parentAdminUserId || "",
});

export default function Projects() {
  const sliderRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [submitting, setSubmitting] = useState(false);

  useLockBodyScroll(showModal);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      const list = response?.data?.data?.data || [];
      setProjects(Array.isArray(list) ? list.map(normalizeProject) : []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      alert("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return projects;

    return projects.filter((project) =>
      [project.name, project.title, project.description]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [projects, query]);

  const openCreate = () => {
    setEditProject(null);
    setForm(createEmptyForm());
    setShowModal(true);
  };

  const openEdit = (project) => {
    setEditProject(project);
    setForm({
      name: project.name || "",
      title: project.title || "",
      description: project.description || "",
      imageUrl: project.imageUrl || "",
      codeUrl: project.codeUrl || "",
      videoUrl: project.videoUrl || "",
      abstractUrl: project.abstractUrl || "",
      userType: project.userType || "students",
      status: typeof project.status === "boolean" ? project.status : true,
      serialNo: project.serialNo ?? "",
      parentAdminUserId: project.parentAdminUserId || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditProject(null);
    setForm(createEmptyForm());
  };

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      title: form.title.trim() || form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      codeUrl: form.codeUrl.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
      abstractUrl: form.abstractUrl.trim() || null,
      userType: form.userType || "students",
      status: Boolean(form.status),
      deleted: false,
    };

    if (form.parentAdminUserId.trim()) {
      payload.parentAdminUserId = form.parentAdminUserId.trim();
    }

    if (form.serialNo !== "") {
      const parsed = Number(form.serialNo);
      if (!Number.isNaN(parsed)) {
        payload.serialNo = parsed;
      }
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Project name is required");
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildPayload();

      if (editProject?._id) {
        await axios.put(`${API_URL}/${editProject._id}`, payload);
      } else {
        await axios.post(API_URL, payload);
      }

      await fetchProjects();
      closeModal();
    } catch (error) {
      console.error("Failed to save project:", error);
      alert("Failed to save project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      setProjects((prev) => prev.filter((project) => project._id !== id));
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project");
    }
  };

  const slideProjects = (direction) => {
    const slider = sliderRef.current;
    if (!slider) return;
    const amount = Math.max(320, Math.round(slider.clientWidth * 0.85));
    slider.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="projects-page">
      <div className="projects-bg-orb orb-1"></div>
      <div className="projects-bg-orb orb-2"></div>

      <div className="projects-shell">
        <div className="projects-header">
          <div className="projects-title-wrap">
            <p className="kicker">Portfolio Admin</p>
            <h1>Projects</h1>
            <p>Premium themed slider view for create, edit, update and delete.</p>
          </div>

          <div className="projects-header-actions">
            <label className="projects-search-label">
              Search Project
              <input
                className="projects-search"
                placeholder="Search project..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button className="add-project-btn" onClick={openCreate}>
              + Add Project
            </button>
          </div>
        </div>

        <section className="projects-board">
          <div className="slider-actions">
            <button
              className="slide-btn"
              onClick={() => slideProjects("left")}
              aria-label="Slide left"
            >
              {"<"}
            </button>
            <button
              className="slide-btn"
              onClick={() => slideProjects("right")}
              aria-label="Slide right"
            >
              {">"}
            </button>
          </div>

          {loading ? (
            <div className="projects-state">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="projects-state">No projects found.</div>
          ) : (
            <div className="projects-slider" ref={sliderRef}>
              {filteredProjects.map((project) => (
                <article key={project._id} className="project-card">
                  <img
                    className="project-image"
                    src={project.imageUrl || "https://via.placeholder.com/640x360?text=Project"}
                    alt={project.name || "Project image"}
                  />

                  <div className="project-card-body">
                    <div className="project-card-top">
                      <h3><b>Name :</b>{project.name || "Untitled Project"}</h3>
                      <span className={`status-chip ${project.status ? "active" : "inactive"}`}>
                        {project.status ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="project-title"><b>Title :</b>{project.title || "-"}</p>
                    <p className="project-description"><b>Description :</b>
                      {project.description || "No description available."}
                    </p>

                    <div className="project-meta">
                      <span>User: {project.userType || "students"}</span>
                      <span>Serial: {project.serialNo === "" ? "-" : project.serialNo}</span>
                    </div>

                    <div className="project-links">
                      {project.codeUrl && (
                        <a href={project.codeUrl} target="_blank" rel="noreferrer">
                          Code
                        </a>
                      )}
                      {project.videoUrl && (
                        <a href={project.videoUrl} target="_blank" rel="noreferrer">
                          Video
                        </a>
                      )}
                      {project.abstractUrl && (
                        <a href={project.abstractUrl} target="_blank" rel="noreferrer">
                          Abstract
                        </a>
                      )}in 
                    </div>
                  </div>

                  <div className="project-card-footer">
                    <button className="edit-project-btn" onClick={() => openEdit(project)}>
                      Edit
                    </button>
                    <button
                      className="delete-project-btn"
                      onClick={() => handleDelete(project._id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      {showModal && (
        <div className="project-modal-overlay">
          <div className="project-modal">
            <div className="project-modal-header">
              <div>
                <p className="kicker">{editProject ? "Update" : "Create"}</p>
                <h2>{editProject ? "Edit Project" : "Add Project"}</h2>
              </div>
              <button className="close-modal-btn" onClick={closeModal}>
                X
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="project-form-grid">
                <div className="project-field">
                  <label className="project-field-label">Project Name</label>
                  <input
                    placeholder="Project Name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="project-field">
                  <label className="project-field-label">Project Title</label>
                  <input
                    placeholder="Project Title"
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                  />
                </div>
              </div>

              <label className="project-field-label">Description</label>
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />

              <div className="project-form-grid">
                <div className="project-field">
                  <label className="project-field-label">Image URL</label>
                  <input
                    placeholder="Image URL"
                    value={form.imageUrl}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, imageUrl: event.target.value }))
                    }
                  />
                </div>
                <div className="project-field">
                  <label className="project-field-label">Code URL</label>
                  <input
                    placeholder="Code URL"
                    value={form.codeUrl}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, codeUrl: event.target.value }))
                    }
                  />
                </div>
                <div className="project-field">
                  <label className="project-field-label">Video URL</label>
                  <input
                    placeholder="Video URL"
                    value={form.videoUrl}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, videoUrl: event.target.value }))
                    }
                  />
                </div>
                <div className="project-field">
                  <label className="project-field-label">Abstract URL</label>
                  <input
                    placeholder="Abstract URL"
                    value={form.abstractUrl}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, abstractUrl: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="project-form-grid">
                <div className="project-field">
                  <label className="project-field-label">Serial Number</label>
                  <input
                    type="number"
                    placeholder="Serial Number"
                    value={form.serialNo}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, serialNo: event.target.value }))
                    }
                  />
                </div>
                <div className="project-field">
                  <label className="project-field-label">Parent Admin User ID (optional)</label>
                  <input
                    placeholder="Parent Admin User ID (optional)"
                    value={form.parentAdminUserId}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, parentAdminUserId: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="project-form-row">
                <div className="project-field">
                  <label className="project-field-label">User Type</label>
                  <input
                    type="text"
                    placeholder="User Type"
                    value={form.userType}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, userType: event.target.value }))
                    }
                  />
                </div>

                <label className="status-toggle">
                  <input
                    type="checkbox"
                    checked={form.status}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, status: event.target.checked }))
                    }
                  />
                  Active Project
                </label>
              </div>

              <div className="project-form-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={submitting}>
                  {submitting ? "Saving..." : editProject ? "Update Project" : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
