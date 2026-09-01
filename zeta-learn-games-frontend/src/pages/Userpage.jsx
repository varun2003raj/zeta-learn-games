import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import CreateUser from "./Createuser";
import "./Userpage.css";

const USERS_API = "https://zetamind-hub-node-backend.onrender.com/api/authUser";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");


  const limit = 5;
  const [offset, setOffset] = useState(0);
  const isFetching = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const getUserTypeParam = (filter) => {
    if (filter === "students") return "students";
    return filter;
  };

  /* ================= FETCH USERS ================= */
  const fetchUsers = async (filterValue = roleFilter, reset = false) => {
    if (isFetching.current || (!hasMore && !reset)) return;

    isFetching.current = true;
    setLoading(true);

    try {
      const pageOffset = reset ? 0 : offset;
      const query = `limit=${limit}&offset=${pageOffset}`;
      const url =
        filterValue === "all"
          ? `${USERS_API}?${query}`
          : `${USERS_API}/?userType=${encodeURIComponent(
              getUserTypeParam(filterValue)
            )}&${query}`;

      const res = await axios.get(url);

      const data = res.data?.data?.data || [];

      if (data.length === 0) {
        setHasMore(false);
      } else {
        setUsers((prev) => (reset ? data : [...prev, ...data]));
        setOffset((prev) => (reset ? 1 : prev + 1)); // page index
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    setUsers([]);
    setOffset(0);
    setHasMore(true);
    fetchUsers(roleFilter, true);
  }, [roleFilter]);

  /* ================= INFINITE SCROLL ================= */
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 100 &&
        !loading &&
        hasMore
      ) {
        fetchUsers(roleFilter);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, roleFilter]);

  /* ================= VERIFY TOGGLE ================= */
  const handleVerifyToggle = async (user) => {
    const newStatus = !user.isVerified;

    try {
      const res = await axios.put(
        `${USERS_API}/${user._id}`,
        { isVerified: newStatus },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.status) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id ? { ...u, isVerified: newStatus } : u
          )
        );
      }
    } catch (err) {
      alert("Failed to update verification");
    }
  };

  /* ================= DELETE USER ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await axios.delete(`${USERS_API}/${id}`);

      if (res.data?.status) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  /* ================= ROLE LABEL ================= */
  const getRoleLabel = (type) => {
    if (type === "admin") return "Admin";
    if (type === "employee") return "Employee";
    if (type === "internship") return "Intern";
    if (type === "students" || type === "student") return "Student";
    return "User";
  };

  const visibleUsers = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return users
      .filter((u) => (u.name || "").toLowerCase().includes(normalizedSearch))
      .filter((u) => {
        if (roleFilter === "all") return true;
        const normalizedUserType = (u.userType || "").toLowerCase();
        if (roleFilter === "students") {
          return (
            normalizedUserType === "students" ||
            normalizedUserType === "student"
          );
        }
        return normalizedUserType === roleFilter;
      });
  }, [users, searchTerm, roleFilter]);

  return (
    <div className="users-page">
      <h1>All Users</h1>

      <button onClick={() => setOpen(true)}>Create User</button>

      {(open || editUser) && (
        <CreateUser
          mode={editUser ? "edit" : "create"}
          userData={editUser}
          onClose={() => {
            setOpen(false);
            setEditUser(null);
          }}
          onSuccess={(savedUser, mode) => {
            if (savedUser && savedUser._id) {
              setUsers((prev) => {
                const exists = prev.some((u) => u._id === savedUser._id);
                if (mode === "edit") {
                  return prev.map((u) =>
                    u._id === savedUser._id ? { ...u, ...savedUser } : u
                  );
                }
                if (!exists) {
                  return [savedUser, ...prev];
                }
                return prev;
              });
              return;
            }

            // Fallback: reload first page if API didn't return saved user
            setUsers([]);
            setOffset(0);
            setHasMore(true);
            fetchUsers(roleFilter, true);
          }}
        />
      )}
      <div className="filter-bar">
  <button
    className={roleFilter === "all" ? "active" : ""}
    onClick={() => setRoleFilter("all")}
  >
    All
  </button>

  <button
    className={roleFilter === "admin" ? "active" : ""}
    onClick={() => setRoleFilter("admin")}
  >
    Admin
  </button>

  <button
    className={roleFilter === "employee" ? "active" : ""}
    onClick={() => setRoleFilter("employee")}
  >
    Employee
  </button>

  <button
    className={roleFilter === "students" ? "active" : ""}
    onClick={() => setRoleFilter("students")}
  >
    Student
  </button>

  <button
    className={roleFilter === "internship" ? "active" : ""}
    onClick={() => setRoleFilter("internship")}
  >
    Intern
  </button>
</div>

      <div className="search-bar">
        <label className="search-label">
          Search User
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
      </div>

      <div className="users-list">
        {visibleUsers.map((user) => (
            <div className="user-card" key={user._id}>
              <div className="user-div">
                <div>
                  <h3>{user.name}</h3>
                  <h3 className="role-badge">
                    User Type:<strong>{getRoleLabel(user.userType)}</strong>
                  </h3>

                  <span
                    className={
                      user.isVerified
                        ? "verify-text verified"
                        : "verify-text not-verified"
                    }
                  >
                    {user.isVerified ? "Verified ✅" : "Not Verified ❌"}
                  </span>

                  <p>Designation: {user.personalDetails?.designation || "N/A"}</p>
                  <p>Job Type: {user.personalDetails?.jobType || "N/A"}</p>
                </div>

                <div className="verify-toggle">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={!!user.isVerified}
                      onChange={() => handleVerifyToggle(user)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="buttons">
                <button className="primary" onClick={() => setSelectedUser(user)}>
                  Details
                </button>

                <button className="edit" onClick={() => setEditUser(user)}>
                  Edit
                </button>

                <button
                  className="delete"
                  onClick={() => handleDelete(user._id)}
                >
                  Delete
                </button>

              </div>
            </div>
          ))}
      </div>

      {loading && <p className="loading-text">Loading users...</p>}
      {!hasMore && <p className="loading-text">All users fetched</p>}

      {selectedUser && (
  <div className="modall">
    <div className="modal-content">
      <h2>
        {selectedUser.name} {selectedUser.lastName || ""}
      </h2>

      <p><strong>Email:</strong> {selectedUser.email}</p>
      <p><strong>Mobile:</strong> {selectedUser.mobileNo}</p>
      <p><strong>User Type:</strong> {getRoleLabel(selectedUser.userType)}</p>
      <p>
        <strong>Status:</strong>{" "}
        {selectedUser.isVerified ? "Verified ✅" : "Not Verified ❌"}
      </p>
      <p><strong>Active Status:</strong> {selectedUser.activeStatus}</p>

      <hr />

      <p><strong>Designation:</strong> {selectedUser.personalDetails?.designation || "N/A"}</p>
      <p><strong>Job Type:</strong> {selectedUser.personalDetails?.jobType || "N/A"}</p>
      <p><strong>Blood Group:</strong> {selectedUser.personalDetails?.bloodGroup || "N/A"}</p>

      <hr />

      <p><strong>Address:</strong> {selectedUser.address?.fullAddress || "N/A"}</p>
      <p><strong>City:</strong> {selectedUser.address?.city || "N/A"}</p>
      <p><strong>State:</strong> {selectedUser.address?.state || "N/A"}</p>
      <p><strong>Country:</strong> {selectedUser.address?.country || "N/A"}</p>
      <p><strong>Postal Code:</strong> {selectedUser.address?.postalCode || "N/A"}</p>

      <hr />

      <p><strong>Bank Name:</strong> {selectedUser.bankDetails?.bankName || "N/A"}</p>
      <p><strong>Account No:</strong> {selectedUser.bankDetails?.accountNumber || "N/A"}</p>
      <p><strong>IFSC:</strong> {selectedUser.bankDetails?.ifscCode || "N/A"}</p>

      <hr />

      <p><strong>UUID:</strong> {selectedUser.uuid}</p>
      <p>
        <strong>Created At:</strong>{" "}
        {new Date(selectedUser.createdAt).toLocaleString()}
      </p>

      <button className="close-btns" onClick={() => setSelectedUser(null)}>
        Close
      </button>
    </div>
  </div>
)}

    </div>
  );
}

export default UsersPage;
