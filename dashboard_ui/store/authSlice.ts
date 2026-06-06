import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface AuthState {
  role: string | null;
  username: string | null;
}

const initialState: AuthState = {
  role: null,
  username: null,
};

export const fetchMe = createAsyncThunk<
  { username: string; role: string },
  void,
  { state: RootState }
>(
  "auth/fetchMe",
  async () => {
    const res = await fetch(`${BASE_URL}/me`, { credentials: "include" });
    if (!res.ok) throw new Error("Not authenticated");
    return res.json();
  },
  {
    // Skip if role is already hydrated — avoids redundant calls on navigation
    condition: (_, { getState }) => getState().auth.role === null,
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ role: string; username: string }>) {
      state.role = action.payload.role;
      state.username = action.payload.username;
    },
    resetAuth() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      state.role = action.payload.role;
      state.username = action.payload.username;
    });
  },
});

export const { setAuth, resetAuth } = authSlice.actions;

export const selectRole = (state: RootState) => state.auth.role;
export const selectUsername = (state: RootState) => state.auth.username;
export const selectIsAdmin = (state: RootState) => state.auth.role === "admin";

export default authSlice.reducer;
