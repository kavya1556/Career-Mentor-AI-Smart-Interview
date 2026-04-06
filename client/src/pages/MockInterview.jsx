import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AlertCircle, CheckCircle, ChevronRight, Video, Mic, MicOff, Maximize, ShieldAlert, X, Volume2, ThumbsUp, AlertTriangle, Star } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Converts raw Gemini markdown text into clean readable JSX.
 * Handles: **bold**, *italic*, bullet points (- or *), numbered lists.
 */
const FeedbackText = ({ text, style = {} }) => {
    if (!text) return null;

    // Split into lines and process each
    const lines = text
        .replace(/\*\*\*/g, '')          // remove triple asterisks
        .replace(/---+/g, '')            // remove horizontal rules
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

    const renderInline = (line) => {
        // Convert **text** to <strong> and *text* to <em>
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} style={{ color: 'white', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                return <em key={i} style={{ color: '#c4b5fd' }}>{part.slice(1, -1)}</em>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', ...style }}>
            {lines.map((line, i) => {
                // Bullet point lines
                if (/^[-•*]\s+/.test(line)) {
                    const content = line.replace(/^[-•*]\s+/, '');
                    return (
                        <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                            <span style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }}>›</span>
                            <span style={{ color: '#d1d5db', lineHeight: '1.6', fontSize: '0.9rem' }}>{renderInline(content)}</span>
                        </div>
                    );
                }
                // Numbered list
                if (/^\d+\.\s+/.test(line)) {
                    const num = line.match(/^(\d+)\.\s+/)[1];
                    const content = line.replace(/^\d+\.\s+/, '');
                    return (
                        <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 700, minWidth: '20px', flexShrink: 0 }}>{num}.</span>
                            <span style={{ color: '#d1d5db', lineHeight: '1.6', fontSize: '0.9rem' }}>{renderInline(content)}</span>
                        </div>
                    );
                }
                // Heading lines (# or ##)
                if (/^#{1,3}\s+/.test(line)) {
                    const content = line.replace(/^#{1,3}\s+/, '');
                    return <p key={i} style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', margin: '0.25rem 0 0' }}>{renderInline(content)}</p>;
                }
                // Regular paragraph
                return (
                    <p key={i} style={{ color: '#d1d5db', lineHeight: '1.7', margin: 0, fontSize: '0.9rem' }}>
                        {renderInline(line)}
                    </p>
                );
            })}
        </div>
    );
};

const MockInterview = () => {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(false);
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [setupPhase, setSetupPhase] = useState(true);
    const [interviewHistory, setInterviewHistory] = useState([]);
    const [isSummaryVisible, setIsSummaryVisible] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const navigate = useNavigate();

    // Video & Audio
    const videoRef = useRef(null);
    const previewRef = useRef(null);
    const audioRef = useRef(null);
    const [isListening, setIsListening] = useState(false);

    const [warnings, setWarnings] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const recognitionRef = useRef(null);
    const streamRef = useRef(null);

    const showToast = (message) => {
        toast.error(message, {
            style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #ef4444'
            }
        });
    };

    useEffect(() => {
        let warningTimeout;
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // Stop camera to save resources and privacy when tab is hidden
                stopCamera();

                if (interviewStarted && !showWarning) {
                    setWarnings(prev => prev + 1);
                    setShowWarning(true);
                    warningTimeout = setTimeout(() => setShowWarning(false), 5000);
                }
            } else if (document.visibilityState === 'visible') {
                // Restart camera when they return to the tab
                if (setupPhase) {
                    startCamera(previewRef);
                } else if (interviewStarted && !isSummaryVisible) {
                    startCamera(videoRef);
                }
            }
        };

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        window.addEventListener('blur', handleVisibilityChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            if (warningTimeout) clearTimeout(warningTimeout);
            window.removeEventListener('blur', handleVisibilityChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [interviewStarted, showWarning]);

    const speakQuestion = async (text) => {
        if (!text) return;

        // Stop any current audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        try {
            const res = await api.post('/interview/voice', { text });
            if (res.data.audio) {
                const audio = new Audio(res.data.audio);
                audioRef.current = audio;
                audio.onended = () => {
                    if (!feedback && !isSummaryVisible) {
                        startListening();
                    }
                };
                audio.play();
            }
        } catch (err) {
            console.error("Neural Voice Error:", err);
            // Fallback to basic synth if backend fails
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => {
                if (!feedback && !isSummaryVisible) {
                    startListening();
                }
            };
            window.speechSynthesis.speak(utterance);
        }
    };

    const checkPermissions = async () => {
        console.log("[SmartAI] Starting Hardware Access Check...");
        
        const hasMediaDevices = !!(navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        if (!hasMediaDevices) {
            toast.error("Security/Hardware Block: Access requires a secure (HTTPS/localhost) connection.", { 
                icon: '🔒', 
                duration: 6000 
            });
            return false;
        }

        try {
            // Attempt to capture stream. This will trigger the browser permission prompt
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            // If we got here, user granted access
            if (stream) {
                stream.getTracks().forEach(t => t.stop()); // Release hardware immediately
                return true;
            }
            return false;
        } catch (err) {
            console.error("[SmartAI] Hardware access error details:", err);
            
            const errName = err.name || 'Error';
            const errMsg = err.message || '';
            const isDenied = errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.toLowerCase().includes('permission');
            
            if (isDenied) {
                toast.error("Access Blocked: Please click the 'Lock' icon in your address bar and allow Camera/Mic access.", { id: 'media-denied' });
            } else {
                toast.error(`Hardware Init Failed: ${errName}. Check if other apps are using your camera.`);
            }
            return false;
        }
    };

    const startCamera = async (targetRef) => {
        if (!targetRef || !targetRef.current) return;

        // Before requesting, clear any previous stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            targetRef.current.srcObject = stream;

            // Explicitly wait for video to be ready before playing
            targetRef.current.onloadedmetadata = async () => {
                try {
                    await targetRef.current.play();
                } catch (e) {
                    console.error("Video play failed:", e);
                }
            };
            return true;
        } catch (err) {
            console.error("Camera access failed:", err.name);
            return false;
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    useEffect(() => {
        // Cleanup all media streams and recognition on unmount
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (setupPhase && cameraActive) {
            startCamera(previewRef);
        }
    }, [setupPhase, cameraActive]);

    useEffect(() => {
        if (interviewStarted) {
            startCamera(videoRef);
        }
    }, [interviewStarted]);

    useEffect(() => {
        const playVoice = () => {
            if (interviewStarted && questions.length > 0 && !feedback && !isSummaryVisible) {
                const currentQ = questions[currentIndex]?.text || questions[currentIndex]?.Text;
                if (currentQ) {
                    // Slight delay to ensure UI transition finishes
                    setTimeout(() => speakQuestion(currentQ), 800);
                }
            }
        };

        // Some browsers need a tiny kick to load voices
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = playVoice;
        } else {
            playVoice();
        }
    }, [currentIndex, interviewStarted, questions, feedback, isSummaryVisible]);

    useEffect(() => {
        if (interviewStarted) {
            document.title = "SmartAI | Proctored Assessment";
        } else {
            document.title = "SmartAI | Proctoring Lab";
        }
    }, [interviewStarted]);

    const enterFullscreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        }
    };

    const startInterview = async () => {
        setLoading(true);
        try {
            const res = await api.post('/interview/start', {});
            setQuestions(res.data.questions);
            setSetupPhase(false);
            setInterviewStarted(true);
            setCurrentIndex(0);
            enterFullscreen();
        } catch (err) {
            console.error(err);
            showToast('Unable to synchronize with AI Engine. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const quitInterview = () => {
        setShowQuitConfirm(true);
    };

    const confirmQuit = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        stopCamera();
        navigate('/dashboard');
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) || isListening) return;

        try {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognitionRef.current = recognition;

            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setAnswer(prev => prev + ' ' + event.results[i][0].transcript);
                    }
                }
            };
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event) => {
                console.error("Speech Error:", event.error);
                setIsListening(false);
            };

            recognition.start();
        } catch (e) {
            console.error("Error starting recognition:", e);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
    };

    const handleSpeech = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const submitAnswer = async () => {
        if (!answer.trim()) return;
        stopListening(); // Stop mic before submitting
        setLoading(true);
        try {
            const res = await api.post('/interview/submit', {
                question_id: questions[currentIndex]._id,
                answer_text: answer
            });

            const newFeedback = res.data.feedback;
            setFeedback(newFeedback);

            // Record in history for final summary
            setInterviewHistory(prev => [...prev, {
                question: questions[currentIndex]?.text || questions[currentIndex]?.Text,
                answer: answer,
                feedback: newFeedback
            }]);

            // AUTO-ADVANCE LOGIC: Show feedback for 6 seconds then move on
            if (currentIndex < questions.length - 1) {
                setTransitioning(true);
                setTimeout(() => {
                    nextQuestion();
                    setTransitioning(false);
                }, 7000);
            } else {
                // Final question finished — stop camera immediately
                stopCamera();
                if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
                setTimeout(() => {
                    setIsSummaryVisible(true);
                    if (document.fullscreenElement) document.exitFullscreen();
                }, 5000);
            }
        } catch (err) {
            console.error(err);
            showToast('Transmission Error: Failed to evaluate your response.');
        } finally {
            setLoading(false);
        }
    };

    const nextQuestion = () => {
        setFeedback(null);
        setAnswer('');
        setCurrentIndex(currentIndex + 1);
    };

    // Render 2: Final Summary Phase
    if (isSummaryVisible) {
        const averageScore = Math.round(interviewHistory.reduce((acc, h) => acc + (h.feedback.score || 0), 0) / interviewHistory.length);
        return (
            <div style={{ background: '#020617', minHeight: '100vh', padding: '4rem 2rem' }}>
                <div className="container" style={{ maxWidth: '1200px' }}>
                    <div className="glass" style={{ padding: '2rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '1.5rem', marginBottom: '3rem', textAlign: 'center', animation: 'slideUp 0.8s ease-out' }}>
                        <CheckCircle size={40} color="var(--accent)" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Assessment Completed Successfully</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>
                            Thank you for attending the SmartAI Proctoted Interview. You've demonstrated great commitment to your professional growth. Your performance data has been analyzed and is ready for review below.
                        </p>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Interview Performance Report</h1>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>Comprehensive analysis of your technical and behavioral competence.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
                        <div className="glass" style={{ padding: '2rem', textAlign: 'center', border: '2px solid var(--primary)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem', letterSpacing: '2px' }}>OVERALL SCORE</div>
                            <div style={{ fontSize: '4rem', fontWeight: '900', color: 'var(--primary)' }}>{averageScore}%</div>
                        </div>
                        <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem', letterSpacing: '2px' }}>TECHNICAL READINESS</div>
                            <div style={{ fontSize: '4rem', fontWeight: '900', color: 'var(--accent)' }}>{averageScore > 80 ? 'HIGH' : averageScore > 60 ? 'MID' : 'LOW'}</div>
                        </div>
                        <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem', letterSpacing: '2px' }}>STATUS</div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', padding: '1rem 0', color: 'white' }}>{averageScore > 75 ? 'Qualified' : 'Needs Polish'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {interviewHistory.map((h, i) => (
                            <div key={i} className="glass" style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.3rem', color: 'white', maxWidth: '80%' }}>{i + 1}. {h.question}</h3>
                                    <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>SCORE: {h.feedback.score}%</div>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Your Response</p>
                                    <p style={{ color: 'white', lineHeight: '1.6' }}>{h.answer}</p>
                                </div>
                                {/* Summary feedback — clean rendering */}
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div className="glass" style={{ flex: '1 1 260px', padding: '1rem', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.02)', borderRadius: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <ThumbsUp size={13} color="var(--accent)" />
                                            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.75rem' }}>STRENGTHS</span>
                                        </div>
                                        {h.feedback.strengths?.length > 0
                                            ? <FeedbackText text={h.feedback.strengths.join('\n')} />
                                            : <FeedbackText text={h.feedback.comments} />
                                        }
                                    </div>
                                    {h.feedback.areas_of_improvement?.length > 0 && (
                                        <div className="glass" style={{ flex: '1 1 260px', padding: '1rem', border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.02)', borderRadius: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                <AlertTriangle size={13} color="#f59e0b" />
                                                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.75rem' }}>TO IMPROVE</span>
                                            </div>
                                            <FeedbackText text={h.feedback.areas_of_improvement.join('\n')} />
                                        </div>
                                    )}
                                </div>
                                {h.feedback.matched_keywords?.length > 0 && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Keywords used: </span>
                                        {h.feedback.matched_keywords.map((kw, j) => (
                                            <span key={j} style={{ display: 'inline-block', margin: '0.15rem 0.2rem', padding: '0.1rem 0.5rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '2rem', fontSize: '0.72rem', color: '#a5b4fc' }}>{kw}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '5rem' }}>
                        <button onClick={() => { stopCamera(); navigate('/dashboard'); }} className="btn btn-primary" style={{ padding: '1.5rem 5rem', fontSize: '1.2rem' }}>
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Render 1: Setup Phase
    if (setupPhase) {
        // ... (existing code)
        return (
            <div className="container" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="glass" style={{ padding: '3rem', maxWidth: '1000px', width: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>
                    <div>
                        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Ready to Begin?</h1>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', lineHeight: '1.8' }}>
                            Welcome to the SmartAI Proctoring Lab. Please ensure your environment is quiet and your face is clearly visible in the preview.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '12px', height: '12px', background: 'var(--accent)', borderRadius: '50%' }}></div>
                                <span>External monitor: <b>Connected & Monitored</b></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '12px', height: '12px', background: 'var(--accent)', borderRadius: '50%' }}></div>
                                <span>Voice recognition: <b>Initialized</b></span>
                            </div>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem' }}>
                            <li style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                                <ShieldAlert color="var(--primary)" size={18} /> Exit fullscreen will pause the session.
                            </li>
                            <li style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                                <Video color="var(--primary)" size={18} /> Camera must stay active.
                            </li>
                        </ul>

                        {!cameraActive ? (
                            <button
                                onClick={async () => {
                                    const granted = await checkPermissions();
                                    if (granted) setCameraActive(true);
                                }}
                                className="btn btn-primary"
                                style={{ padding: '1.25rem 4rem', fontSize: '1.2rem', borderRadius: '1rem', width: '100%' }}
                            >
                                Initialize Camera & Mic
                            </button>
                        ) : (
                            <button onClick={startInterview} disabled={loading} className="btn btn-primary" style={{ padding: '1.25rem 4rem', fontSize: '1.2rem', borderRadius: '1rem', width: '100%' }}>
                                {loading ? 'Booting AI Context...' : 'Authorize & Start Interview'}
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="glass" style={{ height: '350px', background: '#000', borderRadius: '1rem', overflow: 'hidden', position: 'relative', border: '2px solid var(--primary-glow)' }}>
                            {cameraActive ? (
                                <video ref={previewRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem', color: 'var(--text-dim)' }}>
                                    <Video size={48} opacity={0.3} />
                                    <p style={{ fontSize: '0.8rem' }}>Hardware dormant. Click initialize above.</p>
                                </div>
                            )}
                            {cameraActive && (
                                <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '25px', fontSize: '0.8rem', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                                    PREVIEW ACTIVE
                                </div>
                            )}
                        </div>
                        <div className="glass" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                            <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.9rem' }}>Mic Check: <span style={{ color: 'var(--accent)' }}>Level Normal</span></p>
                        </div>
                    </div>
                </div>

                <button onClick={() => window.location.href = '/dashboard'} style={{ marginTop: '2rem', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                    Cancel and Return to Dashboard
                </button>
            </div>
        );
    }

    const currentQ = questions[currentIndex];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#020617',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden'
        }}>

            {/* Aggressive Red Viewport Border - Appears on Breaches */}
            {showWarning && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, border: '6px solid var(--danger)', pointerEvents: 'none', zIndex: 2501, animation: 'redFlash 1s infinite', boxSizing: 'border-box' }}></div>
            )}

            {/* Custom termination alert - Now using react-hot-toast (component toaster is in App.js) */}

            {/* Custom Termination Modal */}
            {showQuitConfirm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="glass" style={{ padding: '3rem', maxWidth: '450px', textAlign: 'center', border: '2px solid rgba(255,255,255,0.05)' }}>
                        <ShieldAlert size={60} color="var(--danger)" style={{ marginBottom: '1.5rem' }} />
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'white' }}>End Session?</h2>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                            You are about to terminate this proctored interview. Any unsaved progress will be permanently lost.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={confirmQuit} className="btn" style={{ flex: 1, background: 'var(--danger)', color: 'white', fontWeight: 'bold' }}>Yes, End Interview</button>
                            <button onClick={() => setShowQuitConfirm(false)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspicious Activity Warning Modal */}
            {showWarning && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2000, width: '450px' }}>
                    <div className="glass" style={{ padding: '2.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '2px solid var(--danger)', boxShadow: '0 0 50px rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
                        <ShieldAlert size={60} color="var(--danger)" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))' }} />
                        <h2 style={{ color: 'white', fontSize: '1.75rem', marginBottom: '1rem' }}>Suspicious Activity</h2>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', lineHeight: '1.6' }}>
                            A tab switch or focus loss was detected. Please remain on this screen to ensure the integrity of the interview.
                        </p>
                        <button onClick={() => setShowWarning(false)} className="btn btn-primary" style={{ padding: '0.75rem 3rem', background: 'var(--danger)', border: 'none' }}>
                            I Understand
                        </button>
                    </div>
                </div>
            )}

            {/* Dark background overlay for warning */}
            {showWarning && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1999 }} onClick={() => setShowWarning(false)}></div>}

            {/* Proctoring Status */}
            {!isFullscreen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100, background: 'var(--danger)', color: 'white', padding: '1rem', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                    <Maximize size={24} /> INTERVIEW FROZEN: You must remain in Fullscreen mode!
                    <button onClick={enterFullscreen} className="btn" style={{ background: 'white', color: 'var(--danger)', padding: '0.5rem 2rem', fontWeight: 'bold' }}>Authorize Fullscreen</button>
                </div>
            )}

            <div className="container" style={{ width: '100%', maxWidth: '1400px', height: '100vh', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', height: '100%', overflow: 'hidden' }}>

                    {/* Main Content Area - Scrollable */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '1rem', paddingBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'white', opacity: 0.8 }}>{currentQ?.type?.toUpperCase() || 'TECHNICAL'} EXAMINATION</h1>
                                <p style={{ color: 'var(--primary)', fontWeight: 'bold', margin: '0.25rem 0', fontSize: '0.9rem' }}>QUESTION {currentIndex + 1} OF {questions.length}</p>
                            </div>
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                                PROCTOR ID: #UX-7721
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.01)', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                <div style={{ background: 'var(--primary-glow)', padding: '0.75rem', borderRadius: '0.75rem' }} onClick={() => speakQuestion(currentQ?.text || currentQ?.Text)}>
                                    <Volume2 size={24} color="var(--primary)" style={{ cursor: 'pointer' }} />
                                </div>
                                <h2 style={{ fontSize: '1.4rem', color: 'white', lineHeight: '1.4', margin: 0 }}>{currentQ?.text || currentQ?.Text}</h2>
                            </div>

                            <div style={{ flex: 1, position: 'relative' }}>
                                <textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    disabled={!!feedback || loading}
                                    placeholder="Listening... (or type your response here)"
                                    style={{ width: '100%', height: '180px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1.5rem', fontSize: '1.1rem', lineHeight: '1.6', resize: 'none' }}
                                />
                                <div
                                    onClick={handleSpeech}
                                    style={{ position: 'absolute', bottom: '1rem', right: '1rem', width: '50px', height: '50px', borderRadius: '50%', background: isListening ? 'var(--danger)' : 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: isListening ? '0 0 20px var(--danger)' : '0 4px 15px rgba(0,0,0,0.4)', transition: 'all 0.3s' }}
                                >
                                    {isListening ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ color: isListening ? 'var(--danger)' : 'var(--text-dim)', transition: 'all 0.3s', fontSize: '0.9rem' }}>
                                    {isListening ? 'VOICE ENGINE ACTIVE...' : 'MICROPHONE READY'}
                                </div>
                                {!feedback ? (
                                    <button onClick={submitAnswer} disabled={!answer.trim() || loading} className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', fontSize: '1rem' }}>
                                        {loading ? 'Evaluating...' : 'Seal & Submit'}
                                    </button>
                                ) : transitioning ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1rem' }}>
                                        Next Question in 3s...
                                    </div>
                                ) : (
                                    <button onClick={nextQuestion} className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', fontSize: '1rem' }}>
                                        Next Question <ChevronRight size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Inline Feedback Panel */}
                        {feedback && (
                            <div className="glass" style={{ padding: '2rem', border: '1px solid var(--primary)', animation: 'slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)', background: 'rgba(99, 102, 241, 0.02)' }}>
                                {/* Score Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Star size={18} color="var(--primary)" />
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>AI Feedback</h3>
                                    </div>
                                    <div style={{
                                        fontSize: '1.75rem', fontWeight: 900,
                                        color: feedback.score >= 75 ? 'var(--accent)' : feedback.score >= 50 ? '#f59e0b' : 'var(--danger)'
                                    }}>
                                        {feedback.score}%
                                    </div>
                                </div>

                                {/* Score breakdown pills */}
                                {feedback.breakdown && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                                        {Object.entries(feedback.breakdown).map(([key, val]) => (
                                            <div key={key} style={{
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '2rem',
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                fontSize: '0.75rem',
                                                display: 'flex', gap: '0.4rem', alignItems: 'center'
                                            }}>
                                                <span style={{ color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                                                    {key.replace(/_/g, ' ')}
                                                </span>
                                                <span style={{
                                                    fontWeight: 700,
                                                    color: val >= 70 ? 'var(--accent)' : val >= 45 ? '#f59e0b' : 'var(--danger)'
                                                }}>{Math.round(val)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Main feedback content — clean, no asterisks */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(16,185,129,0.04)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(16,185,129,0.12)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <ThumbsUp size={14} color="var(--accent)" />
                                            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em' }}>STRENGTHS</span>
                                        </div>
                                        {feedback.strengths?.length > 0
                                            ? <FeedbackText text={feedback.strengths.join('\n')} />
                                            : <FeedbackText text={feedback.comments} />
                                        }
                                    </div>
                                    <div style={{ background: 'rgba(99,102,241,0.04)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(99,102,241,0.12)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <AlertTriangle size={14} color="#f59e0b" />
                                            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em' }}>TO IMPROVE</span>
                                        </div>
                                        {feedback.areas_of_improvement?.length > 0
                                            ? <FeedbackText text={feedback.areas_of_improvement.join('\n')} />
                                            : <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Keep building on strong technical vocabulary.</p>
                                        }
                                    </div>
                                </div>

                                {/* Matched keywords */}
                                {feedback.matched_keywords?.length > 0 && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Keywords used: </span>
                                        {feedback.matched_keywords.map((kw, i) => (
                                            <span key={i} style={{ display: 'inline-block', margin: '0.15rem 0.25rem', padding: '0.15rem 0.6rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '2rem', fontSize: '0.75rem', color: '#a5b4fc' }}>
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Area - Restored and Optimized */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        height: '100%'
                    }}>
                        <div className="glass" style={{ height: '200px', overflow: 'hidden', position: 'relative', borderRadius: '1rem', border: '2px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(239, 68, 68, 0.8)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 'bold' }}>LIVE</div>
                        </div>

                        <div className="glass" style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div className="proctor-pulse" style={{ width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%' }}></div>
                                <h4 style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>INTEGRITY MONITOR</h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: warnings > 0 ? 'var(--danger)' : 'white' }}>Breaches</span>
                                    <span style={{ color: warnings > 0 ? 'var(--danger)' : 'var(--accent)', fontWeight: 'bold' }}>{warnings}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Tracker</span>
                                    <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>ACTIVE</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '1.5rem', marginTop: 'auto', background: 'rgba(255,255,255,0.01)', fontSize: '0.85rem' }}>
                            <p style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }}>SESSION TIPS</p>
                            <p style={{ color: 'white', opacity: 0.6, fontSize: '0.8rem', lineHeight: '1.4' }}>Maintain eye contact with the camera and speak clearly for best AI evaluation results.</p>
                        </div>

                        <button onClick={quitInterview} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            <X size={18} /> Exit Session
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes aiGlow {
                    0% { box-shadow: 0 0 5px var(--primary-glow); }
                    50% { box-shadow: 0 0 25px var(--primary); }
                    100% { box-shadow: 0 0 5px var(--primary-glow); }
                }
                @keyframes redFlash {
                    0% { opacity: 0.1; }
                    50% { opacity: 1; border-color: #ef4444; }
                    100% { opacity: 0.1; }
                }
                @keyframes pulseProctor {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                .ai-speaking { animation: aiGlow 2s infinite; }
                .proctor-pulse {
                    position: relative;
                }
                .proctor-pulse::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: inherit;
                    border-radius: inherit;
                    animation: pulseProctor 1.5s infinite;
                }
            `}</style>
        </div>
    );
};

export default MockInterview;
