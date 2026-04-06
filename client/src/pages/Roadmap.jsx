import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BookOpen, ExternalLink, CheckCircle, Loader, Sparkles } from 'lucide-react';

const SkeletonBar = ({ width = '100%', height = '14px', style = {} }) => (
    <div style={{
        width, height, borderRadius: '6px',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style
    }} />
);

const RoadmapSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        {[1, 2, 3, 4].map(w => (
            <div key={w} style={{ display: 'flex', gap: '3rem' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '3px solid rgba(99,102,241,0.3)', flexShrink: 0, animation: 'pulse 2s infinite' }} />
                <div className="glass" style={{ flex: 1, padding: '2.5rem' }}>
                    <SkeletonBar height="22px" width="55%" style={{ marginBottom: '1.5rem' }} />
                    <SkeletonBar height="14px" style={{ marginBottom: '0.75rem' }} />
                    <SkeletonBar height="14px" width="80%" style={{ marginBottom: '2rem' }} />
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass" style={{ flex: '1 1 200px', padding: '1.25rem', minWidth: '180px' }}>
                                <SkeletonBar height="16px" width="70%" style={{ marginBottom: '0.5rem' }} />
                                <SkeletonBar height="12px" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ))}
    </div>
);

/**
 * Renders raw Gemini markdown text as clean styled JSX.
 * Handles: ## headers, **bold**, *italic*, bullet lists, numbered lists.
 */
const RoadmapRenderer = ({ text }) => {
    if (!text) return null;
    const lines = text
        .replace(/\*\*\*/g, '')
        .split('\n')
        .map(l => l.trimEnd())
        .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''));

    const renderInline = (line) => {
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**'))
                return <strong key={i} style={{ color: 'white', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
                return <em key={i} style={{ color: '#c4b5fd' }}>{part.slice(1, -1)}</em>;
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} style={{ height: '0.5rem' }} />;

                // H1 / H2 / H3 headers
                const hMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
                if (hMatch) {
                    const level = hMatch[1].length;
                    const sizes = { 1: '1.4rem', 2: '1.15rem', 3: '1rem' };
                    return (
                        <p key={i} style={{
                            color: level === 1 ? 'white' : level === 2 ? '#a5b4fc' : '#94a3b8',
                            fontWeight: level <= 2 ? 700 : 600,
                            fontSize: sizes[level],
                            margin: level === 1 ? '1.25rem 0 0.25rem' : '0.9rem 0 0.1rem',
                            borderBottom: level === 2 ? '1px solid rgba(165,180,252,0.15)' : 'none',
                            paddingBottom: level === 2 ? '0.25rem' : 0
                        }}>{renderInline(hMatch[2])}</p>
                    );
                }
                // Bullet list
                if (/^[-•*]\s+/.test(trimmed)) {
                    return (
                        <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', paddingLeft: '0.5rem' }}>
                            <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '3px' }}>›</span>
                            <span style={{ color: '#cbd5e1', lineHeight: '1.65', fontSize: '0.9rem' }}>
                                {renderInline(trimmed.replace(/^[-•*]\s+/, ''))}
                            </span>
                        </div>
                    );
                }
                // Numbered list
                if (/^\d+\.\s+/.test(trimmed)) {
                    const num = trimmed.match(/^(\d+)/)[1];
                    return (
                        <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', paddingLeft: '0.5rem' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 700, minWidth: '1.2rem', flexShrink: 0 }}>{num}.</span>
                            <span style={{ color: '#cbd5e1', lineHeight: '1.65', fontSize: '0.9rem' }}>
                                {renderInline(trimmed.replace(/^\d+\.\s+/, ''))}
                            </span>
                        </div>
                    );
                }
                // Regular text
                return (
                    <p key={i} style={{ color: '#94a3b8', lineHeight: '1.7', margin: 0, fontSize: '0.9rem' }}>
                        {renderInline(trimmed)}
                    </p>
                );
            })}
        </div>
    );
};

const Roadmap = () => {
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRoadmap = async () => {
            try {
                const res = await api.get('/roadmap');
                setRoadmap(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchRoadmap();
    }, []);

    const generateNewRoadmap = async () => {
        setLoading(true);
        try {
            const res = await api.post('/roadmap/generate', {});
            setRoadmap(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate roadmap. Please try again.', {
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '3rem 2rem' }}>
            <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Learning Strategy</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>4-week structured plan to bridge your skill gaps</p>
                </div>
                {!roadmap && (
                    <button onClick={generateNewRoadmap} disabled={loading} className="btn btn-primary" style={{ padding: '1rem 2.5rem' }}>
                        {loading ? 'Analyzing Skills...' : 'Construct Roadmap'}
                    </button>
                )}
            </header>

            {loading && <RoadmapSkeleton />}

            {!loading && !roadmap ? (
                <div className="glass" style={{ padding: '6rem', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
                    <BookOpen size={80} color="var(--primary)" style={{ marginBottom: '2.5rem', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ecosystem Ready</h3>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '3rem', fontSize: '1.1rem' }}>Complete your resume analysis first to initialize your personalized learning path.</p>
                    <button onClick={generateNewRoadmap} disabled={loading} className="btn btn-primary" style={{ padding: '1.25rem 3.5rem' }}>
                        <Sparkles size={18} style={{ marginRight: '0.5rem' }} />
                        Generate Strategy
                    </button>
                </div>
            ) : !loading && (
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '26px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, var(--primary), transparent)' }}></div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                        {[1, 2, 3, 4].map(week => (
                            <div key={week} style={{ display: 'flex', gap: '3rem', position: 'relative' }}>
                                <div style={{ width: '54px', height: '54px', background: '#020617', border: '3px solid var(--primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)', zIndex: 1, boxShadow: '0 0 25px var(--primary-glow)' }}>
                                    {week}
                                </div>
                                <div className="glass" style={{ flex: 1, padding: '2.5rem', background: 'rgba(255,255,255,0.01)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 style={{ color: 'white', fontSize: '1.5rem' }}>
                                            Week {week}: {
                                                week === 1 ? `Core ${roadmap.jobRole || ''} Foundations` :
                                                    week === 2 ? `Advanced ${roadmap.jobRole || ''} Engineering` :
                                                        week === 3 ? 'Architecture & Scaling' :
                                                            'Final Prep & Testing'
                                            }
                                        </h3>
                                        <div className="glass" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                                            PHASE 0{week}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <p style={{ fontSize: '1.1rem', color: 'var(--text-dim)', lineHeight: '1.8' }}>
                                            {
                                                week === 1 ? `Mastering the specialized fundamentals of ${roadmap.jobRole}.` :
                                                    week === 2 ? `Deep dive into high-performance ${roadmap.jobRole} systems.` :
                                                        week === 3 ? `Scaling and orchestrating ${roadmap.jobRole} environments.` :
                                                            `Simulated ${roadmap.jobRole} interviews and final polish.`
                                            }
                                        </p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                        {/* Filter topics for current week and map them */}
                                        {roadmap.topics && roadmap.topics.filter(t => t.week === week).length > 0 ? (
                                            roadmap.topics
                                                .filter(t => t.week === week)
                                                .map((topic, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="glass roadmap-item"
                                                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(topic.title + ' ' + (roadmap.jobRole || ''))}`, '_blank')}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.02)',
                                                            padding: '1.25rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '1rem',
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <div style={{
                                                            background: idx % 2 === 0 ? 'var(--accent-glow)' : 'var(--primary-glow)',
                                                            padding: '0.5rem',
                                                            borderRadius: '0.5rem'
                                                        }}>
                                                            {idx % 2 === 0 ? <CheckCircle size={20} color="var(--accent)" /> : <BookOpen size={20} color="var(--primary)" />}
                                                        </div>
                                                        <span style={{ fontWeight: '500' }}>{topic.title}</span>
                                                        <ExternalLink size={16} color="var(--text-dim)" style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                                    </div>
                                                ))
                                        ) : (
                                            <>
                                                <div className="glass roadmap-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: 'none', opacity: 0.6 }}>
                                                    <div style={{ background: 'var(--accent-glow)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                                        <CheckCircle size={20} color="var(--accent)" />
                                                    </div>
                                                    <span style={{ fontWeight: '500' }}>Mastering Core Patterns</span>
                                                    <ExternalLink size={16} color="var(--text-dim)" style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                                </div>
                                                <div className="glass roadmap-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: 'none', opacity: 0.6 }}>
                                                    <div style={{ background: 'var(--primary-glow)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                                        <BookOpen size={20} color="var(--primary)" />
                                                    </div>
                                                    <span style={{ fontWeight: '500' }}>Architecture Deep Dive</span>
                                                    <ExternalLink size={16} color="var(--text-dim)" style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="glass" style={{ marginTop: '5rem', padding: '3rem', border: '1px solid var(--primary-glow)', background: 'rgba(99,102,241,0.03)' }}>
                        <h3 className="text-gradient" style={{ fontSize: '1.75rem', marginBottom: '2rem' }}>AI Detailed Syllabus</h3>
                        <RoadmapRenderer text={roadmap.content} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Roadmap;
