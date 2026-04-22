import React from "react";
import { useNavigate } from "react-router-dom";
import doctor from "../assets/doctor.webp";
import patient from "../assets/patient.webp";
import logo from "../assets/logo.png";

const AccountSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-950 text-slate-100 flex items-center justify-center px-4">
      <div className="relative w-full max-w-4xl">
        <div className="absolute -top-6 right-0 opacity-100">
          <img
            src={logo}
            alt="EHRS Logo"
            className="h-14 sm:h-16 w-auto rounded-lg bg-white/95 p-1 ring-1 ring-white/60 shadow"
          />
        </div>

        <div className="text-center pt-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200/90">
            Choose your role to get started
          </div>
          <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold">
            Create your <span className="bg-gradient-to-r from-sky-300 to-teal-300 bg-clip-text text-transparent">EHRS</span> account
          </h1>
          <p className="mt-3 text-slate-200/80 text-sm sm:text-base">
            Pick the account type. You can always log in later.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Patient Card */}
          <button
            type="button"
            onClick={() => navigate("/Psignup")}
            className="group text-left rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
          >
            <div className="flex items-start gap-4">
              <img
                src={patient}
                alt="Patient"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-sm border border-white/10 object-cover"
              />
              <div>
                <div className="text-teal-300 font-bold text-lg">Patient</div>
                <div className="text-sm text-slate-200/80 mt-1">
                  View appointments and securely access your medical documents.
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                  Continue <span className="opacity-80">→</span>
                </div>
              </div>
            </div>
          </button>

          {/* Doctor Card */}
          <button
            type="button"
            onClick={() => navigate("/Dsignup")}
            className="group text-left rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
          >
            <div className="flex items-start gap-4">
              <img
                src={doctor}
                alt="Doctor"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-sm border border-white/10 object-cover"
              />
              <div>
                <div className="text-indigo-300 font-bold text-lg">Doctor</div>
                <div className="text-sm text-slate-200/80 mt-1">
                  Review patient schedules and manage encrypted medical records.
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                  Continue <span className="opacity-80">→</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-semibold"
            onClick={() => navigate("/login")}
          >
            Already have an account? Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSelection;
