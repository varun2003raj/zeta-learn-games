import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Topics.css";
import useLockBodyScroll from "../hooks/useLockBodyScroll";

const COURSE_API_BASE = "https://zetamind-hub-node-backend-1.onrender.com/api/course";
const COURSE_CATE_API_BASE = "https://zetamind-hub-node-backend-1.onrender.com/api/courseCate";

const normalizeCourseType = (course) => {
  const rawType = String(course?.courseType || "")
    .toLowerCase()
    .trim();

  if (rawType === "additional") return "additional";
  if (rawType === "primary") return "primary";

  // Treat unknown/legacy values as primary to avoid showing additional-only fields by mistake.
  return "primary";
};

function Topics() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTopic, setEditTopic] = useState(null);
  const [courseType, setCourseType] = useState("primary");
  const [detailInput, setDetailInput] = useState("");

  useLockBodyScroll(showModal);

  const [formData, setFormData] = useState({
    courseCateName: "",
    courseCateTitle: "",
    courseCateDescription: "",
    courseCateImgUrl: "",
    courseCateDetails: [],
    courseCatePDFUrl: "",
    startDate: "",
    endDate: "",
  });

  const fetchTopics = async () => {
    try {
      const res = await axios.get(
        `${COURSE_CATE_API_BASE}?courseId=${courseId}&limit=50`
      );
      setTopics(res.data?.data?.courseList || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setTopics([]);
    }
  };

  const fetchCourseType = async () => {
    try {
      // Primary lookup: fetch exact course by id (works for newly created courses).
      const singleCourseRes = await axios.get(`${COURSE_API_BASE}/${courseId}`);
      const courseData = Array.isArray(singleCourseRes.data?.data)
        ? singleCourseRes.data.data[0]
        : singleCourseRes.data?.data;

      if (!courseData) {
        setCourseType("primary");
        return;
      }

      const type = normalizeCourseType(courseData);
      setCourseType(type);
      return;
    } catch (err) {
      // Fallback for APIs that may not support /:id consistently.
      try {
        const fallbackRes = await axios.get(`${COURSE_API_BASE}?limit=200`);
        const fallbackCourse = (fallbackRes.data?.data?.courseList || []).find(
          (c) => c._id === courseId
        );
        setCourseType(normalizeCourseType(fallbackCourse));
      } catch (fallbackErr) {
        console.error("Error fetching course type:", fallbackErr);
        setCourseType("primary");
      }

      console.error("Course type by id failed:", err);
    }
  };

  useEffect(() => {
    if (!courseId) return;
    fetchTopics();
    fetchCourseType();
  }, [courseId]);

  const formatDateForInput = (date) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const openAdd = () => {
    setEditTopic(null);
    setDetailInput("");
    setFormData({
      courseCateName: "",
      courseCateTitle: "",
      courseCateDescription: "",
      courseCateImgUrl: "",
      courseCateDetails: [],
      courseCatePDFUrl: "",
      startDate: "",
      endDate: "",
    });
    setShowModal(true);
  };

  const openEdit = (topic) => {
    setEditTopic(topic);
    setDetailInput("");
    setFormData({
      courseCateName: topic.courseCateName || "",
      courseCateTitle: topic.courseCateTitle || "",
      courseCateDescription: topic.courseCateDescription || "",
      courseCateImgUrl: topic.courseCateImgUrl || "",
      courseCateDetails: topic.courseCateDetails || [],
      courseCatePDFUrl:
        courseType === "additional" ? topic.courseCatePDFUrl || "" : "",
      startDate: formatDateForInput(topic.startDate),
      endDate: formatDateForInput(topic.endDate),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Login required");
      return;
    }

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const payload = {
      ...formData,
      courseCatePDFUrl:
        courseType === "additional" ? formData.courseCatePDFUrl : "",
    };

    if (editTopic) {
      await axios.put(`${COURSE_CATE_API_BASE}/${editTopic._id}`, payload, config);
    } else {
      await axios.post(COURSE_CATE_API_BASE, { ...payload, courseId }, config);
    }

    setShowModal(false);
    fetchTopics();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this topic?")) return;

    const token = localStorage.getItem("token");

    await axios.delete(`${COURSE_CATE_API_BASE}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setTopics((prev) => prev.filter((t) => t._id !== id));
  };

  const removeDetail = (index) => {
    setFormData((prev) => ({
      ...prev,
      courseCateDetails: prev.courseCateDetails.filter((_, i) => i !== index),
    }));
  };

  const clearAllDetails = () => {
    setFormData((prev) => ({
      ...prev,
      courseCateDetails: [],
    }));
  };

  return (
    <div className="topics-page">
      <div className="topics-header">
        <h2>Course Topics</h2>
        <button className="add-btn" onClick={openAdd}>
          Add Topic
        </button>
      </div>

      <div className="topics-grid">
        {topics.map((topic) => (
          <div key={topic._id} className="topic-card">
            <img
              src={topic.courseCateImgUrl || "https://via.placeholder.com/300"}
              className="topic-img"
              alt=""
            />

            <div className="topic-body">
              <h3>{topic.courseCateName}</h3>
              <p>{topic.courseCateTitle}</p>

              <ul>
                {topic.courseCateDetails?.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>

              <div className="topic-footer">
                {courseType === "additional" ? (
                  <>
                    {topic.courseCatePDFUrl ? (
                      <button
                        className="view-btn"
                        onClick={() =>
                          navigate(
                            `/pdf-view/${encodeURIComponent(topic.courseCatePDFUrl)}`
                          )
                        }
                      >
                        View PDF
                      </button>
                    ) : (
                      <span>No PDF available</span>
                    )}
                  </>
                ) : (
                  <>
                    <span>{topic.courseCateDetails?.length || 0} Contents</span>
                    <button
                      className="view-btn"
                      onClick={() => navigate(`/contents/${topic._id}`)}
                    >
                      View Contents
                    </button>
                  </>
                )}
              </div>

              <div className="topic-actions">
                <button className="edit-btn" onClick={() => openEdit(topic)}>
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(topic._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-top">
              <h3>{editTopic ? "Edit Topic" : "Add Topic"}</h3>
              <button
                type="button"
                className="modal-close-btn"
                style={{ background: "#fff", color: "#10213a", border: "1px solid #d8e4f3" }}
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Topic Name</label>
                <input
                  placeholder="Topic Name"
                  value={formData.courseCateName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      courseCateName: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  placeholder="Title"
                  value={formData.courseCateTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      courseCateTitle: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Description"
                  value={formData.courseCateDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      courseCateDescription: e.target.value,
                    }))
                  }
                />
              </div>

              {courseType === "additional" && (
                <div className="form-group">
                  <label className="form-label">PDF URL</label>
                  <input
                    placeholder="PDF URL"
                    value={formData.courseCatePDFUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        courseCatePDFUrl: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  placeholder="Image URL"
                  value={formData.courseCateImgUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      courseCateImgUrl: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course Detail</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    placeholder="Course Detail"
                    value={detailInput}
                    onChange={(e) => setDetailInput(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (!detailInput.trim()) return;
                      setFormData((prev) => ({
                        ...prev,
                        courseCateDetails: [...prev.courseCateDetails, detailInput],
                      }));
                      setDetailInput("");
                    }}
                  >
                    Add
                  </button>

                  <button type="button" onClick={() => setDetailInput("")}>
                    Clear Input
                  </button>
                </div>
              </div>

              <ul>
                {formData.courseCateDetails.map((item, i) => (
                  <li key={i}>
                    {item}
                    <button
                      type="button"
                      onClick={() => removeDetail(i)}
                      style={{ marginLeft: "8px", color: "red" }}
                    >
                      X
                    </button>
                  </li>
                ))}
              </ul>

              {formData.courseCateDetails.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllDetails}
                  style={{
                    background: "red",
                    color: "#fff",
                    marginTop: "10px",
                  }}
                >
                  Clear All Bullets
                </button>
              )}

              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Topics;
