import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/auth.types';
import tokenService from '../../services/token.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: tokenService.getUser<User>(),
  isAuthenticated: !!tokenService.getAccessToken(),
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; access: string; refresh: string }>
    ) => {
      const { user, access, refresh } = action.payload;
      state.user = user;
      state.isAuthenticated = true;
      tokenService.setUser(user);
      tokenService.setAccessToken(access);
      tokenService.setRefreshToken(refresh);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      tokenService.setUser(action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      tokenService.clear();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, updateUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
