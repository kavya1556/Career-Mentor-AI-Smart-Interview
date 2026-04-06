import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, FileText, Map, Video, LogOut } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="glass" style={{ margin: '1rem', padding: '0.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backdropFilter: 'blur(12px)' }}>
            <h2 style={{ color: 'var(--primary)', fontWeight: 'bold', margin: 0 }}>SmartAI Coach</h2>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <NavLink to="/dashboard" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', transition: 'all 0.3s' })}>
                    <LayoutDashboard size={20} /> Dashboard
                </NavLink>
                <NavLink to="/upload-resume" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', transition: 'all 0.3s' })}>
                    <FileText size={20} /> Resume
                </NavLink>
                <NavLink to="/roadmap" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' })}>
                    <Map size={20} /> Roadmap
                </NavLink>
                <NavLink to="/interview" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' })}>
                    <Video size={20} /> Mock Interview
                </NavLink>
                <button onClick={handleLogout} className="btn" style={{ background: 'transparent', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LogOut size={20} /> Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
