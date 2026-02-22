"use client";
import React, { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BsPeople, BsClock, BsPlayFill, BsCheckCircleFill, BsStopFill, BsXCircleFill, BsBarChartFill, BsTrophyFill } from "react-icons/bs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function LiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session, status } = useSession();
    const router = useRouter();

    const [liveSession, setLiveSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [completed, setCompleted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [viewingParticipant, setViewingParticipant] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'leaderboard' | 'analytics'>('leaderboard');

    const isOwner = liveSession?.ownerId?._id === (session?.user as any)?.id;

    const fetchSession = async () => {
        try {
            const res = await fetch(`/api/live/${id}`);
            const data = await res.json();
            if (data.session) {
                setLiveSession(data.session);
                if (data.session.status === 'active' && data.session.endTime) {
                    const remaining = Math.max(0, Math.floor((new Date(data.session.endTime).getTime() - Date.now()) / 1000));
                    setTimeLeft(remaining);
                }
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") router.push("/auth/signin");
        if (status === "authenticated") {
            fetchSession();
            // Initial Join for participants
            fetch(`/api/live/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "join" })
            });
        }
    }, [status]);

    // Polling for status updates
    useEffect(() => {
        if (!liveSession || liveSession.status === 'completed') return;

        const interval = setInterval(() => {
            fetchSession();
        }, 3000);

        return () => clearInterval(interval);
    }, [liveSession?.status]);

    // Timer effect
    useEffect(() => {
        if (liveSession?.status !== 'active' || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [liveSession?.status, timeLeft]);

    const handleStart = async () => {
        await fetch(`/api/live/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "start" })
        });
        fetchSession();
    };

    const handleEnd = async () => {
        if (!confirm("End session for everyone?")) return;
        await fetch(`/api/live/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "end" })
        });
        fetchSession();
    };

    const handleSubmit = async () => {
        const mcqs = liveSession.quizId.mcqs;
        let score = 0;
        const formattedAnswers = mcqs.map((q: any, i: number) => {
            const isCorrect = answers[i] === q.correctAnswer;
            if (isCorrect) score++;
            return {
                questionIdx: i,
                selectedOption: answers[i] || "",
                isCorrect
            };
        });

        // Create standard attempt record so it shows in dashboard
        fetch("/api/attempts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                quizId: liveSession.quizId._id,
                score,
                totalQuestions: mcqs.length,
                answers: formattedAnswers
            })
        }).catch(err => console.error("Attempt sync failed:", err));

        await fetch(`/api/live/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "submit",
                answers: formattedAnswers,
                score,
                progress: 100
            })
        });
        setCompleted(true);
    };

    if (loading || status === "loading") return <div style={styles.center}><div className="spinner"></div></div>;
    if (!liveSession) return <div style={styles.center}>Session not found.</div>;

    // -------------------------
    // LOBBY VIEW
    // -------------------------
    if (liveSession.status === 'waiting') {
        return (
            <div style={styles.container}>
                <div className="glass-card animate-fade-in" style={{ padding: '3rem', textAlign: 'center' }}>
                    <h1 style={{ marginBottom: '1rem' }}>Live Session Lobby</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Quiz: <span style={{ color: 'white', fontWeight: 600 }}>{liveSession.quizId.title}</span>
                    </p>

                    <div style={styles.lobbyGrid}>
                        <div style={styles.participantsList}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <BsPeople /> Joined Participants ({liveSession.participants.length})
                            </h3>
                            <div style={styles.pGrid}>
                                {liveSession.participants.map((p: any) => (
                                    <div key={p.userId._id} style={styles.participantBadge}>
                                        <img src={p.userId.image || `https://ui-avatars.com/api/?name=${p.name}`} style={styles.avatar} />
                                        <span>{p.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={styles.lobbyStatus}>
                            <div style={styles.timeInfo}>
                                <BsClock size={32} color="var(--accent-color)" />
                                <div>
                                    <h4 style={{ margin: 0 }}>Duration</h4>
                                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{liveSession.timeLimit} Minutes</p>
                                </div>
                            </div>

                            {isOwner ? (
                                <button className="btn-primary" onClick={handleStart} style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
                                    <BsPlayFill size={24} /> Start Session for All
                                </button>
                            ) : (
                                <div style={styles.waitingNotice}>
                                    <div className="spinner-small"></div>
                                    <p>Waiting for host to start...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------
    // ACTIVE EXAM VIEW
    // -------------------------
    if (liveSession.status === 'active' && !completed) {
        const mcqs = liveSession.quizId.mcqs;
        const q = mcqs[currentIdx];

        return (
            <div style={styles.container}>
                <div style={styles.liveHeader}>
                    <div>
                        <h2 style={{ margin: 0 }}>{liveSession.quizId.title}</h2>
                        <span style={{ color: 'var(--text-secondary)' }}>Live Session • Question {currentIdx + 1} of {mcqs.length}</span>
                    </div>
                    <div style={styles.timerBadge}>
                        <BsClock />
                        <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '1fr 300px' : '1fr', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '2.5rem' }}>
                        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', lineHeight: 1.4 }}>{q.question}</h2>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {q.options.map((opt: string, i: number) => {
                                const isSelected = answers[currentIdx] === opt;
                                return (
                                    <button
                                        key={opt}
                                        style={{ ...styles.option, background: isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)' }}
                                        onClick={() => setAnswers({ ...answers, [currentIdx]: opt })}
                                    >
                                        <span style={styles.optIdx}>{String.fromCharCode(65 + i)}</span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <button className="btn-secondary" disabled={currentIdx === 0} onClick={() => setCurrentIdx(p => p - 1)}>Previous</button>
                            {currentIdx === mcqs.length - 1 ? (
                                <button className="btn-primary" onClick={handleSubmit}>Finish & Submit</button>
                            ) : (
                                <button className="btn-primary" onClick={() => setCurrentIdx(p => p + 1)}>Next Question</button>
                            )}
                        </div>
                    </div>

                    {isOwner && (
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Real-time Progress</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {liveSession.participants.map((p: any) => (
                                    <div key={p.userId._id} style={styles.monitorItem}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ ...styles.statusDot, background: p.isFinished ? '#10b981' : '#f59e0b' }}></div>
                                            <span style={{ fontSize: '0.9rem' }}>{p.name}</span>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.isFinished ? 'Finished' : 'In Progress'}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="btn-secondary" style={{ width: '100%', marginTop: '2rem', color: '#ef4444' }} onClick={handleEnd}>
                                <BsStopFill /> End Session
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // -------------------------
    // RESULTS/COMPLETED VIEW
    // -------------------------
    if (liveSession.status === 'completed' || completed) {
        return (
            <div style={styles.container}>
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <BsCheckCircleFill size={64} color="#10b981" style={{ marginBottom: '1.5rem' }} />
                    <h1>Session Finished</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>Results and performance overview</p>

                    {isOwner ? (
                        <div style={{ textAlign: 'left' }}>
                            <div style={styles.tabContainer}>
                                <button
                                    style={{ ...styles.tabBtn, borderBottom: viewMode === 'leaderboard' ? '2px solid var(--accent-color)' : 'none', color: viewMode === 'leaderboard' ? 'white' : 'var(--text-secondary)' }}
                                    onClick={() => setViewMode('leaderboard')}
                                >
                                    <BsTrophyFill /> Leaderboard
                                </button>
                                <button
                                    style={{ ...styles.tabBtn, borderBottom: viewMode === 'analytics' ? '2px solid var(--accent-color)' : 'none', color: viewMode === 'analytics' ? 'white' : 'var(--text-secondary)' }}
                                    onClick={() => setViewMode('analytics')}
                                >
                                    <BsBarChartFill /> Session Analytics
                                </button>
                            </div>

                            {viewMode === 'leaderboard' ? (
                                <>
                                    <h3 style={{ marginBottom: '1.5rem' }}>Participant Leaderboard</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {liveSession.participants.map((p: any) => (
                                            <div
                                                key={p.userId._id}
                                                style={{ ...styles.resultRow, cursor: 'pointer', border: viewingParticipant?._id === p._id ? '1px solid var(--accent-color)' : '1px solid var(--surface-border)' }}
                                                onClick={() => setViewingParticipant(p)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img src={p.userId.image || `https://ui-avatars.com/api/?name=${p.name}`} style={styles.avatar} />
                                                    <span>{p.name} {p.userId._id === (session?.user as any)?.id ? "(You)" : ""}</span>
                                                </div>
                                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div>
                                                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.score} / {liveSession.quizId.mcqs.length}</span>
                                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{Math.round((p.score / liveSession.quizId.mcqs.length) * 100)}% Accuracy</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {viewingParticipant && (
                                        <div className="animate-fade-in" style={{ marginTop: '3rem', borderTop: '1px solid var(--surface-border)', paddingTop: '2rem' }}>
                                            <h3 style={{ marginBottom: '1.5rem' }}>Reviewing: {viewingParticipant.name}</h3>
                                            <div style={styles.reviewList}>
                                                {liveSession.quizId.mcqs.map((mcq: any, idx: number) => {
                                                    const pAnswer = viewingParticipant.answers?.find((a: any) => a.questionIdx === idx);
                                                    return (
                                                        <div key={idx} style={styles.reviewItem}>
                                                            <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                                                                Q{idx + 1}: {mcq.question}
                                                            </p>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: pAnswer?.isCorrect ? "#10b981" : "#ef4444", marginBottom: "0.5rem" }}>
                                                                {pAnswer?.isCorrect ? <BsCheckCircleFill /> : <BsXCircleFill />}
                                                                <span>Answer: {pAnswer?.selectedOption || "Unanswered"}</span>
                                                            </div>
                                                            {!pAnswer?.isCorrect && (
                                                                <div style={{ color: "#10b981", marginBottom: "0.5rem", fontSize: '0.9rem' }}>
                                                                    Correct Answer: {mcq.correctAnswer}
                                                                </div>
                                                            )}
                                                            {mcq.explanation && (
                                                                <p style={styles.explanationBox}>
                                                                    <strong>Explanation:</strong> {mcq.explanation}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="animate-fade-in" style={{ display: 'grid', gap: '2rem' }}>
                                    <div className="glass-card" style={{ padding: '2rem', height: '400px' }}>
                                        <h3 style={{ marginBottom: '2rem' }}>Score Distribution</h3>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={liveSession.participants.map((p: any) => ({ name: p.name, score: p.score }))}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                                                <YAxis stroke="var(--text-secondary)" />
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '8px' }}
                                                    itemStyle={{ color: 'var(--accent-color)' }}
                                                />
                                                <Bar dataKey="score" fill="var(--accent-color)" radius={[4, 4, 0, 0]}>
                                                    {liveSession.participants.map((_: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={`hsl(260, 70%, ${50 + (index % 5) * 5}%)`} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <div className="glass-card" style={{ padding: '2rem' }}>
                                            <h3>Session Overview</h3>
                                            <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
                                                <div style={styles.statBox}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>Total Participants</span>
                                                    <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{liveSession.participants.length}</span>
                                                </div>
                                                <div style={styles.statBox}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>Avg. Accuracy</span>
                                                    <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                                        {Math.round((liveSession.participants.reduce((acc: number, p: any) => acc + (p.score / liveSession.quizId.mcqs.length), 0) / liveSession.participants.length) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="glass-card" style={{ padding: '2rem' }}>
                                            <h3>Accuracy Brackets</h3>
                                            <div style={{ height: '200px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'High (80%+)', value: liveSession.participants.filter((p: any) => (p.score / liveSession.quizId.mcqs.length) >= 0.8).length },
                                                                { name: 'Mid (50-80%)', value: liveSession.participants.filter((p: any) => (p.score / liveSession.quizId.mcqs.length) >= 0.5 && (p.score / liveSession.quizId.mcqs.length) < 0.8).length },
                                                                { name: 'Low (<50%)', value: liveSession.participants.filter((p: any) => (p.score / liveSession.quizId.mcqs.length) < 0.5).length },
                                                            ]}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            <Cell fill="#10b981" />
                                                            <Cell fill="#f59e0b" />
                                                            <Cell fill="#ef4444" />
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'left' }}>
                            <div style={styles.userResult}>
                                <h1 style={{ fontSize: '3rem', margin: 0 }}>{liveSession.participants.find((p: any) => p.userId._id === (session?.user as any).id)?.score}</h1>
                                <p style={{ color: 'var(--text-secondary)' }}>Correct out of {liveSession.quizId.mcqs.length}</p>
                            </div>

                            <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Your Review</h3>
                            <div style={styles.reviewList}>
                                {liveSession.quizId.mcqs.map((mcq: any, idx: number) => {
                                    const myResult = liveSession.participants.find((p: any) => p.userId._id === (session?.user as any).id)?.answers?.find((a: any) => a.questionIdx === idx);
                                    return (
                                        <div key={idx} style={styles.reviewItem}>
                                            <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                                                Q{idx + 1}: {mcq.question}
                                            </p>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: myResult?.isCorrect ? "#10b981" : "#ef4444", marginBottom: "0.5rem" }}>
                                                {myResult?.isCorrect ? <BsCheckCircleFill /> : <BsXCircleFill />}
                                                <span>Your Answer: {myResult?.selectedOption || "Unanswered"}</span>
                                            </div>
                                            {!myResult?.isCorrect && (
                                                <div style={{ color: "#10b981", marginBottom: "0.5rem", fontSize: '0.9rem' }}>
                                                    Correct Answer: {mcq.correctAnswer}
                                                </div>
                                            )}
                                            {mcq.explanation && (
                                                <p style={styles.explanationBox}>
                                                    <strong>Explanation:</strong> {mcq.explanation}
                                                </p>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <button className="btn-primary" style={{ marginTop: '3rem', width: '100%' }} onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
                </div>
            </div>
        );
    }

    return null;
}

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem' },
    center: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    lobbyGrid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginTop: '2rem' },
    participantsList: { textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--surface-border)' },
    pGrid: { display: 'flex', flexWrap: 'wrap', gap: '1rem' },
    participantBadge: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '30px', border: '1px solid var(--surface-border)' },
    avatar: { width: '28px', height: '28px', borderRadius: '50%' },
    lobbyStatus: { display: 'flex', flexDirection: 'column', gap: '2rem' },
    timeInfo: { display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', background: 'rgba(139, 92, 246, 0.1)', padding: '1.5rem', borderRadius: '16px' },
    waitingNotice: { padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px dashed var(--surface-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
    liveHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    timerBadge: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '30px', fontWeight: 700 },
    option: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '16px', border: '1px solid var(--surface-border)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', color: 'white', fontSize: '1rem' },
    optIdx: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', fontWeight: 600 },
    monitorItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--surface-border)' },
    statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
    resultRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--surface-border)' },
    userResult: { padding: '2rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '20px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', margin: '0 auto', border: '1px solid var(--accent-color)' },
    reviewList: { textAlign: 'left', marginTop: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '1rem' },
    reviewItem: { padding: '1.5rem', borderBottom: '1px solid var(--surface-border)', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' },
    explanationBox: { fontSize: "0.85rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "8px", marginTop: "0.75rem" },
    tabContainer: { display: 'flex', gap: '2rem', borderBottom: '1px solid var(--surface-border)', marginBottom: '2rem' },
    tabBtn: { padding: '1rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', transition: 'all 0.2s' },
    statBox: { padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }
};
