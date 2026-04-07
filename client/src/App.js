import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './pages/ResumeUpload';
import Roadmap from './pages/Roadmap';
import MockInterview from './pages/MockInterview';

const PrivateRoute = ({ children }) => {
    const { user, loading } = React.useContext(AuthContext);
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

const AppContent = () => {
    const { user } = React.useContext(AuthContext);
    const isAuthPage = !user; // Navbar returns null id no user

    return (
        <div style={{ minHeight: '100vh', paddingBottom: isAuthPage ? '0' : '3rem' }}>
            <Navbar />
            <div style={{ paddingTop: isAuthPage ? '0' : '80px' }}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/upload-resume" element={<PrivateRoute><ResumeUpload /></PrivateRoute>} />
                    <Route path="/roadmap" element={<PrivateRoute><Roadmap /></PrivateRoute>} />
                    <Route path="/interview" element={<PrivateRoute><MockInterview /></PrivateRoute>} />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </div>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Toaster position="top-center" reverseOrder={false} />
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;
