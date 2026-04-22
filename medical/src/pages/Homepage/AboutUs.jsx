import React from "react";
import { useNavigate } from "react-router-dom";
import au1 from "../../assets/AU1.jpg";
import au2 from "../../assets/AU2.jpg";
import logo from "../../assets/logo.png";
const AboutUs = () => {
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
            <a href="/Services" className="hover:text-white">Services</a>
            <a href="/AboutUs" className="hover:text-white font-semibold border-b border-white/20 pb-1">
              About Us
            </a>
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
          Built to protect <span className="bg-gradient-to-r from-sky-300 to-teal-300 bg-clip-text text-transparent">health</span>
          data
        </h1>
        <p className="mt-4 text-slate-200/80 max-w-2xl text-sm md:text-base">
          EHRS is a role-based encrypted medical record system that makes patient data secure, shareable, and easy to manage.
        </p>
      </section>

      {/* Story */}
      <section className="max-w-6xl mx-auto px-6 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
            <div className="text-teal-300 font-bold text-sm uppercase tracking-wider">Mission</div>
            <div className="mt-2 text-xl font-extrabold">Secure workflows for every role</div>
            <p className="mt-3 text-sm text-slate-200/80 leading-relaxed">
              Encryption ensures documents and descriptions stay protected, while role-based dashboards help patients, doctors, and admins access the right data at the right time.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                <div className="font-bold">Encryption-first</div>
                <div className="text-sm text-slate-200/80 mt-1">AES-GCM protected content</div>
              </div>
              <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                <div className="font-bold">Role-based access</div>
                <div className="text-sm text-slate-200/80 mt-1">Patients, Doctors, Admins</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-0 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              <div className="p-4">
                <img src={au1} alt="Secure data" className="w-full h-52 object-cover rounded-xl border border-white/10" />
              </div>
              <div className="p-4">
                <img src={au2} alt="Cloud storage" className="w-full h-52 object-cover rounded-xl border border-white/10" />
              </div>
            </div>
            <div className="px-7 pb-7 pt-2">
              <div className="text-sm text-slate-200/80">Vision</div>
              <div className="mt-1 text-lg font-extrabold">Healthcare records should be effortless and safe.</div>
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
                <li><a href="/Home" className="hover:text-white">Home</a></li>
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

export default AboutUs;
