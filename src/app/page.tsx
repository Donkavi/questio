"use client";
import React from "react";
import Link from "next/link";

import { BsMagic, BsFileText, BsPeopleFill } from "react-icons/bs";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation */}
      <nav style={styles.nav} className="glass-panel">
        <div style={styles.logo}>
          <span style={{ color: "var(--primary-color)" }}>Q</span>uestio
        </div>
        <div style={styles.navLinks}>
          <Link href="/auth/signin" className="btn-secondary" style={{ marginRight: '1rem' }}>
            Sign In
          </Link>
          <Link href="/auth/signin" className="btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero} className="animate-fade-in">
        <h1 style={styles.title}>
          Generate Intelligent <span style={styles.highlight}>MCQs instantly.</span>
        </h1>
        <p style={styles.subtitle}>
          Upload your PDF, DOCX, or text files and let our AI engine craft high-quality multiple choice questions in English or Sinhala.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <Link href="/dashboard" className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Start Generating
          </Link>
        </div>
      </section>

      {/* Features Showcase */}
      <section style={styles.features}>
        <div className="glass-card animate-fade-in delay-100" style={styles.featureCard}>
          <div style={styles.iconWrapper}><BsFileText size={28} color="var(--accent-color)" /></div>
          <h3>Document Upload</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.5 }}>
            Upload any text-based document. We automatically parse the content to fuel the AI Context.
          </p>
        </div>

        <div className="glass-card animate-fade-in delay-200" style={styles.featureCard}>
          <div style={styles.iconWrapper}><BsMagic size={28} color="var(--primary-color)" /></div>
          <h3>AI Generation</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.5 }}>
            Powered by Gemini & OpenAI. Get precision questions, correct answers, and thorough explanations.
          </p>
        </div>

        <div className="glass-card animate-fade-in delay-300" style={styles.featureCard}>
          <div style={styles.iconWrapper}><BsPeopleFill size={28} color="#10b981" /></div>
          <h3>Real-time Collaboration</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.5 }}>
            Share a unique session link. Test friends or students in a collaborative, synchronized environment.
          </p>
        </div>
      </section>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    margin: "1rem 2rem",
  },
  logo: {
    fontSize: "1.75rem",
    fontWeight: 700,
    letterSpacing: "-0.5px",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
  },
  hero: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "4rem 2rem",
    maxWidth: "800px",
    margin: "0 auto",
  },
  title: {
    fontSize: "4rem",
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: "-1px",
    marginBottom: "1.5rem",
  },
  highlight: {
    background: "linear-gradient(135deg, var(--primary-color), var(--accent-color))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "1.25rem",
    color: "var(--text-secondary)",
    maxWidth: "600px",
    lineHeight: 1.6,
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
    padding: "4rem 2rem",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
  },
  featureCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  iconWrapper: {
    padding: "1rem",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    marginBottom: "1rem",
  }
};
