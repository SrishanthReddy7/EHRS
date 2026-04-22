import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"

const SplashScreen = () => {
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2500); // Start fade-out
    const redirectTimer = setTimeout(() => navigate("/Home"), 2000); // Redirect after fade

    return () => {
      clearTimeout(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div
      className={`h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-950 transition-opacity duration-500 ease-in-out ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <img
            src={logo}
            alt="EHRS Splash"
            className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-auto object-contain drop-shadow"
          />
          <div className="pointer-events-none absolute -inset-6 rounded-full bg-gradient-to-r from-sky-400/20 via-indigo-400/20 to-teal-300/20 blur-2xl animate-pulse" />
        </div>
        <p className="text-slate-200 text-sm sm:text-base tracking-wide">
          Encrypted medical records, securely delivered
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
