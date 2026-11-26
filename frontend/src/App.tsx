import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { DashboardLayout } from './layouts/DashboardLayout.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { BuildingsPage } from './pages/BuildingsPage.js';
import { FloorPlanPage } from './pages/FloorPlanPage.js';
import { DevicesPage } from './pages/DevicesPage.js';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage.js';
import { EnergyPage } from './pages/EnergyPage.js';
import { LightingPage } from './pages/LightingPage.js';
import { EnvironmentPage } from './pages/EnvironmentPage.js';
import { WaterPage } from './pages/WaterPage.js';
import { SafetyPage } from './pages/SafetyPage.js';
import { ParkingPage } from './pages/ParkingPage.js';
import { AccessControlPage } from './pages/AccessControlPage.js';
import { WastePage } from './pages/WastePage.js';
import { EquipmentPage } from './pages/EquipmentPage.js';
import { AutomationPage } from './pages/AutomationPage.js';
import { AlertsPage } from './pages/AlertsPage.js';
import { MaintenancePage } from './pages/MaintenancePage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Authenticated Dashboard Operations Console */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/buildings" element={<BuildingsPage />} />
            <Route path="/floors-rooms" element={<FloorPlanPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/live" element={<LiveMonitoringPage />} />
            <Route path="/energy" element={<EnergyPage />} />
            <Route path="/lighting" element={<LightingPage />} />
            <Route path="/environment" element={<EnvironmentPage />} />
            <Route path="/water" element={<WaterPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/parking" element={<ParkingPage />} />
            <Route path="/access-control" element={<AccessControlPage />} />
            <Route path="/waste" element={<WastePage />} />
            <Route path="/equipment" element={<EquipmentPage />} />
            <Route path="/automation" element={<AutomationPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
