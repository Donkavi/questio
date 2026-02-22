"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BsCloudUpload, BsFileEarmarkText, BsPlus, BsGear, BsPlayCircle, BsPeople, BsCheckCircleFill, BsXCircleFill, BsArrowLeft, BsBarChartFill, BsTrophyFill, BsClock } from "react-icons/bs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sets, setSets] = useState<any[]>([]);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [liveSessions, setLiveSessions] = useState<any[]>([]);
    const [hostedSessions, setHostedSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'my' | 'public' | 'results' | 'live' | 'hosted'>('my');
    const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
    const [selectedHostedSession, setSelectedHostedSession] = useState<any>(null);
    const [viewingHostedParticipant, setViewingHostedParticipant] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'leaderboard' | 'analytics'>('leaderboard');
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const categories = ["All", "General", "Science", "History", "IT", "Language", "Medical"];

    const loadData = () => {
        setLoading(true);
        if (tab === 'results') {
            fetch('/api/attempts')
                .then(res => res.json())
                .then(data => {
                    if (data.attempts) setAttempts(data.attempts);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        } else if (tab === 'hosted') {
            fetch('/api/live?owner=true')
                .then(res => res.json())
                .then(data => {
                    if (data.sessions) setHostedSessions(data.sessions);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        } else if (tab === 'live') {
            fetch('/api/live')
                .then(res => res.json())
                .then(data => {
                    if (data.sessions) setLiveSessions(data.sessions);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        } else {
            const params = new URLSearchParams({
                type: tab,
                category: category,
                search: search
            });

            fetch(`/api/mcqsets?${params.toString()}`)
                .then(res => res.json())
                .then(data => {
                    if (data.sets) setSets(data.sets);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (status === "authenticated") {
            loadData();
        }
    }, [status, router, tab, category]); // Trigger on tab or category change

    useEffect(() => {
        if (status !== "authenticated" || tab === 'results') return;
        const timer = setTimeout(() => {
            loadData();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    if (status === "loading" || loading) {
        return (
            <div style={styles.centerPage}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div style={styles.dashboardContainer}>
            <header style={styles.header}>
                <div>
                    <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                        Hello, {session?.user?.name || "User"}
                    </h1>
                    <p style={{ color: "var(--text-secondary)" }}>Manage your quizzes or discover new ones.</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => router.push('/dashboard/generate')}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                    <BsPlus size={24} /> Create Quiz
                </button>
            </header>

            <div style={styles.tabContainer}>
                <button
                    style={{ ...styles.tab, borderBottomColor: tab === 'my' ? 'var(--primary-color)' : 'transparent', color: tab === 'my' ? 'white' : 'var(--text-secondary)' }}
                    onClick={() => setTab('my')}
                >
                    My Quizzes
                </button>
                <button
                    style={{ ...styles.tab, borderBottomColor: tab === 'public' ? 'var(--primary-color)' : 'transparent', color: tab === 'public' ? 'white' : 'var(--text-secondary)' }}
                    onClick={() => setTab('public')}
                >
                    Browse Public
                </button>
                <button
                    style={{ ...styles.tab, borderBottomColor: tab === 'results' ? 'var(--primary-color)' : 'transparent', color: tab === 'results' ? 'white' : 'var(--text-secondary)' }}
                    onClick={() => setTab('results')}
                >
                    My Results
                </button>
                <button
                    style={{ ...styles.tab, borderBottomColor: tab === 'live' ? 'var(--primary-color)' : 'transparent', color: tab === 'live' ? 'white' : 'var(--accent-hover)' }}
                    onClick={() => setTab('live')}
                >
                    Live Now 🟢
                </button>
                <button
                    style={{ ...styles.tab, borderBottomColor: tab === 'hosted' ? 'var(--primary-color)' : 'transparent', color: tab === 'hosted' ? 'white' : 'var(--text-secondary)' }}
                    onClick={() => setTab('hosted')}
                >
                    Hosted Sessions 📊
                </button>
            </div>

            {tab !== 'results' && tab !== 'live' && tab !== 'hosted' && (
                <div style={styles.filterBar}>
                    <input
                        type="text"
                        placeholder="Search quizzes..."
                        style={styles.searchInput}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div style={styles.categoryScroll}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                style={{
                                    ...styles.catBtn,
                                    background: category === cat ? 'var(--primary-color)' : 'transparent',
                                    borderColor: category === cat ? 'var(--primary-color)' : 'var(--surface-border)'
                                }}
                                onClick={() => setCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <section style={styles.gridSection}>
                {tab === 'results' ? (
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h2 style={{ marginBottom: '2rem' }}>Recent Quiz Attempts</h2>
                        {attempts.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>No attempts found. Start a quiz to see your history!</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {attempts.map(attempt => (
                                    <div key={attempt._id} style={styles.resultItem}>
                                        <div>
                                            <h4 style={{ fontSize: '1.1rem' }}>{attempt.quizId?.title || "Deleted Quiz"}</h4>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {new Date(attempt.completedAt).toLocaleDateString()} • {attempt.quizId?.category}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: attempt.score / attempt.totalQuestions >= 0.5 ? '#10b981' : '#ef4444' }}>
                                                    {attempt.score} / {attempt.totalQuestions}
                                                </div>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {Math.round((attempt.score / attempt.totalQuestions) * 100)}% Accuracy
                                                </p>
                                            </div>
                                            <button className="btn-secondary" onClick={() => setSelectedAttempt(attempt)}>View Details</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedAttempt && (
                            <div className="animate-fade-in" style={{ marginTop: '3rem', borderTop: '1px solid var(--surface-border)', paddingTop: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <div>
                                        <button className="btn-secondary" onClick={() => setSelectedAttempt(null)} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <BsArrowLeft /> Back to List
                                        </button>
                                        <h3 style={{ margin: 0 }}>Review: {selectedAttempt.quizId?.title}</h3>
                                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Completed on {new Date(selectedAttempt.completedAt).toLocaleString()}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <h2 style={{ margin: 0, color: '#10b981' }}>{selectedAttempt.score} / {selectedAttempt.totalQuestions}</h2>
                                        <span style={{ color: 'var(--text-secondary)' }}>Final Score</span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                    {selectedAttempt.answers?.map((ans: any, idx: number) => {
                                        const quizMcq = selectedAttempt.quizId?.mcqs?.[ans.questionIdx];
                                        return (
                                            <div key={idx} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                                <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Q{idx + 1}: {quizMcq?.question || "Question Data Missing"}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: ans.isCorrect ? '#10b981' : '#ef4444', marginBottom: '0.5rem' }}>
                                                    {ans.isCorrect ? <BsCheckCircleFill /> : <BsXCircleFill />}
                                                    <span>Your Answer: {ans.selectedOption || "No Answer"}</span>
                                                </div>
                                                {!ans.isCorrect && (
                                                    <div style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                                        Correct Answer: {quizMcq?.correctAnswer}
                                                    </div>
                                                )}
                                                {quizMcq?.explanation && (
                                                    <div style={{ marginTop: '0.75rem', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem' }}>
                                                        <strong>Explanation:</strong> {quizMcq.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ) : tab === 'hosted' ? (
                    <div style={{ width: '100%' }}>
                        {!selectedHostedSession ? (
                            <div className="glass-card" style={{ padding: '2rem' }}>
                                <h2 style={{ marginBottom: '2rem' }}>Sessions You've Hosted</h2>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {hostedSessions.length === 0 ? (
                                        <p style={{ color: 'var(--text-secondary)' }}>You haven't hosted any live sessions yet.</p>
                                    ) : (
                                        hostedSessions.map(session => (
                                            <div key={session._id} style={styles.resultItem}>
                                                <div>
                                                    <h4 style={{ fontSize: '1.1rem' }}>{session.quizId?.title}</h4>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        {new Date(session.createdAt).toLocaleDateString()} • {session.participants.length} Participants
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem' }}>
                                                    <span style={{ ...styles.badge, background: session.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: session.status === 'completed' ? '#10b981' : '#f59e0b' }}>
                                                        {session.status.toUpperCase()}
                                                    </span>
                                                    <button className="btn-secondary" onClick={() => setSelectedHostedSession(session)}>View Results</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in glass-card" style={{ padding: '3rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <div>
                                        <button className="btn-secondary" onClick={() => setSelectedHostedSession(null)} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <BsArrowLeft /> Back to List
                                        </button>
                                        <h2 style={{ margin: 0 }}>{selectedHostedSession.quizId?.title}</h2>
                                        <p style={{ color: 'var(--text-secondary)' }}>Hosted on {new Date(selectedHostedSession.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ background: 'var(--accent-color)', color: 'white', padding: '8px 16px', borderRadius: '30px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <BsPeople /> {selectedHostedSession.participants.length} Joined
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--surface-border)', marginBottom: '2rem' }}>
                                    <button
                                        style={{ background: 'none', border: 'none', borderBottom: viewMode === 'leaderboard' ? '2px solid var(--accent-color)' : 'none', color: viewMode === 'leaderboard' ? 'white' : 'var(--text-secondary)', padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        onClick={() => setViewMode('leaderboard')}
                                    >
                                        <BsTrophyFill /> Leaderboard
                                    </button>
                                    <button
                                        style={{ background: 'none', border: 'none', borderBottom: viewMode === 'analytics' ? '2px solid var(--accent-color)' : 'none', color: viewMode === 'analytics' ? 'white' : 'var(--text-secondary)', padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        onClick={() => setViewMode('analytics')}
                                    >
                                        <BsBarChartFill /> Analytics
                                    </button>
                                </div>

                                {viewMode === 'leaderboard' ? (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <h3 style={{ marginBottom: '0.5rem' }}>Participant Leaderboard</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Click a participant to view their detailed answers</p>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            {selectedHostedSession.participants.map((p: any) => (
                                                <div
                                                    key={p.userId?._id || p.name}
                                                    style={{
                                                        ...styles.resultRowLarge,
                                                        cursor: 'pointer',
                                                        border: viewingHostedParticipant?._id === p._id ? '1px solid var(--accent-color)' : '1px solid var(--surface-border)',
                                                        background: viewingHostedParticipant?._id === p._id ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255,255,255,0.02)'
                                                    }}
                                                    onClick={() => setViewingHostedParticipant(p)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <img src={p.userId?.image || `https://ui-avatars.com/api/?name=${p.name}`} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                                        <div>
                                                            <h4 style={{ margin: 0 }}>{p.name}</h4>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.isFinished ? 'Completed' : 'Did not finish'}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{p.score} / {selectedHostedSession.quizId?.mcqs?.length || 0}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            {Math.round((p.score / (selectedHostedSession.quizId?.mcqs?.length || 1)) * 100)}% Accuracy
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {viewingHostedParticipant && (
                                            <div className="animate-fade-in" style={{ marginTop: '3rem', borderTop: '1px solid var(--surface-border)', paddingTop: '2rem' }}>
                                                <h3 style={{ marginBottom: '1.5rem' }}>Reviewing: {viewingHostedParticipant.name}</h3>
                                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                                    {selectedHostedSession.quizId?.mcqs?.map((mcq: any, idx: number) => {
                                                        const pAnswer = viewingHostedParticipant.answers?.find((a: any) => a.questionIdx === idx);
                                                        return (
                                                            <div key={idx} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
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
                                                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "8px", marginTop: "0.75rem" }}>
                                                                        <strong>Explanation:</strong> {mcq.explanation}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '2rem' }}>
                                        <div style={{ height: '300px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={selectedHostedSession.participants.map((p: any) => ({ name: p.name, score: p.score }))}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                    <XAxis dataKey="name" stroke="var(--text-secondary)" />
                                                    <YAxis stroke="var(--text-secondary)" />
                                                    <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333' }} />
                                                    <Bar dataKey="score" fill="var(--accent-color)" radius={[4, 4, 0, 0]}>
                                                        {selectedHostedSession.participants.map((_: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={`hsl(260, 70%, ${40 + (index % 5) * 10}%)`} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                            <div style={styles.statBoxSmall}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Average Score</span>
                                                <span style={{ fontSize: '2rem', fontWeight: 700 }}>
                                                    {(selectedHostedSession.participants.reduce((acc: number, p: any) => acc + p.score, 0) / selectedHostedSession.participants.length).toFixed(1)}
                                                </span>
                                            </div>
                                            <div style={styles.statBoxSmall}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Avg. Accuracy</span>
                                                <span style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                                                    {Math.round((selectedHostedSession.participants.reduce((acc: number, p: any) => acc + (p.score / (selectedHostedSession.quizId?.mcqs?.length || 1)), 0) / selectedHostedSession.participants.length) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : tab === 'live' ? (
                    <div style={styles.cardsGrid}>
                        {liveSessions.length === 0 ? (
                            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1/-1' }}>
                                <p style={{ color: 'var(--text-secondary)' }}>No active live sessions. Start one from your quiz settings!</p>
                            </div>
                        ) : (
                            liveSessions.map((session, i) => (
                                <div key={session._id} className="glass-card animate-fade-in" style={{ ...styles.card, borderColor: 'var(--accent-color)' }}>
                                    <div style={styles.cardHeader}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span style={{ ...styles.badge, background: '#ef4444', color: 'white' }}>LIVE</span>
                                            <span style={styles.badge}>{session.quizId?.category}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            <BsPeople /> {session.participants?.length || 0}
                                        </div>
                                    </div>
                                    <h3 style={styles.cardTitle}>{session.quizId?.title}</h3>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                                        Host: {session.ownerId?.name || "Host"} • Status: <span style={{ color: '#10b981', fontWeight: 600 }}>{session.status.toUpperCase()}</span>
                                    </p>
                                    <button
                                        className="btn-primary"
                                        style={{ background: 'var(--accent-color)' }}
                                        onClick={() => router.push(`/live/${session._id}`)}
                                    >
                                        Join Session
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : sets.length === 0 ? (
                    <div className="glass-card animate-fade-in" style={styles.emptyState}>
                        <BsCloudUpload size={48} color="var(--accent-color)" />
                        <h3 style={{ marginTop: "1rem" }}>{tab === 'my' ? "No MCQs Generated Yet" : "No Public Quizzes Found"}</h3>
                        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                            {tab === 'my' ? 'Click "Create Quiz" to upload a document.' : 'Try a different category or search term.'}
                        </p>
                    </div>
                ) : (
                    <div style={styles.cardsGrid}>
                        {sets.map((set, i) => (
                            <div key={set._id} className={`glass-card animate-fade-in delay-${i * 100 > 300 ? 300 : i * 100}`} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span style={styles.badge}>{set.language}</span>
                                        <span style={{ ...styles.badge, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>{set.category || 'General'}</span>
                                        {!set.isPublic && <span style={{ ...styles.badge, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>Private</span>}
                                    </div>
                                    <BsFileEarmarkText size={20} color="var(--primary-color)" />
                                </div>
                                <h3 style={styles.cardTitle}>{set.title}</h3>
                                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                                    {set.mcqs?.length || 0} Questions • Source: {set.documentReference}
                                </p>
                                <div style={styles.cardActions}>
                                    <button
                                        className="btn-primary"
                                        onClick={() => router.push(`/exam/${set._id}`)}
                                        style={{ flex: 1, padding: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
                                    >
                                        <BsPlayCircle /> Start Test
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => router.push(`/dashboard/set/${set._id}`)}
                                        style={{ padding: "8px", width: "40px", display: "flex", justifyContent: "center" }}
                                    >
                                        <BsGear />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    centerPage: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    dashboardContainer: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "3rem",
        flexWrap: "wrap",
        gap: "1rem",
    },
    gridSection: {
        minHeight: "400px",
    },
    emptyState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "4rem 2rem",
        borderStyle: "dashed",
        borderColor: "var(--surface-border)",
    },
    cardsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1.5rem",
    },
    card: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "1rem",
    },
    badge: {
        fontSize: "0.75rem",
        background: "rgba(139, 92, 246, 0.2)",
        color: "var(--accent-color)",
        padding: "4px 8px",
        borderRadius: "12px",
        fontWeight: "600",
    },
    cardTitle: {
        fontSize: "1.25rem",
        marginBottom: "0.5rem",
        fontWeight: "700",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    cardActions: {
        display: "flex",
        gap: "0.5rem",
    },
    tabContainer: {
        display: "flex",
        gap: "2rem",
        borderBottom: "1px solid var(--surface-border)",
        marginBottom: "2rem",
    },
    tab: {
        background: "none",
        border: "none",
        borderBottom: "2px solid transparent",
        padding: "0.75rem 0.5rem",
        fontSize: "1.1rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    filterBar: {
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        marginBottom: "2rem",
    },
    searchInput: {
        width: "100%",
        padding: "12px 20px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid var(--surface-border)",
        color: "white",
        fontSize: "1rem",
    },
    categoryScroll: {
        display: "flex",
        gap: "0.75rem",
        overflowX: "auto",
        paddingBottom: "0.5rem",
    },
    catBtn: {
        padding: "6px 16px",
        borderRadius: "20px",
        border: "1px solid",
        fontSize: "0.9rem",
        cursor: "pointer",
        whiteSpace: "nowrap",
        color: "white",
        transition: "all 0.2s ease",
    },
    resultItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--surface-border)",
    },
    resultRowLarge: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.5rem",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--surface-border)",
    },
    statBoxSmall: {
        padding: '1.5rem',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: '1px solid var(--surface-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem'
    }
};
