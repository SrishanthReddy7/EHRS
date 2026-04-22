import React, { useState, useEffect } from "react";
import { MdSettings, MdClose } from "react-icons/md";
import { MdLogout } from "react-icons/md";
import logo from "../../assets/logo.png";
import patientai from "../../assets/doctor.webp";
import axios from "axios";

function Doctorpage() {
  const [selectedTab, setSelectedTab] = useState("schedule");
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [appointmentStatus, setAppointmentStatus] = useState("");
  const [error, setError] = useState(null);
  const [existingMedicalRecord, setExistingMedicalRecord] = useState(null);
  const [recordVersionHistory, setRecordVersionHistory] = useState([]);

  useEffect(() => {
    const loadDoctorWorkspaceData = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;

        if (!user?.username) {
          setError("No user data found. Please log in again.");
          setLoading(false);
          return;
        }

        const username = user.username;

        const doctorResponse = await axios.get(`http://localhost:5000/api/doctor/${username}`);
        setDoctorDetails(doctorResponse.data);

        const appointmentsResponse = await axios.get(`http://localhost:5000/api/doctor/${doctorResponse.data._id}/appointments/today`);
        setAppointments(appointmentsResponse.data);

        const patientsResponse = await axios.get(`http://localhost:5000/api/doctor/${doctorResponse.data._id}/patients`);
        setPatients(patientsResponse.data);
      } catch (error) {
        setError(`Error loading data: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadDoctorWorkspaceData();
  }, []);

  const handleRecordFileSelection = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const loadExistingMedicalRecord = async (patientName) => {
    try {
      const patientResponse = await axios.get(`http://localhost:5000/api/patient/by-name/${patientName}`);
      if (patientResponse.data && patientResponse.data._id) {
        const medicalRecordResponse = await axios.get(
          `http://localhost:5000/api/medical-record/${patientResponse.data._id}/${doctorDetails._id}`
        );
        if (medicalRecordResponse.data) {
          setExistingMedicalRecord(medicalRecordResponse.data);
          setDescription(medicalRecordResponse.data.description || "");
          await loadRecordVersionHistory(medicalRecordResponse.data._id);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error fetching existing medical record:", error);
      return false;
    }
  };

  const loadRecordVersionHistory = async (recordId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/medical-record/${recordId}/versions`);
      setRecordVersionHistory(response.data.history || []);
    } catch {
      setRecordVersionHistory([]);
    }
  };

  const submitMedicalRecord = async () => {
    if (!selectedPatient) return;

    try {
      const patientResponse = await axios.get(`http://localhost:5000/api/patient/by-name/${selectedPatient.name}`);
      if (!patientResponse.data) {
        alert("Patient not found.");
        return;
      }

      const patientId = patientResponse.data._id;
      const doctorId = doctorDetails._id;
      const normalizedDescription = (description || "").trim();

      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('patientId', patientId);
      formData.append('doctorId', doctorId);
      formData.append('description', normalizedDescription);

      if (existingMedicalRecord) {
        formData.append('recordId', existingMedicalRecord._id);
        await axios.put('http://localhost:5000/api/update-medical-record', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert("Medical record updated successfully");
      } else {
        await axios.post('http://localhost:5000/api/create-medical-record', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert("Medical record created successfully");
      }

      setShowModal(false);
      setSelectedFile(null);
      setDescription("");
      setExistingMedicalRecord(null);
      setRecordVersionHistory([]);
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      alert(`Failed to ${existingMedicalRecord ? 'update' : 'create'} medical record: ${serverMessage || error.message}`);
    }
  };

  const updateAppointmentStatus = async (status) => {
    if (!selectedPatient || !selectedPatient.appointmentId) return;
    try {
      await axios.post('http://localhost:5000/admin/update-appointment-status', {
        appointmentId: selectedPatient.appointmentId,
        status
      });
      setAppointmentStatus(status);
      if (status !== 'scheduled') {
        const updatedAppointments = await axios.get(`http://localhost:5000/api/doctor/${doctorDetails._id}/appointments/today`);
        setAppointments(updatedAppointments.data);
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  const openPatientContext = async (patient) => {
    setSelectedPatient(patient);
    setAppointmentStatus(patient.status || "scheduled");

    const hasExistingRecord = await loadExistingMedicalRecord(patient.name);

    if (!hasExistingRecord) {
      setDescription("");
      setSelectedFile(null);
    }

    setShowModal(true);
  };

  const closePatientModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
    setSelectedFile(null);
    setDescription("");
    setExistingMedicalRecord(null);
    setRecordVersionHistory([]);
    setAppointmentStatus("");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = '/';
  };

  const openAllMedicalRecords = async (appointment) => {
    try {
      const patientResponse = await axios.get(`http://localhost:5000/api/patient/by-name/${appointment.name}`);
      if (!patientResponse.data) {
        alert("Patient not found.");
        return;
      }

      const patientId = patientResponse.data._id;
      const medicalRecordsResponse = await axios.get(`http://localhost:5000/api/patient/${patientId}/all-medical-records`);
      if (medicalRecordsResponse.data && medicalRecordsResponse.data.length > 0) {
        setSelectedPatient({ ...appointment, medicalRecords: medicalRecordsResponse.data });
        setShowModal(true);
      } else {
        alert("No medical records found for this patient.");
      }
    } catch (error) {
      console.error("Error fetching medical records:", error);
      alert("Failed to fetch medical records. Please try again.");
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-950 overflow-hidden text-slate-100">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <img src={logo} alt="logo" className="h-10 w-auto rounded-lg bg-white/95 p-1 ring-1 ring-white/60 shadow" />
          <div className="text-2xl font-bold leading-none bg-gradient-to-r from-sky-300 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
            EHRS
          </div>
        </div>

        <div className="flex gap-6 text-slate-200 font-semibold text-lg">
          <button
            className={`pb-1 ${selectedTab === "schedule" ? "border-b-2 border-teal-300/70 text-white" : "text-slate-200/70 hover:text-white"}`}
            onClick={() => setSelectedTab("schedule")}
          >
            Schedule
          </button>
          <button
            className={`pb-1 ${selectedTab === "patientList" ? "border-b-2 border-teal-300/70 text-white" : "text-slate-200/70 hover:text-white"}`}
            onClick={() => setSelectedTab("patientList")}
          >
            Patient List
          </button>
        </div>

        <div className="flex items-center gap-4">
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
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left Sidebar */}
        <div className="bg-white/5 text-slate-200 w-full md:w-[22%] flex flex-col items-center py-8 gap-6 shadow-inner border-r border-white/10">
          <img
            src={patientai}
            alt="Doctor avatar"
            className="w-24 h-24 rounded-full border-2 border-gray-400 shadow-md"
          />
          {loading ? (
            <div className="text-slate-200">Loading doctor details...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="border border-white/10 rounded-xl p-6 bg-white/10 shadow-lg w-[90%] flex flex-col gap-4 text-slate-100 text-lg leading-relaxed font-poppins ">
              <p className="text-lg font-semibold">
                <strong>Name:</strong> {doctorDetails.name || "Dr. Raj Chopra"}
              </p>
              <p className="text-lg font-semibold">
                <strong>Gender:</strong> {doctorDetails.gender || "Male"}
              </p>
              <p className="text-lg font-semibold">
                <strong>Age:</strong> {doctorDetails.age || "32"}
              </p>
              <p className="text-lg font-semibold">
                <strong>Blood Group:</strong> {doctorDetails.blood_group || "O+"}
              </p>
              <p className="text-lg font-semibold">
                <strong>Contact:</strong> {doctorDetails.contact_info || "9xxxx 9xxxx"}
              </p>
              {doctorDetails.doctor_id && (
                <p className="text-lg font-semibold">
                  <strong>Doctor ID:</strong> {doctorDetails.doctor_id}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white/5 p-6 flex flex-col items-center">
          {loading ? (
            <p className="text-lg text-slate-200">Loading data...</p>
          ) : error ? (
            <p className="text-lg text-red-600">{error}</p>
          ) : selectedTab === "schedule" ? (
            <>
              <h2 className="text-3xl font-bold text-slate-100 mb-6 text-center">Today's Schedule</h2>
              <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-4 overflow-y-auto h-[70vh] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                {appointments.length === 0 ? (
                  <p className="text-center text-slate-300 mt-10">No appointments scheduled for today.</p>
                ) : (
                  // In the appointments.map section of Doctorpage.jsx
                  // In the appointments map:
                  appointments.map((appointment, idx) => (
  <button
    key={idx}
    className="relative border border-gray-300 rounded-xl p-4 mb-6 shadow-md bg-white hover:bg-gray-200 text-left w-full"
    onClick={() => openPatientContext(appointment)}
  >
    {/* Name and Reason */}
    <div className="mb-4">
      <p className="text-lg font-semibold text-gray-800">
        Name: {appointment.name}
      </p>
      <p className="text-gray-700 mt-1">
        <strong>Reason:</strong> {appointment.reason}
      </p>
    </div>

    {/* Date, Time, and Medical Records Button */}
    <div className="absolute top-4 right-4 text-right">
      <p className="text-gray-700">
        <strong>Date:</strong> {appointment.date}
      </p>
      <p className="text-gray-700">
        <strong>Time:</strong> {appointment.time}
      </p>
      <button
        className="text-blue-600 underline hover:text-blue-800 transition mt-2"
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering the parent button's onClick
          openAllMedicalRecords(appointment);
        }}
      >
        View All Medical Records
      </button>
    </div>
  </button>
))
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-slate-100 mb-6 text-center">Patient List</h2>
              <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-4 overflow-y-auto h-[70vh] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                {patients.length === 0 ? (
                  <p className="text-center text-slate-300 mt-10">No patients assigned yet.</p>
                ) : (
                  patients.map((patient, idx) => (
                    <button
                      key={idx}
                      className="border border-gray-300 rounded-xl p-4 mb-4 shadow-md bg-white hover:bg-gray-200 text-left w-full"
                      onClick={() => openPatientContext(patient)}
                    >
                      <p className="text-lg font-semibold text-gray-800">Name: {patient.name}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-gray-700"><strong>Age:</strong> {patient.age}</p>
                          <p className="text-gray-700"><strong>Contact:</strong> {patient.contact}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
          <footer className="text-sm text-slate-400 mt-6">© 2026 EHRS. All rights reserved.</footer>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedPatient && (
  <div className="fixed inset-0 bg-gray-200 bg-opacity-80 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-150 h-150 p-6 relative max-w-4xl max-h-[90vh] overflow-y-auto text-slate-900">
      <button onClick={closePatientModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
        <MdClose className="text-2xl" />
      </button>

      {/* Patient Details */}
      <h2 className="text-2xl font-bold text-black mb-4">Patient Details</h2>
      <div className="bg-gray-100 p-4 rounded-lg mb-6 relative">
        <p className="text-xl font-semibold text-gray-800">{selectedPatient.name}</p>
        <p className="text-gray-700 mt-1"><strong>Reason:</strong> {selectedPatient.reason || "General Consultation"}</p>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            {selectedPatient.age && <p className="text-gray-700"><strong>Age:</strong> {selectedPatient.age}</p>}
            {selectedPatient.contact && <p className="text-gray-700"><strong>Contact:</strong> {selectedPatient.contact}</p>}
          </div>
        </div>
        <div className="absolute top-4 right-4 text-gray-700">
          <p><strong>Date:</strong> {selectedPatient.date || "Not specified"}</p>
          <p><strong>Time:</strong> {selectedPatient.time || "Not specified"}</p>
        </div>
      </div>

      {/* Medical Records Section */}
      {selectedPatient.medicalRecords && (
        <>
          <h2 className="text-2xl font-bold text-black mt-8">Medical Records</h2>
          <div className="mt-4 space-y-4">
            {selectedPatient.medicalRecords.map((record, index) => (
              <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <p className="text-lg font-semibold text-gray-800">{record.description}</p>
                <p className="text-gray-700 mt-1"><strong>Date:</strong> {new Date(record.date).toLocaleDateString()}</p>
                {record.pdf && (
                  <a
                    href={`http://localhost:5000/api/view-file/${record._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline mt-2 inline-block"
                  >
                    View Document
                  </a>
                )}

                {existingMedicalRecord && existingMedicalRecord.pdf && (
                  <div className="mt-4">
                    <a 
                      href={`http://localhost:5000/api/view-file/${existingMedicalRecord._id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View Existing Document
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

            {/* Status */}
            <h2 className="text-2xl font-bold text-black mt-4">Status of the Appointment</h2>
            <div className="flex justify-between mt-4">
              <button
                className={`w-60 p-4 border-2 ${appointmentStatus === 'completed' ? 'border-green-500 bg-green-100 text-green-900' : 'border-gray-300 text-slate-800'} rounded-lg`}
                onClick={() => updateAppointmentStatus('completed')}
              >
                Completed
              </button>
              <button
                className={`w-60 p-4 border-2 ${appointmentStatus === 'cancelled' ? 'border-red-500 bg-red-100 text-red-900' : 'border-gray-300 text-slate-800'} rounded-lg`}
                onClick={() => updateAppointmentStatus('cancelled')}
              >
                Cancelled
              </button>
            </div>

            {/* Medical Record Description */}
            <h2 className="text-2xl font-bold text-black mt-8">
              {existingMedicalRecord ? 'Update Medical Record' : 'Create Medical Record'}
            </h2>
            {recordVersionHistory.length > 0 && (
              <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-800 mb-2">Previous Note Versions</h3>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {recordVersionHistory.map((item, idx) => (
                    <div key={`${item.updatedAt}-${idx}`} className="text-sm text-gray-700 border-b border-gray-200 pb-2">
                      <div className="font-medium">{new Date(item.updatedAt).toLocaleString()}</div>
                      <div>{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <textarea
              className="mt-4 p-4 border-2 border-gray-300 rounded-lg h-32 resize-none w-full"
              placeholder="Enter medical records description here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Upload PDF */}
            <h2 className="text-2xl font-bold text-black mt-8">Report Link</h2>
            <div className="mt-4">
              <label className="text-lg font-semibold text-gray-700">Upload PDF (optional):</label>
              <div className="mt-2 flex items-center gap-4">
                <input type="file" id="files" accept=".pdf" className="hidden" onChange={handleRecordFileSelection} />
                <label htmlFor="files" className="p-4 border-2 border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 text-black">
                  {selectedFile ? selectedFile.name : "Select File"}
                </label>
                <button 
                  onClick={submitMedicalRecord} 
                  className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {existingMedicalRecord ? 'Update Record' : 'Create Record'}
                </button>
              </div>
              {existingMedicalRecord && existingMedicalRecord.pdf && (
  <div className="mt-4">
          <a 
            href={`http://localhost:5000/${existingMedicalRecord.pdf}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View Existing Document
          </a>
  </div>
)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
}

export default Doctorpage;