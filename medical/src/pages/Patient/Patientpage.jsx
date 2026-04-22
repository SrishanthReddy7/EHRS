import React, { useState, useEffect } from "react";
import { MdSettings, MdLogout } from "react-icons/md";
import logo from "../../assets/logo.png";
import patientai from "../../assets/patient.webp";
import axios from "axios";

// Array of health tips to randomly select from
const WELLNESS_HINTS = [
  {
    title: "Stay Hydrated",
    description: "Drink at least 8 glasses of water a day to support digestion, circulation, and energy levels."
  },
  {
    title: "Get Some Sunlight",
    description: "10-15 minutes of morning sun helps regulate your circadian rhythm and boosts Vitamin D."
  },
  {
    title: "Take Deep Breaths",
    description: "Practice deep breathing for 5 minutes daily to reduce stress and improve oxygen flow."
  },
  {
    title: "Stretch Regularly",
    description: "Take short breaks to stretch throughout the day to improve flexibility and reduce muscle tension."
  },
  {
    title: "Limit Screen Time Before Bed",
    description: "Avoid screens 1 hour before bedtime to improve sleep quality and reduce eye strain."
  },
  {
    title: "Eat More Leafy Greens",
    description: "Include dark leafy vegetables in at least one meal per day for essential vitamins and minerals."
  },
  {
    title: "Practice Gratitude",
    description: "Write down three things you're grateful for each day to boost mental wellbeing."
  },
  {
    title: "Stay Active",
    description: "Aim for at least 30 minutes of moderate physical activity most days of the week."
  }
];

// Get random health tips
const pickRandomWellnessHints = (count = 2) => {
  const shuffled = [...WELLNESS_HINTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const HomeView = ({ appointments, medicalRecords, cancelAppointment, exportSummary }) => {
  // Get random health tips on component render or refresh
  const [wellnessHints, setWellnessHints] = useState(pickRandomWellnessHints());
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
  // Get the next upcoming appointment - already sorted from the backend
  const nextScheduledAppointment = appointments && appointments.length > 0 ? appointments[0] : null;

  // Function to format date to a more readable format
  const formatFriendlyDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Refresh health tips
  const refreshWellnessHints = () => {
    setWellnessHints(pickRandomWellnessHints());
  };

  return (
    <div className="p-4">
      {/* Modal for more appointments */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/10 border border-white/10 rounded-lg shadow-xl p-6 w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-100">All Upcoming Appointments</h3>
              <button 
                onClick={() => setIsAppointmentModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {appointments.slice(1).map((appointment, index) => (
                <div key={index} className="border border-white/20 rounded-lg p-4 bg-slate-900/40 hover:bg-slate-900/60 transition">
                  <div className="flex justify-between flex-wrap">
                    <span className="font-medium text-slate-100">{formatFriendlyDate(appointment.date)}</span>
                    <span className="text-slate-200">{appointment.time}</span>
                  </div>
                  <div className="mt-2 text-slate-100"><strong>Doctor:</strong> Dr. {appointment.doctorName}</div>
                  <div className="mt-1 text-slate-300">{appointment.reason}</div>
                  
                  <div className="mt-3 flex justify-end">
                    <button 
                      onClick={() => cancelAppointment(appointment.appointmentId)}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Cancel Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button 
                onClick={() => setIsAppointmentModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-900 rounded-md hover:bg-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    
      <div className="flex flex-row gap-6 flex-wrap">
        {/* Appointments Box */}
        <div className="bg-white/10 border border-white/10 rounded-xl shadow-md p-6 w-full md:w-7/15">
          <h2 className="text-2xl font-bold text-slate-100 mb-4">Your Next Appointment:</h2>

          {nextScheduledAppointment ? (
            <div className="border-2 border-white/20 rounded-xl p-4 bg-slate-900/50 flex flex-col gap-3 text-slate-100 text-lg">
              <div className="flex gap-2">
                <span className="font-semibold">📅 Date:</span> {formatFriendlyDate(nextScheduledAppointment.date)}
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">⏰ Time:</span> {nextScheduledAppointment.time}
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">👨‍⚕️ Doctor:</span> Dr. {nextScheduledAppointment.doctorName}
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">📝 Reason:</span> {nextScheduledAppointment.reason}
              </div>
            </div>
          ) : (
            <div className="border-2 border-white/20 rounded-xl p-4 bg-slate-900/50 flex flex-col gap-3 text-slate-100 text-lg">
              <p>No upcoming appointments scheduled.</p>
            </div>
          )}

          <div className="mt-6 bg-teal-50 border border-teal-300 p-4 rounded-xl space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-teal-600 text-xl">✅</span>
              <p className="text-slate-700">Please arrive 10 minutes early.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-teal-600 text-xl">✅</span>
              <p className="text-slate-700">
                Upload all relevant medical reports in your profile beforehand.
              </p>
            </div>
          </div>

          {/* "more" link for additional appointments */}
          {appointments && appointments.length > 1 && (
            <div className="mt-3 text-center">
              <button 
                onClick={() => setIsAppointmentModalOpen(true)}
                className="text-teal-600 hover:text-teal-800 hover:underline text-sm font-medium"
              >
                View more appointments ({appointments.length - 1})
              </button>
            </div>
          )}
        </div>

        {/* Small Changes, Big Impact Box - Fixed size with scrollable content */}
        <div className="bg-teal-50 border-2 border-teal-200 p-6 rounded-xl md:w-180 w-full h-120 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Small Changes, Big Impact:</h2>
            <button 
              onClick={refreshWellnessHints} 
              className="bg-teal-600 text-white px-3 py-1 rounded-lg hover:bg-teal-700 transition"
            >
              Refresh Tips
            </button>
          </div>

          <div className="flex-grow overflow-y-auto">
            {wellnessHints.map((tip, index) => (
              <div key={index} className={`${index > 0 ? 'mt-4' : ''} bg-white/10 border border-white/10 p-4 rounded-lg shadow-sm`}>
                <h3 className="font-bold text-lg text-teal-600 mb-1">{tip.title}</h3>
                <p className="text-gray-700">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medical History Box - Added below the appointment and health tips sections */}
      <div className="bg-white/10 border border-white/10 rounded-xl shadow-md p-6 w-full mt-6 text-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-100">Medical History</h2>
          <button
            onClick={exportSummary}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-teal-400 text-slate-950 font-semibold"
          >
            Export PDF Summary
          </button>
        </div>
        
        {medicalRecords && medicalRecords.length > 0 ? (
          <div className="space-y-6">
            {medicalRecords.map((record, index) => (
              <div key={index} className="border border-white/20 rounded-lg p-4 hover:bg-slate-900/40 transition">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-teal-300">{record.description}</h3>
                  <span className="text-slate-300 text-sm">{new Date(record.date).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="text-slate-200 font-medium">Doctor:</span>
                  <span>{record.doctorName}</span>
                </div>
                {record.pdf && (
                  <div className="mt-3">
                    <a 
                      href={`http://localhost:5000/api/view-file/${record.recordId}`}  
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition inline-flex items-center gap-1"
                    >
                  View Document
                  </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-300 italic">
            No medical records available yet. Your medical history will appear here once records are added.
          </p>
        )}
      </div>
    </div>
  );
};

const PatientPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  // Get username from localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const username = user?.username;
  
  // Handle logout
  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Redirect to login page
    window.location.href = '/';
  };
  
  useEffect(() => {
    // Function to fetch patient data
    const fetchPatientData = async () => {
      if (!username) {
        console.log("No username found in localStorage");
        setError("Please log in to view your details");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching patient data for username:", username);
        setLoading(true);
        
        // Fetch patient profile
        const patientResponse = await axios.get(`http://localhost:5000/api/patient/${username}`);
        console.log("Patient data received:", patientResponse.data);
        setPatientDetails(patientResponse.data);
        
        // Only proceed if we have a valid patient ID
        if (patientResponse.data && patientResponse.data._id) {
          const patientId = patientResponse.data._id;
          
          try {
            // Fetch appointments - already sorted by date and time from backend
            const appointmentsResponse = await axios.get(`http://localhost:5000/api/patient/${patientId}/appointments`);
            console.log("Appointments received:", appointmentsResponse.data);
            
            // No need to sort appointments here as they're already sorted by the backend
            // Just filter by scheduled status if needed
            const scheduledAppointments = appointmentsResponse.data.filter(app => app.status === 'scheduled');
            setAppointments(scheduledAppointments);

          } catch (appointmentsErr) {
            console.error("Error fetching appointments:", appointmentsErr);
            // Don't fail everything if appointments can't be loaded
          }
          
          try {
            // Fetch medical records
            const recordsResponse = await axios.get(`http://localhost:5000/api/patient/${patientId}/medical-records`);
            console.log("Medical records received:", recordsResponse.data);
            setMedicalRecords(recordsResponse.data);
          } catch (recordsErr) {
            console.error("Error fetching medical records:", recordsErr);
            // Don't fail everything if records can't be loaded
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching patient data:", err);
        setError("Failed to load patient data. Please try again later.");
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [username]);

  // Function to cancel appointment
  const cancelAppointment = async (appointmentId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/appointment/${appointmentId}/cancel`);
      
      if (response.status === 200) {
        // Remove canceled appointment from the display
        setAppointments(appointments.filter(app => app.appointmentId !== appointmentId));
        
        alert("Appointment canceled successfully");
      }
    } catch (error) {
      console.error("Error canceling appointment:", error);
      alert("Failed to cancel appointment. Please try again.");
    }
  };

  const exportPatientSummary = async () => {
    try {
      if (!patientDetails?._id) return;
      const response = await axios.get(
        `http://localhost:5000/api/patient/${patientDetails._id}/export-summary`,
        { responseType: "blob" }
      );
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileUrl = window.URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = fileUrl;
      anchor.download = `ehrs-summary-${patientDetails.patient_id || patientDetails._id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(fileUrl);
    } catch (downloadError) {
      console.error("Error exporting summary:", downloadError);
      alert("Failed to export summary.");
    }
  };

  // If there's no username in localStorage, show an error
  if (!username && !loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f0f0f0] items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-8 py-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
          <p>No user data found. Please log in again.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-950 overflow-hidden text-slate-100">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <img src={logo} alt="logo" className="h-10 w-auto rounded-lg bg-white/95 p-1 ring-1 ring-white/60 shadow" />
          <div className="text-2xl font-bold bg-gradient-to-r from-sky-300 via-indigo-300 to-teal-300 bg-clip-text text-transparent">EHRS</div>
        </div>

        <div className="flex items-center gap-4">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-md hover:opacity-95 transition"
          >
            <MdLogout className="text-xl" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Sidebar - Patient Info */}
        <div className="bg-white/5 text-slate-100 w-full lg:w-72 flex flex-col items-center py-8 gap-6 shadow-inner border-r border-white/10">
          <img
            src={patientai}
            alt="Patient avatar"
            className="w-24 h-24 rounded-full border-2 border-gray-400 shadow-md"
          />
          {loading ? (
              <div className="text-slate-100 py-4">Loading patient details...</div>
          ) : error ? (
            <div className="text-red-200 p-4">{error}</div>
          ) : patientDetails ? (
            <div className="border border-white/10 rounded-xl p-6 bg-white/5 shadow-sm w-[90%] flex flex-col gap-4 text-slate-100">
              <p>
                <strong>Name:</strong> {patientDetails.name}
              </p>
              <p>
                <strong>Gender:</strong> {patientDetails.gender}
              </p>
              <p>
                <strong>Age:</strong> {patientDetails.age}
              </p>
              <p>
                <strong>Blood Group:</strong> {patientDetails.blood_group}
              </p>
              <p>
                <strong>Contact:</strong> {patientDetails.contact_info || "Not provided"}
              </p>
              <p>
                <strong>Patient ID:</strong> {patientDetails.patient_id || "Not provided"}
              </p>
            </div>
          ) : (
            <div className="text-slate-200/80 p-4">No patient details available</div>
          )}
        </div>

        {/* Main View */}
        <div className="flex-grow p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-xl text-slate-200">Loading patient data...</div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : (
            <HomeView 
              patientDetails={patientDetails} 
              appointments={appointments}
              medicalRecords={medicalRecords}
              cancelAppointment={cancelAppointment}
              exportSummary={exportPatientSummary}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientPage;