import React, { useEffect, useState } from 'react';
import { db } from './firebase'; // Import your firebase config
import { doc, onSnapshot } from 'firebase/firestore';

const VitalsDashboard = () => {
  const [vitals, setVitals] = useState({
    temperature: 0,
    pulse: 0,
    spo2: 0,
    ecg: 0,
    status: 'Loading...'
  });

  useEffect(() => {
    // Listen to the specific document "patient_santhoush" in "patients" collection
    const unsub = onSnapshot(doc(db, "patients", "patient_santhoush"), (doc) => {
      if (doc.exists()) {
        setVitals(doc.data());
      }
    });

    // Cleanup listener on unmount
    return () => unsub();
  }, []);

  // Simple Helper for Status Color
  const getStatusColor = () => {
    if (vitals.status === 'NORMAL') return 'green';
    return 'red';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Patient Monitor: Santhoush</h1>
      
      {/* Status Banner */}
      <div style={{ 
        backgroundColor: getStatusColor(), 
        color: 'white', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        STATUS: {vitals.status}
      </div>

      {/* Grid Layout for Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Card 1: Temperature */}
        <div style={cardStyle}>
          <h3>Temperature</h3>
          <p style={{ fontSize: '2rem', margin: '10px 0' }}>
            {vitals.temperature}°C
          </p>
        </div>

        {/* Card 2: Pulse */}
        <div style={cardStyle}>
          <h3>Heart Rate</h3>
          <p style={{ fontSize: '2rem', margin: '10px 0' }}>
            {vitals.pulse} <span style={{fontSize: '1rem'}}>BPM</span>
          </p>
        </div>

        {/* Card 3: SpO2 */}
        <div style={cardStyle}>
          <h3>SpO2</h3>
          <p style={{ fontSize: '2rem', margin: '10px 0' }}>
            {vitals.spo2}%
          </p>
        </div>

        {/* Card 4: ECG Voltage */}
        <div style={cardStyle}>
          <h3>ECG Level</h3>
          <p style={{ fontSize: '2rem', margin: '10px 0' }}>
            {vitals.ecg} mV
          </p>
        </div>
      </div>
    </div>
  );
};

// Simple inline styling for the card
const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

export default VitalsDashboard;