import React from "react";
import { useNavigate } from "react-router-dom";
import Homepage from "../../assets/HomePage.jpg";
import logo from "../../assets/logo.png";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-950 text-slate-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/5 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EHRS logo" className="h-9 w-auto rounded-lg bg-white/95 p-1 ring-1 ring-white/60 shadow" />
            <span className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-sky-300 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
              EHRS
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-200/90">
            <a href="/Home" className="hover:text-white font-semibold">Home</a>
            <a href="/Services" className="hover:text-white">Services</a>
            <a href="/AboutUs" className="hover:text-white">About Us</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-lg border border-white/15 hover:bg-white/10 transition text-sm font-semibold"
              onClick={() => navigate("/choose")}
            >
              Sign Up
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-teal-400 text-slate-950 font-bold hover:opacity-95 transition text-sm"
              onClick={() => navigate("/login")}
            >
              Log In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-slate-200">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              Encrypted • Secure • Role-based
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              EHRS for secure <span className="bg-gradient-to-r from-sky-300 to-teal-300 bg-clip-text text-transparent">medical records</span>
            </h1>

            <p className="text-slate-200/80 text-sm md:text-base leading-relaxed">
              Store, share, and manage patient information with encryption and controlled access for patients, doctors, and admins.
            </p>

            <ul className="space-y-3 text-sm text-slate-200/90">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-teal-300">✓</span>
                Encrypted descriptions and documents
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-teal-300">✓</span>
                Doctor–patient appointment linking
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-teal-300">✓</span>
                Admin management and dashboards
              </li>
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                className="px-6 py-3 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition"
                onClick={() => navigate("/choose")}
              >
                Create Account
              </button>
              <button
                className="px-6 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition font-semibold"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-sky-400/25 via-indigo-500/20 to-teal-400/25 blur-xl" />
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-xl">
              <img
                src={Homepage}
                alt="EHRS dashboard preview"
                className="w-full h-full object-cover"
              />
              <div className="p-5 bg-gradient-to-t from-slate-950/70 to-transparent">
                <div className="text-xs text-slate-200/90">Encrypted record delivery</div>
                <div className="text-sm font-semibold text-white">Designed for privacy & clarity</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-6xl mx-auto px-6 pb-14">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold">Core capabilities</h2>
            <p className="text-slate-200/80 mt-2 text-sm">
              A clean experience for secure healthcare data workflows.
            </p>
          </div>
          <div className="hidden md:flex text-xs text-slate-200/70 border border-white/10 rounded-xl px-4 py-2">
            EHRS • 2026
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Encrypted Records",
              desc: "Encrypted medical descriptions and stored documents for secure access.",
            },
            {
              title: "Doctor Connections",
              desc: "Admin schedules appointments and doctors can view assigned patients.",
            },
            {
              title: "Patient History",
              desc: "Patients can view upcoming appointments and medical documents securely.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition">
              <div className="text-teal-300 font-bold mb-2">{item.title}</div>
              <div className="text-sm text-slate-200/80 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="font-bold">Quick Links</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-200/80">
                <li><a href="/AboutUs" className="hover:text-white">About Us</a></li>
                <li><a href="/Services" className="hover:text-white">Services</a></li>
                <li><a href="#" className="hover:text-white">Help</a></li>
              </ul>
            </div>
            <div>
              <div className="font-bold">Contact</div>
              <div className="mt-3 text-sm text-slate-200/80">
                <div>support@EHRS.com</div>
                <div>1-800-EHRS</div>
              </div>
            </div>
            <div>
              <div className="font-bold">Legal</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-200/80">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">HIPAA Compliance</a></li>
              </ul>
            </div>
          </div>

          <p className="text-center text-slate-300/70 mt-8 text-sm">© 2026 EHRS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
