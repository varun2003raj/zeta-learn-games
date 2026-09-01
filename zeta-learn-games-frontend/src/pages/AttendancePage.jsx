import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./AttendancePage.css";

const USER_ATTENDANCE_API =
  "https://zetamind-hub-node-backend.onrender.com/api/authUser/userGetAttendance";
const ATTENDANCE_LIST_API =
  "https://zetamind-hub-node-backend-1.onrender.com/api/attendanceList";
const PAGE_LIMIT = 10;

const FILTER_MODE = {
  TODAY: "today",
  DATE: "date",
};

const LIST_STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  COMPLETED: "completed",
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

const normalizeDateTimeString = (value) => {
  if (typeof value !== "string") return value;
  return value
    .replace(/\.\d{1,3}Z$/i, "")
    .replace(/Z$/i, "")
    .replace(/\.\d{1,3}$/i, "");
};

const parseLocalDateTime = (value) => {
  if (!value) return null;
  const normalized = normalizeDateTimeString(String(value));
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const formatTime = (value) => {
  if (!value) return "--";
  const d = parseLocalDateTime(value);
  if (!d) return "--";
  return d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
};

const formatDate = (value) => {
  if (!value) return "--";
  const d = parseLocalDateTime(value);
  if (!d) return "--";
  return d.toLocaleDateString();
};

const normalizeUsers = (payload) => {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.users)) return payload.data.users;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload)) return payload;
  return [];
};

const normalizeAttendanceRecords = (payload) => {
  if (Array.isArray(payload?.data?.AttendanceList)) return payload.data.AttendanceList;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.AttendanceList)) return payload.AttendanceList;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const getAttendanceArray = (user) => {
  if (Array.isArray(user?.attendance)) return user.attendance;
  return [];
};

const mergeUniqueUsers = (existing, incoming) => {
  const result = [];
  const seen = new Set();

  [...existing, ...incoming].forEach((user) => {
    const key =
      user?._id ||
      user?.id ||
      user?.email ||
      user?.mobileNo ||
      `${user?.name || "unknown"}-${result.length}`;

    if (seen.has(key)) return;
    seen.add(key);
    result.push(user);
  });

  return result;
};

const getLatestAttendance = (attendanceList) => {
  if (!Array.isArray(attendanceList) || attendanceList.length === 0) return null;

  return [...attendanceList].sort((a, b) => {
    const aTime = new Date(a?.checkIn || a?.date || 0).getTime();
    const bTime = new Date(b?.checkIn || b?.date || 0).getTime();
    return bTime - aTime;
  })[0];
};

const getCurrentStatusWord = (user, attendanceItem) => {
  if (!attendanceItem) return "didnt put attedence";
  if (attendanceItem.checkOut) return "checked out";

  const apiStatus = attendanceItem.checkInStatus || attendanceItem.type;
  if (apiStatus) return String(apiStatus);

  if (user?.activeStatus) return String(user.activeStatus);
  return "checked in";
};

const isMissingStatus = (value) => {
  if (!value) return false;
  const status = String(value).trim().toLowerCase();
  return status === "not updated" || status === "didnt put attedence" || status === "absent";
};

const getUserName = (user) => {
  return user?.name || user?.lastName || user?.email || user?.mobileNo || "Unknown User";
};

const getRecordDateInputValue = (record) => {
  return toDateInputValue(record?.date || record?.checkIn || record?.checkOut);
};

const normalizeBooleanStatus = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
};

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  if (!token) return {};

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

export default function AttendancePage() {
  const location = useLocation();
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();

  const lockedUserId = location.state?.userId || paramUserId || "";
  const studentName = location.state?.studentName || "";
  const isUserMode = Boolean(lockedUserId);

  const [users, setUsers] = useState([]);
  const [userAttendanceRecords, setUserAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filterMode, setFilterMode] = useState(FILTER_MODE.TODAY);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
  const [searchTerm, setSearchTerm] = useState("");
  const [listStatusFilter, setListStatusFilter] = useState(LIST_STATUS_FILTER.ALL);
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const isFetchingRef = useRef(false);

  const title = lockedUserId ? `${studentName || "Student"} Attendance` : "Attendance";

  const fetchAttendanceByDate = async (reset = false) => {
    if (isFetchingRef.current) return;
    if (!reset && !hasMore) return;

    isFetchingRef.current = true;
    if (reset) {
      setLoading(true);
      setError("");
    } else {
      setLoadingMore(true);
    }

    try {
      const currentOffset = reset ? 0 : offset;
      const url = `${USER_ATTENDANCE_API}?date=${encodeURIComponent(
        selectedDate
      )}&limit=${PAGE_LIMIT}&offset=${currentOffset}`;
      const res = await axios.get(url, getAuthConfig());
      const list = normalizeUsers(res.data);
      const normalizedList = Array.isArray(list) ? list : [];

      setUsers((prev) =>
        reset ? normalizedList : mergeUniqueUsers(prev, normalizedList)
      );
      setHasMore(normalizedList.length === PAGE_LIMIT);
      setOffset((prev) => (reset ? 1 : prev + 1));
    } catch (err) {
      console.error("Attendance users fetch error:", err);
      setError("Failed to load attendance users.");
      if (reset) {
        setUsers([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  const fetchUserAttendanceHistory = async () => {
    if (!lockedUserId) return;

    setLoading(true);
    setError("");
    try {
      const url = `${ATTENDANCE_LIST_API}?userId=${encodeURIComponent(lockedUserId)}`;
      const res = await axios.get(url, getAuthConfig());
      const list = normalizeAttendanceRecords(res.data);
      const normalizedList = Array.isArray(list) ? list : [];
      const sorted = [...normalizedList].sort((a, b) => {
        const aTime = new Date(a?.date || a?.checkIn || 0).getTime();
        const bTime = new Date(b?.date || b?.checkIn || 0).getTime();
        return bTime - aTime;
      });
      setUserAttendanceRecords(sorted);
    } catch (err) {
      console.error("User attendance fetch error:", err);
      setError("Failed to load user attendance history.");
      setUserAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const openUserAttendance = (user) => {
    const id = user?._id || user?.id;
    if (!id) return;
    navigate(`/attendance/${id}`, {
      state: { studentName: getUserName(user) },
    });
  };

  useEffect(() => {
    if (!isUserMode && selectedDate) {
      setUsers([]);
      setOffset(0);
      setHasMore(true);
      fetchAttendanceByDate(true);
    }
  }, [selectedDate, isUserMode]);

  useEffect(() => {
    if (isUserMode) {
      fetchUserAttendanceHistory();
    }
  }, [isUserMode, lockedUserId]);

  useEffect(() => {
    if (filterMode === FILTER_MODE.TODAY) {
      setSelectedDate(toDateInputValue(new Date()));
    }
  }, [filterMode]);

  useEffect(() => {
    const handleScroll = () => {
      if (isUserMode) return;
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 120;

      if (nearBottom && !loading && !loadingMore && hasMore) {
        fetchAttendanceByDate(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, hasMore, offset, selectedDate, isUserMode]);

  const visibleUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const normalizedStatus = normalizeBooleanStatus(user?.status);

      if (
        listStatusFilter === LIST_STATUS_FILTER.ACTIVE &&
        normalizedStatus !== true
      ) {
        return false;
      }

      if (
        listStatusFilter === LIST_STATUS_FILTER.COMPLETED &&
        normalizedStatus !== false
      ) {
        return false;
      }

      if (normalizedSearch) {
        const key = getUserName(user).toLowerCase();
        return key.includes(normalizedSearch);
      }

      return true;
    });
  }, [users, searchTerm, listStatusFilter]);

  const visibleUserAttendanceRecords = useMemo(() => {
    if (!historyDateFilter) return userAttendanceRecords;

    return userAttendanceRecords.filter((record) => {
      return getRecordDateInputValue(record) === historyDateFilter;
    });
  }, [userAttendanceRecords, historyDateFilter]);

  return (
    <div className="attendance-page">
      <div className="attendance-top">
        <button className="back-button" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      <h2 className="attendance-title">{title}</h2>

      {!isUserMode && (
        <div className="attendance-toolbar">
          <div className="filter-group">
            <button
              type="button"
              className={filterMode === FILTER_MODE.TODAY ? "active" : ""}
              onClick={() => setFilterMode(FILTER_MODE.TODAY)}
            >
              Today
            </button>
            <button
              type="button"
              className={filterMode === FILTER_MODE.DATE ? "active" : ""}
              onClick={() => setFilterMode(FILTER_MODE.DATE)}
            >
              Particular Day
            </button>
          </div>

          <div className="filter-group">
            <button
              type="button"
              className={listStatusFilter === LIST_STATUS_FILTER.ALL ? "active" : ""}
              onClick={() => setListStatusFilter(LIST_STATUS_FILTER.ALL)}
            >
              All
            </button>
            <button
              type="button"
              className={listStatusFilter === LIST_STATUS_FILTER.ACTIVE ? "active" : ""}
              onClick={() => setListStatusFilter(LIST_STATUS_FILTER.ACTIVE)}
            >
              Active
            </button>
            <button
              type="button"
              className={listStatusFilter === LIST_STATUS_FILTER.COMPLETED ? "active" : ""}
              onClick={() => setListStatusFilter(LIST_STATUS_FILTER.COMPLETED)}
            >
              Completed
            </button>
          </div>

          {filterMode === FILTER_MODE.DATE && (
            <label className="date-label">
              Search Date
              <input
                className="date-filter-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </label>
          )}

          <label className="date-label">
            Search User
            <input
              className="user-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username"
            />
          </label>
        </div>
      )}

      {loading && <p className="loading-text">Loading attendance...</p>}
      {!loading && error && <p className="no-data">{error}</p>}

      {!loading && !error && !isUserMode && (
        <div className="attendance-card">
          <div className="attendance-row list-row header">
            <div>User</div>
            <div>Check In</div>
            <div>Check Out</div>
            <div>Total Hours</div>
            <div>Active Status</div>
            <div>Action</div>
          </div>

          {visibleUsers.length === 0 ? (
            <p className="no-data">No users found for this date.</p>
          ) : (
            visibleUsers.map((user) => {
              const attendanceList = getAttendanceArray(user);
              const latest = getLatestAttendance(attendanceList);
              const hasAttendance = attendanceList.length > 0;
              const statusText = hasAttendance
                ? getCurrentStatusWord(user, latest)
                : "not updated";
              const statusClass =
                !hasAttendance || isMissingStatus(statusText) ? "status-miss" : "status-put";

              return (
                <div className="attendance-row list-row" key={user?._id || user?.email}>
                  <div>{getUserName(user)}</div>
                  <div>{formatTime(latest?.checkIn)}</div>
                  <div>{formatTime(latest?.checkOut)}</div>
                  <div>{latest?.totalHours ?? "--"}</div>
                  <div className={statusClass}>
                    <span className="status-word">{statusText}</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="view-attendance-btn"
                      onClick={() => openUserAttendance(user)}
                    >
                      View Attendance
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {!loading && !error && !isUserMode && loadingMore && (
        <p className="loading-text">Loading more users...</p>
      )}

      {!loading && !error && isUserMode && (
        <>
          <div className="attendance-toolbar">
            <label className="date-label">
              Filter Date
              <input
                className="date-filter-input"
                type="date"
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
              />
            </label>
            {historyDateFilter && (
              <div className="filter-group">
                <button type="button" onClick={() => setHistoryDateFilter("")}>
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="attendance-card">
            <div className="attendance-row history-row header">
              <div>Date</div>
              <div>Check In</div>
              <div>Check Out</div>
              <div>Total Hours</div>
              <div>Status</div>
            </div>

            {visibleUserAttendanceRecords.length === 0 ? (
              <p className="no-data">No attendance history found for this user.</p>
            ) : (
              visibleUserAttendanceRecords.map((record) => {
                const statusText =
                  record?.checkInStatus ||
                  (record?.checkOut ? "checked out" : record?.checkIn ? "checked in" : "absent");
                const statusClass =
                  record?.checkIn && !isMissingStatus(statusText) ? "status-put" : "status-miss";

                return (
                  <div
                    className="attendance-row history-row"
                    key={record?._id || `${record?.date}-${record?.checkIn}`}
                  >
                    <div>{formatDate(record?.date || record?.checkIn)}</div>
                    <div>{formatTime(record?.checkIn)}</div>
                    <div>{formatTime(record?.checkOut)}</div>
                    <div>{record?.totalHours ?? "--"}</div>
                    <div className={statusClass}>
                      <span className="status-word">{statusText}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
