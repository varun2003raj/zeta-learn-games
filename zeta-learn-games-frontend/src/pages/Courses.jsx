import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useLockBodyScroll from "../hooks/useLockBodyScroll";

const USER_ID = "68ea5e801d1b8cb9ce265cf2&limit=50";
const API_URL = "https://zetamind-hub-node-backend-1.onrender.com/api/course";

function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    courseName: "",
    courseTitle: "",
    courseDescription: "",
    courseImgUrl: "",
    courseLogo: "",
    duration: "",
    days: "",
    fee: "",
    cousesType: "",
    classType: "",
    courseType: "primary",
    isRecommended: false,
    courseDetails: [],
    tags: [],
  });

  // Edit state
  const [editingCourse, setEditingCourse] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useLockBodyScroll(showModal || showEditModal);

  // 🔹 Fetch courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}?userId=${USER_ID}`);
      const courseList = res.data?.data?.courseList || [];
      setCourses(courseList);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // 🔹 Filter courses based on search
  const filteredCourses = useMemo(
    () =>
      courses.filter((c) =>
        c.courseName?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [courses, searchQuery]
  );

  // 🔹 Add course
  const handleAddCourse = async () => {
    if (
      !newCourse.courseName ||
      !newCourse.courseDescription ||
      !newCourse.cousesType ||
      !newCourse.classType
    ) {
      alert("Please fill all required fields");
      return;
    }

    const payload = {
      userId: USER_ID,
      courseName: newCourse.courseName,
      courseTitle: newCourse.courseTitle || newCourse.courseName,
      courseDescription: newCourse.courseDescription,
      courseImgUrl:
        newCourse.courseImgUrl || "https://via.placeholder.com/400x200",
      courseLogo: newCourse.courseLogo || "https://via.placeholder.com/100",
      duration: newCourse.duration || "0 hours",
      days: newCourse.days || 0,
      fee: newCourse.fee || 0,
      cousesType: newCourse.cousesType,
      classType: newCourse.classType,
      courseType: newCourse.courseType,
      isRecommended: newCourse.isRecommended,
      courseDetails: newCourse.courseDetails.length
        ? newCourse.courseDetails
        : [newCourse.courseName],
      tags: newCourse.tags.length ? newCourse.tags : [],
      status: true,
      courseCode: Math.floor(Math.random() * 1000),
    };

    try {
      const res = await axios.post(API_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      // ✅ Immediately update UI with new course
      const addedCourse = res.data?.data || payload;
      setCourses((prev) => [...prev, addedCourse]);

      // Close modal and reset form
      setShowModal(false);
      setNewCourse({
        courseName: "",
        courseTitle: "",
        courseDescription: "",
        courseImgUrl: "",
        courseLogo: "",
        duration: "",
        days: "",
        fee: "",
        cousesType: "",
        classType: "",
        courseDetails: [],
        tags: [],
      });
    } catch (err) {
      console.error("Error adding course:", err.response || err);
      alert("Failed to add course");
    }
  };

  // 🔹 Delete course
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      setCourses(courses.filter((course) => course._id !== id));
    } catch (err) {
      console.error("Failed to delete course:", err);
      alert("Failed to delete course");
    }
  };

  // 🔹 Open edit modal
  const handleEditClick = (course) => {
    setEditingCourse(course);
    setShowEditModal(true);
  };

  // 🔹 Update course
  const handleUpdateCourse = async () => {
    if (!editingCourse.courseName || !editingCourse.courseDescription) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const res = await axios.put(
        `${API_URL}/${editingCourse._id}`,
        editingCourse,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // Update UI
      setCourses((prev) =>
        prev.map((c) => (c._id === editingCourse._id ? res.data.data : c))
      );

      setShowEditModal(false);
      setEditingCourse(null);
    } catch (err) {
      console.error("Failed to update course:", err);
      alert("Failed to update course");
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "15px", fontSize: "16px", color: "#555" }}>
          Loading...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}

      <div style={styles.header}>
        <h1 style={styles.heading}>Courses</h1>
        <div style={styles.topActions}>
          <label style={styles.searchFieldWrap}>
            <span style={styles.searchFieldLabel}>Search Courses</span>
            <input
              style={styles.search}
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <button style={styles.addBtn} onClick={() => setShowModal(true)}>
            + Add Course
          </button>
        </div>
      </div>

      {/* COURSE CARDS */}
      <div style={styles.grid}>
        {filteredCourses.length ? (
          filteredCourses.map((course) => (
            <div key={course._id} style={styles.card}>
              <img
                src={
                  course.courseImgUrl || "https://via.placeholder.com/400x200"
                }
                alt={course.courseName}
                style={styles.image}
              />
              <div style={styles.cardBody}>
                <div style={styles.Head}>
                  <img
                    style={styles.logo}
                    src={course.courseLogo}
                    alt={course.courseName}
                  />
                  <h3 style={styles.title}>{course.courseName}</h3>
                </div>
                <p style={styles.desc}>
                  {course.courseDescription?.slice(0, 90)}...
                </p>
                <p
                  style={{ fontSize: "12px", marginTop: "5px", color: "#555" }}
                >
                  <b>Duration:</b> {course.duration} | <b>Days:</b>{" "}
                  {course.days} | <b>Class:</b> {course.classType} |{" "}
                  <b>Type:</b> {course.cousesType}
                </p>
                <p
                  style={{ fontSize: "12px", marginTop: "5px", color: "#777" }}
                >
                  <b>Tags:</b> {course.tags?.join(", ")}
                </p>
                <p
                  style={{ fontSize: "12px", marginTop: "5px", color: "#777" }}
                >
                  <b>CourseType: </b>
                  {course.courseType}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: course.isRecommended ? "#16a34a" : "#6b7280",
                  }}
                >
                  {course.isRecommended
                    ? "⭐ Recommended Course"
                    : "Regular Course"}
                </p>
              </div>
              <div style={styles.cardFooter}>
                <p style={styles.price}>₹ {course.fee}</p>
                <button
                  style={styles.viewBtn}
                  onClick={() => navigate(`/course/${course._id}`)}
                >
                  View
                </button>
                <button
                  style={styles.editBtn}
                  onClick={() => handleEditClick(course)}
                >
                  Edit
                </button>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDelete(course._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No courses found</p>
        )}
      </div>

      {/* ADD COURSE MODAL */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTopRow}>
              <h2 style={{ margin: 0 }}>Add Course</h2>
              <button
                type="button"
                style={styles.modalCloseBtn}
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                X
              </button>
            </div>
            <label style={styles.modalLabel}>Course Name</label>
            <input
              style={styles.modalInput}
              placeholder="Course Name"
              value={newCourse.courseName}
              onChange={(e) =>
                setNewCourse({ ...newCourse, courseName: e.target.value })
              }
            />
            <label style={styles.modalLabel}>Course Title</label>
            <input
              style={styles.modalInput}
              placeholder="Course Title"
              value={newCourse.courseTitle}
              onChange={(e) =>
                setNewCourse({ ...newCourse, courseTitle: e.target.value })
              }
            />
            <label style={styles.modalLabel}>Course Description</label>
            <textarea
              style={styles.modalTextarea}
              placeholder="Course Description"
              value={newCourse.courseDescription}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  courseDescription: e.target.value,
                })
              }
            />
            <label style={styles.modalLabel}>Image URL</label>
            <input
              style={styles.modalInput}
              placeholder="Image URL"
              value={newCourse.courseImgUrl}
              onChange={(e) =>
                setNewCourse({ ...newCourse, courseImgUrl: e.target.value })
              }
            />
            <label style={styles.modalLabel}>Logo URL</label>
            <input
              style={styles.modalInput}
              placeholder="Logo URL"
              value={newCourse.courseLogo}
              onChange={(e) =>
                setNewCourse({ ...newCourse, courseLogo: e.target.value })
              }
            />
            <label style={styles.modalLabel}>Duration</label>
            <input
              style={styles.modalInput}
              placeholder="Duration"
              value={newCourse.duration}
              onChange={(e) =>
                setNewCourse({ ...newCourse, duration: e.target.value })
              }
            />
            <label style={styles.modalLabel}>Days</label>
            <input
              style={styles.modalInput}
              placeholder="Days"
              type="number"
              value={newCourse.days}
              onChange={(e) =>
                setNewCourse({ ...newCourse, days: e.target.value })
              }
            />
            <label style={styles.modalLabel}>Fee</label>
            <input
              style={styles.modalInput}
              placeholder="Fee"
              type="number"
              value={newCourse.fee}
              onChange={(e) =>
                setNewCourse({ ...newCourse, fee: e.target.value })
              }
            />
            <label style={styles.modalLabel}>Course Category</label>
            <select
              style={styles.modalInput}
              value={newCourse.cousesType}
              onChange={(e) =>
                setNewCourse({ ...newCourse, cousesType: e.target.value })
              }
            >
              <option value="">Select Course Type</option>
              <option value="fullstack">Fullstack</option>
              <option value="frontend">Frontend</option>
              <option value="mobileapp">Mobile App</option>
              <option value="webapp">Web App</option>
              <option value="backend">Backend</option>
              <option value="webdesign">Web Design</option>
            </select>
            <label style={styles.modalLabel}>Class Type</label>
            <select
              style={styles.modalInput}
              value={newCourse.classType}
              onChange={(e) =>
                setNewCourse({ ...newCourse, classType: e.target.value })
              }
            >
              <option value="">Select Class Type</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <label style={styles.modalLabel}>Course Flow Type</label>
            <select
              style={styles.modalInput}
              value={newCourse.courseType}
              onChange={(e) =>
                setNewCourse({ ...newCourse, courseType: e.target.value })
              }
            >
              <option value="primary">Primary Course</option>
              <option value="additional">Additional Course</option>
            </select>

            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "14px", fontWeight: "600" }}>
                Recommended Course
              </p>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={newCourse.isRecommended}
                  onChange={() =>
                    setNewCourse({
                      ...newCourse,
                      isRecommended: !newCourse.isRecommended,
                    })
                  }
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "#0ea5a0",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "13px" }}>
                  {newCourse.isRecommended ? "Recommended" : "Not Recommended"}
                </span>
              </label>
            </div>

            <label style={styles.modalLabel}>Tags (comma separated)</label>
            <input
              style={styles.modalInput}
              placeholder="Tags (comma separated)"
              value={newCourse.tags.join(",")}
              onChange={(e) =>
                setNewCourse({ ...newCourse, tags: e.target.value.split(",") })
              }
            />
            <label style={styles.modalLabel}>Course Details (comma separated)</label>
            <input
              style={styles.modalInput}
              placeholder="Course Details (comma separated)"
              value={newCourse.courseDetails.join(",")}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  courseDetails: e.target.value.split(","),
                })
              }
            />
            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleAddCourse}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT COURSE MODAL */}
      {showEditModal && editingCourse && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTopRow}>
              <h2 style={{ margin: 0 }}>Edit Course</h2>
              <button
                type="button"
                style={styles.modalCloseBtn}
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
              >
                X
              </button>
            </div>
            <label style={styles.modalLabel}>Course Name</label>
            <input
              style={styles.modalInput}
              placeholder="Course Name"
              value={editingCourse.courseName}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  courseName: e.target.value,
                })
              }
            />
            <label style={styles.modalLabel}>Course Title</label>
            <input
              style={styles.modalInput}
              placeholder="Course Title"
              value={editingCourse.courseTitle}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  courseTitle: e.target.value,
                })
              }
            />
            <label style={styles.modalLabel}>Course Description</label>
            <textarea
              style={styles.modalTextarea}
              placeholder="Course Description"
              value={editingCourse.courseDescription}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  courseDescription: e.target.value,
                })
              }
            />
            <label style={styles.modalLabel}>Image URL</label>
            <input
              style={styles.modalInput}
              placeholder="Image URL"
              value={editingCourse.courseImgUrl}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  courseImgUrl: e.target.value,
                })
              }
            />
            <label style={styles.modalLabel}>Logo URL</label>
            <input
              style={styles.modalInput}
              placeholder="Logo URL"
              value={editingCourse.courseLogo}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  courseLogo: e.target.value,
                })
              }
            />
            <label style={styles.modalLabel}>Duration</label>
            <input
              style={styles.modalInput}
              placeholder="Duration"
              value={editingCourse.duration}
              onChange={(e) =>
                setEditingCourse({ ...editingCourse, duration: e.target.value })
              }
            />
            <label style={styles.modalLabel}>Days</label>
            <input
              style={styles.modalInput}
              placeholder="Days"
              type="number"
              value={editingCourse.days}
              onChange={(e) =>
                setEditingCourse({ ...editingCourse, days: e.target.value })
              }
            />
            <label style={styles.modalLabel}>Fee</label>
            <input
              style={styles.modalInput}
              placeholder="Fee"
              type="number"
              value={editingCourse.fee}
              onChange={(e) =>
                setEditingCourse({ ...editingCourse, fee: e.target.value })
              }
            />
            <label style={styles.modalLabel}>Course Category</label>
            <select
              style={styles.modalInput}
              value={editingCourse.cousesType}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  cousesType: e.target.value,
                })
              }
            >
              <option value="">Select Course Type</option>
              <option value="fullstack">Fullstack</option>
              <option value="frontend">Frontend</option>
              <option value="mobileapp">Mobile App</option>
              <option value="webapp">Web App</option>
              <option value="backend">Backend</option>
              <option value="webdesign">Web Design</option>
            </select>
            <label style={styles.modalLabel}>Course Flow Type</label>
            <select
              style={styles.modalInput}
              value={editingCourse.courseType}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  courseType: e.target.value,
                })
              }
            >
              <option value="primary">Primary Course</option>
              <option value="additional">Additional Course</option>
            </select>
            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "14px", fontWeight: "600" }}>
                Recommended Course
              </p>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={editingCourse.isRecommended}
                  onChange={() =>
                    setEditingCourse({
                      ...editingCourse,
                      isRecommended: !editingCourse.isRecommended,
                    })
                  }
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "#0ea5a0",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: "13px" }}>
                  {editingCourse.isRecommended
                    ? "Recommended"
                    : "Not Recommended"}
                </span>
              </label>
            </div>

            <label style={styles.modalLabel}>Class Type</label>
            <select
              style={styles.modalInput}
              value={editingCourse.classType}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  classType: e.target.value,
                })
              }
            >
              <option value="">Select Class Type</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <label style={styles.modalLabel}>Tags (comma separated)</label>
            <input
              style={styles.modalInput}
              placeholder="Tags (comma separated)"
              value={editingCourse.tags.join(",")}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  tags: e.target.value.split(","),
                })
              }
            />
            <label style={styles.modalLabel}>Course Details (comma separated)</label>
            <input
              style={styles.modalInput}
              placeholder="Course Details (comma separated)"
              value={editingCourse.courseDetails.join(",")}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  courseDetails: e.target.value.split(","),
                })
              }
            />
            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleUpdateCourse}>
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  Head: { display: "flex", flexDirection: "row", gap: "10px" },
  logo: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid #d8e4f3",
    objectFit: "cover",
  },
  page: {
    padding: "30px",
    background: "transparent",
    minHeight: "100vh",
    fontFamily: "\"Sora\", \"Trebuchet MS\", \"Segoe UI\", sans-serif",
  },
  header: { marginBottom: "25px" },
  heading: { fontSize: "30px", fontWeight: "800", marginBottom: "15px", color: "#10213a" },
  topActions: { display: "flex", gap: "15px", alignItems: "center" },
  searchFieldWrap: { display: "flex", flexDirection: "column", gap: "6px" },
  searchFieldLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#3c4f6c",
  },
  search: {
    padding: "10px 15px",
    borderRadius: "10px",
    border: "1px solid #d8e4f3",
    background: "#ffffff",
    color: "#10213a",
    width: "260px",
  },
  addBtn: {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg,#0ea5a0,#0284c7)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
    gap: "22px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #d8e4f3",
    boxShadow: "0 14px 30px rgba(80,108,150,0.15)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  image: { width: "100%", height: "160px", objectFit: "cover" },
  cardBody: { padding: "15px", flexGrow: 1 },
  title: { fontSize: "18px", fontWeight: "700", marginTop: "10px", color: "#10213a" },
  desc: { fontSize: "14px", color: "#3c4f6c" },
  cardFooter: { padding: "15px", borderTop: "1px solid #d8e4f3" },
  price: { fontWeight: "800", marginBottom: "10px", color: "#0f766e" },
  viewBtn: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg,#0ea5a0,#0284c7)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  editBtn: {
    margin: "10px 0 0 0",
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  loading: {
    textAlign: "center",
    marginTop: "100px",
    fontSize: "22px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #0ea5a0",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(13,23,39,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(4px)",
    zIndex: 1000,
  },
  modal: {
    background: "linear-gradient(160deg,#ffffff,#f7fbff)",
    border: "1px solid #d8e4f3",
    padding: "32px",
    borderRadius: "18px",
    width: "900px",
    maxHeight: "95vh",
    overflowY: "auto",
    boxShadow: "0 14px 30px rgba(80,108,150,0.15)",
  },
  modalTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  modalCloseBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    border: "1px solid #d8e4f3",
    background: "#fff",
    color: "#10213a",
    fontWeight: "700",
    cursor: "pointer",
  },
  modalLabel: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#3c4f6c",
  },
  modalInput: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: "14px",
    borderRadius: "10px",
    border: "1px solid #d8e4f3",
    background: "#fff",
    color: "#10213a",
    fontSize: "14px",
    outline: "none",
  },
  modalTextarea: {
    width: "100%",
    height: "110px",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d8e4f3",
    background: "#fff",
    color: "#10213a",
    fontSize: "14px",
    marginBottom: "16px",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "10px",
  },
  cancelBtn: {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "1px solid #d8e4f3",
    background: "#edf4ff",
    fontWeight: "700",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "10px 22px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg,#0ea5a0,#0284c7)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  deleteButton: {
    margin: "10px 0 0 0",
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default Dashboard;


