import React, { useEffect, useState } from "react";
import axios from "axios";

const EHRSConnector = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/patients")
      .then(res => setPatients(res.data))
      .catch(err => console.error("Error fetching:", err));
  }, []);

  const sendData = () => {
    axios.post("http://localhost:5000/api/send-data", { name: "EHRS" })
      .then(res => console.log("✅", res.data))
      .catch(err => console.error("❌", err));
  };

  return (
    <div>
      <h2>Patient List (Dummy Data)</h2>
      {patients.map((p, idx) => (
        <div key={idx}>
          {p.name} - {p.age} yrs - {p.diagnosis}
        </div>
      ))}
      <button onClick={sendData}>Send Dummy Data</button>
    </div>
  );
};

export default EHRSConnector;
