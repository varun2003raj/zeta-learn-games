import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./Task.css";
import useLockBodyScroll from "../hooks/useLockBodyScroll";

const USERS_URL = "https://zetamind-hub-node-backend.onrender.com/api/authUser";
const TASKS_URL = "https://zetamind-hub-node-backend.onrender.com/api/task";
const USER_PAGE_LIMIT = 10;
const DEFAULT_ASSIGNABLE_USER_TYPE = "internship";
const ASSIGNABLE_USER_TYPES = [
  { value: "internship", label: "Intern" },
  { value: "employee", label: "Employee" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const statusLabel = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const priorityLabel = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function toDateString(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function findFirstArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return null;

  for (const value of Object.values(payload)) {
    const nested = findFirstArray(value);
    if (nested) return nested;
  }

  return null;
}

function extractArray(payload, preferredKeys = []) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of preferredKeys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  return findFirstArray(payload) || [];
}

function normalizeUserType(value) {
  const normalized = (value || "").toString().trim().toLowerCase();
  if (normalized === "student") return "students";
  if (normalized === "intern") return "internship";
  return normalized;
}

function normalizeUser(user = {}) {
  return {
    _id: user?._id || user?.id || "",
    name: user?.name || user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    userType: normalizeUserType(user?.userType || user?.role),
  };
}

function normalizeReference(value) {
  if (!value) {
    return { id: "", snapshot: null };
  }

  if (typeof value === "object") {
    return {
      id: value._id || value.id || "",
      snapshot: normalizeUser(value),
    };
  }

  return { id: String(value), snapshot: null };
}

function normalizeTaskStatus(value) {
  const normalized = (value || "pending").toString().trim().toLowerCase().replace(/\s+/g, "_");
  return ["pending", "in_progress", "completed"].includes(normalized) ? normalized : "pending";
}

function normalizePriority(value) {
  const normalized = (value || "medium").toString().trim().toLowerCase();
  return ["low", "medium", "high"].includes(normalized) ? normalized : "medium";
}

function normalizeTask(task = {}) {
  const assignee = normalizeReference(task?.userId);
  const assignedAdmin = normalizeReference(task?.assignedBy);
  const sharedUser = normalizeReference(task?.sharedUserId);

  return {
    ...task,
    _id: task?._id || task?.id || "",
    userId: assignee.id,
    assignedBy: assignedAdmin.id,
    sharedUserId: sharedUser.id,
    assigneeSnapshot: assignee.snapshot,
    assignedBySnapshot: assignedAdmin.snapshot,
    sharedUserSnapshot: sharedUser.snapshot,
    title: task?.title || "",
    description: task?.description || "",
    taskStatus: normalizeTaskStatus(task?.taskStatus),
    priority: normalizePriority(task?.priority),
    duration:
      task?.duration === null || task?.duration === undefined || task?.duration === ""
        ? ""
        : String(task.duration),
    startTime: task?.startTime || "",
    endTime: task?.endTime || "",
    dueDate: task?.dueDate || "",
    deleted: Boolean(task?.deleted),
    status: task?.status !== false,
  };
}

function createEmptyForm(defaultAdminId = "") {
  return {
    userId: "",
    assignedBy: defaultAdminId,
    sharedUserId: "",
    title: "",
    description: "",
    taskStatus: "pending",
    priority: "medium",
    startTime: "",
    endTime: "",
    duration: "20",
    dueDate: "",
  };
}

function parseDateValue(value) {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateInputValue(value) {
  if (!value) return "";
  const date = parseDateValue(value);
  if (!date) return "";
  return toDateString(date);
}

function toDateValueOrNull(value) {
  if (!value) return null;
  const date = parseDateValue(value);
  return date ? toDateString(date) : null;
}

function formatDate(value) {
  if (!value) return "-";
  const date = parseDateValue(value);
  return date ? dateFormatter.format(date) : "-";
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateTimeFormatter.format(date);
}

function buildUserName(user) {
  const normalized = normalizeUser(user);
  return normalized.name || normalized.lastName || normalized.email || normalized._id || "";
}

function getTaskUserRoleLabel(value) {
  const normalized = normalizeUserType(value);
  if (normalized === "internship") return "Intern";
  if (normalized === "employee") return "Employee";
  return "User";
}

function isAssignableTaskUserType(value) {
  const normalized = normalizeUserType(value);
  return ASSIGNABLE_USER_TYPES.some((option) => option.value === normalized);
}

function isEligibleTaskUser(user) {
  return isAssignableTaskUserType(user?.userType);
}

function isSameDateValue(value, targetDate) {
  if (!value || !targetDate) return false;
  return toDateInputValue(value) === targetDate;
}

function matchesTaskDate(task, targetDate) {
  return (
    isSameDateValue(task.startTime, targetDate) ||
    isSameDateValue(task.endTime, targetDate) ||
    isSameDateValue(task.dueDate, targetDate)
  );
}

function getWeekRange(referenceDate) {
  const date = new Date(referenceDate);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function matchesTaskThisWeek(task, referenceDate) {
  const { start, end } = getWeekRange(referenceDate);

  return [task.startTime, task.endTime, task.dueDate].some((value) => {
    const date = parseDateValue(value);
    return date && date >= start && date <= end;
  });
}

function getTaskDateValues(task) {
  return [task.startTime, task.endTime, task.dueDate]
    .map((value) => parseDateValue(value))
    .filter(Boolean);
}

function matchesTaskDateRange(task, fromValue, toValue) {
  if (!fromValue && !toValue) return true;

  const fromDate = fromValue ? parseDateValue(fromValue) : null;
  const toDate = toValue ? parseDateValue(toValue) : null;
  const taskDates = getTaskDateValues(task);

  if (fromDate) {
    fromDate.setHours(0, 0, 0, 0);
  }

  if (toDate) {
    toDate.setHours(23, 59, 59, 999);
  }

  return taskDates.some((date) => {
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  });
}

function getTaskSortTime(task) {
  const taskDates = getTaskDateValues(task);

  if (taskDates.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.min(...taskDates.map((date) => date.getTime()));
}

function matchesUserName(user, value) {
  if (!value) return false;
  return buildUserName(user).toLowerCase() === value.trim().toLowerCase();
}

function getSearchableTaskText(task, resolveUserName) {
  return [
    resolveUserName(task.userId, task.assigneeSnapshot),
    resolveUserName(task.assignedBy, task.assignedBySnapshot),
    resolveUserName(task.sharedUserId, task.sharedUserSnapshot),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function mergeUsers(...groups) {
  const uniqueUsers = new Map();

  groups.flat().forEach((user) => {
    const normalizedUser = normalizeUser(user);
    if (!normalizedUser._id) return;
    uniqueUsers.set(normalizedUser._id, normalizedUser);
  });

  return Array.from(uniqueUsers.values());
}

async function fetchUsersByType(userType) {
  const collectedUsers = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(`${USERS_URL}/`, {
      params: {
        userType,
        limit: USER_PAGE_LIMIT,
        offset,
      },
    });

    const responseData = response.data?.data || {};
    const pageUsers = extractArray(response.data, ["data", "users", "list", "items"])
      .map(normalizeUser)
      .filter((user) => user._id);
    const reportedTotalCount = Number(responseData.totalCount);
    const loadedCount = collectedUsers.length + pageUsers.length;

    if (pageUsers.length === 0) {
      break;
    }

    collectedUsers.push(...pageUsers);
    offset += 1;

    hasMore =
      pageUsers.length === USER_PAGE_LIMIT &&
      (!Number.isFinite(reportedTotalCount) || reportedTotalCount < 0 || loadedCount < reportedTotalCount);
  }

  return collectedUsers;
}

function TaskUserTypeSwitch({ value, onChange, label }) {
  return (
    <div className="task-role-switch" role="tablist" aria-label={label}>
      {ASSIGNABLE_USER_TYPES.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "task-role-btn active" : "task-role-btn"}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function TaskOptionDropdown({
  value,
  options,
  placeholder,
  onChange,
  emptyOptionLabel = "",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((option) => option.value === value) || null;

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const selectValue = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div className="task-custom-select" ref={containerRef}>
      <button
        type="button"
        className={open ? "task-custom-trigger open" : "task-custom-trigger"}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selectedOption ? "task-custom-value" : "task-custom-placeholder"}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="task-custom-chevron" aria-hidden="true" />
      </button>

      {open && (
        <div className="task-custom-menu" role="listbox">
          {emptyOptionLabel ? (
            <button
              type="button"
              className={!value ? "task-custom-option active" : "task-custom-option"}
              onClick={() => selectValue("")}
            >
              {emptyOptionLabel}
            </button>
          ) : null}

          {options.length === 0 ? (
            <div className="task-custom-empty">No users available</div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={value === option.value ? "task-custom-option active" : "task-custom-option"}
                onClick={() => selectValue(option.value)}
              >
                <span>{option.label}</span>
                {value === option.value ? <span className="task-custom-check">Selected</span> : null}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TaskStatusPill({ value }) {
  return <span className={`task-pill task-status ${value}`}>{statusLabel[value] || "Pending"}</span>;
}

function TaskPriorityPill({ value }) {
  return (
    <span className={`task-pill task-priority ${value}`}>{priorityLabel[value] || "Medium"}</span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="task-detail-card">
      <span>{label}</span>
      <div>{value}</div>
    </div>
  );
}

export default function TaskPage() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [quickDateFilter, setQuickDateFilter] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortFromDate, setSortFromDate] = useState("");
  const [sortToDate, setSortToDate] = useState("");
  const [assigneeType, setAssigneeType] = useState(DEFAULT_ASSIGNABLE_USER_TYPE);
  const [sharedType, setSharedType] = useState(DEFAULT_ASSIGNABLE_USER_TYPE);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [viewTask, setViewTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(createEmptyForm());
  const [saving, setSaving] = useState(false);

  useLockBodyScroll(showModal || Boolean(viewTask));

  const userMap = useMemo(() => {
    return new Map(users.map((user) => [user._id, user]));
  }, [users]);

  const todayDate = useMemo(() => toDateString(new Date()), []);

  const userOptionsByType = useMemo(() => {
    return ASSIGNABLE_USER_TYPES.reduce((result, option) => {
      result[option.value] = users
        .filter((user) => normalizeUserType(user.userType) === option.value)
        .sort((left, right) => buildUserName(left).localeCompare(buildUserName(right)));
      return result;
    }, {});
  }, [users]);

  const assigneeOptions = userOptionsByType[assigneeType] || [];
  const sharedOptions = userOptionsByType[sharedType] || [];
  const assigneeDropdownOptions = useMemo(() => {
    return assigneeOptions.map((user) => ({
      value: user._id,
      label: buildUserName(user),
    }));
  }, [assigneeOptions]);
  const sharedDropdownOptions = useMemo(() => {
    return sharedOptions.map((user) => ({
      value: user._id,
      label: buildUserName(user),
    }));
  }, [sharedOptions]);

  const currentAdmin = useMemo(() => {
    let storedAdminProfile = null;
    try {
      storedAdminProfile = JSON.parse(localStorage.getItem("adminProfile") || "null");
    } catch (parseError) {
      storedAdminProfile = null;
    }

    const storedAdminId = (localStorage.getItem("adminId") || "").trim();
    const storedAdminEmail = (localStorage.getItem("adminEmail") || "").trim().toLowerCase();
    const storedAdminName = (localStorage.getItem("adminName") || "").trim();
    const profileAdminId = (storedAdminProfile?._id || storedAdminProfile?.id || "").trim();
    const profileAdminEmail = (storedAdminProfile?.email || "").trim().toLowerCase();
    const profileAdminName = buildUserName(storedAdminProfile);

    if (profileAdminId && userMap.has(profileAdminId)) {
      return userMap.get(profileAdminId);
    }

    if (profileAdminEmail) {
      const adminFromUsers = users.find(
        (user) => user.userType === "admin" && user.email.toLowerCase() === profileAdminEmail
      );
      if (adminFromUsers) {
        return adminFromUsers;
      }
    }

    if (profileAdminId || profileAdminEmail || profileAdminName) {
      return normalizeUser(storedAdminProfile);
    }

    if (storedAdminId && userMap.has(storedAdminId)) {
      return userMap.get(storedAdminId);
    }

    if (storedAdminEmail) {
      const adminFromUsers = users.find(
        (user) => user.userType === "admin" && user.email.toLowerCase() === storedAdminEmail
      );
      if (adminFromUsers) {
        return adminFromUsers;
      }
    }

    if (storedAdminName) {
      const adminFromUsers = users.find(
        (user) => user.userType === "admin" && matchesUserName(user, storedAdminName)
      );
      if (adminFromUsers) {
        return adminFromUsers;
      }
    }

    return normalizeUser({
      _id: storedAdminId,
      name: storedAdminName,
      email: storedAdminEmail,
      userType: "admin",
    });
  }, [userMap, users]);

  const currentAdminId = currentAdmin?._id || "";
  const currentAdminName = buildUserName(currentAdmin) || "Current admin";

  const resolveUserName = useCallback(
    (id, snapshot = null) => {
      if (id && userMap.has(id)) {
        const user = userMap.get(id);
        return buildUserName(user);
      }

      if (snapshot) {
        return buildUserName(snapshot);
      }

      return id || "Not selected";
    },
    [userMap]
  );

  const resolveAssignableUserType = useCallback(
    (id, snapshot = null) => {
      if (id && userMap.has(id)) {
        const normalizedType = normalizeUserType(userMap.get(id)?.userType);
        if (isAssignableTaskUserType(normalizedType)) {
          return normalizedType;
        }
      }

      const snapshotType = normalizeUserType(snapshot?.userType);
      if (isAssignableTaskUserType(snapshotType)) {
        return snapshotType;
      }

      return DEFAULT_ASSIGNABLE_USER_TYPE;
    },
    [userMap]
  );

  useEffect(() => {
    if (!currentAdminId && !currentAdmin?.email && !currentAdminName) return;

    if (currentAdminId) {
      localStorage.setItem("adminId", currentAdminId);
    }

    if (currentAdmin?.email) {
      localStorage.setItem("adminEmail", currentAdmin.email);
    }

    if (currentAdminName && currentAdminName !== "Current admin") {
      localStorage.setItem("adminName", currentAdminName);
    }

    localStorage.setItem("adminProfile", JSON.stringify(currentAdmin || {}));
  }, [currentAdmin, currentAdminId, currentAdminName]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [adminUsers, internshipUsers, employeeUsers, tasksResponse] = await Promise.all([
        fetchUsersByType("admin"),
        fetchUsersByType("internship"),
        fetchUsersByType("employee"),
        axios.get(TASKS_URL),
      ]);

      const taskList = extractArray(tasksResponse.data, ["data", "tasks", "list", "items"]);

      setUsers(mergeUsers(adminUsers, internshipUsers, employeeUsers));
      setTasks(Array.isArray(taskList) ? taskList.map(normalizeTask) : []);
    } catch (requestError) {
      console.error("Failed to load tasks:", requestError);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to load tasks. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!showModal || editingTask || form.assignedBy || !currentAdminId) return;
    setForm((current) => ({ ...current, assignedBy: currentAdminId }));
  }, [currentAdminId, editingTask, form.assignedBy, showModal]);

  const activeTasks = useMemo(() => {
    return tasks.filter((task) => !task.deleted);
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const searchValue = query.trim().toLowerCase();

    const filteredTasks = activeTasks.filter((task) => {
      if (statusFilter !== "all" && task.taskStatus !== statusFilter) return false;
      if (quickDateFilter === "today" && !matchesTaskDate(task, todayDate)) return false;
      if (quickDateFilter === "week" && !matchesTaskThisWeek(task, new Date())) return false;
      if (dateFilter && !matchesTaskDate(task, dateFilter)) return false;
      if (sortOpen && !matchesTaskDateRange(task, sortFromDate, sortToDate)) return false;
      if (!searchValue) return true;
      return getSearchableTaskText(task, resolveUserName).includes(searchValue);
    });

    let nextTasks = filteredTasks;

    if (sortOpen) {
      nextTasks = [...nextTasks].sort((left, right) => {
        const timeDifference = getTaskSortTime(left) - getTaskSortTime(right);
        if (timeDifference !== 0) return timeDifference;
        return (left.title || "").localeCompare(right.title || "", undefined, {
          sensitivity: "base",
        });
      });
    }

    return nextTasks;
  }, [
    activeTasks,
    dateFilter,
    query,
    quickDateFilter,
    resolveUserName,
    sortOpen,
    sortFromDate,
    sortToDate,
    statusFilter,
    todayDate,
  ]);

  const openCreate = () => {
    setEditingTask(null);
    setForm(createEmptyForm(currentAdminId));
    setAssigneeType(DEFAULT_ASSIGNABLE_USER_TYPE);
    setSharedType(DEFAULT_ASSIGNABLE_USER_TYPE);
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setAssigneeType(resolveAssignableUserType(task.userId, task.assigneeSnapshot));
    setSharedType(resolveAssignableUserType(task.sharedUserId, task.sharedUserSnapshot));
    setForm({
      userId: task.userId || "",
      assignedBy: task.assignedBy || currentAdminId || "",
      sharedUserId: task.sharedUserId || "",
      title: task.title || "",
      description: task.description || "",
      taskStatus: normalizeTaskStatus(task.taskStatus),
      priority: normalizePriority(task.priority),
      startTime: toDateInputValue(task.startTime),
      endTime: toDateInputValue(task.endTime),
      duration: task.duration === "" ? "" : String(task.duration),
      dueDate: toDateInputValue(task.dueDate),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setForm(createEmptyForm(currentAdminId));
    setAssigneeType(DEFAULT_ASSIGNABLE_USER_TYPE);
    setSharedType(DEFAULT_ASSIGNABLE_USER_TYPE);
  };

  const handleFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAssigneeTypeChange = (nextType) => {
    setAssigneeType(nextType);

    if (form.userId && resolveAssignableUserType(form.userId, editingTask?.assigneeSnapshot) !== nextType) {
      handleFieldChange("userId", "");
    }
  };

  const handleSharedTypeChange = (nextType) => {
    setSharedType(nextType);

    if (
      form.sharedUserId &&
      resolveAssignableUserType(form.sharedUserId, editingTask?.sharedUserSnapshot) !== nextType
    ) {
      handleFieldChange("sharedUserId", "");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      userId: form.userId || null,
      assignedBy: form.assignedBy || currentAdminId || null,
      sharedUserId: form.sharedUserId || null,
      title: form.title.trim(),
      description: form.description.trim(),
      taskStatus: normalizeTaskStatus(form.taskStatus),
      priority: normalizePriority(form.priority),
      startTime: toDateValueOrNull(form.startTime),
      endTime: toDateValueOrNull(form.endTime),
      duration: form.duration === "" ? 0 : Number(form.duration),
      dueDate: toDateValueOrNull(form.dueDate),
      deleted: Boolean(editingTask?.deleted),
      status: editingTask?.status !== false,
    };

    if (!payload.title) {
      alert("Task title is required.");
      return;
    }

    if (!payload.userId) {
      alert("Please select the user for this task.");
      return;
    }

    if (!payload.assignedBy) {
      alert("Current admin was not found. Please log in again.");
      return;
    }

    if (
      payload.startTime &&
      payload.endTime &&
      parseDateValue(payload.startTime) > parseDateValue(payload.endTime)
    ) {
      alert("End date must be after start date.");
      return;
    }

    if (Number.isNaN(payload.duration) || payload.duration < 0) {
      alert("Duration must be a valid number.");
      return;
    }

    setSaving(true);

    try {
      if (editingTask?._id) {
        await axios.put(`${TASKS_URL}/${editingTask._id}`, payload);
      } else {
        await axios.post(TASKS_URL, payload);
      }

      closeModal();
      await loadData();
    } catch (submitError) {
      console.error("Failed to save task:", submitError);
      alert(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Failed to save task. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;

    try {
      await axios.delete(`${TASKS_URL}/${task._id}`);
      if (viewTask?._id === task._id) {
        setViewTask(null);
      }
      await loadData();
    } catch (deleteError) {
      console.error("Failed to delete task:", deleteError);
      alert(
        deleteError?.response?.data?.message ||
          deleteError?.message ||
          "Failed to delete task. Please try again."
      );
    }
  };

  return (
    <div className="task-page">
      <div className="task-bg-orb task-orb-1" />
      <div className="task-bg-orb task-orb-2" />

      <div className="task-shell">
        <header className="task-header">
          <h1 className="task-page-title">Task Manager</h1>

          <div className="task-header-actions">
            <button className="add-task-btn" onClick={openCreate}>
              Add Task
            </button>
            <button className="task-refresh-btn" onClick={() => void loadData()}>
              Refresh
            </button>
          </div>
        </header>

        <section className="task-board">
          <div className="task-toolbar">
            <div className="task-toolbar-row">
              <div className="task-filter-group">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={statusFilter === option.value ? "task-filter-btn active" : "task-filter-btn"}
                    onClick={() => setStatusFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <input
                className="task-search"
                type="text"
                placeholder="Search user name"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search user name"
              />
            </div>

            <div className="task-toolbar-row">
              <div className="task-filter-group">
                <button
                  className={
                    !quickDateFilter && !dateFilter && !sortOpen
                      ? "task-filter-btn active"
                      : "task-filter-btn"
                  }
                  onClick={() => {
                    setQuickDateFilter("");
                    setDateFilter("");
                    setSortOpen(false);
                    setSortFromDate("");
                    setSortToDate("");
                  }}
                >
                  All
                </button>
                <button
                  className={
                    quickDateFilter === "today" ? "task-filter-btn active" : "task-filter-btn"
                  }
                  onClick={() =>
                    setQuickDateFilter((current) => {
                      const nextValue = current === "today" ? "" : "today";
                      setDateFilter("");
                      setSortOpen(false);
                      setSortFromDate("");
                      setSortToDate("");
                      return nextValue;
                    })
                  }
                >
                  Today
                </button>
                <button
                  className={
                    quickDateFilter === "week" ? "task-filter-btn active" : "task-filter-btn"
                  }
                  onClick={() =>
                    setQuickDateFilter((current) => {
                      const nextValue = current === "week" ? "" : "week";
                      setDateFilter("");
                      setSortOpen(false);
                      setSortFromDate("");
                      setSortToDate("");
                      return nextValue;
                    })
                  }
                >
                  This Week
                </button>
                <button
                  className={sortOpen ? "task-filter-btn active" : "task-filter-btn"}
                  onClick={() => {
                    setSortOpen((current) => {
                      const nextValue = !current;
                      setQuickDateFilter("");
                      setDateFilter("");

                      if (!nextValue) {
                        setSortFromDate("");
                        setSortToDate("");
                      }

                      return nextValue;
                    });
                  }}
                >
                  Sort
                </button>
              </div>

              <div className="task-toolbar-actions">
                {sortOpen && (
                  <input
                    className="task-date-filter"
                    type="date"
                    value={sortFromDate}
                    onChange={(event) => setSortFromDate(event.target.value)}
                    aria-label="Sort from date"
                  />
                )}
                <input
                  className="task-date-filter"
                  type="date"
                  value={sortOpen ? sortToDate : dateFilter}
                  onChange={(event) => {
                    if (sortOpen) {
                      setSortToDate(event.target.value);
                      return;
                    }

                    setQuickDateFilter("");
                    setSortOpen(false);
                    setSortFromDate("");
                    setSortToDate("");
                    setDateFilter(event.target.value);
                  }}
                  aria-label={sortOpen ? "Sort to date" : "Search by date"}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="task-state-box">Loading tasks...</div>
          ) : error ? (
            <div className="task-state-box error">
              <p>{error}</p>
              <button onClick={() => void loadData()}>Retry</button>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="task-state-box">No tasks match the current filters.</div>
          ) : (
            <div className="task-table-wrap">
              <table className="task-table">
                <colgroup>
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assigned To</th>
                    <th>Shared With</th>
                    <th>Created By</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.map((task) => (
                    <tr key={task._id || `${task.title}-${task.userId}`}>
                      <td>
                        <div className="task-name-cell">
                          <span className="task-title-text">{task.title}</span>
                          <p>{task.description || "No description added."}</p>
                        </div>
                      </td>
                      <td>
                        <span className="task-user-text">
                          {resolveUserName(task.userId, task.assigneeSnapshot)}
                        </span>
                      </td>
                      <td>
                        <span className="task-user-text">
                          {resolveUserName(task.sharedUserId, task.sharedUserSnapshot)}
                        </span>
                      </td>
                      <td>
                        <span className="task-user-text admin">
                          {resolveUserName(task.assignedBy, task.assignedBySnapshot)}
                        </span>
                      </td>
                      <td>
                        <TaskStatusPill value={task.taskStatus} />
                      </td>
                      <td>
                        <TaskPriorityPill value={task.priority} />
                      </td>
                      <td>
                        <div className="task-actions">
                          <button className="task-action-btn view" onClick={() => setViewTask(task)}>
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div className="task-modal-overlay" onClick={closeModal}>
          <div className="task-modal" onClick={(event) => event.stopPropagation()}>
            <div className="task-modal-header">
              <div>
                <p className="task-kicker">{editingTask ? "Update" : "Create"}</p>
                <h2>{editingTask ? "Edit Task" : "Create Task"}</h2>
              </div>

              <button className="task-close-btn" onClick={closeModal}>
                X
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="task-form-grid">
                <div className="task-field">
                  <label className="task-field-label">Task Title</label>
                  <input
                    type="text"
                    placeholder="Task title"
                    value={form.title}
                    onChange={(event) => handleFieldChange("title", event.target.value)}
                    required
                  />
                </div>

                <div className="task-field">
                  <label className="task-field-label">Assign To</label>
                  <TaskUserTypeSwitch
                    value={assigneeType}
                    onChange={handleAssigneeTypeChange}
                    label="Assignee type"
                  />
                  <TaskOptionDropdown
                    value={form.userId}
                    options={assigneeDropdownOptions}
                    placeholder={`Select ${getTaskUserRoleLabel(assigneeType).toLowerCase()}`}
                    onChange={(nextValue) => handleFieldChange("userId", nextValue)}
                  />
                  <p className="task-field-hint">
                    {assigneeOptions.length} {getTaskUserRoleLabel(assigneeType).toLowerCase()}
                    {assigneeOptions.length === 1 ? "" : "s"} loaded
                  </p>
                </div>
              </div>

              <label className="task-field-label">Description</label>
              <textarea
                placeholder="Task description"
                value={form.description}
                onChange={(event) => handleFieldChange("description", event.target.value)}
              />

              <div className="task-form-grid">
                <div className="task-field">
                  <label className="task-field-label">Created By Admin</label>
                  <input
                    type="text"
                    value={
                      form.assignedBy
                        ? resolveUserName(form.assignedBy, editingTask?.assignedBySnapshot)
                        : currentAdminName
                    }
                    readOnly
                  />
                </div>

                <div className="task-field">
                  <label className="task-field-label">Shared With</label>
                  <TaskUserTypeSwitch
                    value={sharedType}
                    onChange={handleSharedTypeChange}
                    label="Shared user type"
                  />
                  <TaskOptionDropdown
                    value={form.sharedUserId}
                    options={sharedDropdownOptions}
                    placeholder="Choose shared user"
                    emptyOptionLabel="No shared user"
                    onChange={(nextValue) => handleFieldChange("sharedUserId", nextValue)}
                  />
                  <p className="task-field-hint">
                    {sharedOptions.length} {getTaskUserRoleLabel(sharedType).toLowerCase()}
                    {sharedOptions.length === 1 ? "" : "s"} loaded
                  </p>
                </div>
              </div>

              <div className="task-form-grid task-form-grid-3">
                <div className="task-field">
                  <label className="task-field-label">Task Status</label>
                  <select
                    value={form.taskStatus}
                    onChange={(event) => handleFieldChange("taskStatus", event.target.value)}
                  >
                    {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="task-field">
                  <label className="task-field-label">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(event) => handleFieldChange("priority", event.target.value)}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="task-field">
                  <label className="task-field-label">Duration (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="20"
                    value={form.duration}
                    onChange={(event) => handleFieldChange("duration", event.target.value)}
                  />
                </div>
              </div>

              <div className="task-form-grid task-form-grid-3">
                <div className="task-field">
                  <label className="task-field-label">Assigned Date</label>
                  <input
                    type="date"
                    value={form.startTime}
                    onChange={(event) => handleFieldChange("startTime", event.target.value)}
                  />
                </div>

                <div className="task-field">
                  <label className="task-field-label">End Date</label>
                  <input
                    type="date"
                    value={form.endTime}
                    onChange={(event) => handleFieldChange("endTime", event.target.value)}
                  />
                </div>

                <div className="task-field">
                  <label className="task-field-label">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => handleFieldChange("dueDate", event.target.value)}
                  />
                </div>
              </div>

              <div className="task-form-actions">
                <button type="button" className="task-secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="task-primary-btn" disabled={saving}>
                  {saving ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewTask && (
        <div className="task-modal-overlay" onClick={() => setViewTask(null)}>
          <div className="task-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="task-modal-header">
              <div>
                <p className="task-kicker">Task Details</p>
                <h2>{viewTask.title}</h2>
              </div>

              <button className="task-close-btn" onClick={() => setViewTask(null)}>
                X
              </button>
            </div>

            <div className="task-detail-grid">
              <DetailItem
                label="Assigned"
                value={resolveUserName(viewTask.userId, viewTask.assigneeSnapshot)}
              />
              <DetailItem
                label="Shared With"
                value={resolveUserName(viewTask.sharedUserId, viewTask.sharedUserSnapshot)}
              />
              <DetailItem label="Assigned Date" value={formatDate(viewTask.startTime)} />
              <DetailItem label="End Date" value={formatDate(viewTask.endTime)} />
              <DetailItem label="Due Date" value={formatDate(viewTask.dueDate)} />
              <DetailItem label="Current Status" value={<TaskStatusPill value={viewTask.taskStatus} />} />
              <DetailItem label="Priority" value={<TaskPriorityPill value={viewTask.priority} />} />
            </div>

            <div className="task-form-actions">
              <button type="button" className="task-secondary-btn" onClick={() => setViewTask(null)}>
                Close
              </button>
              <button
                type="button"
                className="task-primary-btn"
                onClick={() => {
                  setViewTask(null);
                  openEdit(viewTask);
                }}
              >
                Edit Task
              </button>
              <button
                type="button"
                className="task-danger-btn"
                onClick={() => void handleDelete(viewTask)}
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
