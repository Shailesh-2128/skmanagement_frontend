import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { RootState, AppDispatch } from '../app/store';
import { logout as logoutAction } from '../features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  const logout = () => {
    dispatch(logoutAction());
    queryClient.clear();
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isCuttingUser = user?.role === 'CUTTING';
  const isSaasOwner = user?.role === 'SAAS_OWNER';

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    isSuperAdmin,
    isManager,
    isCuttingUser,
    isSaasOwner,
  };
};
export default useAuth;
