import { useState } from "react";
import logo from "../assets/logo.png";
import { useNavigate, Link } from "react-router-dom";

export default function PSignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const calculateAge = (dobString) => {
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async () => {
    setError("");

    // Validate required fields
    if (!firstName || !lastName || !aadhaar || !dob || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validate password strength to match backend policy
    const strongPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPwd.test(password)) {
      setError("Password must be 8+ chars and include upper, lower, number, and special character.");
      return;
    }

    const age = calculateAge(dob);
    if (age < 0 || age > 150) {
      setError("Please enter a valid date of birth.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email,
          password: password,
          role: "Patient",
          name: `${firstName} ${lastName}`,
          gender: "other", // default; you can add a gender field later
          dob: dob,
          age: age,
          blood_group: "O+", // default; you can add a blood group field later
          contact_info: aadhaar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create account.");
        setLoading(false);
        return;
      }

      alert("Account created successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err);
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-950 p-4 px-4">
      <div className="bg-white/5 border border-white/10 text-slate-100 p-8 md:p-10 rounded-3xl shadow-lg max-w-5xl w-full flex flex-col md:flex-row">
        {/* Form Section */}
        <div className="w-full md:w-2/3 md:pr-8">
          <h2 className="text-3xl font-extrabold mb-4 text-center md:text-left">Create an account</h2>
          <p className="text-sm text-slate-200/80 mb-4 text-center md:text-left">
            Already have an account?{" "}
            <Link to="/login" className="text-teal-300 hover:underline font-semibold">
              Login
            </Link>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/20 text-red-200 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">First name</label>
              <input
                type="text"
                placeholder="First name"
                className="border p-2 rounded w-full"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700">Last name</label>
              <input
                type="text"
                placeholder="Last name"
                className="border p-2 rounded w-full"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700">Aadhaar No.</label>
              <input
                type="text"
                placeholder="Aadhaar No."
                className="border p-2 rounded w-full"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700">DOB</label>
              <input
                type="date"
                className="border p-2 rounded w-full"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700">Email address</label>
              <input
                type="email"
                placeholder="Email address"
                className="border p-2 rounded w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="border p-2 rounded w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="border p-2 rounded w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Show Password Checkbox */}
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              className="mr-2"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <span>Show password</span>
          </div>

          {/* Signup Button */}
          <button
            className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-teal-400 text-slate-950 py-3 rounded-2xl font-bold hover:opacity-95 transition disabled:opacity-50"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create an Account"}
          </button>
        </div>

        {/* Image Section */}
        <div className="w-full md:w-1/3 flex justify-center items-center mt-6 md:mt-0">
          <img src={logo} alt="EHRS Logo" className="w-32 md:w-40 h-auto rounded-lg bg-white/95 p-2 ring-1 ring-white/60 shadow" />
        </div>
      </div>
    </div>
  );
}
