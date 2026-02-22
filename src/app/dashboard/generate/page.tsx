"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BsArrowLeft, BsCloudUpload, BsFileEarmarkText } from "react-icons/bs";

export default function GenerateMCQ() {
    const { status } = useSession();
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [models, setModels] = useState<any[]>([]);
    const [settings, setSettings] = useState({
        count: "10",
        language: "English",
        model: "",
        category: "General",
        isPublic: true,
        password: ""
    });

    React.useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/models")
                .then(res => res.json())
                .then(data => {
                    if (data.models && data.models.length > 0) {
                        setModels(data.models);
                        setSettings(s => ({ ...s, model: data.models[0].name }));
                    }
                })
                .catch(err => console.error("Error fetching models:", err));
        }
    }, [status]);

    if (status === "unauthenticated") {
        router.push("/auth/signin");
        return null;
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const generate = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("count", settings.count);
        formData.append("language", settings.language);
        formData.append("model", settings.model);
        formData.append("category", settings.category);
        formData.append("isPublic", settings.isPublic.toString());
        formData.append("password", settings.password);

        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/dashboard/set/${data.setId}`);
            } else {
                alert(data.error || "Generation failed.");
            }
        } catch (err: any) {
            console.error(err);
            alert("System error. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <header>
                <button className="btn-secondary" onClick={() => router.back()} style={{ border: 'none', padding: '0', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BsArrowLeft /> Back to Dashboard
                </button>
                <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>Create New Quiz</h1>
                <p style={{ color: "var(--text-secondary)" }}>Upload your material, set parameters, and let our AI do the rest.</p>
            </header>

            <div style={styles.grid}>
                {/* Upload Section */}
                <div className="glass-card animate-fade-in" style={styles.card}>
                    <h2 style={{ marginBottom: "1.5rem" }}>Document Upload</h2>

                    <div
                        style={{ ...styles.dropZone, borderColor: dragActive ? "var(--accent-color)" : "var(--surface-border)" }}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input type="file" id="fileUpload" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={handleChange} />
                        <div style={{ textAlign: "center" }}>
                            {file ? (
                                <>
                                    <BsFileEarmarkText size={48} color="var(--primary-color)" style={{ marginBottom: "1rem" }} />
                                    <h4>{file.name}</h4>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                                        {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown Type'}
                                    </p>
                                    <label htmlFor="fileUpload" style={styles.reselectText}>Choose another file</label>
                                </>
                            ) : (
                                <label htmlFor="fileUpload" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <BsCloudUpload size={48} color="var(--text-secondary)" style={{ marginBottom: "1rem" }} />
                                    <h4>Drag and drop your file here</h4>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                                        Supports PDF, DOCX, TXT
                                    </p>
                                    <span style={{ color: "var(--accent-color)", marginTop: "1rem", fontWeight: 600 }}>Browse Files</span>
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* Settings Section */}
                <div className="glass-card animate-fade-in delay-100" style={styles.card}>
                    <h2 style={{ marginBottom: "1.5rem" }}>AI Configuration</h2>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Number of Questions</label>
                        <input
                            type="number"
                            className="input-base"
                            value={settings.count}
                            onChange={e => setSettings({ ...settings, count: e.target.value })}
                            min="1" max="50"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Output Language</label>
                        <select
                            className="input-base"
                            value={settings.language}
                            onChange={e => setSettings({ ...settings, language: e.target.value })}
                        >
                            <option value="English">English</option>
                            <option value="Sinhala">Sinhala (සිංහල)</option>
                        </select>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>AI Model</label>
                        <select
                            className="input-base"
                            value={settings.model}
                            onChange={e => setSettings({ ...settings, model: e.target.value })}
                            style={{ appearance: "none", cursor: "pointer" }}
                        >
                            {models.map(m => (
                                <option key={m.name} value={m.name}>
                                    {m.displayName || m.name}
                                </option>
                            ))}
                            {models.length === 0 && <option value="">Loading models...</option>}
                        </select>
                        {settings.model && (
                            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                                {models.find(m => m.name === settings.model)?.description || ""}
                            </p>
                        )}
                    </div>

                    <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Category</label>
                            <select
                                className="input-base"
                                value={settings.category}
                                onChange={e => setSettings({ ...settings, category: e.target.value })}
                            >
                                <option value="General">General</option>
                                <option value="Science">Science</option>
                                <option value="History">History</option>
                                <option value="IT">IT & Tech</option>
                                <option value="Language">Language</option>
                                <option value="Medical">Medical</option>
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Privacy</label>
                            <select
                                className="input-base"
                                value={settings.isPublic ? "public" : "private"}
                                onChange={e => setSettings({ ...settings, isPublic: e.target.value === "public" })}
                            >
                                <option value="public">Public (Anyone can find)</option>
                                <option value="private">Private (Link/Password required)</option>
                            </select>
                        </div>
                    </div>

                    {!settings.isPublic && (
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Quiz Password (Optional)</label>
                            <input
                                type="password"
                                className="input-base"
                                placeholder="Leave blank for no password"
                                value={settings.password}
                                onChange={e => setSettings({ ...settings, password: e.target.value })}
                            />
                        </div>
                    )}

                    <button
                        className="btn-primary"
                        style={{ width: "100%", marginTop: "2rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "16px" }}
                        onClick={generate}
                        disabled={!file || loading}
                    >
                        {loading ? <div className="spinner"></div> : <span>Generate Selected Quiz</span>}
                    </button>
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
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gap: "2rem",
        marginTop: "2rem",
    },
    card: {
        display: "flex",
        flexDirection: "column",
    },
    dropZone: {
        flex: 1,
        border: "2px dashed",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1rem",
        backgroundColor: "rgba(0,0,0,0.2)",
        transition: "border 0.3s ease",
    },
    reselectText: {
        color: "var(--primary-color)",
        cursor: "pointer",
        fontSize: "0.85rem",
        marginTop: "1rem",
        display: "inline-block",
        textDecoration: "underline",
    },
    formGroup: {
        marginBottom: "1.5rem",
    },
    label: {
        display: "block",
        marginBottom: "0.5rem",
        fontWeight: 600,
        color: "var(--text-secondary)",
    },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
    }
};
