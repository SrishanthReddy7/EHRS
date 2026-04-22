// Updated server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { User, Patient, Doctor, Appointment, MedicalRecord, Admin } = require('./schema');
const bcrypt = require("bcrypt");
const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const { execSync } = require('child_process');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Configure multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const mongoURL = process.env.MongoURL;
const Port = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET || 'ehrs-dev-secret';
const REMINDER_LOOKAHEAD_MINUTES = Number(process.env.REMINDER_LOOKAHEAD_MINUTES || 90);

const app = express();
app.use(cors());
app.use(express.json());

const isStrongPassword = (plainPassword) => {
    if (typeof plainPassword !== 'string' || plainPassword.length < 8) return false;
    const hasUpper = /[A-Z]/.test(plainPassword);
    const hasLower = /[a-z]/.test(plainPassword);
    const hasDigit = /\d/.test(plainPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(plainPassword);
    return hasUpper && hasLower && hasDigit && hasSpecial;
};

const verifyAuthToken = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({ message: 'Missing auth token' });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.authUser = payload;
        next();
    } catch (_err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const buildReminderWindow = (referenceDate = new Date()) => {
    const windowStart = new Date(referenceDate);
    const windowEnd = new Date(referenceDate.getTime() + REMINDER_LOOKAHEAD_MINUTES * 60 * 1000);
    return { windowStart, windowEnd };
};

const appointmentToDateTime = (appointmentDate, appointmentTime) => {
    const date = new Date(appointmentDate);
    const [hours, minutes] = (appointmentTime || '00:00').split(':').map(Number);
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
};

const hasSmtpConfig = () =>
    !!process.env.SMTP_HOST && !!process.env.SMTP_PORT && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

const reminderTransporter = hasSmtpConfig()
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    })
    : null;

  const isLikelyEmail = (value) => {
    if (!value || typeof value !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

const sendEmailReminder = async ({ toEmail, patientName, doctorName, appointmentDate, appointmentTime }) => {
    if (!toEmail) return { sent: false, reason: 'Missing patient email' };
    if (!isLikelyEmail(toEmail)) {
      return { sent: false, reason: 'Invalid patient email format' };
    }

    const subject = 'EHRS Appointment Reminder';
    const text = [
        `Hi ${patientName || 'Patient'},`,
        '',
        `This is a reminder for your appointment with Dr. ${doctorName || 'Unknown'}.`,
        `Date: ${new Date(appointmentDate).toLocaleDateString()}`,
        `Time: ${appointmentTime || 'N/A'}`,
        '',
        'Please arrive 10 minutes early.',
        'EHRS Team'
    ].join('\n');

    if (!reminderTransporter) {
        console.log(`[Reminder Preview] To: ${toEmail}\n${text}`);
        return { sent: false, reason: 'SMTP not configured (preview logged)' };
    }

    try {
      await reminderTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject,
        text
      });
      return { sent: true };
    } catch (mailError) {
      return { sent: false, reason: `SMTP delivery failed: ${mailError.message}` };
    }
};

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB first, then start server
(async () => {
    try {
        if (!mongoURL) {
            throw new Error('Missing env MongoURL');
        }
        if (!Port) {
          throw new Error('Missing env PORT');
        }

        await mongoose.connect(mongoURL, {
            serverSelectionTimeoutMS: 15000,
        });
        console.log('✅ MongoDB connected successfully');

        app.listen(Port, () => {
            console.log(`✅ Server running on http://localhost:${Port}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server (MongoDB connection error):', err);
        process.exitCode = 1;
    }
})();




app.post("/login-legacy", async (req, res) => {
    const { username, password } = req.body;

    try {
        const normalizedUsername = (username || '').trim().toLowerCase();
        const user = await User.findOne({ username: normalizedUsername });
        if (!user) return res.status(400).json({ error: "User not found" });

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) return res.status(401).json({ error: "Incorrect password" });

        const { password_hash, ...userWithoutHash } = user.toObject();
        const token = jwt.sign(
            { id: user._id.toString(), username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '2h' }
        );
        res.json({ message: "Login successful", user: userWithoutHash, token });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/api/auth/verify', verifyAuthToken, async (req, res) => {
    res.json({
        valid: true,
        user: {
            id: req.authUser.id,
            username: req.authUser.username,
            role: req.authUser.role
        }
    });
});

// Upload medical record
app.post('/api/upload-medical-record', upload.single('file'), async (req, res) => {
    try {
        const { patientId, doctorId, description } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const encryptedDescription = encryptDescription(description);
        const inputFilePath = req.file.path;
        const encryptedFilePath = `${inputFilePath}.json`;

        execSync(`python Encryption.py ${inputFilePath} ${encryptedFilePath}`);

        // Normalize the file path to use forward slashes
        const normalizedFilePath = encryptedFilePath.replace(/\\/g, '/');

        const newRecord = new MedicalRecord({
            patient_id: patientId,
            doctor_id: doctorId,
            description: encryptedDescription,
            pdf: normalizedFilePath
        });

        await newRecord.save();
        fs.unlinkSync(inputFilePath); // Clean up original file
        res.status(201).json({ message: 'Medical record uploaded successfully' });
    } catch (error) {
        console.error('Error uploading medical record:', error);
        res.status(500).json({ message: 'Failed to upload medical record' });
    }
});

// Route to create a new user (Admin, Doctor, or Patient)
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role, name, gender, dob, age, blood_group, uid, contact_info, address, hospital_name} = req.body;

        // Check if required fields are present
        if (!username || !password || !role) {
            return res.status(400).json({ message: 'Missing username, password, or role.' });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                message: 'Weak password. Use at least 8 chars including upper, lower, number, and special character.'
            });
        }

        const normalizedUsername = username.trim().toLowerCase();
        const duplicateUser = await User.findOne({ username: normalizedUsername });
        if (duplicateUser) {
            return res.status(409).json({ message: 'Username already exists. Please choose another one.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const newUser = new User({
            username: normalizedUsername,
            password_hash: hashedPassword,
            role: role.trim(),
        });

        // Save the user
        const savedUser = await newUser.save();

        // Initialize profile object
        let profile = null;

        // Add to respective role collection based on user role
        if (role === 'Doctor') {
            // Check if all required fields for doctor are provided
            if (!name || !gender || !age || !blood_group || !uid) {
                return res.status(400).json({ message: 'Doctor requires name, gender, age, blood group, and UID.' });
            }

            // Create new doctor profile
            const newDoctor = new Doctor({
                name,
                username: normalizedUsername,
                gender,
                age,
                blood_group,
                uid,
                contact_info,
            });

            profile = await newDoctor.save();
        }

        if (role === 'Patient') {
            // Check if all required fields for patient are provided
            if (!name || !gender || !dob || !age || !blood_group) {
                return res.status(400).json({ message: 'Patient requires name, gender, dob, age, and blood group.' });
            }

            // Create new patient profile
            const newPatient = new Patient({
                name,
                username: normalizedUsername,
                gender,
                dob,
                age,
                blood_group,
                contact_info,
                address,
            });

            profile = await newPatient.save();
        }

        if (role === 'Admin') {
            if (!name || !hospital_name) {
                return res.status(400).json({ message: 'Admin requires name and hospital_name.' });
            }

            const newAdmin = new Admin({
                name,
                username: normalizedUsername,
                hospital_name,
                password_hash: hashedPassword  // ✅ Add this line to store hashed password
            });

            profile = await newAdmin.save();
        }


        // Return success response with the user and profile data
        const { password_hash, ...userWithoutHash } = savedUser.toObject();
        res.status(201).json({
            user: userWithoutHash,
            profile,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Could not create user', error: error.message });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
    const normalizedUsername = (username || '').trim().toLowerCase();
    const user = await User.findOne({ username: normalizedUsername });

        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        // Compare the hashed password stored in the database
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        // Prepare user object without password_hash for response
        const { password_hash, ...userWithoutHash } = user.toObject();
        const token = jwt.sign(
          { id: user._id.toString(), username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '2h' }
        );

        res.json({
            message: "Login successful",
            user: userWithoutHash,  // Return the user data excluding the password
          token,
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// View admin active connection count and name
// Route to get active admin stats (active doctors, active patients, active connections)
// Updated /api/admin/dashboard-stats endpoint
app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
        // Get counts of active doctors and patients
        const activeAppointments = await Appointment.find({ status: 'scheduled' });
        
        // Get unique doctor and patient IDs from active appointments
        const activeDoctorIds = new Set();
        const activePatientIds = new Set();
        
        activeAppointments.forEach(appointment => {
            activeDoctorIds.add(appointment.doctor_id.toString());
            activePatientIds.add(appointment.patient_id.toString());
        });
        
        // Instead of using the Admin.active_connections field,
        // count the active connections directly from appointments
        const activeConnectionsCount = activeAppointments.length;
        
        const stats = {
            activeDoctors: activeDoctorIds.size,
            activePatients: activePatientIds.size,
            activeConnections: activeConnectionsCount
        };
        
        console.log('Active dashboard stats being sent:', stats);
        res.json(stats);
        
    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
});

// Also update the /admin/connect endpoint to not increment the counter
// since we're now counting active connections directly

// Update the update-appointment-status endpoint to not manipulate the counter
app.post('/admin/update-appointment-status', async (req, res) => {
    const { appointmentId, status } = req.body;

    try {
        const appointment = await Appointment.findByIdAndUpdate(appointmentId, { status }, { new: true });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // Remove the Admin.updateOne calls that manipulate active_connections
        // We're now counting active connections directly from appointments

        res.json({ message: 'Appointment status updated.', appointment });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ message: 'Failed to update appointment status.' });
    }
});
// Updated admin/stats endpoint
app.get('/admin/stats', async (req, res) => {
    try {
        // Find any admin - since we're just looking for stats
        const admin = await Admin.findOne({}, { password_hash: 0, __v: 0 });
        if (!admin) {
            return res.status(404).json({ error: 'Admin details not found' });
        }
        res.json(admin);
    } catch (err) {
        console.error('Error fetching admin stats:', err);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});


// Route to fetch active connections for the table
app.get('/admin/active-connections', async (req, res) => {
    try {
        const appointments = await Appointment.find({ status: 'scheduled' })
            .populate({ 
                path: 'patient_id', 
                select: 'patient_id name' 
            })
            .populate({ 
                path: 'doctor_id', 
                select: 'doctor_id name' 
            });

        const connections = appointments.map(app => ({
            patientId: app.patient_id.patient_id,
            patientName: app.patient_id.name,
            doctorId: app.doctor_id.doctor_id,
            doctorName: app.doctor_id.name,
            date: app.appointment_date.toISOString().split('T')[0], // YYYY-MM-DD format
            time: app.appointment_time,
            reason: app.notes,
            status: app.status,
        }));

        res.json(connections);
    } catch (err) {
        console.error('Failed to fetch active connections:', err);
        res.status(500).json({ message: 'Failed to fetch active connections.' });
    }
});

// Route to update appointment status (for decrementing active connections)
app.post('/admin/update-appointment-status', async (req, res) => {
    const { appointmentId, status } = req.body;

    try {
        const appointment = await Appointment.findByIdAndUpdate(appointmentId, { status }, { new: true });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // Check the previous status to avoid double decrementing/incrementing
        const originalAppointment = await Appointment.findById(appointmentId);
        if (originalAppointment?.status === 'scheduled' && status !== 'scheduled') {
            await Admin.updateOne({}, { $inc: { active_connections: -1 } });
        } else if (originalAppointment?.status !== 'scheduled' && status === 'scheduled') {
            await Admin.updateOne({}, { $inc: { active_connections: 1 } });
        }

        res.json({ message: 'Appointment status updated.', appointment });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ message: 'Failed to update appointment status.' });
    }
});

  // Route to get doctor details by username
app.get('/api/doctor/:username', async (req, res) => {
    try {
        const username = req.params.username;
        
        // First find the user
        const user = await User.findOne({ username, role: 'Doctor' });
        console.log(user)
        if (!user) {
            return res.status(404).json({ message: 'Doctor user not found.' });
        }
        
        // Find doctor profile using uid field which should match user._id
        const doctor = await Doctor.findOne({username});
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found.' });
        }
        
        res.json(doctor);
    } catch (error) {
        console.error('Error fetching doctor details:', error);
        res.status(500).json({ message: 'Failed to get doctor details.' });
    }
});

// Route to get today's appointments for a doctor
app.get('/api/doctor/:doctorId/appointments/today', async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        const startTime = "00:00";
        const endTime = "23:59";
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Find appointments for the doctor that are scheduled for today
        const appointments = await Appointment.find({
            doctor_id: doctorId,
            appointment_date: { $gte: today, $lt: tomorrow },
            appointment_time:{ $gte: startTime, $lt: endTime },
            status: 'scheduled'
        }).populate('patient_id')
        .sort({ appointment_time: 1 }); 
        
        const formattedAppointments = appointments.map(appointment => {
            const patient = appointment.patient_id;
            return {
                name: patient.name,
                date: appointment.appointment_date.toLocaleDateString('en-IN'),
                time:appointment.appointment_time,
                reason: appointment.notes || 'General Consultation',
                patientId: patient._id,
                appointmentId: appointment._id
            };
        });
        
        res.json(formattedAppointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Failed to get appointments.' });
    }
});

// Route to get all patients assigned to a doctor
app.get('/api/doctor/:doctorId/patients', async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        
        // Find all appointments for this doctor to get the associated patients
        const appointments = await Appointment.find({
            doctor_id: doctorId
        }).populate('patient_id');
        
        // Extract unique patients from appointments
        const patientMap = new Map();
        appointments.forEach(appointment => {
            const patient = appointment.patient_id;
            if (patient && !patientMap.has(patient._id.toString())) {
                patientMap.set(patient._id.toString(), {
                    id: patient._id,
                    name: patient.name,
                    age: patient.age,
                    contact: patient.contact_info || 'Not provided',
                    condition: appointment.notes || 'General Checkup'
                });
            }
        });
        
        const patientList = Array.from(patientMap.values());
        res.json(patientList);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Failed to get patient list.' });
    }
});

// One-time helper route to create a default admin user
// Visit http://localhost:5000/admin/bootstrap once to create it.
app.get('/admin/bootstrap', async (req, res) => {
    try {
        const existingUser = await User.findOne({ username: 'admin1', role: 'Admin' });
        if (existingUser) {
            return res.json({
                message: 'Admin user already exists.',
                username: 'admin1'
            });
        }

        const rawPassword = 'Admin@123';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // Create user entry
        const user = new User({
            username: 'admin1',
            password_hash: hashedPassword,
            role: 'Admin'
        });
        await user.save();

        // Create admin profile entry
        const admin = new Admin({
            name: 'Default Admin',
            username: 'admin1',
            hospital_name: 'XYZ Hospital',
            password_hash: hashedPassword
        });
        await admin.save();

        res.json({
            message: 'Default admin created successfully.',
            login: {
                username: 'admin1',
                password: rawPassword
            }
        });
    } catch (err) {
        console.error('Error bootstrapping admin:', err);
        res.status(500).json({ error: 'Failed to create default admin' });
    }
});


// app.listen moved to after Mongo connection

async function syncActiveConnectionsCount() {
    try {
        const activeAppointmentsCount = await Appointment.countDocuments({ status: 'scheduled' });
        
        // Update the admin model with the accurate count
        await Admin.updateOne({}, { $set: { active_connections: activeAppointmentsCount } });
        
        console.log(`✅ Active connections synced. Count: ${activeAppointmentsCount}`);
        return activeAppointmentsCount;
    } catch (error) {
        console.error('❌ Failed to sync active connections count:', error);
        throw error;
    }
}

// Add an endpoint to manually trigger synchronization
app.post('/admin/sync-connections', async (req, res) => {
    try {
        const count = await syncActiveConnectionsCount();
        res.json({ message: 'Active connections synced successfully', count });
    } catch (error) {
        res.status(500).json({ message: 'Failed to sync active connections' });
    }
});

// Updated admin/connect endpoint
app.post('/admin/connect', async (req, res) => {
    const { patientId, doctorId, appointmentDate, appointmentTime, notes } = req.body;
    try {
        const patient = await Patient.findOne({ patient_id: patientId });
        const doctor = await Doctor.findOne({ doctor_id: doctorId });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found.' });
        }
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        // Format the date properly
        let appDate;
        try {
            appDate = new Date(appointmentDate);
            if (isNaN(appDate.getTime())) {
                throw new Error('Invalid date');
            }
        } catch (error) {
            return res.status(400).json({ message: 'Invalid appointment date format.' });
        }

        const newAppointment = new Appointment({
            patient_id: patient._id,
            doctor_id: doctor._id,
            appointment_date: appDate,
            appointment_time: appointmentTime || 'Not Specified',
            notes: notes || 'General Consultation',
            status: 'scheduled'
        });

        const savedAppointment = await newAppointment.save();

        res.status(201).json({
            message: 'Connection created successfully.',
            appointment: savedAppointment
        });

    } catch (error) {
        console.error('Error creating connection:', error);
        res.status(500).json({ message: 'Failed to create connection.' });
    }
});

app.post('/admin/reminders/run-now', verifyAuthToken, async (req, res) => {
    try {
        if (req.authUser?.role !== 'Admin') {
            return res.status(403).json({ message: 'Only admin can trigger reminders.' });
        }
        const { windowStart, windowEnd } = buildReminderWindow();
        const scheduledAppointments = await Appointment.find({ status: 'scheduled' })
            .populate('patient_id')
            .populate('doctor_id');

        const dueAppointments = scheduledAppointments.filter((appointment) => {
            const startAt = appointmentToDateTime(appointment.appointment_date, appointment.appointment_time);
            return startAt >= windowStart && startAt <= windowEnd;
        });

        const reminderResults = [];
        for (const appointment of dueAppointments) {
            const patientDoc = appointment.patient_id;
            const doctorDoc = appointment.doctor_id;
            const delivery = await sendEmailReminder({
                toEmail: patientDoc?.username,
                patientName: patientDoc?.name,
                doctorName: doctorDoc?.name,
                appointmentDate: appointment.appointment_date,
                appointmentTime: appointment.appointment_time
            });

            reminderResults.push({
                appointmentId: appointment._id,
                patient: patientDoc?.name || 'Unknown',
                doctor: doctorDoc?.name || 'Unknown',
                email: patientDoc?.username || null,
                ...delivery
            });
        }

          const sentCount = reminderResults.filter((item) => item.sent).length;
          const failedCount = reminderResults.length - sentCount;

        res.json({
            lookAheadMinutes: REMINDER_LOOKAHEAD_MINUTES,
            dueCount: dueAppointments.length,
            sentCount,
            failedCount,
            results: reminderResults
        });
    } catch (error) {
        console.error('Error running reminder dispatch:', error);
        res.status(500).json({ message: 'Failed to run reminders.' });
    }
});

if (process.env.ENABLE_REMINDER_CRON === 'true') {
    cron.schedule('*/15 * * * *', async () => {
        try {
            const { windowStart, windowEnd } = buildReminderWindow();
            const appointments = await Appointment.find({ status: 'scheduled' })
                .populate('patient_id')
                .populate('doctor_id');

            const upcoming = appointments.filter((appointment) => {
                const startAt = appointmentToDateTime(appointment.appointment_date, appointment.appointment_time);
                return startAt >= windowStart && startAt <= windowEnd;
            });

            for (const appointment of upcoming) {
                await sendEmailReminder({
                    toEmail: appointment.patient_id?.username,
                    patientName: appointment.patient_id?.name,
                    doctorName: appointment.doctor_id?.name,
                    appointmentDate: appointment.appointment_date,
                    appointmentTime: appointment.appointment_time
                });
            }
            console.log(`Reminder cron processed ${upcoming.length} upcoming appointments.`);
        } catch (error) {
            console.error('Reminder cron failure:', error);
        }
    });
}


// Update the endpoint for doctor's appointments to include new fields
app.get('/api/doctor/:doctorId/appointments/today', async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Find appointments for the doctor that are scheduled for today
        const appointments = await Appointment.find({
            doctor_id: doctorId,
            appointment_date: { $gte: today, $lt: tomorrow },
            status: 'scheduled'
        }).populate('patient_id');
        
        const formattedAppointments = appointments.map(appointment => {
            const patient = appointment.patient_id;
            return {
                name: patient.name,
                date: appointment.appointment_date.toISOString().split('T')[0], // Consistent date format
                time: appointment.appointment_time,
                reason: appointment.notes || 'General Consultation',
                status: appointment.status,
                patientId: patient._id,
                appointmentId: appointment._id
            };
        });
        
        res.json(formattedAppointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Failed to get appointments.' });
    }
});

// Add these endpoints to your server.js file

// Get patient details by username
app.get('/api/patient/:username', async (req, res) => {
    try {
      const username = req.params.username;
      
      // First, find the user with the patient role
      const user = await User.findOne({ username, role: 'Patient' });
      if (!user) {
        return res.status(404).json({ message: 'Patient user not found.' });
      }
      
      // Then find the patient profile
      const patient = await Patient.findOne({ username });
      if (!patient) {
        return res.status(404).json({ message: 'Patient profile not found.' });
      }
      
      res.json(patient);
    } catch (error) {
      console.error('Error fetching patient details:', error);
      res.status(500).json({ message: 'Failed to get patient details.' });
    }
});
  
// Get patient's appointments with proper sorting by datetime
app.get('/api/patient/:patientId/appointments', async (req, res) => {
    try {
      const patientId = req.params.patientId;
      const now = new Date(); // Local current datetime
  
      const appointments = await Appointment.find({
        patient_id: patientId,
        status: 'scheduled'
      }).populate('doctor_id');
  
      const formattedAppointments = await Promise.all(
        appointments
          .filter(appointment => {
            let appointmentDate;
            // Support both Date object and string format
            if (typeof appointment.appointment_date === 'string') {
              const [year, month, day] = appointment.appointment_date.split('-').map(Number);
              appointmentDate = new Date(year, month - 1, day);
            } else {
              appointmentDate = new Date(appointment.appointment_date);
            }
  
            const [hours, minutes] = appointment.appointment_time.split(':').map(Number);
  
            const appointmentDateTime = new Date(
              appointmentDate.getFullYear(),
              appointmentDate.getMonth(),
              appointmentDate.getDate(),
              hours,
              minutes
            );
  
            return appointmentDateTime >= now;
          })
          .map(async appointment => {
            const doctor = appointment.doctor_id;
  
            let appointmentDate;
            if (typeof appointment.appointment_date === 'string') {
              const [year, month, day] = appointment.appointment_date.split('-').map(Number);
              appointmentDate = new Date(year, month - 1, day);
            } else {
              appointmentDate = new Date(appointment.appointment_date);
            }
  
            const [hours, minutes] = appointment.appointment_time.split(':').map(Number);
  
            const fullDateTime = new Date(
              appointmentDate.getFullYear(),
              appointmentDate.getMonth(),
              appointmentDate.getDate(),
              hours,
              minutes
            );
  
            return {
              appointmentId: appointment._id,
              date: appointment.appointment_date instanceof Date
                ? appointment.appointment_date.toISOString().split('T')[0]
                : appointment.appointment_date,
              time: appointment.appointment_time,
              doctorName: doctor.name,
              doctorId: doctor._id,
              reason: appointment.notes || 'General Consultation',
              status: appointment.status,
              fullDateTime: fullDateTime.toISOString()
            };
          })
      );
  
      // Sort by datetime
      formattedAppointments.sort((a, b) => new Date(a.fullDateTime) - new Date(b.fullDateTime));
  
      const cleanedAppointments = formattedAppointments.map(({ fullDateTime, ...rest }) => rest);
  
      res.json(cleanedAppointments);
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      res.status(500).json({ message: 'Failed to get patient appointments.' });
    }
  });
  
  
  

// Endpoint to cancel appointment
app.post('/api/appointment/:appointmentId/cancel', async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    
    appointment.status = 'cancelled';
    await appointment.save();
    
    res.json({ message: 'Appointment cancelled successfully.', appointment });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Failed to cancel appointment.' });
  }
});
  
  
  // Get patient's medical records
  app.get('/api/patient/:patientId/medical-records', async (req, res) => {
    try {
      const patientId = req.params.patientId;
      
      // Find all medical records for this patient
      const records = await MedicalRecord.find({
        patient_id: patientId
      }).populate('doctor_id');
      
      // Format records for the frontend
      const formattedRecords = records.map(record => {
        const doctor = record.doctor_id;
        
        return {
          recordId: record._id,
          date: record.createdAt || new Date(),
          description: record.description,
          doctorName: doctor ? doctor.name : 'Unknown Doctor',
          doctorId: doctor ? doctor._id : null,
          pdf: record.pdf 
        };
      });
      
      // Sort by date (newest first)
      const sortedRecords = formattedRecords.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      
      res.json(sortedRecords);
    } catch (error) {
      console.error('Error fetching patient medical records:', error);
      res.status(500).json({ message: 'Failed to get patient medical records.' });
    }
  });
  
  // Add a route to handle appointment cancellation
  app.post('/api/appointment/:appointmentId/cancel', async (req, res) => {
    try {
      const appointmentId = req.params.appointmentId;
      
      const appointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        { status: 'cancelled' },
        { new: true }
      );
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found.' });
      }
      
      res.json({ 
        message: 'Appointment cancelled successfully',
        appointment 
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      res.status(500).json({ message: 'Failed to cancel appointment.' });
    }
  });

  // Add these endpoints to server.js

// Get patient by name
app.get('/api/patient/by-name/:name', async (req, res) => {
    try {
      const name = req.params.name;
      
      // Find the patient with the given name
      const patient = await Patient.findOne({ name: name });
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found.' });
      }
      
      res.json(patient);
    } catch (error) {
      console.error('Error fetching patient by name:', error);
      res.status(500).json({ message: 'Failed to get patient by name.' });
    }
  });
  
  // Get existing medical record
  app.get('/api/medical-record/:patientId/:doctorId', async (req, res) => {
    try {
      const { patientId, doctorId } = req.params;
      
      // Find the most recent medical record for this patient-doctor pair
      const medicalRecord = await MedicalRecord.findOne({
        patient_id: patientId,
        doctor_id: doctorId
      }).sort({ uploadedAt: -1 });
      
      if (!medicalRecord) {
        return res.status(404).json({ message: 'No medical record found.' });
      }
      
      res.json(medicalRecord);
    } catch (error) {
      console.error('Error fetching medical record:', error);
      res.status(500).json({ message: 'Failed to get medical record.' });
    }
  });

  app.get('/api/medical-record/:recordId/versions', async (req, res) => {
    try {
      const { recordId } = req.params;
      const record = await MedicalRecord.findById(recordId, { note_versions: 1, description: 1, updatedAt: 1 });
      if (!record) {
        return res.status(404).json({ message: 'Medical record not found.' });
      }

      const history = [...(record.note_versions || [])].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      res.json({
        current: {
          description: record.description,
          updatedAt: record.updatedAt
        },
        history
      });
    } catch (error) {
      console.error('Error fetching medical record versions:', error);
      res.status(500).json({ message: 'Failed to fetch medical record versions.' });
    }
  });
  
  function encryptFile(inputFilePath, outputFilePath) {
    try {
        execSync(`python Encryption.py ${inputFilePath} ${outputFilePath}`);
        return outputFilePath;
    } catch (error) {
        console.error('Error encrypting file:', error);
        throw new Error('Failed to encrypt file');
    }
}

// Create a new medical record (encryption-friendly, but does not hard‑fail if Python is missing)
app.post('/api/create-medical-record', upload.single('file'), async (req, res) => {
  try {
    const { patientId, doctorId, description } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ message: 'Missing required fields: patientId and doctorId are required.' });
    }

    const safeDescription = (description || '').trim() || 'No description provided';
    let storedFilePath = null;

    if (req.file) {
      const inputFilePath = req.file.path;
      storedFilePath = inputFilePath;

      // Try to encrypt the file; if it fails, fall back to storing the original
      try {
        const encryptedFilePath = `${inputFilePath}.json`;
        const command = `python Encryption.py encrypt "${inputFilePath}" "${encryptedFilePath}"`;
        execSync(command);

        storedFilePath = encryptedFilePath;

        // Remove original only if encryption succeeded
        if (fs.existsSync(inputFilePath)) {
          fs.unlinkSync(inputFilePath);
        }
      } catch (encryptionError) {
        console.error('Encryption failed, storing original file instead:', encryptionError.message);
      }
    }

    const newRecord = new MedicalRecord({
      patient_id: patientId,
      doctor_id: doctorId,
      description: safeDescription,
      pdf: storedFilePath ? storedFilePath.replace(/\\/g, '/') : undefined,
      uploadedAt: new Date()
    });

    await newRecord.save();

    res.status(201).json({
      message: 'Medical record created successfully',
      record: newRecord
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({
      message: 'Failed to create medical record',
      error: error.message
    });
  }
});
  
  // Update an existing medical record
  app.put('/api/update-medical-record', upload.single('file'), async (req, res) => {
    try {
      const { recordId, patientId, doctorId, description } = req.body;
      
      if (!recordId) {
        return res.status(400).json({ message: 'Record ID is required.' });
      }
      
      // Find the existing record
      const existingRecord = await MedicalRecord.findById(recordId);
      if (!existingRecord) {
        return res.status(404).json({ message: 'Medical record not found.' });
      }
      
      // Keep immutable note history before applying latest change
      if (description && description !== existingRecord.description) {
        if (!Array.isArray(existingRecord.note_versions)) {
          existingRecord.note_versions = [];
        }
        existingRecord.note_versions.push({
          description: existingRecord.description,
          updatedByDoctorId: doctorId || null,
          updatedAt: new Date()
        });
      }

      // Update the latest record text
      existingRecord.description = description || existingRecord.description;
      existingRecord.uploadedAt = new Date(); // Update the upload timestamp
      
      // If a new file was uploaded, update the pdf field
      if (req.file) {
        // Delete the old file if it exists
        if (existingRecord.pdf) {
          try {
            fs.unlinkSync(existingRecord.pdf);
          } catch (unlinkError) {
            console.error('Error deleting old file:', unlinkError);
            // Continue even if delete fails
          }
        }
        existingRecord.pdf = req.file.path;
      }
      
      await existingRecord.save();
      
      res.status(200).json({ 
        message: 'Medical record updated successfully',
        record: existingRecord
      });
    } catch (error) {
      console.error('Error updating medical record:', error);
      res.status(500).json({ message: 'Failed to update medical record.' });
    }
  });
  
  

  app.get('/api/patient/:patientId/all-medical-records', async (req, res) => {
    try {
      const patientId = req.params.patientId;
  
      // Fetch all medical records for the patient, sorted by upload date
      const records = await MedicalRecord.find({ patient_id: patientId }).sort({ uploadedAt: -1 });
  
      // Format each record
      const formattedRecords = await Promise.all(records.map(async (record) => {
        let doctorName = 'Unknown Doctor';
        const doctorIdValue = record.doctor_id;
  
        // Fetch doctor's name
        try {
          const doctor = await Doctor.findOne({ _id: doctorIdValue });
          if (doctor) doctorName = doctor.name;
        } catch (err) {
          console.error('Error finding doctor:', err);
        }
  
        const storedPdfPath = typeof record.pdf === 'string' ? record.pdf : '';
        const filePath = storedPdfPath
          ? (path.isAbsolute(storedPdfPath) ? storedPdfPath : path.join(__dirname, storedPdfPath))
          : null;
        let pdfBase64 = '';
  
        try {
          // If it's a regular PDF
          if (storedPdfPath && storedPdfPath.endsWith('.pdf') && filePath) {
            if (fs.existsSync(filePath)) {
              pdfBase64 = fs.readFileSync(filePath, 'base64');
            } else {
              console.error("File does not exist:", filePath);
            }
          }
        } catch (error) {
          console.error("Error reading file:", error);
        }

        const obj = record.toObject();
        return {
          ...obj,
          date: obj.uploadedAt || obj.createdAt || new Date(),
          doctorName,
          pdfBase64
        };
      }));

      res.status(200).json(formattedRecords);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      res.status(500).json({ message: 'Error fetching medical records.' });
    }
});

app.get('/api/patient/:patientId/export-summary', async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const appointmentList = await Appointment.find({ patient_id: patientId })
      .populate('doctor_id')
      .sort({ appointment_date: -1 });

    const recordList = await MedicalRecord.find({ patient_id: patientId })
      .sort({ uploadedAt: -1 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ehrs-summary-${patient.patient_id || patient._id}.pdf"`
    );

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(20).text('EHRS Patient Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${patient.name}`);
    doc.text(`Patient ID: ${patient.patient_id || patient._id}`);
    doc.text(`Gender: ${patient.gender || 'N/A'}`);
    doc.text(`Age: ${patient.age || 'N/A'}`);
    doc.text(`Blood Group: ${patient.blood_group || 'N/A'}`);
    doc.text(`Generated At: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(16).text('Appointments');
    doc.moveDown(0.5);
    if (appointmentList.length === 0) {
      doc.fontSize(12).text('No appointments found.');
    } else {
      appointmentList.slice(0, 20).forEach((apt, idx) => {
        const doctorName = apt.doctor_id?.name || 'Unknown Doctor';
        doc
          .fontSize(11)
          .text(
            `${idx + 1}. ${new Date(apt.appointment_date).toLocaleDateString()} ${apt.appointment_time} | ${doctorName} | ${apt.status}`
          );
      });
    }

    doc.moveDown();
    doc.fontSize(16).text('Medical Records');
    doc.moveDown(0.5);
    if (recordList.length === 0) {
      doc.fontSize(12).text('No records found.');
    } else {
      recordList.slice(0, 20).forEach((record, idx) => {
        doc
          .fontSize(11)
          .text(
            `${idx + 1}. ${new Date(record.uploadedAt || record.createdAt).toLocaleDateString()} | ${record.description}`
          );
      });
    }

    doc.end();
  } catch (error) {
    console.error('Error exporting patient summary:', error);
    res.status(500).json({ message: 'Failed to export patient summary.' });
  }
});

  

app.get('/api/view-file/:fileId', async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.fileId);
    if (!record || !record.pdf) {
      return res.status(404).json({ message: 'File not found' });
    }

    const storedPath = record.pdf;
    const absolutePath = path.isAbsolute(storedPath)
      ? storedPath
      : path.join(__dirname, storedPath);

    // If the stored file is an encrypted JSON, decrypt then serve
    if (storedPath.endsWith('.json')) {
      const tempOutputPath = path.join(
        __dirname,
        'uploads',
        `temp_${Date.now()}_${path.basename(storedPath, '.json')}`
      );

      execSync(`python Encryption.py decrypt "${absolutePath}" "${tempOutputPath}"`);

      return res.sendFile(path.resolve(tempOutputPath), {}, () => {
        if (fs.existsSync(tempOutputPath)) {
          fs.unlinkSync(tempOutputPath);
        }
      });
    }

    // Otherwise assume it's a regular PDF stored on disk
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    return res.sendFile(path.resolve(absolutePath));
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ message: 'Error serving file' });
  }
});


// Health-check root route
app.get('/', (req, res) => {
    res.json({ message: 'EHRS API is running' });
});

app.use((req, res, next) => {
    res.status(404).json({ message: 'File not found' });
});







