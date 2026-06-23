import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';

import Overview from './pages/Overview';
import Users from './pages/Users';
import Buses from './pages/Buses';
import Schedules from './pages/Schedules';
import RoutesPage from './pages/Routes';
import Bookings from './pages/Bookings';
import BusRequests from './pages/BusRequests';
import Settings from './pages/Settings';
import LiveTracking from './pages/LiveTracking';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="flex-center" style={{ height: '100vh' }}>
      <div className="spinner" style={{ borderTopColor: 'var(--primary)' }}></div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<LiveTracking />} />
              <Route path="overview" element={<Overview />} />
              <Route path="users" element={<Users />} />
              <Route path="buses" element={<Buses />} />
              <Route path="schedules" element={<Schedules />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="bus-requests" element={<BusRequests />} />
              <Route path="settings" element={<Settings />} />
              <Route path="live-tracking" element={<LiveTracking />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
