import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const storedUser = localStorage.getItem('authUser');
  if (!storedUser) return null;

  try {
    const parsedUser = JSON.parse(storedUser) as AuthUser;
    if (!parsedUser?.id || !parsedUser?.email || !parsedUser?.role) {
      return null;
    }
    return parsedUser;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: getStoredUser(),
  token: getStoredToken(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload.token);
        localStorage.setItem('authUser', JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authUser');
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
