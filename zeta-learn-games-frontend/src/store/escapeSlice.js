import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import escapeService from "../services/escapeService";

const initialState = {
  dashboard: {
    totals: {
      rooms: 0,
      levels: 0,
      questions: 0,
      attempts: 0,
      completedUsers: 0,
    },
    recentAttempts: [],
    attemptsByRoom: [],
    completionSummary: {
      completed: 0,
      inProgress: 0,
    },
    lastUpdated: null,
  },
  rooms: [],
  roomQuery: {
    search: "",
    difficulty: "all",
    page: 1,
    pageSize: 10,
  },
  roomMeta: {
    count: 0,
    next: null,
    previous: null,
  },
  loading: {
    dashboard: false,
    rooms: false,
  },
  error: {
    dashboard: "",
    rooms: "",
  },
};

export const fetchDashboardStats = createAsyncThunk(
  "escape/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      return await escapeService.getDashboardStats();
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to load dashboard.";
      return rejectWithValue(message);
    }
  }
);

export const fetchEscapeRooms = createAsyncThunk(
  "escape/fetchEscapeRooms",
  async (query, { rejectWithValue }) => {
    try {
      return await escapeService.listRooms(query);
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to load escape rooms.";
      return rejectWithValue(message);
    }
  }
);

const escapeSlice = createSlice({
  name: "escape",
  initialState,
  reducers: {
    setRoomQuery(state, action) {
      state.roomQuery = {
        ...state.roomQuery,
        ...action.payload,
      };
    },
    clearRoomError(state) {
      state.error.rooms = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.dashboard = true;
        state.error.dashboard = "";
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.dashboard = false;
        state.dashboard.totals = action.payload.totals;
        state.dashboard.recentAttempts = action.payload.recentAttempts;
        state.dashboard.attemptsByRoom = action.payload.attemptsByRoom || [];
        state.dashboard.completionSummary = action.payload.completionSummary || {
          completed: 0,
          inProgress: 0,
        };
        state.dashboard.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.dashboard = false;
        state.error.dashboard = action.payload || "Dashboard load failed.";
      })
      .addCase(fetchEscapeRooms.pending, (state) => {
        state.loading.rooms = true;
        state.error.rooms = "";
      })
      .addCase(fetchEscapeRooms.fulfilled, (state, action) => {
        state.loading.rooms = false;
        state.rooms = action.payload.results;
        state.roomMeta = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        };
      })
      .addCase(fetchEscapeRooms.rejected, (state, action) => {
        state.loading.rooms = false;
        state.error.rooms = action.payload || "Room list load failed.";
      });
  },
});

export const { setRoomQuery, clearRoomError } = escapeSlice.actions;

export default escapeSlice.reducer;
