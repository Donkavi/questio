"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BsClock, BsCheckCircleFill, BsXCircleFill, BsHouseDoor } from "react-icons/bs";

export default function ExamSession({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { status } = useSession();
    const router = useRouter();

    const [set, setSet] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [passwordInput, setPasswordInput] = useState("");
    const [isAuthorized, setIsAuthorized] = useState(false);

    const [timeLeft, setTimeLeft] = useState(60 * 10); // 10 minutes default if not set
    const [completed, setCompleted] = useState(false);
    const [score, setScore] = useState(0);

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
                        if (data.set.settings?.timeLimitTotal) {
                            setTimeLeft(data.set.settings.timeLimitTotal * 60);
                        } else {
                            setTimeLeft(data.set.mcqs.length * 60); // default 1 min per q
                        }

                        // Check if authorization is needed
                        if (!data.set.password || data.set.creatorId === (status === "authenticated" ? (useSession() as any).data?.user?.id : null)) {
                            setIsAuthorized(true);
                        }
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [id, status, router]);

    useEffect(() => {
        if (loading || completed || !set) return;
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }
        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, loading, completed, set]);

    const handleOptionSelect = (opt: string) => {
        if (completed) return;
        setAnswers({ ...answers, [currentIdx]: opt });
    };

    const calculateScore = () => {
        let s = 0;
        set.mcqs.forEach((q: any, i: number) => {
            if (answers[i] === q.correctAnswer) s += 1;
        });
        return s;
    };

    const handleSubmit = async () => {
        const finalScore = calculateScore();
        setScore(finalScore);
        setCompleted(true);

        // Map answers to the format needed for the API
        const formattedAnswers = set.mcqs.map((q: any, i: number) => ({
            questionIdx: i,
            selectedOption: answers[i] || "",
            isCorrect: answers[i] === q.correctAnswer
        }));

        try {
            await fetch("/api/attempts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quizId: set._id,
                    score: finalScore,
                    totalQuestions: set.mcqs.length,
                    answers: formattedAnswers
                })
            });
        } catch (err) {
            console.error("Failed to save results", err);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading || status === "loading") {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}><div className="spinner"></div></div>;
    }

    if (!set) {
        return <div style={{ textAlign: "center", padding: "4rem" }}>MCQ Set Not Found</div>;
    }

    if (!isAuthorized && set?.password) {
        return (
            <div style={styles.container}>
                <div className="glass-card animate-fade-in" style={{ ...styles.resultsCard, padding: '3rem' }}>
                    <h2 style={{ color: 'white', marginBottom: '1rem' }}>Private Quiz</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>This quiz is password protected.</p>
                    <input
                        type="password"
                        className="input-base"
                        placeholder="Enter Password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        style={{ marginBottom: '1rem' }}
                    />
                    <button
                        className="btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => {
                            if (passwordInput === set.password) {
                                setIsAuthorized(true);
                            } else {
                                alert("Incorrect Password");
                            }
                        }}
                    >
                        Verify & Start
                    </button>
                </div>
            </div>
        );
    }

    // -------------------------
    // RESULTS VIEW
    // -------------------------
    if (completed) {
        return (
            <div style={styles.container}>
                <div className="glass-card animate-fade-in" style={styles.resultsCard}>
                    <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "white" }}>Test Complete!</h1>
                    <div style={styles.scoreCircle}>
                        <span style={{ fontSize: "3rem", fontWeight: 800 }}>{score}</span>
                        <span style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>/ {set.mcqs.length}</span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "3rem", fontSize: "1.1rem" }}>
                        Accuracy: {Math.round((score / set.mcqs.length) * 100)}%
                    </p>

                    <div style={{ width: "100%", textAlign: "left" }}>
                        <h3 style={{ marginBottom: "1rem", color: "white" }}>Review Answers</h3>
                        <div style={styles.reviewList}>
                            {set.mcqs.map((mcq: any, idx: number) => (
                                <div key={idx} style={styles.reviewItem}>
                                    <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                                        Q{idx + 1}: {mcq.question}
                                    </p>

                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: answers[idx] === mcq.correctAnswer ? "#10b981" : "#ef4444", marginBottom: "0.5rem" }}>
                                        {answers[idx] === mcq.correctAnswer ? <BsCheckCircleFill /> : <BsXCircleFill />}
                                        <span>Your Answer: {answers[idx] || "Unanswered"}</span>
                                    </div>

                                    {answers[idx] !== mcq.correctAnswer && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981", marginBottom: "0.5rem" }}>
                                            <BsCheckCircleFill />
                                            <span>Correct Answer: {mcq.correctAnswer}</span>
                                        </div>
                                    )}

                                    {mcq.explanation && (
                                        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px", marginTop: "0.5rem" }}>
                                            <strong>Explanation:</strong> {mcq.explanation}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => router.push("/dashboard")} style={{ marginTop: "2rem", width: "100%" }}>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const q = set.mcqs[currentIdx];

    // -------------------------
    // ACTIVE EXAM VIEW
    // -------------------------
    return (
        <div style={styles.container}>
            {/* Exam Header */}
            <div style={styles.examHeader} className="glass-panel">
                <div>
                    <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--text-primary)" }}>{set.title}</h2>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Question {currentIdx + 1} of {set.mcqs.length}</span>
                </div>
                <div style={styles.timer}>
                    <BsClock />
                    <span style={{ color: timeLeft < 60 ? "#ef4444" : "var(--text-primary)", fontWeight: 700 }}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div className="glass-card animate-fade-in" key={currentIdx} style={styles.questionCard}>
                    <h2 style={styles.questionText}>{q.question}</h2>

                    <div style={styles.optionsList}>
                        {q.options.map((opt: string, i: number) => {
                            const isSelected = answers[currentIdx] === opt;
                            return (
                                <button
                                    key={i}
                                    style={{
                                        ...styles.optionBtn,
                                        background: isSelected ? "var(--accent-color)" : "rgba(255,255,255,0.05)",
                                        borderColor: isSelected ? "var(--accent-hover)" : "var(--surface-border)"
                                    }}
                                    onClick={() => handleOptionSelect(opt)}
                                >
                                    <span style={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
                                    <span style={{ textAlign: "left", flex: 1, color: "var(--text-primary)" }}>{opt}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div style={styles.examFooter}>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                        className="btn-secondary"
                        onClick={() => setCurrentIdx(p => Math.max(0, p - 1))}
                        disabled={currentIdx === 0}
                        style={{ width: "120px" }}
                    >
                        Previous
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => setCurrentIdx(p => Math.min(set.mcqs.length - 1, p + 1))}
                        disabled={currentIdx === set.mcqs.length - 1}
                        style={{ width: "120px" }}
                    >
                        Next
                    </button>
                </div>

                <button className="btn-primary" onClick={handleSubmit} style={{ width: "200px" }}>
                    Finish Attempt
                </button>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
    },
    examHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 1.5rem",
        marginBottom: "2rem",
    },
    timer: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "1.2rem",
        background: "rgba(0,0,0,0.3)",
        padding: "8px 16px",
        borderRadius: "20px",
    },
    questionCard: {
        padding: "3rem",
    },
    questionText: {
        fontSize: "1.5rem",
        fontWeight: 500,
        lineHeight: 1.5,
        marginBottom: "2.5rem",
        color: "white"
    },
    optionsList: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    optionBtn: {
        display: "flex",
        alignItems: "center",
        padding: "16px",
        borderRadius: "12px",
        border: "1px solid",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontSize: "1rem",
    },
    optionLetter: {
        width: "32px",
        height: "32px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginRight: "1rem",
        fontWeight: 600,
        color: "var(--text-primary)"
    },
    examFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "2rem",
    },
    resultsCard: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "4rem 2rem",
    },
    scoreCircle: {
        width: "180px",
        height: "180px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(229, 9, 20, 0.2), rgba(139, 92, 246, 0.2))",
        border: "4px solid var(--accent-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        marginBottom: "1rem",
    },
    reviewList: {
        maxHeight: "500px",
        overflowY: "auto",
        paddingRight: "1rem",
    },
    reviewItem: {
        padding: "1.5rem",
        borderBottom: "1px solid var(--surface-border)",
        marginBottom: "1rem",
    }
};
