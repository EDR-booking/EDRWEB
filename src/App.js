import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Services from './pages/Services';
import Stations from './pages/Stations';
import Pricing from './pages/Pricing';
import VerifyTicket from './pages/VerifyTicket';
import RefundTicket from './pages/RefundTicket';
import GenerateReport from './pages/GenerateReport';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/services" element={<Services />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/verify-ticket" element={<VerifyTicket />} />
            <Route path="/refund-ticket" element={<RefundTicket />} />
            <Route path="/generate-report" element={<GenerateReport />} />
            <Route path="/tickets" element={<Dashboard />} /> {/* Placeholder */}
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
