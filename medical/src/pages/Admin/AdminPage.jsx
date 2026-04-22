import React, { useState, useEffect } from "react";
import { MdSettings, MdRefresh, MdError } from "react-icons/md";
import { MdLogout } from "react-icons/md";
import logo from "../../assets/logo.png";
import patientai from "../../assets/admin.webp";
import {
    fetchDashboardStats as fetchDashboardStatsApi,
    fetchActiveConnections as fetchActiveConnectionsApi,
    fetchAdminStats as fetchAdminStatsApi,
    createConnection as createConnectionApi,
    triggerAppointmentReminders
} from "../../api/adminApi";
import { verifySessionToken } from "../../api/authApi";

function Adminpage() {
    const [adminDetails, setAdminDetails] = useState(null);
    const [dashboardStats, setDashboardStats] = useState({
        activeDoctors: 0,
        activePatients: 0,
        activeConnections: 0
    });
    const [patientIdInput, setPatientIdInput] = useState("");
    const [doctorIdInput, setDoctorIdInput] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentTime, setAppointmentTime] = useState("");
    const [appointmentReason, setAppointmentReason] = useState("");
    const [activeConnections, setActiveConnections] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingStats, setIsFetchingStats] = useState(false);
    const [isFetchingConnections, setIsFetchingConnections] = useState(false);
    const [isRunningReminderJob, setIsRunningReminderJob] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortMode, setSortMode] = useState("date_desc");

    // Set default date to today
    useEffect(() => {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        setAppointmentDate(formattedDate);
    }, []);

    // Fetch all data when component mounts
    useEffect(() => {
        console.log("Initial data loading started");
        
        const initializeDashboardData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    fetchAdminDetails(),
                    fetchActiveConnections(),
                    fetchDashboardStats()
                ]);
            } catch (error) {
                console.error("Error loading initial data:", error);
                setError("Failed to load dashboard data. Please refresh the page.");
            } finally {
                setIsLoading(false);
                console.log("All data loaded");
            }
        };
        
        initializeDashboardData();
    }, []);

    const fetchDashboardStats = async () => {
        console.log("Fetching dashboard stats...");
        setIsFetchingStats(true);
        try {
            const data = await fetchDashboardStatsApi();
            console.log("Dashboard stats received:", data);
            setDashboardStats(data);
            return data;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return null;
        } finally {
            setIsFetchingStats(false);
        }
    };

    const fetchAdminDetails = async () => {
        console.log("Fetching admin details...");
        try {
            const data = await fetchAdminStatsApi();
            console.log("Admin details received:", data);
            setAdminDetails(data);
            return data;
        } catch (error) {
            console.error('Error fetching admin details:', error);
            setAdminDetails(null);
            return null;
        }
    };

    const fetchActiveConnections = async () => {
        console.log("Fetching active connections...");
        setIsFetchingConnections(true);
        try {
            const data = await fetchActiveConnectionsApi();
            console.log("Active connections received:", data);
            setActiveConnections(data);
            return data;
        } catch (error) {
            console.error('Error fetching active connections:', error);
            return [];
        } finally {
            setIsFetchingConnections(false);
        }
    };

    const handleCreateConnection = async () => {
        // Clear previous messages
        setError("");
        setSuccess("");
        // Input validation
        if (!patientIdInput.trim()) {
            setError("Patient ID is required");
            return;
        }
        
        if (!doctorIdInput.trim()) {
            setError("Doctor ID is required");
            return;
        }
        
        if (!appointmentDate) {
            setError("Appointment date is required");
            return;
        }
        
        if (!appointmentTime) {
            setError("Appointment time is required");
            return;
        }
        
        try {
            console.log("Connecting patient and doctor...");
            
            await createConnectionApi({ 
                    patientId: patientIdInput, 
                    doctorId: doctorIdInput,
                    appointmentDate: appointmentDate,
                    appointmentTime: appointmentTime,
                    notes: appointmentReason 
                });

            console.log('Connection successful!');
            setSuccess("Connection successfully created!");
            
            // Refetch all data to update counts and connections
            console.log("Refreshing data after connection...");
            
            // Use setTimeout to give the server a moment to update before refetching
            setTimeout(async () => {
                try {
                    await Promise.all([
                        fetchDashboardStats(),
                        fetchActiveConnections()
                    ]);
                } catch (error) {
                    console.error("Error refreshing data:", error);
                }
                
                // Clear input fields
                setPatientIdInput("");
                setDoctorIdInput("");
                setAppointmentReason("");
                // Don't clear date and time for convenience
            }, 500);
        } catch (error) {
            setError(error.message || "Server error. Please try again.");
            console.error('Error connecting:', error);
        }
    };

    // Sync admin counter with actual connection count
    const handleSyncConnectionCount = async () => {
        try {
            const response = await fetch('http://localhost:5000/admin/sync-connections', {
                method: 'POST'
            });
            
            if (response.ok) {
                const data = await response.json();
                setSuccess(`Connections synced successfully. Count: ${data.count}`);
                await fetchDashboardStats();
            } else {
                setError("Failed to sync connections");
            }
        } catch (error) {
            console.error("Error syncing connections:", error);
            setError("Server error while syncing connections");
        }
    };

    const handleRunReminderJob = async () => {
        setError("");
        setSuccess("");
        try {
            setIsRunningReminderJob(true);
            const verified = await verifySessionToken();
            if (verified?.user?.role !== "Admin") {
                throw new Error("Only admin can trigger reminders. Please log in with an admin account.");
            }
            const result = await triggerAppointmentReminders();
            const sent = result?.sentCount ?? 0;
            const failed = result?.failedCount ?? 0;
            setSuccess(`Reminder job completed. Due: ${result.dueCount}, Sent: ${sent}, Failed: ${failed}`);
        } catch (runError) {
            if (runError?.status === 401) {
                localStorage.removeItem("token");
                setError("Session expired or invalid token. Please log out and log in again as Admin.");
            } else if (runError?.status === 403) {
                setError("Only admin can trigger reminders. Please re-login with an admin account.");
            } else {
                setError(runError.message || "Failed to run reminder job");
            }
        } finally {
            setIsRunningReminderJob(false);
        }
    };

    // Get admin name from local storage
    const resolveAdminDisplayName = () => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            return user.username || adminDetails?.name || "Admin";
        } catch {
            return "Admin";
        }
    };
    
    // Format numbers with commas for better readability
    const formatCountValue = (num) => {
        return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = '/';
      };

    const visibleConnections = [...activeConnections]
        .filter((conn) => {
            const search = searchQuery.trim().toLowerCase();
            const searchMatch =
                !search ||
                conn.patientId?.toLowerCase().includes(search) ||
                conn.doctorId?.toLowerCase().includes(search) ||
                conn.patientName?.toLowerCase().includes(search) ||
                conn.doctorName?.toLowerCase().includes(search) ||
                conn.reason?.toLowerCase().includes(search);
            const statusMatch = statusFilter === "all" || conn.status === statusFilter;
            return searchMatch && statusMatch;
        })
        .sort((a, b) => {
            if (sortMode === "date_asc") return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
            if (sortMode === "date_desc") return `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`);
            if (sortMode === "patient_asc") return (a.patientName || "").localeCompare(b.patientName || "");
            if (sortMode === "doctor_asc") return (a.doctorName || "").localeCompare(b.doctorName || "");
            return 0;
        });

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-950 text-slate-100">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur border-b border-white/10 shadow-sm">
                <div className="flex items-center gap-4">
                    <img src={logo} alt="logo" className="h-10 w-auto rounded-lg bg-white/95 p-1 ring-1 ring-white/60 shadow" />
                    <div className="text-2xl font-bold leading-none bg-gradient-to-r from-sky-300 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                        EHRS
                    </div>
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
                        alt="Admin avatar"
                        className="w-24 h-24 rounded-full border-2 border-gray-400 shadow-md"
                    />
                    <div className="bg-white/10 text-slate-100 w-[90%] rounded-lg text-sm leading-relaxed border border-white/10 shadow-lg flex flex-col justify-center px-6 py-4 space-y-4 font-poppins">
                        <p className="text-lg font-semibold">
                            <strong>Admin Username:</strong> {resolveAdminDisplayName()}
                        </p>
                        <p className="text-lg font-semibold">
                            <strong>Admin Level:</strong> 1
                        </p>
                        <p className="text-lg font-semibold">
                            <strong>Active Doctors:</strong> {isLoading || isFetchingStats ? "Loading..." : formatCountValue(dashboardStats.activeDoctors)}
                        </p>
                        <p className="text-lg font-semibold">
                            <strong>Active Patients:</strong> {isLoading || isFetchingStats ? "Loading..." : formatCountValue(dashboardStats.activePatients)}
                        </p>
                        <p className="text-lg font-semibold">
                            <strong>Active Connections:</strong> {isLoading || isFetchingStats ? "Loading..." : dashboardStats.activeConnections}
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={fetchDashboardStats}
                                disabled={isFetchingStats}
                                className={`mt-2 ${isFetchingStats ? 'bg-slate-500 cursor-not-allowed' : 'bg-slate-200 hover:bg-white'} text-slate-900 py-2 px-4 rounded-lg text-sm font-medium shadow-sm flex items-center justify-center`}
                            >
                                {isFetchingStats ? 'Refreshing...' : 'Refresh Stats'}
                                {!isFetchingStats && <MdRefresh className="ml-1" />}
                            </button>
                            <button 
                                onClick={handleSyncConnectionCount}
                                className="mt-2 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg text-sm font-medium shadow-sm"
                            >
                                Sync Counts
                            </button>
                            <button
                                onClick={handleRunReminderJob}
                                disabled={isRunningReminderJob}
                                className={`mt-2 ${isRunningReminderJob ? 'bg-amber-100 cursor-not-allowed' : 'bg-amber-200 hover:bg-amber-300'} text-amber-900 py-2 px-4 rounded-lg text-sm font-medium shadow-sm`}
                            >
                                {isRunningReminderJob ? "Sending..." : "Run Reminders"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 flex flex-col items-center">
                    <h2 className="text-3xl font-bold text-slate-100 mb-6 text-center">
                        Create New Connection
                    </h2>

                    <div className="flex flex-col gap-10 w-full max-w-4xl">
                        {/* Create New Connection Box */}
                        <div className="flex flex-col bg-white/10 border border-white/10 p-6 rounded-xl shadow-lg w-full space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 w-full mb-4">
                                <div className="w-full md:w-1/2">
                                    <label className="block text-slate-200 text-sm font-bold mb-2">Patient ID</label>
                                    <input
                                        type="text"
                                        placeholder="PATxxx"
                                        className="bg-slate-100 px-6 py-3 rounded-full border border-slate-300 text-slate-900 font-medium w-full shadow-inner"
                                        value={patientIdInput}
                                        onChange={(e) => setPatientIdInput(e.target.value.toUpperCase())}
                                    />
                                </div>
                                <div className="w-full md:w-1/2">
                                    <label className="block text-slate-200 text-sm font-bold mb-2">Doctor ID</label>
                                    <input
                                        type="text"
                                        placeholder="DOCxxx"
                                        className="bg-slate-100 px-6 py-3 rounded-full border border-slate-300 text-slate-900 font-medium w-full shadow-inner"
                                        value={doctorIdInput}
                                        onChange={(e) => setDoctorIdInput(e.target.value.toUpperCase())}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row md:items-center gap-4 w-full mb-4">
                                <div className="w-full md:w-1/2">
                                    <label className="block text-slate-200 text-sm font-bold mb-2">Appointment Date</label>
                                    <input
                                        type="date"
                                        className="bg-slate-100 px-6 py-3 rounded-full border border-slate-300 text-slate-900 font-medium w-full shadow-inner"
                                        value={appointmentDate}
                                        onChange={(e) => setAppointmentDate(e.target.value)}
                                    />
                                </div>
                                <div className="w-full md:w-1/2">
                                    <label className="block text-slate-200 text-sm font-bold mb-2">Appointment Time</label>
                                    <input
                                        type="time"
                                        className="bg-slate-100 px-6 py-3 rounded-full border border-slate-300 text-slate-900 font-medium w-full shadow-inner"
                                        value={appointmentTime}
                                        onChange={(e) => setAppointmentTime(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className="w-full mb-4">
                                <label className="block text-slate-200 text-sm font-bold mb-2">Reason for Appointment</label>
                                <input
                                    type="text"
                                    placeholder="Reason for appointment"
                                    className="bg-slate-100 px-6 py-3 rounded-full border border-slate-300 text-slate-900 font-medium w-full shadow-inner"
                                    value={appointmentReason}
                                    onChange={(e) => setAppointmentReason(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex justify-center mt-4">
                                <button
                                    className="bg-[#333333] hover:bg-[#444444] text-white px-8 py-3 rounded-full font-semibold transition shadow-md"
                                    onClick={handleCreateConnection}
                                >
                                    Connect
                                </button>
                            </div>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full flex items-center">
                                <MdError className="mr-2" />
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        
                        {success && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative w-full">
                                <span className="block sm:inline">{success}</span>
                            </div>
                        )}

                        {/* Active Connections Table */}
                        <div className="bg-white/10 border border-white/10 p-6 rounded-xl shadow-lg w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-semibold text-slate-100">
                                    Active Connections ({visibleConnections.length})
                                </h3>
                                <button 
                                    onClick={fetchActiveConnections} 
                                    disabled={isFetchingConnections}
                                    className={`${isFetchingConnections ? 'bg-slate-500 cursor-not-allowed' : 'bg-slate-200 hover:bg-white'} text-slate-900 px-3 py-1 rounded text-sm flex items-center`}>
                                    {isFetchingConnections ? 'Refreshing...' : 'Refresh'}
                                    {!isFetchingConnections && <MdRefresh className="ml-1" />}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search patient/doctor/reason"
                                    className="bg-white/80 text-gray-800 px-3 py-2 rounded border border-gray-300"
                                />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-white/80 text-gray-800 px-3 py-2 rounded border border-gray-300"
                                >
                                    <option value="all">All status</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <select
                                    value={sortMode}
                                    onChange={(e) => setSortMode(e.target.value)}
                                    className="bg-white/80 text-gray-800 px-3 py-2 rounded border border-gray-300"
                                >
                                    <option value="date_desc">Date (newest)</option>
                                    <option value="date_asc">Date (oldest)</option>
                                    <option value="patient_asc">Patient name (A-Z)</option>
                                    <option value="doctor_asc">Doctor name (A-Z)</option>
                                </select>
                            </div>
                            <div className="w-full overflow-x-auto">
                                <div className="flex font-semibold text-slate-200 border-b border-white/20 pb-2 text-center">
                                    <div className="w-1/6">Patient ID</div>
                                    <div className="w-1/6">Doctor ID</div>
                                    <div className="w-1/6">Date</div>
                                    <div className="w-1/6">Time</div>
                                    <div className="w-1/6">Reason</div>
                                    <div className="w-1/6">Status</div>
                                </div>
                                {isLoading || isFetchingConnections ? (
                                    <div className="text-center py-4 text-slate-300">Loading connections...</div>
                                ) : visibleConnections.length > 0 ? (
                                    visibleConnections.map((connection, index) => (
                                        <div key={index} className="flex text-slate-200 mt-4 text-center">
                                            <div className="w-1/6">{connection.patientId}</div>
                                            <div className="w-1/6">{connection.doctorId}</div>
                                            <div className="w-1/6">{connection.date || "N/A"}</div>
                                            <div className="w-1/6">{connection.time || "N/A"}</div>
                                            <div className="w-1/6">{connection.reason || "N/A"}</div>
                                            <div className="w-1/6 text-green-600 font-semibold">
                                                {connection.status}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-slate-300">No active connections found</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Adminpage;