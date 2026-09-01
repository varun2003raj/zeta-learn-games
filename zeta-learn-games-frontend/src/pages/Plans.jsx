import { useEffect, useState } from "react";
import axios from "axios";
import "./Plans.css";
import useLockBodyScroll from "../hooks/useLockBodyScroll";

const API = "https://zetamind-hub-node-backend-1.onrender.com/api/plans";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [detailInput, setDetailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    price: "",
    durationInDays: "",
    durationType: "",
    planDetails: [],
  });

  useLockBodyScroll(showModal);

  /* FETCH */
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setPlans(res.data.data.PlanList || []);
    } catch (err) {
      console.error("Error fetching plans:", err);
      alert("Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  /* OPEN ADD */
  const openAdd = () => {
    setEditPlan(null);
    setForm({
      name: "",
      description: "",
      image: "",
      price: "",
      durationInDays: "",
      durationType: "",
      planDetails: [],
    });
    setShowModal(true);
  };

  /* OPEN EDIT */
  const openEdit = (p) => {
    setEditPlan(p);
    setForm({
      name: p.name,
      description: p.description,
      image: p.image || "",
      price: p.price,
      durationInDays: p.durationInDays,
      durationType: p.durationType,
      planDetails: p.planDetails || [],
    });
    setShowModal(true);
  };

  /* SAVE */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Plan Name is required");
      return;
    }
    if (!form.durationType) {
      alert("Please select a duration type");
      return;
    }

    setSubmitLoading(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        durationInDays: Number(form.durationInDays) || 0,
        planDetails: form.planDetails.length
          ? form.planDetails
          : ["No Feature"],
      };

      if (editPlan) {
        await axios.put(`${API}/${editPlan._id}`, payload);
      } else {
        await axios.post(API, payload);
      }

      setShowModal(false);
      fetchPlans();
    } catch (err) {
      console.error("Error creating plan:", err.response?.data || err);
      alert("Failed to create plan. Check console for details.");
    } finally {
      setSubmitLoading(false);
    }
  };

  /* DELETE */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    await axios.delete(`${API}/${id}`);
    setPlans((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="plans-page">
      <div className="plans-header">
        <h2>Subscription Plans</h2>
        <button onClick={openAdd}>➕ Add Plan</button>
      </div>
      {loading ? (
        <div className="loading">Loading plans...</div>
      ) : (
        <div className="plans-grid">
          {plans.map((p) => (
            <div key={p._id} className="plan-card"></div>
          ))}
        </div>
      )}

      <div className="plans-grid">
        {plans.map((p) => (
          <div key={p._id} className="plan-card">
            {p.image && <img src={p.image} className="plan-img" alt="" />}

            <h3>{p.name}</h3>
            <p>{p.description}</p>

            <div className="price">₹{p.price}</div>
            <span>
              {p.durationInDays} Days • {p.durationType}
            </span>

            <ul>
              {p.planDetails?.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>

            <div className="actions">
              <button onClick={() => openEdit(p)}>Edit</button>
              <button onClick={() => handleDelete(p._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modalss-bg">
          <div className="modalss">
            <div className="modalss-top">
              <h3>{editPlan ? "Edit Plan" : "Add Plan"}</h3>
              <button
                type="button"
                className="modalss-close-btn"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="field-label">Plan Name</label>
              <input
                placeholder="Plan Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
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
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />

              <label className="field-label">Price</label>
              <input
                type="number"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />

              <label className="field-label">Duration (Days)</label>
              <input
                type="number"
                placeholder="Duration (Days)"
                value={form.durationInDays}
                onChange={(e) =>
                  setForm({ ...form, durationInDays: e.target.value })
                }
              />

              <label className="field-label">Level</label>
              <select
                className="select-color"
                value={form.durationType}
                onChange={(e) =>
                  setForm({ ...form, durationType: e.target.value })
                }
              >
                <option value="">Select Level</option>
                <option value="Basics">Basics</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <label className="field-label">Plan Feature</label>
              <div className="detail-row">
                <input
                  placeholder="Plan Feature"
                  value={detailInput}
                  onChange={(e) => setDetailInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!detailInput.trim()) return;
                    setForm({
                      ...form,
                      planDetails: [...form.planDetails, detailInput],
                    });
                    setDetailInput("");
                  }}
                >
                  Add
                </button>
              </div>

              <ul>
                {form.planDetails.map((d, i) => (
                  <li key={i}>
                    {d}{" "}
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          planDetails: form.planDetails.filter(
                            (item, index) => index !== i
                          ),
                        })
                      }
                    >
                      ❌
                    </button>
                  </li>
                ))}
              </ul>

              <div className="modalss-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowModal(false)}>
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
