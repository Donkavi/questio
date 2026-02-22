"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BsArrowLeft, BsPlayCircle, BsLink45Deg, BsGear } from "react-icons/bs";

export default function MCQSetDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session, status } = useSession();
    const router = useRouter();

    const [set, setSet] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ category: "", isPublic: true, password: "" });
    const [saving, setSaving] = useState(false);
    const [liveTimeLimit, setLiveTimeLimit] = useState(30);
    const [creatingLive, setCreatingLive] = useState(false);

    const categories = ["General", "Science", "History", "IT", "Language", "Medical"];

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }

        if (status === "authenticated") {
            fetch(`/api/mcqsets/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.set) {
                        setSet(data.set);
                        setEditData({
                            category: data.set.category || "General",
                            isPublic: data.set.isPublic !== false,
                            password: data.set.password || ""
                        });
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [id, status, router]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/mcqsets/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });
            const data = await res.json();
            if (data.success) {
                setSet(data.set);
                setIsEditing(false);
                alert("Quiz updated successfully!");
            } else {
                alert(data.error || "Update failed.");
            }
        } catch (err) {
            console.error(err);
            alert("System error saving quiz.");
        } finally {
            setSaving(false);
        }
    };

    const handleStartLive = async () => {
        setCreatingLive(true);
        try {
            const res = await fetch("/api/live", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quizId: id, timeLimit: liveTimeLimit }),
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/live/${data.sessionId}`);
            } else {
                alert(data.error || "Failed to start live session.");
            }
        } catch (err) {
            console.error(err);
            alert("System error starting live session.");
        } finally {
            setCreatingLive(false);
        }
    };

    const copyLink = () => {
        const link = `${window.location.origin}/exam/${id}`;
        navigator.clipboard.writeText(link);
        alert("Exam link copied to clipboard!");
    };

    if (loading || status === "loading") {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}><div className="spinner"></div></div>;
    }

    if (!set) {
        return <div style={{ textAlign: "center", padding: "4rem" }}>MCQ Set Not Found</div>;
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <button className="btn-secondary" onClick={() => router.push("/dashboard")} style={{ border: 'none', padding: '0', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BsArrowLeft /> Back to Dashboard
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{set.title}</h1>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={styles.badge}>{set.language}</span>
                            <span style={{ ...styles.badge, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>{set.category || 'General'}</span>
                            {!set.isPublic && <span style={{ ...styles.badge, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>Private</span>}
                            <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: '0.9rem' }}>
                                {set.mcqs?.length} Questions • Document: {set.documentReference}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {set.creatorId === (session as any)?.user?.id && (
                            <button
                                className="btn-secondary"
                                onClick={() => setIsEditing(!isEditing)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <BsGear size={20} /> {isEditing ? "Cancel" : "Settings"}
                            </button>
                        )}
                        <button className="btn-secondary" onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BsLink45Deg size={20} /> Copy Link
                        </button>
                        <button className="btn-primary" onClick={() => router.push(`/exam/${set._id}`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BsPlayCircle size={20} /> Start Test
                        </button>
                    </div>
                </div>

                {set.creatorId === (session?.user as any)?.id && (
                    <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ color: 'white', marginBottom: '0.25rem' }}>Host Live Session</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Challenge others in real-time. Joined users will sync with your start command.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Time (min)</label>
                                <input
                                    type="number"
                                    className="input-base"
                                    value={liveTimeLimit}
                                    onChange={e => setLiveTimeLimit(Number(e.target.value))}
                                    style={{ width: '80px', padding: '8px' }}
                                />
                            </div>
                            <button
                                className="btn-primary"
                                style={{ background: 'var(--primary-color)', minWidth: '160px' }}
                                onClick={handleStartLive}
                                disabled={creatingLive}
                            >
                                {creatingLive ? "Initializing..." : "Create Live Session"}
                            </button>
                        </div>
                    </div>
                )}

                {isEditing && (
                    <div className="glass-card animate-fade-in" style={{ marginTop: '2rem', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Edit Quiz Settings</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div>
                                <label style={styles.editLabel}>Category</label>
                                <select
                                    className="input-base"
                                    value={editData.category}
                                    onChange={e => setEditData({ ...editData, category: e.target.value })}
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={styles.editLabel}>Privacy</label>
                                <select
                                    className="input-base"
                                    value={editData.isPublic ? "public" : "private"}
                                    onChange={e => setEditData({ ...editData, isPublic: e.target.value === "public" })}
                                >
                                    <option value="public">Public (Visible to browse)</option>
                                    <option value="private">Private (Only via link)</option>
                                </select>
                            </div>
                            {!editData.isPublic && (
                                <div>
                                    <label style={styles.editLabel}>Password</label>
                                    <input
                                        type="text"
                                        className="input-base"
                                        placeholder="Set quiz password"
                                        value={editData.password}
                                        onChange={e => setEditData({ ...editData, password: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                        <button
                            className="btn-primary"
                            style={{ marginTop: '1.5rem', width: '200px' }}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                )}
            </header>

            <div style={styles.content}>
                <div className="glass-card animate-fade-in" style={styles.questionsList}>
                    <h2 style={{ marginBottom: "2rem" }}>Questions Overview</h2>
                    {set.mcqs?.map((mcq: any, i: number) => (
                        <div key={i} style={styles.questionItem}>
                            <h4 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>{i + 1}. {mcq.question}</h4>
                            <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                                {mcq.options.map((opt: string, j: number) => (
                                    <li
                                        key={j}
                                        style={{
                                            padding: "8px 12px",
                                            marginBottom: "8px",
                                            borderRadius: "6px",
                                            background: opt === mcq.correctAnswer ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.05)",
                                            border: opt === mcq.correctAnswer ? "1px solid rgba(16, 185, 129, 0.5)" : "1px solid transparent",
                                            color: opt === mcq.correctAnswer ? "#10b981" : "var(--text-primary)"
                                        }}
                                    >
                                        {String.fromCharCode(65 + j)}. {opt}
                                    </li>
                                ))}
                            </ul>
                            {mcq.explanation && (
                                <div style={{ marginTop: "1rem", padding: "12px", background: "rgba(139, 92, 246, 0.1)", borderRadius: "8px", borderLeft: "4px solid var(--accent-color)" }}>
                                    <p style={{ fontSize: "0.9rem", margin: 0 }}>
                                        <strong>Explanation:</strong> {mcq.explanation}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "4rem 2rem",
    },
    header: {
        marginBottom: "3rem",
    },
    content: {
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
    },
    badge: {
        fontSize: "0.75rem",
        background: "rgba(139, 92, 246, 0.2)",
        color: "var(--accent-color)",
        padding: "4px 10px",
        borderRadius: "12px",
        fontWeight: "600",
    },
    questionsList: {
        padding: "2rem",
    },
    questionItem: {
        paddingBottom: "2rem",
        marginBottom: "2rem",
        borderBottom: "1px solid var(--surface-border)",
    },
    editLabel: {
        display: "block",
        marginBottom: "0.5rem",
        fontSize: "0.9rem",
        fontWeight: 600,
        color: "var(--text-secondary)",
    }
};
