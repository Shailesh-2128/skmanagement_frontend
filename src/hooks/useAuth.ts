import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../app/store';
import { logout as logoutAction } from '../features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  const logout = () => {
    dispatch(logoutAction());
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isManager = user?.role === 'MANAGER';

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    isSuperAdmin,
    isManager,
  };
};
export default useAuth;
