"use client";
import React from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

export default function SignIn() {
    return (
        <div style={styles.container}>
            <div className="glass-card animate-fade-in" style={styles.card}>
                <div style={styles.header}>
                    <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Welcome Back</h2>
                    <p style={{ color: "var(--text-secondary)" }}>Sign in to continue to Questio</p>
                </div>

                <button
                    onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                    style={styles.googleBtn}
                >
                    <FcGoogle size={24} />
                    <span>Continue with Google</span>
                </button>

                <p style={styles.footerText}>
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
    },
    card: {
        width: "100%",
        maxWidth: "400px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
    },
    header: {
        marginBottom: "2rem",
    },
    googleBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        width: "100%",
        padding: "14px",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        border: "1px solid var(--surface-border)",
        borderRadius: "8px",
        color: "var(--text-primary)",
        fontSize: "1rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    footerText: {
        marginTop: "2rem",
        fontSize: "0.85rem",
        color: "var(--text-secondary)",
    }
};
