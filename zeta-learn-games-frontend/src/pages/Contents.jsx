import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Contents.css";
import useLockBodyScroll from "../hooks/useLockBodyScroll";

const API_BASE = "https://zeta-learn-games.onrender.com/api/content";
const API_LIST = `${API_BASE}?limit=100`;

export default function Contents() {
  const { courseCateId } = useParams();

  const [contents, setContents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailInput, setDetailInput] = useState("");
  const [fullscreenContent, setFullscreenContent] = useState("");
  const [summaryInput, setSummaryInput] = useState("");

  const [form, setForm] = useState({
    contentName: "",
    contentTitle: "",
    summaryDetails: [],
    contentLogo: "",
    contentDescription: "",
    contentImgUrl: "",
    contentBlogUrl: "",
    contentVideoUrl: "",
    contentExample: "",
    exampleOutput: "",
    contentDetails: [],
  
  });

  useLockBodyScroll(showModal || Boolean(fullscreenContent));

  useEffect(() => {
    fetchContents();
  }, [courseCateId]);

  const fetchContents = async () => {
    try {
      const res = await axios.get(`${API_LIST}&courseCateId=${courseCateId}`);

      const normalized = (res.data.data.contentList || []).map((item) => ({
        ...item,
        contentSummary: Array.isArray(item.contentSummary)
          ? item.contentSummary.join("\n")
          : item.contentSummary || item.summary || "",
      }));

      setContents(normalized);
    } catch (err) {
      console.error("Error fetching contents:", err);
    }
  };

  const openAdd = () => {
    setEditItem(null);
    setDetailInput("");
    setSummaryInput("");
    setForm({
      contentName: "",
      contentTitle: "",
      summaryDetails: [],
      contentLogo: "",
      contentDescription: "",
      contentImgUrl: "",
      contentBlogUrl: "",
      contentVideoUrl: "",
      contentExample: "",
      exampleOutput: "",
      contentDetails: [],
    });
    setShowModal(true);
  };

  /* ✅ SUMMARY READ FIX */
  const openEdit = (item) => {
    setEditItem(item);
    setDetailInput("");
    setSummaryInput("");
    setForm({
      contentName: item.contentName || "",
      contentTitle: item.contentTitle || "",
      summaryDetails: item.summaryDetails || item.contentSummary || [],
      contentLogo: item.contentLogo || "",
      contentDescription: item.contentDescription || "",
      contentImgUrl: item.contentImgUrl || "",
      contentBlogUrl: item.contentBlogUrl || "",
      contentVideoUrl: item.contentVideoUrl || "",
      contentExample: item.contentExample || "",
      exampleOutput: item.exampleOutput || "",
      contentDetails: item.contentDetails || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      contentSummary: form.contentSummary || "",
    };

    try {
      if (editItem) {
        await axios.put(`${API_BASE}/${editItem._id}`, payload);
      } else {
        await axios.post(API_BASE, { ...payload, courseCateId });
      }
      fetchContents();
      setShowModal(false);
    } catch (err) {
      console.error("Error saving content:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this content?")) return;
    try {
      await axios.delete(`${API_BASE}/${id}`);
      setContents((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Error deleting content:", err);
    }
  };

  const removeDetail = (index) => {
    setForm({
      ...form,
      contentDetails: form.contentDetails.filter((_, i) => i !== index),
    });
  };

  const clearAllDetails = () => {
    setForm({ ...form, contentDetails: [] });
  };

  return (
    <div className="contents-page">
      <div className="contents-header">
        <h2>Contents</h2>
        <button className="add-btn" onClick={openAdd}>
          ➕ Add Content
        </button>
      </div>

      <div className="contents-grid">
        {contents.map((item) => (
          <div key={item._id} className="content-card">
            <img className="content-card-img"
              src={item.contentImgUrl || "https://via.placeholder.com/300"}
              alt={item.contentName || "Content Image"}
            />

            

            <div className="card-body">
             <div className="content-head">
               
              {item.contentLogo && (
              <img className="content-logo" src={item.contentLogo} alt="Logo" />
            )}
            <h3>{item.contentName}</h3>
             </div>
              {item.contentSummary && (
                <p className="summary">
                  {item.contentSummary.split("\n").map((s, i) => (
                    <span key={i}>
                      • {s}
                      <br />
                    </span>
                  ))}
                </p>
              )}

              <p className="title">{item.contentTitle}</p>
              <p>{item.contentDescription}</p>
              {item.summaryDetails?.length > 0 && (
                <p className="summary">
                  {item.summaryDetails.map((s, i) => (
                    <span key={i}>
                      • {s}
                      <br />
                    </span>
                  ))}
                </p>
              )}
              <ul>
                {item.contentDetails?.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>

              {item.contentExample && (
                <div className="example-container">
                  <button
                    className="view-code"
                    onClick={() => setFullscreenContent(item.contentExample)}
                  >
                    View Code
                  </button>
                  <pre className="code-box">{item.contentExample}</pre>
                </div>
              )}

              {item.exampleOutput && (
                <div className="output-container">
                  <button
                    className="view-code"
                    onClick={() => setFullscreenContent(item.exampleOutput)}
                  >
                    View Output
                  </button>
                  <pre className="output-box">{item.exampleOutput}</pre>
                </div>
              )}

              <div className="actions">
                <button className="edit-button" onClick={() => openEdit(item)}>
                  ✏️ Edit
                </button>
                <button
                  className="dlt-button"
                  onClick={() => handleDelete(item._id)}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-top-row">
              <h2>{editItem ? "Edit Content" : "Add Content"}</h2>
              <button
                type="button"
                className="close-modal"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="field-label">Content Name</label>
              <input
                placeholder="Content Name"
                value={form.contentName}
                onChange={(e) =>
                  setForm({ ...form, contentName: e.target.value })
                }
                required
              />
              <label className="field-label">Title</label>
              <input
                placeholder="Title"
                value={form.contentTitle}
                onChange={(e) =>
                  setForm({ ...form, contentTitle: e.target.value })
                }
              />

              <label className="field-label">Summary</label>
              <div className="bullet-input">
                <input
                  placeholder="Summary"
                  value={summaryInput}
                  onChange={(e) => setSummaryInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!summaryInput.trim()) return;

                    setForm({
                      ...form,
                      summaryDetails: [...form.summaryDetails, summaryInput],
                    });

                    setSummaryInput("");
                  }}
                >
                  Add
                </button>
              </div>

              {form.summaryDetails.length > 0 && (
                <ul className="bullet-preview">
                  {form.summaryDetails.map((s, i) => (
                    <li key={i}>
                      {s}
                      <button
                        type="button"
                        onClick={() => {
                          setForm({
                            ...form,
                            summaryDetails: form.summaryDetails.filter(
                              (_, idx) => idx !== i
                            ),
                          });
                        }}
                      >
                        ❌
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <label className="field-label">Logo URL</label>
              <input
                placeholder="Logo URL"
                value={form.contentLogo}
                onChange={(e) =>
                  setForm({ ...form, contentLogo: e.target.value })
                }
              />
              <label className="field-label">Description</label>
              <textarea
                placeholder="Description"
                value={form.contentDescription}
                onChange={(e) =>
                  setForm({ ...form, contentDescription: e.target.value })
                }
              />
              <label className="field-label">Image URL</label>
              <input
                placeholder="Image URL"
                value={form.contentImgUrl}
                onChange={(e) =>
                  setForm({ ...form, contentImgUrl: e.target.value })
                }
              />
              <label className="field-label">Blog URL</label>
              <input
                placeholder="Blog URL"
                value={form.contentBlogUrl}
                onChange={(e) =>
                  setForm({ ...form, contentBlogUrl: e.target.value })
                }
              />
              <label className="field-label">YouTube Video URL</label>
              <input
                placeholder="YouTube Video URL"
                value={form.contentVideoUrl}
                onChange={(e) =>
                  setForm({ ...form, contentVideoUrl: e.target.value })
                }
              />

              <label className="field-label">Content Detail</label>
              <div className="bullet-input">
                <input
                  placeholder="Content Detail"
                  value={detailInput}
                  onChange={(e) => setDetailInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!detailInput.trim()) return;
                    setForm({
                      ...form,
                      contentDetails: [...form.contentDetails, detailInput],
                    });
                    setDetailInput("");
                  }}
                >
                  Add
                </button>
              </div>

              <ul className="bullet-preview">
                {form.contentDetails.map((d, i) => (
                  <li key={i}>
                    {d}{" "}
                    <button type="button" onClick={() => removeDetail(i)}>
                      ❌
                    </button>
                  </li>
                ))}
              </ul>

              {form.contentDetails.length > 0 && (
                <button
                  type="button"
                  className="clear-all"
                  onClick={clearAllDetails}
                >
                  Clear All
                </button>
              )}

              <label className="field-label">Example Code</label>
              <textarea
                placeholder="Example Code"
                value={form.contentExample}
                onChange={(e) =>
                  setForm({ ...form, contentExample: e.target.value })
                }
              />
              <label className="field-label">Example Output</label>
              <textarea
                placeholder="Example Output"
                value={form.exampleOutput}
                onChange={(e) =>
                  setForm({ ...form, exampleOutput: e.target.value })
                }
              />

              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {fullscreenContent && (
        <div className="sidepanel-overlay">
          <div className="sidepanel">
            <button
              className="close-sidepanel"
              onClick={() => setFullscreenContent("")}
            >
              ✕
            </button>
            <pre>{fullscreenContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

