import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SplashScreen from "./pages/SplashScreen";
import "./App.css";
import AccountSelection from "./pages/AccountSelection";
import DSignupForm from "./pages/Dsignup";
import PSignupForm from "./pages/Psignup";
import Home from "./pages/Homepage/Home";
import Services from "./pages/Homepage/Services";
import AboutUs from "./pages/Homepage/AboutUs";
import Patientpage from "./pages/Patient/Patientpage";
import EHRSConnector from "./EHRSConnector"
import Adminpage from "./pages/Admin/AdminPage";
import Doctorpage from "./pages/Doctor/Doctorpage";
import ProtectedRoute from "./components/ProtectedRoute";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/choose" element={<AccountSelection />} />
        <Route path="/DSignup" element={<DSignupForm />} />
        <Route path="/PSignup" element={<PSignupForm />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Services" element={<Services />} />
        <Route path="/AboutUs" element={<AboutUs />} />
        <Route path="/Patient" element={<ProtectedRoute allowedRoles={["Patient"]}><Patientpage /></ProtectedRoute>} />
        <Route path="/ehrs" element={<EHRSConnector/>}/>
        <Route path="/Admin" element={<ProtectedRoute allowedRoles={["Admin"]}><Adminpage /></ProtectedRoute>} />
        <Route path="/Doctor" element={<ProtectedRoute allowedRoles={["Doctor"]}><Doctorpage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
