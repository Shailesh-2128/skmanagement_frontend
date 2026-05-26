import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '../routes/AppRoutes';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};
export default AppRouter;
