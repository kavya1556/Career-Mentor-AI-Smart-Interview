import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';
import { Upload, CheckCircle, Cpu, AlertCircle, Zap, Target, TrendingUp } from 'lucide-react';

// ── Animated skeleton loader ─────────────────────────────────────────────────
const SkeletonBar = ({ width = '100%', height = '12px', style = {} }) => (
    <div style={{
        width, height, borderRadius: '6px',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style
    }} />
);

// ── Progress step indicator ──────────────────────────────────────────────────
const steps = ['Extracting text…', 'Parsing skills with AI…', 'Analysing skill gaps…', 'Generating insights…'];

const ProgressSteps = ({ activeStep }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        {steps.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: i <= activeStep ? 1 : 0.3, transition: 'opacity 0.4s' }}>
                <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i < activeStep ? 'var(--accent)' : i === activeStep ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    boxShadow: i === activeStep ? '0 0 12px var(--primary-glow)' : 'none',
                    transition: 'all 0.4s'
                }}>
                    {i < activeStep
                        ? <CheckCircle size={14} color="white" />
                        : <span style={{ fontSize: '0.65rem', fontWeight: 700, color: i === activeStep ? 'white' : 'rgba(255,255,255,0.4)' }}>{i + 1}</span>
                    }
                </div>
                <span style={{ fontSize: '0.875rem', color: i === activeStep ? 'white' : 'var(--text-dim)', fontWeight: i === activeStep ? 600 : 400 }}>{label}</span>
                {i === activeStep && <div style={{ marginLeft: 'auto', display: 'flex', gap: '3px' }}>
                    {[0, 1, 2].map(d => (
                        <div key={d} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', animation: `bounce 1s ${d * 0.2}s infinite` }} />
                    ))}
                </div>}
            </div>
        ))}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const ResumeUpload = () => {
    const [file, setFile] = useState(null);
    const [jobRole, setJobRole] = useState('Software Engineer');
    const [loading, setLoading] = useState(false);
    const [progressStep, setProgressStep] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const onDrop = useCallback(acceptedFiles => {
        setFile(acceptedFiles[0]);
        setResult(null);
        setError(null);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
            'text/plain': ['.txt'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        multiple: false
    });

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setProgressStep(0);

        // Simulate incremental progress while waiting for the AI
        const timers = [
            setTimeout(() => setProgressStep(1), 1200),
            setTimeout(() => setProgressStep(2), 3500),
            setTimeout(() => setProgressStep(3), 6000),
        ];

        try {
            const formData = new FormData();
            formData.append('resume', file);
            formData.append('job_role', jobRole);

            const res = await api.post('/resume/upload', formData);
            timers.forEach(clearTimeout);
            setProgressStep(4); // all done
            setResult(res.data);
        } catch (err) {
            timers.forEach(clearTimeout);
            console.error(err);
            setError('Analysis failed. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const gapScore = result?.gap_analysis?.gap_score ?? 0;
    const scoreColor = gapScore >= 70 ? 'var(--accent)' : gapScore >= 40 ? '#f59e0b' : 'var(--danger)';

    return (
        <div className="container">
            <style>{`
                @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                @keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
                @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                .result-card { animation: fadeUp 0.5s ease forwards; }
            `}</style>

            <header style={{ marginBottom: '3rem' }}>
                <h1 className="text-gradient">Resume Analysis</h1>
                <p style={{ color: 'var(--text-dim)' }}>Upload your resume — AI extracts skills and identifies gaps in seconds</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {/* ── Upload Panel ── */}
                <div className="glass" style={{ padding: '2rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>Target Job Role</label>
                        <input
                            type="text"
                            value={jobRole}
                            onChange={(e) => setJobRole(e.target.value)}
                            disabled={loading}
                            placeholder="e.g., Senior Fullstack Developer, Product Manager..."
                            style={{ 
                                marginTop: '0.5rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                padding: '0.875rem 1rem',
                                borderRadius: '0.5rem',
                                width: '100%'
                            }}
                        />
                    </div>

                    <div
                        {...getRootProps()}
                        className="glass"
                        style={{
                            padding: '3rem', textAlign: 'center', cursor: loading ? 'not-allowed' : 'pointer',
                            border: `2px dashed ${isDragActive ? 'var(--primary)' : file ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                            transition: 'border-color 0.3s, background 0.3s',
                            background: isDragActive ? 'rgba(99,102,241,0.05)' : 'transparent',
                            opacity: loading ? 0.6 : 1,
                            borderRadius: '1rem'
                        }}
                    >
                        <input {...getInputProps()} disabled={loading} />
                        {file
                            ? <CheckCircle size={48} color="var(--accent)" style={{ marginBottom: '1rem' }} />
                            : <Upload size={48} color={isDragActive ? 'var(--primary)' : 'var(--text-dim)'} style={{ marginBottom: '1rem' }} />
                        }
                        <p style={{ fontWeight: 500 }}>
                            {file ? file.name : 'Drag & drop resume, or click to select'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                            PDF, DOCX, DOC, TXT or Images · Max 5MB
                        </p>
                    </div>

                    {loading && <ProgressSteps activeStep={progressStep} />}

                    {error && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <AlertCircle size={18} color="var(--danger)" />
                            <span style={{ fontSize: '0.875rem', color: '#fca5a5' }}>{error}</span>
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {loading ? <><Cpu size={18} className="animate-spin" /> Analysing…</> : <><Zap size={18} /> Analyse Resume</>}
                    </button>
                </div>

                {/* ── Results Panel ── */}
                {loading && !result && (
                    <div className="glass" style={{ padding: '2rem' }}>
                        <SkeletonBar height="24px" width="60%" style={{ marginBottom: '2rem' }} />
                        <SkeletonBar height="8px" style={{ marginBottom: '0.5rem' }} />
                        <SkeletonBar height="8px" width="80%" style={{ marginBottom: '2rem' }} />
                        <SkeletonBar height="16px" width="40%" style={{ marginBottom: '1rem' }} />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                            {[90, 70, 110, 80, 95, 65].map((w, i) => (
                                <SkeletonBar key={i} width={`${w}px`} height="28px" style={{ borderRadius: '2rem' }} />
                            ))}
                        </div>
                        <SkeletonBar height="16px" width="40%" style={{ marginBottom: '1rem' }} />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {[80, 100, 70, 90].map((w, i) => (
                                <SkeletonBar key={i} width={`${w}px`} height="28px" style={{ borderRadius: '2rem' }} />
                            ))}
                        </div>
                    </div>
                )}

                {result && (
                    <div className="glass result-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <CheckCircle color="var(--accent)" /> Analysis Complete
                        </h3>

                        {/* Score */}
                        <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: `1px solid ${scoreColor}33` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)' }}>
                                    <Target size={16} /> Readiness Score
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.5rem', color: scoreColor }}>{gapScore}%</span>
                                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '2rem', background: `${scoreColor}22`, color: scoreColor, border: `1px solid ${scoreColor}44` }}>
                                        {result.gap_analysis?.readiness_level}
                                    </span>
                                </div>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${gapScore}%`, height: '100%', background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}bb)`, borderRadius: '4px', transition: 'width 1s ease' }} />
                            </div>
                        </div>

                        {/* Matched Skills */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <TrendingUp size={16} color="var(--accent)" /> Extracted Skills
                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                    {result.resume?.skills?.length ?? result.skills?.length ?? 0} found
                                </span>
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {(result.resume?.skills || result.skills || []).map((skill, i) => (
                                    <span key={i} style={{ padding: '0.25rem 0.75rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '2rem', fontSize: '0.8rem' }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Missing Skills */}
                        {result.gap_analysis?.missing_skills?.length > 0 && (
                            <div>
                                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertCircle size={16} color="var(--danger)" /> Skills to Improve
                                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                        {result.gap_analysis.missing_skills.length} gaps
                                    </span>
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {result.gap_analysis.missing_skills.map((skill, i) => (
                                        <span key={i} style={{ padding: '0.25rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '2rem', fontSize: '0.8rem', color: '#fca5a5' }}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeUpload;
