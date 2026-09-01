import { useEffect, useState } from "react";
import axios from "axios";
import "./Banners.css";
import useLockBodyScroll from "../hooks/useLockBodyScroll";

const API =
  "https://zetamind-hub-node-backend-1.onrender.com/api/banner";

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  useLockBodyScroll(open);

  const [form, setForm] = useState({
    name: "",
    title: "",
    description: "",
    imageUrl: "",
    redirectUrl: "",
    userType: "students",
    productType: "courses",
    bannerType: "",
    viewType:"",
  });

  const buildBannerPayload = () => {
    return {
      name: form.name.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      redirectUrl: form.redirectUrl.trim(),
      userType: (form.userType || "students").trim(),
      productType: (form.productType || "courses").trim(),
      bannerType: form.bannerType,
      viewType: form.viewType.trim(),
      status: true,
    };
  };

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  /* FETCH */
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setBanners(res.data.data?.data || []);
    } catch (e) {
      console.error(e);
      alert("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  /* OPEN CREATE */
  const openCreate = () => {
    setEditId(null);
    setForm({
      name: "",
      title: "",
      description: "",
      imageUrl: "",
      redirectUrl: "",
      userType: "students",
      productType: "courses",
      bannerType: "",
      viewType:"",
    });
    setOpen(true);
  };

  /* OPEN EDIT */
  const openEdit = (b) => {
    setEditId(b._id);
    setForm({
      name: b.name || "",
      title: b.title || "",
      description: b.description || "",
      imageUrl: b.imageUrl || "",
      redirectUrl: b.redirectUrl || "",
      userType: b.userType || "students",
      productType: b.productType || "courses",
      bannerType: b.bannerType || "",
      viewType: b.viewType || "",
    });
    setOpen(true);
  };

  /* SAVE */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.bannerType) {
      alert("Name & Banner Type required");
      return;
    }

    const authConfig = getAuthConfig();

    if (!authConfig) {
      alert("Login required");
      return;
    }

    try {
      const payload = buildBannerPayload();
      if (editId) {
        await axios.put(`${API}/${editId}`, payload, authConfig);
      } else {
        await axios.post(API, payload, authConfig);
      }
      setOpen(false);
      fetchBanners();
    } catch (e) {
      const errorMessage =
        e.response?.data?.data ||
        e.response?.data?.message ||
        "Save failed";
      console.error(e.response?.data || e);
      alert(errorMessage);
    }
  };

  /* DELETE */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete banner?")) return;
    const authConfig = getAuthConfig();
    if (!authConfig) {
      alert("Login required");
      return;
    }

    try {
      await axios.delete(`${API}/${id}`, authConfig);
      setBanners((p) => p.filter((b) => b._id !== id));
    } catch (e) {
      const errorMessage =
        e.response?.data?.data ||
        e.response?.data?.message ||
        "Delete failed";
      console.error(e.response?.data || e);
      alert(errorMessage);
    }
  };

  return (
    <div className="banner-page">
      <div className="banner-header">
        <h2>Banner Management</h2>
        <button onClick={openCreate}>➕ Create Banner</button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="banner-grid">
          {banners.map((b) => (
            <div key={b._id} className="banner-card">
              <img src={b.imageUrl} alt="" />
              <p><b>Title : </b>{b.title}</p>
              <p><b>Description : </b>{b.description}</p>
              <p><b>User Type : </b>{b.userType}</p>
              <p><b>Product Type : </b>{b.productType}</p>
              <p><b>Viewtype : </b>{b.viewType}</p>
              <span className="tag"><b>BannerType : </b>{b.bannerType}</span>

              <div className="card-actions">
                <button onClick={() => openEdit(b)}>Edit</button>
                <button onClick={() => handleDelete(b._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIALOG */}
      {open && (
        <div className="dialog-backdrop">
          <div className="dialog-box">
            <div className="dialog-top">
              <h3>{editId ? "Edit Banner" : "Create Banner"}</h3>
              <button
                type="button"
                className="dialog-close-btn"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="field-label">Name</label>
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <label className="field-label">Title</label>
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
              />

              <label className="field-label">Description</label>
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <label className="field-label">Image URL</label>
              <input
                placeholder="Image URL"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm({ ...form, imageUrl: e.target.value })
                }
              />

              <label className="field-label">Redirect URL</label>
              <input
                placeholder="Redirect URL"
                value={form.redirectUrl}
                onChange={(e) =>
                  setForm({ ...form, redirectUrl: e.target.value })
                }
              />

              <label className="field-label">User Type</label>
              <input
                placeholder="User Type"
                value={form.userType}
                onChange={(e) =>
                  setForm({ ...form, userType: e.target.value })
                }
              />
              <label className="field-label">View Type</label>
              <input
                placeholder="View Type"
                value={form.viewType}
                onChange={(e) =>
                  setForm({ ...form, viewType: e.target.value })
                }
              />

              <label className="field-label">Product Type</label>
              <input
                placeholder="Product Type"
                value={form.productType}
                onChange={(e) =>
                  setForm({ ...form, productType: e.target.value })
                }
              />

              <label className="field-label">Banner Type</label>
              <select
                value={form.bannerType}
                onChange={(e) =>
                  setForm({ ...form, bannerType: e.target.value })
                }
              >
                <option value="">Banner Type</option>
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
              </select>

              <div className="dialog-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setOpen(false)}>
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

