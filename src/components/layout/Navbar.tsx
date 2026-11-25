"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Moon, Sun, Plus, Compass, History, Settings } from "lucide-react";

interface NavbarProps {
  currentTab: "analyze" | "history" | "settings";
  setCurrentTab: (tab: "analyze" | "history" | "settings") => void;
  onNewAnalysis: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onNewAnalysis }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    setIsDark(dark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    localStorage.setItem("truthlens_theme", nextDark ? "dark" : "light");
    setIsDark(nextDark);
  };

  const tabs = [
    { id: "analyze" as const, label: "Analyze", Icon: Compass },
    { id: "history" as const, label: "History", Icon: History },
    { id: "settings" as const, label: "Settings", Icon: Settings },
  ];

  return (
    <header className="site-header">
      <div className="nav-inner">
        <button
          type="button"
          onClick={() => setCurrentTab("analyze")}
          className="brand-lockup focus-visible:outline-none"
          aria-label="TruthLens home"
        >
          <span className="brand-symbol"><ShieldCheck size={20} strokeWidth={1.8} aria-hidden="true" /></span>
          <span>
            <span className="brand-name">TruthLens</span>
            <span className="brand-note">Media integrity · Claim context</span>
          </span>
        </button>

        <nav role="tablist" aria-label="Workspace sections" className="section-nav">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={currentTab === id}
              aria-controls="tabpanel-content"
              onClick={() => setCurrentTab(id)}
              className="nav-tab"
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          <button type="button" onClick={onNewAnalysis} className="new-analysis-button">
            <Plus aria-hidden="true" />
            <span className="new-analysis-label">New analysis</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            aria-pressed={isDark}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
            className="theme-toggle"
          >
            {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            <span className="theme-toggle-label">{isDark ? "Light" : "Dark"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
