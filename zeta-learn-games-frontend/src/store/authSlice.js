import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import authService, { ADMIN_THEME_KEY } from "../services/authService";

const storedSession = authService.getStoredSession();

const initialState = {
  user: storedSession.user,
  accessToken: storedSession.accessToken,
  refreshToken: storedSession.refreshToken,
  status: "idle",
  error: "",
  theme: localStorage.getItem(ADMIN_THEME_KEY) || "dark",
};

export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.loginAdmin(credentials);
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to login.";
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      authService.logoutAdmin();
      state.user = null;
      state.accessToken = "";
      state.refreshToken = "";
      state.status = "idle";
      state.error = "";
    },
    clearAuthError(state) {
      state.error = "";
    },
    hydrateSession(state) {
      const session = authService.getStoredSession();
      state.user = session.user;
      state.accessToken = session.accessToken;
      state.refreshToken = session.refreshToken;
    },
    setTheme(state, action) {
      state.theme = action.payload;
      localStorage.setItem(ADMIN_THEME_KEY, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Login failed.";
      });
  },
});

export const { logout, clearAuthError, hydrateSession, setTheme } =
  authSlice.actions;

export default authSlice.reducer;
