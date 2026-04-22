import React from "react";
import { useNavigate } from "react-router-dom";
import Service1 from "../../assets/Services1.jpg"
import Service2 from "../../assets/Services2.jpg"
import Service3 from "../../assets/Services3.jpg"
import logo from "../../assets/logo.png";
const Services = () => {
    const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-950 text-slate-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/5 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EHRS logo" className="h-9 w-auto" />
            <span className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-sky-300 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
              EHRS
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-200/90">
            <a href="/Home" className="hover:text-white">Home</a>
            <a href="/Services" className="hover:text-white font-semibold border-b border-white/20 pb-1">
              Services
            </a>
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

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          Services built for <span className="bg-gradient-to-r from-sky-300 to-teal-300 bg-clip-text text-transparent">privacy</span>
        </h1>
        <p className="mt-4 text-slate-200/80 max-w-2xl text-sm md:text-base">
          From encryption to dashboards, EHRS keeps medical data secure and workflows simple.
        </p>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { img: Service1, title: "Encrypted Records", desc: "Documents and descriptions are encrypted and stored securely for controlled access." },
            { img: Service2, title: "Doctor Connections", desc: "Admins schedule connections so doctors see only their assigned patients." },
            { img: Service3, title: "Patient History", desc: "Patients view upcoming appointments and securely access their medical documents." },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition">
              <img src={card.img} alt={card.title} className="mx-auto mb-4 h-28 w-auto object-contain" />
              <div className="text-teal-300 font-bold mb-2">{card.title}</div>
              <div className="text-sm text-slate-200/80 leading-relaxed">{card.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-bold">Appointment Scheduling</div>
            <p className="mt-2 text-sm text-slate-200/80 leading-relaxed">
              Create a connection between a patient and doctor with date/time and notes.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs text-slate-200/80">
              Admin → Patient ↔ Doctor
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-bold">Controlled Access</div>
            <p className="mt-2 text-sm text-slate-200/80 leading-relaxed">
              Role-based dashboards help users access only what they are allowed to see.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs text-slate-200/80">
              Encryption + Role checks
            </div>
          </div>
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

export default Services;
