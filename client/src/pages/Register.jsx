import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, Lock, UserPlus, ArrowRight, BrainCircuit } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(formData.name, formData.email, formData.password);
            toast.success('Registration successful!', {
                style: {
                    border: '1px solid var(--accent)',
                    padding: '16px',
                    color: '#fff',
                    background: '#1a1005',
                },
                iconTheme: {
                    primary: 'var(--accent)',
                    secondary: '#FFFAEE',
                },
            });
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Registration failed. Please try again.', {
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
            <div style={{ flex: 1, background: 'linear-gradient(135deg, #180d05 0%, #301602 100%)', display: 'none', position: 'relative', '@media (min-width: 900px)': { display: 'flex' } }} className="desktop-only-flex">
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, transparent 0%, #000 100%)', opacity: 0.6, pointerEvents: 'none' }}></div>

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '4rem', height: '100%' }}>
                    <div style={{ width: '50px', height: '50px', background: 'var(--accent-glow)', borderRadius: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <BrainCircuit size={28} color="var(--accent)" />
                    </div>
                    <h1 style={{ fontSize: '3rem', fontWeight: '900', lineHeight: 1.1, marginBottom: '1rem', background: 'linear-gradient(to right, #fff, var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Initialize Your Pilot Hub
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-dim)', maxWidth: '400px', lineHeight: 1.5 }}>
                        Gain immediate access to deep-learning mock interviews, real-time proctoring telemetry, and automated personalized skill roadmaps.
                    </p>
                </div>
            </div>

            {/* Right Form Panel */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)', position: 'relative' }}>
                {/* Background ambient orbs restricted to right panel */}
                <div style={{ position: 'absolute', top: '20%', right: '10%', width: '350px', height: '350px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', bottom: '20%', left: '10%', width: '300px', height: '300px', background: 'var(--secondary)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%', zIndex: 0 }}></div>

                <div className="glass" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', position: 'relative', zIndex: 1, border: '1px solid var(--glass-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                    {/* Accent Top Border */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, var(--accent), var(--secondary))' }}></div>

                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ width: '60px', height: '60px', background: 'var(--accent-glow)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1rem', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 0 30px var(--accent-glow)' }}>
                            <UserPlus size={28} color="var(--accent)" />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#fff', letterSpacing: '-0.02em' }}>Create Account</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>Join the next generation of AI preparation</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem', position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} color="var(--text-dim)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', opacity: 0.7 }} />
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', color: 'white', fontSize: '1rem', transition: 'all 0.3s', outline: 'none' }} placeholder="John Doe" />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem', position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} color="var(--text-dim)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', opacity: 0.7 }} />
                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', color: 'white', fontSize: '1rem', transition: 'all 0.3s', outline: 'none' }} placeholder="pilot@smartai.net" />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} color="var(--text-dim)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', opacity: 0.7 }} />
                                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', color: 'white', fontSize: '1rem', transition: 'all 0.3s', outline: 'none' }} placeholder="••••••••" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', transition: 'all 0.3s', background: 'linear-gradient(135deg, var(--accent), #f97316)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Processing...' : <><UserPlus size={18} /> Create Account</>}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '1.5rem 0 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.3s' }}>
                                Sign In <ArrowRight size={14} />
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

export default Register;
