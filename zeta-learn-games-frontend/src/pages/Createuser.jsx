import { useState, useEffect } from "react";
import axios from "axios";
import "./CreateUser.css";
import useLockBodyScroll from "../hooks/useLockBodyScroll";

export default function CreateUser({
  onClose,
  mode = "create",
  userData,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    mobileNo: "",
    parentAdminUserId: null,
    aditionalContactNumber: "",
    uuid: Date.now().toString(),
    activeStatus: "offline",
    imgUrl: "",
    lastSeen: null,
    address: {
      fullAddress: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
    adminUserKYC: {
      DOB: "",
      idProofType: "",
      idProofNumber: "",
      isUserKYCVerified: false,
    },
    personalDetails: {
      dateOfJoining: "",
      bloodGroup: "",
      designation: "",
      jobType: "fullTime",
    },
    bankDetails: { bankName: "", accountNumber: "", ifscCode: "" },
    userType: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useLockBodyScroll(true);
  
  /* Prefill data for edit */
  useEffect(() => {
    if (mode === "edit" && userData) {
      const rawType = (userData.userType || "").toString().toLowerCase();
      const normalizedType =
        rawType === "intern"
          ? "internship"
          : rawType === "student"
          ? "students"
          : rawType;

      setFormData((prev) => ({
        ...prev,
        name: userData.name || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        password: "",
        mobileNo: userData.mobileNo || "",
        address: userData.address || prev.address,
        personalDetails: userData.personalDetails || prev.personalDetails,
        userType: normalizedType || "",
      }));
      setPasswordTouched(false);
    }
  }, [mode, userData]);

  const handleChange = (e, section, field) => {
    if (section) {
      setFormData({
        ...formData,
        [section]: { ...formData[section], [field]: e.target.value },
      });
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }
  };

  /* 🔹 CREATE + EDIT HANDLER */
  const handleSubmit = async (e) => {
  e.preventDefault();

  const payload = { ...formData };

  // 🚫 DO NOT UPDATE PASSWORD IF NOT CHANGED
  if (mode === "edit" && !passwordTouched) {
    delete payload.password;
  }

  try {
    let res;
    if (mode === "edit") {
      res = await axios.put(
        `https://zetamind-hub-node-backend.onrender.com/api/authUser/${userData._id}`,
        payload
      );
    } else {
      res = await axios.post(
        "https://zetamind-hub-node-backend.onrender.com/api/authUser",
        payload
      );
    }

    const savedUser =
      res?.data?.data?.data ||
      res?.data?.data ||
      res?.data?.user ||
      res?.data ||
      null;

    onSuccess(savedUser, mode);
    onClose();
  } catch (err) {
    alert("Something went wrong");
  }
};


  return (
    <div className="fullscreen-modal">
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>{mode === "edit" ? "Edit User" : "Create User"}</h2>
          <button type="button" onClick={onClose} className="close-btn">
            ✖
          </button>
        </div>

        <h3>Basic Details</h3>
        <label className="field-label">First Name</label>
        <input
          placeholder="First Name"
          value={formData.name}
          onChange={(e) => handleChange(e, null, "name")}
        />
        <label className="field-label">Last Name</label>
        <input
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) => handleChange(e, null, "lastName")}
        />
        <label className="field-label">Email</label>
        <input
          placeholder="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange(e, null, "email")}
          disabled={mode === "edit"}
        />

        <label className="field-label">Password</label>
        <div className="password-box">
          <input
            type={showPassword ? "text" : "password"}
            value={passwordTouched ? formData.password : "********"}
            placeholder="New Password (optional)"
            onFocus={() => {
              if (!passwordTouched) {
                setPasswordTouched(true);
                setFormData({ ...formData, password: "" });
              }
            }}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
          <span onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        <label className="field-label">Mobile Number</label>
        <input
          placeholder="Mobile Number"
          maxLength={10}
          value={formData.mobileNo}
          onChange={(e) => handleChange(e, null, "mobileNo")}
        />

        <h3>Address</h3>
        <label className="field-label">Full Address</label>
        <input
          placeholder="Full Address"
          value={formData.address.fullAddress}
          onChange={(e) => handleChange(e, "address", "fullAddress")}
        />
        <label className="field-label">City</label>
        <input
          placeholder="City"
          value={formData.address.city}
          onChange={(e) => handleChange(e, "address", "city")}
        />
        <label className="field-label">Country</label>
        <input
          placeholder="Country"
          value={formData.address.country}
          onChange={(e) => handleChange(e, "address", "country")}
        />
        <label className="field-label">Postal Code</label>
        <input
          placeholder="Postal Code"
          value={formData.address.postalCode}
          onChange={(e) => handleChange(e, "address", "postalCode")}
        />
        <h3>User Type</h3>
        <label className="field-label">Role</label>
        <select
          value={formData.userType}
          onChange={(e) => handleChange(e, null, "userType")}
        >
          <option value="" disabled>
            Select Role
          </option>
          <option value="students">Students</option>
          <option value="internship">Intern</option>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" className="submit-btn">
          {mode === "edit" ? "Update User" : "Create User"}
        </button>
      </form>
    </div>
  );
}

