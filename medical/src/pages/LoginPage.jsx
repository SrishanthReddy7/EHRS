import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { loginUser } from "../api/authApi";

const LoginPage = () => {
  const [username, setusername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const data = await loginUser({ username, password });

      alert("Login successful");
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem("token", data.token);
      } else {
        // Prevent stale role/token mismatches from previous sessions.
        localStorage.removeItem("token");
      }

      if (data.user.role === "Admin") {
        navigate("/Admin");
      } else if (data.user.role === "Doctor") {
        navigate("/Doctor");
      } else if (data.user.role === "Patient") {
        navigate("/Patient");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(error.message || "Server error, please try again later");
    }
  };
  


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand panel */}
        <div className="hidden lg:block rounded-3xl border border-white/10 bg-white/5 p-10 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gradient-to-r from-sky-400/20 via-indigo-400/20 to-teal-300/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <img src={logo} alt="EHRS logo" className="h-12 w-auto rounded-lg bg-white/95 p-1 ring-1 ring-white/60 shadow" />
              <div>
                <div className="text-sm uppercase tracking-wider text-slate-200/80">Encrypted Healthcare</div>
                <div className="text-2xl font-extrabold bg-gradient-to-r from-sky-300 to-teal-300 bg-clip-text text-transparent">EHRS</div>
              </div>
            </div>
            <h2 className="mt-8 text-3xl font-extrabold leading-tight">
              Secure sign-in for <span className="text-teal-300">patients</span>, <span className="text-sky-300">doctors</span>, and <span className="text-indigo-300">admins</span>
            </h2>
            <p className="mt-4 text-sm text-slate-200/80 leading-relaxed">
              Your medical documents are protected with encryption. Log in to access role-based dashboards and appointments.
            </p>
            <div className="mt-8 space-y-3 text-sm text-slate-200/90">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-teal-300">✓</span>
                Encrypted record access
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-teal-300">✓</span>
                Admin-managed appointments
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-teal-300">✓</span>
                Role-based dashboards
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
          <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-sm text-slate-200/80 mb-6">
            Don&apos;t have an account?{" "}
            <Link to="/choose" className="text-teal-300 hover:underline font-semibold">Sign up</Link>
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200/90">Username</label>
              <input
                type="text"
                className="w-full p-3 mt-1 rounded-xl bg-black/20 border border-white/10 focus:outline-none focus:ring-2 focus:ring-teal-400/60 text-sm"
                value={username}
                onChange={(e) => setusername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200/90">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full p-3 mt-1 rounded-xl bg-black/20 border border-white/10 focus:outline-none focus:ring-2 focus:ring-teal-400/60 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="h-4 w-4"
              />
              <span className="text-sm text-slate-200/80">Show password</span>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-teal-400 text-slate-950 p-3 rounded-xl mt-2 font-bold hover:opacity-95 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
