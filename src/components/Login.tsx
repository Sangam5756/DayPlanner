"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Preview } from "./Preview";

export function Login() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("daymark-theme", newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("daymark-theme");
    if (savedTheme) {
      setTheme(savedTheme as "light" | "dark");
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  return (
    <main className="login">
      <section className="login-copy">
        <div className="login-header">
          <div className="logo">D</div>
          <button className="theme-toggle login-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? "☾" : "☀"}
          </button>
        </div>
        <p className="kicker">YOUR PERSONAL OPERATING SYSTEM</p>
        <h1>Turn intention into a day you can finish.</h1>
        <p className="intro">Plan focused work, DSA practice, learning, and life in one honest timeline.</p>
        <button className="google" onClick={() => signIn("google")}><span>G</span> Continue with Google</button>
        <small>Your plans stay private to your Google account.</small>
      </section>
      <section className="login-art">
        <div className="preview">
          <header><b>Today</b><strong>82% discipline</strong></header>
          <Preview time="07:00" title="Two pointer practice" meta="DSA - 60 min" kind="dsa" />
          <Preview time="10:00" title="Project focus block" meta="Office - 90 min" kind="office" />
          <Preview time="19:30" title="Read system design notes" meta="Reading - 45 min" kind="reading" />
        </div>
      </section>
    </main>
  );
}
