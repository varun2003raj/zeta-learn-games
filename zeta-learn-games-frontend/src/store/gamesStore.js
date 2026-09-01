import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import escapeReducer from "./escapeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    escape: escapeReducer,
  },
});

export default store;
