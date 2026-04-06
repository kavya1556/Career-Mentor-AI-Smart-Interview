import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Award, Clock, Activity, Zap, ShieldCheck, ChevronRight, X, User, Bot, Star } from 'lucide-react';

const Dashboard = () => {
    const [progress, setProgress] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [showAllLogs, setShowAllLogs] = useState(false);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchProgress = async () => {
        try {
            const res = await api.get('/progress');
            setProgress(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSessionDetails = async (sessionId) => {
        setModalLoading(true);
        try {
            const res = await api.get(`/progress/session/${sessionId}`);
            setSelectedSession(res.data);
        } catch (err) {
            console.error("Error fetching session details:", err);
        } finally {
            setModalLoading(false);
        }
    };

    useEffect(() => {
        fetchProgress();
    }, []);

    if (!progress) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '2rem' }}>
            <div className="pulse" style={{ width: '100px', height: '100px', border: '2px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            <h2 className="text-gradient">Initializing Dashboard Nexus...</h2>
        </div>
    );

    return (
        <div className="container" style={{ padding: '3rem 2rem', position: 'relative' }}>
            {/* Ambient Background Glows */}
            <div style={{ position: 'absolute', top: '-10%', left: '0%', width: '40vw', height: '40vw', background: 'var(--primary)', filter: 'blur(200px)', opacity: 0.1, borderRadius: '50%', zIndex: -1, pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', bottom: '-20%', right: '0%', width: '40vw', height: '40vw', background: 'var(--secondary)', filter: 'blur(200px)', opacity: 0.1, borderRadius: '50%', zIndex: -1, pointerEvents: 'none' }}></div>

            <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem 1rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--primary)', borderRadius: '2rem', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.05em' }}>
                            <div className="pulse" style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }}></div>
                            SYSTEM ONLINE
                        </div>
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 20%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Welcome, {user?.name?.split(' ')[0] || 'User'}
                    </h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem', marginTop: '0.5rem', fontWeight: '300' }}>Your AI-driven preparation nexus is fully synchronized.</p>
                </div>

                <button onClick={() => navigate('/interview')} className="btn btn-primary" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(135deg, var(--primary), var(--accent))', border: 'none', boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)' }}>
                    <Zap size={20} />
                    <span style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>INITIATE INTERVIEW</span>
                </button>
            </header>

            {/* Top Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                {[
                    { title: "Average Score", value: `${progress.averageScore}%`, icon: <Award size={32} color="var(--primary)" />, color: "var(--primary)", glow: "var(--primary-glow)" },
                    { title: "Missions Completed", value: progress.sessions.length, icon: <Activity size={32} color="var(--accent)" />, color: "var(--accent)", glow: "var(--accent-glow)" },
                    {
                        title: "System Readiness",
                        value: progress.capabilities && progress.capabilities.length > 0 ? (progress.averageScore > 70 ? "Optimal" : "Operational") : "Incomplete",
                        icon: <ShieldCheck size={32} color="var(--secondary)" />,
                        color: "var(--secondary)",
                        glow: "rgba(16, 185, 129, 0.15)"
                    }
                ].map((stat, i) => (
                    <div key={i} className="glass" style={{ padding: '1.5rem 2rem', position: 'relative', overflow: 'hidden', borderTop: `2px solid ${stat.color}`, transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '80px', height: '80px', background: stat.glow, filter: 'blur(35px)', borderRadius: '50%', zIndex: 0 }}></div>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.75rem', border: `1px solid rgba(255,255,255,0.05)` }}>
                                {React.cloneElement(stat.icon, { size: 24 })}
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15rem', fontWeight: '600' }}>{stat.title}</h4>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', margin: 0 }}>{stat.value}</h2>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
                <div className="glass" style={{ padding: '3rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}><TrendingUp color="var(--primary)" /> Performance Telemetry</h3>
                    </div>
                    <div style={{ height: '320px', width: '100%' }}>
                        {progress.sessions.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-dim)' }}>
                                <Activity size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '1rem' }} />
                                <p style={{ fontStyle: 'italic' }}>Awaiting first mission initialization.</p>
                                <button onClick={() => navigate('/interview')} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>Initiate Interview</button>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={[...progress.sessions].reverse()} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={(str) => str ? new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''} stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                    <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '5 5' }} contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--primary)', borderRadius: '0.5rem', backdropFilter: 'blur(10px)', color: 'white' }} />
                                    <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={4} dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: 'var(--primary)' }} activeDot={{ r: 8, fill: 'var(--primary)', strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="glass" style={{ padding: '3rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Clock color="var(--accent)" /> Mission Logs</h3>
                        <button
                            onClick={() => setShowAllLogs(prev => !prev)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            {showAllLogs ? 'SHOW LESS' : 'VIEW ALL'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
                        {progress.sessions.length === 0 ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-dim)', fontStyle: 'italic' }}>No mission logs found.</div>
                        ) : (
                            progress.sessions.slice(showAllLogs ? 0 : -4).reverse().map((session, idx) => (
                                <div
                                    key={idx}
                                    className="glass"
                                    style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', cursor: 'pointer' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                                    onClick={() => fetchSessionDetails(session._id)}
                                >
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-glow)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'white', letterSpacing: '0.02em', marginBottom: '0.25rem' }}>Log #{session._id?.substring(0, 8) || `M-${Math.floor(Math.random() * 10000)}`}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{session.date ? new Date(session.date).toLocaleString() : 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ padding: '0.5rem 1rem', background: session.score >= 70 ? 'var(--accent-glow)' : 'var(--primary-glow)', color: session.score >= 70 ? 'var(--accent)' : 'var(--primary)', fontWeight: '800', fontSize: '1.1rem', borderRadius: '0.5rem', border: `1px solid ${session.score >= 70 ? 'rgba(236,72,153,0.3)' : 'rgba(56,189,248,0.3)'}` }}>
                                            {session.score || 0}%
                                        </div>
                                        <ChevronRight size={20} color="var(--text-dim)" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
                <div className="glass" style={{ padding: '3rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '30%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--secondary), transparent)' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Award color="var(--secondary)" /> Capability Matrix</h3>
                    </div>
                    <div style={{ height: '350px', width: '100%' }}>
                        {(!progress.capabilities || progress.capabilities.length === 0) ? (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-dim)' }}>
                                <ShieldCheck size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '1rem' }} />
                                <p style={{ fontStyle: 'italic' }}>Awaiting initial skill analysis.</p>
                                <button onClick={() => navigate('/upload-resume')} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>Upload Resume to Scan Parameters</button>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={progress.capabilities} margin={{ top: 20, right: 0, left: -20, bottom: 5 }} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} dx={-10} domain={[0, 100]} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--primary)', borderRadius: '0.5rem', backdropFilter: 'blur(10px)', color: 'white' }} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60} minPointSize={5}>
                                        {progress.capabilities.map((entry, index) => {
                                            let color = "var(--primary)";
                                            if (index % 3 === 1) color = "var(--accent)";
                                            if (index % 3 === 2) color = "var(--secondary)";
                                            return <Cell key={`cell-${index}`} fill={color} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Mission Transcript Modal */}
            {(selectedSession || modalLoading) && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.95)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', backdropFilter: 'blur(10px)' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', animation: 'slideUp 0.4s ease-out' }}>

                        {/* Modal Header */}
                        <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                            <div>
                                <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem' }}>Mission Intelligence Transcript</h2>
                                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                    Session ID: #{selectedSession?.id?.substring(0, 10).toUpperCase() || 'SYNCHRONIZING...'}
                                </p>
                            </div>
                            <button onClick={() => setSelectedSession(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            {modalLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1.5rem' }}>
                                    <div className="pulse" style={{ width: '60px', height: '60px', border: '2px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
                                    <p style={{ color: 'var(--text-dim)' }}>Accessing secure logs...</p>
                                </div>
                            ) : selectedSession?.transcript?.map((item, i) => (
                                <div key={i} style={{ borderBottom: i !== selectedSession.transcript.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', paddingBottom: '2.5rem' }}>
                                    {/* Question */}
                                    <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                        <div style={{ background: 'var(--primary-glow)', padding: '0.75rem', borderRadius: '0.75rem', height: 'fit-content' }}>
                                            <Bot size={20} color="var(--primary)" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>AI EXAMINER</p>
                                            <p style={{ color: 'white', fontSize: '1.1rem', lineHeight: '1.6', margin: 0 }}>{item.question}</p>
                                        </div>
                                    </div>

                                    {/* Answer */}
                                    <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2rem', paddingLeft: '2rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '0.75rem', height: 'fit-content' }}>
                                            <User size={20} color="white" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ color: 'var(--text-dim)', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>CANDIDATE RESPONSE</p>
                                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>"{item.answer}"</p>
                                        </div>
                                    </div>

                                    {/* Feedback */}
                                    <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '1rem', padding: '1.5rem', marginLeft: '3.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                                                <Star size={16} fill="var(--accent)" />
                                                <span style={{ fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>Evaluation Feedback</span>
                                            </div>
                                            <div style={{ color: 'var(--accent)', fontWeight: '900', fontSize: '1.25rem' }}>{item.score}%</div>
                                        </div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>{item.comments}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.2)' }}>
                            <button onClick={() => setSelectedSession(null)} className="btn" style={{ background: 'white', color: 'black', padding: '0.75rem 2.5rem', fontWeight: 'bold' }}>Close Logistics</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(50px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            `}</style>
        </div>
    );
};

export default Dashboard;
