import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, ArrowRight, BrainCircuit } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Login successful! Welcome back.', {
                style: {
                    border: '1px solid var(--primary)',
                    padding: '16px',
                    color: '#fff',
                    background: '#1a1005',
                },
                iconTheme: {
                    primary: 'var(--primary)',
                    secondary: '#FFFAEE',
                },
            });
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Login failed. Please check your credentials.', {
                style: {
                    border: '1px solid var(--danger)',
                    padding: '16px',
                    color: '#fff',
                    background: '#1a0505',
                },
                iconTheme: {
                    primary: 'var(--danger)',
                    secondary: '#FFFAEE',
                },
            });
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', position: 'relative' }}>
            {/* Left Branding Panel */}
            <div style={{ flex: 1, background: 'linear-gradient(135deg, #110803 0%, #3a1000 100%)', display: 'none', position: 'relative', '@media (min-width: 900px)': { display: 'flex' } }} className="desktop-only-flex">
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, transparent 0%, #000 100%)', opacity: 0.6, pointerEvents: 'none' }}></div>

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '4rem', height: '100%' }}>
                    <div style={{ width: '50px', height: '50px', background: 'var(--primary-glow)', borderRadius: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                        <BrainCircuit size={28} color="var(--primary)" />
                    </div>
                    <h1 style={{ fontSize: '3rem', fontWeight: '900', lineHeight: 1.1, marginBottom: '1rem', background: 'linear-gradient(to right, #fff, var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Welcome Back to SmartAI
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-dim)', maxWidth: '400px', lineHeight: 1.5 }}>
                        Continue your journey to master your AI interview skills. Reconnect to your personal coaching nexus.
                    </p>
                </div>
            </div>

            {/* Right Form Panel */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)', position: 'relative' }}>
                {/* Background ambient orbs restricted to right panel */}
                <div style={{ position: 'absolute', top: '10%', right: '10%', width: '250px', height: '250px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '250px', height: '250px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%', zIndex: 0 }}></div>

                <div className="glass" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', position: 'relative', zIndex: 1, border: '1px solid var(--glass-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                    {/* Accent Top Border */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, var(--primary), var(--accent))' }}></div>

                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ width: '60px', height: '60px', background: 'var(--primary-glow)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1rem', border: '1px solid rgba(249, 115, 22, 0.3)', boxShadow: '0 0 30px var(--primary-glow)' }}>
                            <LogIn size={28} color="var(--primary)" />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#fff', letterSpacing: '-0.02em' }}>Authentication</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>Enter credentials to access your portal</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem', position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} color="var(--text-dim)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', opacity: 0.7 }} />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', color: 'white', fontSize: '1rem', transition: 'all 0.3s', outline: 'none' }} placeholder="pilot@smartai.net" />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} color="var(--text-dim)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', opacity: 0.7 }} />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', color: 'white', fontSize: '1rem', transition: 'all 0.3s', outline: 'none' }} placeholder="••••••••" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', transition: 'all 0.3s', opacity: loading ? 0.7 : 1, border: 'none', cursor: 'pointer' }}>
                            {loading ? 'Authenticating...' : <><LogIn size={18} /> Sign In</>}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '1.5rem 0 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>
                            Don't have an account?{' '}
                            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.3s' }}>
                                Register Now <ArrowRight size={14} />
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @media (min-width: 900px) {
                    .desktop-only-flex { display: flex !important; }
                }
            `}</style>
        </div>
    );
};

export default Login;
