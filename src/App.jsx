import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Activity, Thermometer, Droplets, Zap, User, 
  MapPin, Play, Square, Bluetooth, 
  MessageSquare, Trophy, 
  TrendingUp, Home, Settings, ShieldAlert, Footprints,
  Sparkles, Utensils, Navigation, Mail, Phone, MessageCircle, LocateFixed, CheckCircle, BarChart2 as BarChartIcon,
  Cpu, Wifi, Battery, Edit2, Camera, X, Save, Send, Database, Terminal, Usb, Menu, FileText, Calendar, Bell, Clock, Info, Globe, Lock, Smartphone, RefreshCw, LogIn, ArrowRight, Code, Copy, Mic, MicOff, Volume2, 
  Eye, EyeOff, HelpCircle, AlertTriangle, LogOut
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar 
} from 'recharts';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

// --- SCREEN IMPORTS ---
import Profile from './components/screens/Profile.jsx';
import Analytics from './components/screens/Analytics.jsx';
import AIChat from './components/screens/AIChat.jsx';
import TestHub from './components/screens/TestHub.jsx';

// --- FIREBASE CONFIG ---
import { ref, set } from "firebase/database";
import { database } from "./firebase";


/* --- EMBEDDED FIRMWARE CODE (C++) --- */
const ARDUINO_FIRMWARE_CODE = 
`#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>
#include <Wire.h>
#include "MAX30105.h"

// --- PIN DEFINITIONS ---
#define ONE_WIRE_BUS 8
#define GPS_RX 2
#define GPS_TX 3
#define SWEAT_PIN 9
#define LO_MINUS 10
#define LO_PLUS 11
#define ECG_PIN A0
#define EMG_PIN A1

// --- OBJECTS ---
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
LiquidCrystal_I2C lcd(0x27, 16, 2);
SoftwareSerial GPS_SoftSerial(GPS_RX, GPS_TX);
TinyGPSPlus gps;
MAX30105 particleSensor;

// --- VARIABLES ---
bool fingerDetected = false;
float ecgValue = 0;
float emgValue = 0;

// Change Detection
float lastTemp = 0;
int lastPulse = 0;
int lastSpo2 = 0;
int lastSweat = 1;

// LCD Management
int lcd_state = 0;
unsigned long lastLCD = 0;
bool showPulseScreen = false;
unsigned long pulseScreenTimer = 0;

// --- GPS HELPER ---
static void smartDelay(unsigned long ms) {
  unsigned long start = millis();
  do {
    while (GPS_SoftSerial.available())
      gps.encode(GPS_SoftSerial.read());
  } while (millis() - start < ms);
}

  delay(1000);

  sensors.begin();
  pinMode(SWEAT_PIN, INPUT);
  pinMode(LO_MINUS, INPUT);
  pinMode(LO_PLUS, INPUT);

  GPS_SoftSerial.begin(9600);
  delay(100);
  Serial.begin(9600);
  delay(100);

  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    lcd.clear();
    lcd.print("MAX30102 Fail");
    while (1) {}
  }
  particleSensor.setup(60, 4, 2, 100, 411, 4096); 
  particleSensor.enableDIETEMPRDY();
}

void loop() {
  smartDelay(10); 

  // 1. TEMPERATURE
  sensors.requestTemperatures();
  float t = sensors.getTempCByIndex(0);

  // 2. ECG
  if (digitalRead(LO_PLUS) == 1 || digitalRead(LO_MINUS) == 1)
    ecgValue = 0;
  else
    ecgValue = (analogRead(ECG_PIN) * (5.0 / 1023.0)) * 1000.0;

  // 3. EMG
  emgValue = analogRead(EMG_PIN);

  // 4. PULSE & SPO2
  long irValue = particleSensor.getIR();
  int pulse = 0;
  int spo2 = 0;

  if (irValue > 50000) {
    pulse = random(80, 111); // Demo values for stability
    spo2 = random(90, 100);
    fingerDetected = true;
  } else {
    fingerDetected = false;
  }

  // 5. LCD LOGIC
  if ((pulse != lastPulse || spo2 != lastSpo2) && fingerDetected) {
    lcd.clear();
    lcd.print("Pulse: "); lcd.print(pulse);
    lcd.setCursor(0, 1);
    lcd.print("SpO2 : "); lcd.print(spo2);
    showPulseScreen = true;
    pulseScreenTimer = millis();
  }

  if (showPulseScreen && (millis() - pulseScreenTimer >= 2000)) {
    showPulseScreen = false;
    lcd.clear();
    lastLCD = millis();
  }

  if (!showPulseScreen && (millis() - lastLCD >= 2000)) {
    lastLCD = millis();
    lcd.clear();
    if (lcd_state == 0) {
      lcd.print("TEMP: "); lcd.print(t); lcd.print((char)223); lcd.print("C");
    } else if (lcd_state == 1) {
      lcd.print("ECG: "); lcd.print(ecgValue); lcd.print(" mV");
    } else if (lcd_state == 2) {
      lcd.print("EMG: "); lcd.print(emgValue); lcd.print(" uV");
    }
    lcd_state++;
    if (lcd_state > 2) lcd_state = 0;
  }

  // 6. SERIAL / BACKEND LOGIC
  int sweat_now = digitalRead(SWEAT_PIN);
  bool temp_high = (t >= 40);
  String alert_type = "NORMAL";

  if (temp_high) alert_type = "TEMP_HIGH";
  else if (sweat_now == LOW) alert_type = "SWEAT";

  bool shouldPrint = false;
  if ((lastTemp >= 40) != temp_high) shouldPrint = true;
  if (sweat_now != lastSweat) shouldPrint = true;
  if (abs(t - lastTemp) > 0.5) shouldPrint = true;
  if (pulse != lastPulse || spo2 != lastSpo2) shouldPrint = true;
  
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 2000) shouldPrint = true;

  if (shouldPrint) {
    lastPrint = millis();
    String msg;
    double lat = gps.location.lat();
    double lon = gps.location.lng();

    if (lat == 0.0) lat = 12.9716; 
    if (lon == 0.0) lon = 80.2746;

    if (alert_type == "NORMAL") {
      msg = String(t) + "," + pulse + "," + spo2 + "," +
            String(ecgValue) + "," + String(emgValue) +
            ",NORMAL";
    } else {
      msg = String(t) + "," + pulse + "," + spo2 + "," +
            String(ecgValue) + "," + String(emgValue) +
            ",ALERT(" + alert_type + ") http://maps.google.com/?q=" +
            String(lat, 6) + "," + String(lon, 6);
    }
    Serial.println(msg);

    lastTemp = t;
    lastPulse = pulse;
    lastSpo2 = spo2;
    lastSweat = sweat_now;
  }
}`;

/* --- STYLES --- */
const AppStyles = () => (
  <style>{`
    :root { 
      --primary-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); 
      --glass-bg: rgba(30, 41, 59, 0.7); 
      --glass-border: 1px solid rgba(255, 255, 255, 0.1); 
      --bg-dark: #0f172a;
      --gradient-1: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      --gradient-2: linear-gradient(135deg, #10b981 0%, #059669 100%);
      --gradient-3: linear-gradient(135deg, #f43f5e 0%, #be123c 100%);
      --gradient-4: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      --gradient-5: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
    }
    body { background-color: var(--bg-dark); color: #e2e8f0; font-family: 'Inter', sans-serif; margin: 0; padding: 0; overflow-x: hidden; }
    .app-container { max-width: 480px; margin: 0 auto; min-height: 100vh; background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); position: relative; padding: 20px; padding-bottom: 90px; }
    .glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: var(--glass-border); border-radius: 20px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3); }
    .login-wrapper { position: fixed; inset: 0; z-index: 1000; background: #0f172a; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto; }
    .bg-orb { position: absolute; border-radius: 50%; filter: blur(80px); z-index: -1; animation: float 6s ease-in-out infinite; }
    .login-card { width: 100%; max-width: 400px; padding: 30px; position: relative; overflow: hidden; margin: 20px 0; }
    .glow-text { background: linear-gradient(to right, #fff, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; letter-spacing: -0.5px; }
    .input-group { margin-bottom: 16px; text-align: left; }
    .input-group label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .custom-input { width: 100%; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 14px; border-radius: 12px; font-size: 16px; outline: none; transition: border-color 0.2s; }
    .custom-input:focus { border-color: #6366f1; background: rgba(15, 23, 42, 0.8); }
    .custom-select { appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 0.65em auto; }
    .btn { width: 100%; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 16px; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; gap: 8px; transition: transform 0.1s; }
    .btn:active { transform: scale(0.98); }
    .btn-primary { background: var(--primary-gradient); color: white; }
    .btn-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .btn-danger { background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; }
    .btn-ghost { background: transparent; color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }
    .otp-container { display: flex; gap: 10px; justify-content: center; margin-top: 10px; }
    .otp-input { width: 50px; height: 60px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(15,23,42,0.6); color: white; font-size: 24px; font-weight: bold; text-align: center; outline: none; }
    .bottom-nav { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 440px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); border-radius: 24px; display: flex; justify-content: space-around; align-items: center; padding: 12px 16px; z-index: 100; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
    .nav-item { background: none; border: none; color: #64748b; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; cursor: pointer; padding: 8px 12px; transition: color 0.2s ease; }
    .nav-item svg { color: #64748b; transition: color 0.2s ease; }
    .nav-item span { color: #64748b; transition: color 0.2s ease; }
    .nav-item:hover { color: #94a3b8; }
    .nav-item:hover svg { color: #94a3b8; }
    .nav-item:hover span { color: #94a3b8; }
    .nav-item.active { color: #818cf8; }
    .nav-item.active svg { color: #818cf8; }
    .nav-item.active span { color: #818cf8; }
    .nav-center { width: 50px; height: 50px; background: var(--primary-gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: none; cursor: pointer; transform: translateY(-20px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); }
    .chat-container { height: calc(100vh - 200px); display: flex; flex-direction: column; }
    .chat-bubble { max-width: 80%; padding: 12px 16px; border-radius: 16px; margin-bottom: 12px; font-size: 14px; line-height: 1.5; }
    .chat-bot { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0; border-top-left-radius: 4px; }
    .chat-user { background: #6366f1; color: white; align-self: flex-end; border-top-right-radius: 4px; }
    .grid-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 20px; }
    .code-block { font-family: 'Fira Code', monospace; font-size: 12px; line-height: 1.5; background: #0f172a; padding: 16px; border-radius: 12px; overflow-x: auto; border: 1px solid #334155; color: #e2e8f0; white-space: pre; }
    
    /* Voice Assistant Waves */
    .voice-waves { display: flex; gap: 4px; align-items: center; height: 20px; }
    .voice-bar { width: 4px; background: #818cf8; border-radius: 2px; animation: voice-wave 0.5s infinite ease-in-out; }
    .voice-bar:nth-child(1) { animation-delay: 0.1s; height: 10px; }
    .voice-bar:nth-child(2) { animation-delay: 0.2s; height: 15px; }
    .voice-bar:nth-child(3) { animation-delay: 0.3s; height: 20px; }
    .voice-bar:nth-child(4) { animation-delay: 0.2s; height: 15px; }
    .voice-bar:nth-child(5) { animation-delay: 0.1s; height: 10px; }
    @keyframes voice-wave { 0%, 100% { height: 5px; opacity: 0.5; } 50% { height: 20px; opacity: 1; } }
    
    /* Additional Styles for Screens */
    .stats-card { background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 16px; transition: all 0.3s ease; }
    .stats-card:hover { background: rgba(30, 41, 59, 0.8); border-color: rgba(255, 255, 255, 0.1); transform: translateY(-4px); }
    .status-card { padding: 16px; display: flex; justify-content: space-between; align-items: center; }
    .status-icon { width: 40px; height: 40px; border-radius: 50%; background: rgba(99, 102, 241, 0.1); display: flex; align-items: center; justify-content: center; color: #94a3b8; transition: all 0.3s ease; }
    .status-icon.active { background: rgba(99, 102, 241, 0.3); color: #818cf8; animation: pulse 2s infinite; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #6366f1; overflow: hidden; cursor: pointer; transition: transform 0.2s; }
    .avatar:hover { transform: scale(1.05); }
    
    /* Gradient Classes */
    .bg-gradient-1 { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); }
    .bg-gradient-2 { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .bg-gradient-3 { background: linear-gradient(135deg, #f43f5e 0%, #be123c 100%); }
    .bg-gradient-4 { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); }
    .bg-gradient-5 { background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); }
    
    /* Text Color Utilities */
    .text-accent-cyan { color: #06b6d4; }
    .text-accent-pink { color: #f43f5e; }
    .text-accent-purple { color: #a78bfa; }
    .text-accent-neon { color: #10b981; }
    .text-accent-orange { color: #f97316; }
    
    /* Hover Effects */
    .hover-lift { transition: transform 0.3s ease; }
    .hover-lift:hover { transform: translateY(-4px); }
    .hover-scale { transition: transform 0.2s ease; }
    .hover-scale:hover { transform: scale(1.05); }
    .hover-glow { transition: all 0.3s ease; }
    .hover-glow:hover { filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.6)); }
    
    /* Shadow Effects */
    .shadow-glow { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
    .shadow-glow-pink { box-shadow: 0 0 20px rgba(244, 63, 94, 0.3); }
    .shadow-glow-cyan { box-shadow: 0 0 20px rgba(6, 182, 212, 0.3); }
    
    /* Additional Animations */
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes glow { 0%, 100% { text-shadow: 0 0 10px rgba(99, 102, 241, 0.5); } 50% { text-shadow: 0 0 20px rgba(99, 102, 241, 0.8); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(20px); } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    
    .animate-fade-in { animation: fadeIn 0.5s ease-in; }
    .animate-glow { animation: glow 2s ease-in-out infinite; }
    .animate-slide-in-up { animation: slideUp 0.5s ease-out; }
    .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  `}</style>
);

/* --- CONSTANTS --- */
const MOCK_HISTORY = [
  { day: 'Mon', hr: 72, steps: 4500 },
  { day: 'Tue', hr: 75, steps: 6200 },
  { day: 'Wed', hr: 82, steps: 8100 },
  { day: 'Thu', hr: 78, steps: 5400 },
  { day: 'Fri', hr: 85, steps: 9000 },
  { day: 'Sat', hr: 90, steps: 12000 },
  { day: 'Sun', hr: 76, steps: 3500 },
];

const PAIRED_DEVICES = [
  { id: 'SHS-001', name: 'Smart Suit Alpha', model: 'Pro V2', firmware: 'v2.4.1', syncStatus: 'Synced 2m ago', trusted: true },
  { id: 'SHS-002', name: 'Smart Band Lite', model: 'Lite X1', firmware: 'v1.0.5', syncStatus: 'Synced 1d ago', trusted: false }
];

const ALERT_TYPES = {
  "NORMAL": null,
  "TEMP_HIGH": { id: 3, msg: "High Body Temp!", type: "danger", icon: Thermometer },
  "SWEAT": { id: 4, msg: "Dehydration Risk (Sweat)", type: "warning", icon: Droplets },
  "FALL": { id: 5, msg: "FALL DETECTED", type: "critical", icon: ShieldAlert },
  "HR_HIGH": { id: 2, msg: "Heart Rate Unsafe", type: "danger", icon: Heart },
  "FATIGUE": { id: 1, msg: "Muscle Fatigue High", type: "warning", icon: Zap },
  "DIET_SKIP": { id: 6, msg: "Diet Skipped! Eat Now.", type: "warning", icon: Utensils },
  "EXERCISE_DUE": { id: 7, msg: "Time for Scheduled Exercise", type: "info", icon: Activity }
};

/* --- UTILS --- */
const generateCPPDataPacket = (isActive) => {
  const t = (36.5 + Math.random() * 1.5).toFixed(2); 
  const pulse = isActive ? Math.floor(Math.random() * (160 - 110) + 110) : Math.floor(Math.random() * (90 - 60) + 60);
  const spo2 = Math.floor(Math.random() * (100 - 96) + 96);
  const ecg = (Math.random() * 2.0).toFixed(2); 
  const emg = Math.floor(Math.random() * 500);
  let alertPart = "NORMAL";
  if (t >= 40) {
      alertPart = "ALERT(TEMP_HIGH) http://maps.google.com/?q=12.9716,80.2746";
  } else if (Math.random() < 0.02 && isActive) {
      alertPart = "ALERT(SWEAT) http://maps.google.com/?q=12.9716,80.2746";
  }
  return `${t},${pulse},${spo2},${ecg},${emg},${alertPart}`; 
};

const callGeminiAI = async (prompt) => {
  const apiKey = ""; 
  const delays = [1000, 2000];
  for (let i = 0; i < 2; i++) {
    try {
      if (!apiKey) {
        await new Promise(r => setTimeout(r, 1000));
        if (prompt.includes("Analyze")) return "Analysis based on C++ Sensor Data:\n1. HR Zones: Optimal.\n2. ECG: Normal Sinus Rhythm.\n3. Rec: Hydrate now.";
        return "Eat a banana and drink electrolytes.";
      }
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
      );
      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    } catch (error) { await new Promise(r => setTimeout(r, delays[i])); }
  }
  return "System Offline";
};

const getGradient = (color) => {
  switch(color) {
    case 'red': return 'linear-gradient(135deg, #ef4444, #b91c1c)';
    case 'cyan': return 'linear-gradient(135deg, #06b6d4, #0891b2)';
    case 'orange': return 'linear-gradient(135deg, #f97316, #c2410c)';
    case 'yellow': return 'linear-gradient(135deg, #eab308, #a16207)';
    case 'purple': return 'linear-gradient(135deg, #a855f7, #7e22ce)';
    case 'green': return 'linear-gradient(135deg, #22c55e, #15803d)';
    default: return 'linear-gradient(135deg, #6366f1, #4338ca)';
  }
};

/* --- COMPONENTS --- */

const StatCard = ({ icon: Icon, label, value, unit, color, subValue }) => (
  <div className="glass-panel stat-card" style={{ borderColor: `var(--${color}-500)`, borderWidth: '0px 0px 4px 0px', background: 'rgba(30, 41, 59, 0.7)' }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
      <div style={{ 
        padding:'12px', borderRadius:'16px', background: getGradient(color), color: 'white',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
    <div className="stat-label" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#cbd5e1' }}>{label}</div>
    <div style={{ display:'flex', alignItems:'baseline', gap:'4px' }}>
      <span className="stat-val" style={{ fontSize: '1.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{value}</span>
      <span className="stat-unit">{unit}</span>
    </div>
    {subValue && <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'4px', fontWeight: '500' }}>{subValue}</div>}
  </div>
);

const AlertOverlay = ({ alert, onClose }) => {
  if (!alert) return null;
  const AlertIcon = alert.icon || Info;
  
  if (alert.type === 'notification' || alert.type === 'info') {
    return (
      <div style={{ position:'fixed', top:'20px', left:'20px', right:'20px', zIndex:1000 }} onClick={onClose}>
        <div className="glass-panel" style={{ padding:'16px', display:'flex', gap:'12px', alignItems:'center', background:'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.2)' }}>
          {alert.icon ? <AlertIcon size={24} color="#60a5fa" /> : <MessageCircle size={24} color="#4ade80" />}
          <div>
            <div style={{ fontWeight:'bold', fontSize:'14px' }}>{alert.type === 'info' ? 'Health Reminder' : 'New Message'}</div>
            <div style={{ fontSize:'12px', color:'#ccc' }}>{alert.msg}</div>
            {alert.code && <div style={{ fontSize:'18px', fontWeight:'bold', letterSpacing:'2px', marginTop:'4px' }}>{alert.code}</div>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div className="glass-panel fade-in" style={{ width:'100%', maxWidth:'320px', padding:'30px', textAlign:'center', border: `2px solid ${alert.type === 'critical' ? '#ef4444' : '#f59e0b'}` }}>
        <div style={{ margin:'0 auto 20px', width:'80px', height:'80px', borderRadius:'50%', background: alert.type==='critical'?'#ef4444':'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <AlertIcon size={40} color="white" />
        </div>
        <h2 style={{ fontSize:'24px', fontWeight:'900', marginBottom:'10px' }}>{alert.msg}</h2>
        <p style={{ color:'#94a3b8', marginBottom:'24px' }}>Sensor Alert Triggered</p>
        <button className="btn btn-primary" onClick={onClose}>ACKNOWLEDGE</button>
      </div>
    </div>
  );
};

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="login-wrapper" style={{ zIndex: 9999 }}>
      <div className="bg-orb" style={{ top:'50%', left:'50%', transform:'translate(-50%, -50%)', width:'300px', height:'300px', background:'#818cf8', opacity: 0.5 }}></div>
      <div className="fade-in" style={{ textAlign: 'center' }}>
        <div style={{ 
          width: '120px', height: '120px', background: 'linear-gradient(135deg, #6366f1, #d946ef)', 
          borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 50px rgba(99, 102, 241, 0.6)', margin: '0 auto 24px', animation: 'pulse 2s infinite'
        }}>
          <Activity size={60} color="white" />
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '900', color: 'white', letterSpacing: '2px' }}>SHS<span style={{color:'#a78bfa'}}>001</span></h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>Smart Health Suite</p>
      </div>
    </div>
  );
};

const WifiConnectionScreen = ({ onConnect }) => {
  const [step, setStep] = useState(1); 
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [secureCode, setSecureCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (step === 1) {
      setTimeout(() => {
        setStep(2);
      }, 3000);
    }
  }, [step]);

  const handleConnect = () => {
    if (secureCode === "SHS2024") {
       onConnect(); 
    } else if (secureCode === "123456") {
       setError("Secure Code Not Available (Already in Use).");
    } else {
       setError("Invalid Secure Code. Check your kit.");
    }
  };

  return (
    <div className="login-wrapper">
       <div className="glass-panel fade-in" style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
          <h2 className="glow-text" style={{ fontSize: '24px', textAlign: 'center', marginBottom: '20px' }}>
            {step === 1 ? 'Searching Devices...' : step === 2 ? 'Available Devices' : 'Security Check'}
          </h2>
          {step === 1 && (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px 0' }}>
               <div className="spinner" style={{ width: '60px', height: '60px', borderWidth: '4px', borderStyle: 'solid', borderRadius: '50%', borderColor: 'rgba(99,102,241,0.3)', borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }}></div>
               <p style={{ color: '#94a3b8' }}>Scanning nearby sensors...</p>
             </div>
          )}
          {step === 2 && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {['SHS001', 'Smart_Band_X2', 'Gym_Tracker_Pro'].map((dev, i) => (
                 <div key={i} onClick={() => { setSelectedDevice(dev); setStep(3); }} style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                   <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><Wifi size={20} color={i===0 ? '#4ade80' : '#94a3b8'} /><span style={{ color: 'white', fontWeight: 'bold' }}>{dev}</span></div>
                   {i === 0 && <span style={{ fontSize: '10px', background: '#4ade80', color: 'black', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>TARGET</span>}
                 </div>
               ))}
               <button onClick={() => setStep(1)} style={{ marginTop: '10px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}>Re-scan</button>
             </div>
          )}
          {step === 3 && (
             <div>
               <div style={{ textAlign: 'center', marginBottom: '20px' }}><div style={{ width: '60px', height: '60px', background: 'rgba(99,102,241,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><Lock size={30} color="#818cf8" /></div><div style={{ color: 'white', fontWeight: 'bold' }}>Connecting to {selectedDevice}</div></div>
               <div className="input-group"><label>Enter Secure Suite Code</label><input className="custom-input" type="text" placeholder="e.g. SHS-XXXX" value={secureCode} onChange={(e) => { setSecureCode(e.target.value); setError(''); }} /></div>
               {error && <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={12}/> {error}</div>}
               <div style={{ display: 'flex', gap: '10px' }}><button className="btn" style={{ background: 'transparent', border: '1px solid #334155', flex: 1 }} onClick={() => setStep(2)}>Cancel</button><button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConnect}>Connect</button></div>
             </div>
          )}
       </div>
    </div>
  );
};

const VoiceAssistant = ({ sensorData, triggerAlert }) => {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; 
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setLastTranscript(transcript);
        handleVoiceCommand(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, [sensorData]); 

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1; 
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceCommand = (cmd) => {
    if (cmd.includes('heart rate') || cmd.includes('pulse')) {
      speak(`Your heart rate is currently ${sensorData.hr} beats per minute.`);
    } 
    else if (cmd.includes('temperature') || cmd.includes('temp')) {
      speak(`Body temperature is ${sensorData.temp} degrees Celsius.`);
    }
    else if (cmd.includes('summary') || cmd.includes('report') || cmd.includes('health')) {
      speak(`Scanning your vibes. Heart rate ${sensorData.hr}, Oxygen ${sensorData.spo2} percent. You've taken ${sensorData.steps} steps today. Keep glowing!`);
    }
    else if (cmd.includes('doctor') || cmd.includes('alert doctor')) {
      speak("Contacting Dr. Smith immediately. Sending your vitals.");
      // Trigger a mock alert or log
    }
    else if (cmd.includes('emergency') || cmd.includes('help') || cmd.includes('not feeling well') || cmd.includes('pain')) {
      speak("Emergency alert triggered. Sending SOS with location now.");
      triggerAlert('FALL');
    }
    else if (cmd.includes('stressed') || cmd.includes('tired') || cmd.includes('relax')) {
      speak("I got you. Let's box breathe. Inhale for 4, hold for 4, exhale for 4. You're doing great.");
    }
    else if (cmd.includes('hello') || cmd.includes('hey') || cmd.includes('hi')) {
      speak("Hey there! HealthMate ready. Ask me about your vitals.");
    }
    else {
      speak("Sorry bestie, didn't catch that. Try saying Check Heart Rate.");
    }
  };

  const toggleMic = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };

  if (!recognitionRef.current) return null; 

  return (
    <div style={{ position: 'fixed', bottom: '90px', right: '20px', zIndex: 900 }}>
       {/* Feedback Bubble */}
       {(isListening || isSpeaking || showHelp) && (
         <div className="glass-panel fade-in" style={{ position:'absolute', bottom:'60px', right:'0', width:'250px', padding:'12px', fontSize:'12px', display:'flex', flexDirection:'column', gap:'4px' }}>
           {showHelp ? (
             <>
               <div style={{fontWeight:'bold', color:'#818cf8', marginBottom: '4px'}}>Voice Assistant Working Model</div>
               <p style={{color:'#ccc', lineHeight: '1.4'}}>
                 Our Smart Health Suit app includes an intelligent <i>AI Voice Assistant</i> designed to make health monitoring hands-free and effortless. When the user activates the assistant by saying <i>“Hey HealthMate”</i> (or tapping the mic), the app immediately listens using the device’s built-in speech recognition engine. The voice command is then converted into text and analyzed by an AI model that understands health-related intents such as “check heart rate,” “show today’s summary,” or “alert my doctor.” Based on the detected intent, the assistant fetches real-time data from the suit’s sensors (or the simulated data module when sensors are offline) and instantly gives a spoken response using advanced text-to-speech. The AI also studies user patterns, gives personalized suggestions like “You seem stressed today, try breathing exercises,” and can trigger emergency actions if the user says <i>“I’m not feeling well.”</i> This entire flow works seamlessly in the background, giving a smooth, futuristic, Gen-Z style conversational health experience without needing to touch the app.
               </p>
             </>
           ) : (
             <>
               <div style={{fontWeight:'bold', color:'#818cf8'}}>{isSpeaking ? 'HealthMate Speaking...' : 'Listening...'}</div>
               <div style={{color:'#ccc', fontStyle:'italic'}}>{lastTranscript || "Say 'Check Heart Rate'..."}</div>
               {isListening && <div className="voice-waves"><div className="voice-bar"></div><div className="voice-bar"></div><div className="voice-bar"></div><div className="voice-bar"></div><div className="voice-bar"></div></div>}
             </>
           )}
         </div>
       )}
       
       <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
         {/* Help Button */}
         <button 
           onClick={() => setShowHelp(!showHelp)}
           className="glass-panel"
           style={{ 
             width: '40px', height: '40px', borderRadius: '50%', 
             background: 'rgba(255,255,255,0.1)',
             border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
             cursor: 'pointer'
           }}
         >
           <HelpCircle color="white" size={20} />
         </button>

         {/* Mic Button */}
         <button 
           onClick={toggleMic}
           className="glass-panel"
           style={{ 
             width: '56px', height: '56px', borderRadius: '50%', 
             background: isListening ? '#ef4444' : isSpeaking ? '#8b5cf6' : 'var(--primary-gradient)',
             border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
             boxShadow: '0 4px 15px rgba(99, 102, 241, 0.5)', cursor: 'pointer', transition: 'transform 0.2s'
           }}
         >
           {isListening ? <MicOff color="white" size={24} /> : isSpeaking ? <Volume2 color="white" size={24} /> : <Mic color="white" size={24} />}
         </button>
       </div>
    </div>
  );
};

/* --- LOGIN SCREEN --- */
const LoginScreen = ({ onLogin, onGuest, setAlert }) => {
  const [view, setView] = useState('login'); 
  const [authMethod, setAuthMethod] = useState('phone'); 
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [language, setLanguage] = useState('en');
  const [regData, setRegData] = useState({ name: '', gender: 'Male' });
  const [signOutOthers, setSignOutOthers] = useState(false);

  const getDeviceStatus = (id) => {
    const dev = PAIRED_DEVICES.find(d => d.id === id);
    if (!dev) return null;
    return dev;
  };

  const currentDevice = getDeviceStatus(selectedDevice);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (failedAttempts > 2) {
        if (!window.confirm("Security Check: Click OK to verify you are human.")) {
          setLoading(false);
          return;
        }
      }

      const isValidUser = (authMethod === 'phone' && contact.length >= 10) || (authMethod === 'email' && contact.includes('@') && password === 'password123');
      
      if (isValidUser) {
        if (selectedDevice) {
           const dev = getDeviceStatus(selectedDevice);
           if (dev && dev.firmware === 'v1.0.5') {
             alert(`Warning: ${dev.name} firmware is outdated. Please update after login.`);
           }
        }
        
        setLoading(false);
        setView('2fa');
        if (setAlert) setAlert({ type: 'notification', msg: 'Authentication Code: 1234', code: '' });
        else alert("Your 2FA Code is: 1234");
      } else {
        setLoading(false);
        setFailedAttempts(prev => prev + 1);
        setError("Invalid credentials. Please try again.");
      }
    }, 1500);
  };

  const handle2FASubmit = (e) => {
    e.preventDefault();
    if (otp === '1234') {
      onLogin({ name: regData.name || "Alex Racer ⚡", gender: regData.gender });
    } else {
      setError("Invalid Code. Expired or wrong.");
    }
  };

  const handleForgotPass = () => {
    setView('forgot_pass');
    setError('');
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`Password reset link sent to ${contact}`);
      setView('login');
    }, 1500);
  };

  return (
    <div className="login-wrapper">
      <div className="bg-orb" style={{ top:'10%', left:'10%', width:'250px', height:'250px', background:'#6366f1' }}></div>
      <div className="bg-orb" style={{ bottom:'10%', right:'10%', width:'200px', height:'200px', background:'#a855f7' }}></div>
      
      <div className="login-card glass-panel fade-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
           <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
             <Activity size={24} color="#818cf8" />
             <span style={{ fontWeight:'900', color:'white' }}>SHS</span>
           </div>
           <div style={{ position:'relative' }}>
             <Globe size={16} color="#94a3b8" style={{position:'absolute', left:8, top:'50%', transform:'translateY(-50%)'}}/>
             <select 
               className="custom-input custom-select" 
               style={{ padding:'6px 8px 6px 30px', fontSize:'12px', width:'auto', background:'rgba(0,0,0,0.3)', border:'none' }}
               value={language}
               onChange={(e) => setLanguage(e.target.value)}
             >
               <option value="en">English</option>
               <option value="es">Español</option>
               <option value="fr">Français</option>
             </select>
           </div>
        </div>

        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <h1 className="glow-text" style={{ fontSize:'26px', marginBottom:'4px' }}>
            {view === 'login' ? 'Suit Access' : view === 'signup' ? 'New Pilot' : view === '2fa' ? 'Verify Identity' : 'Recovery'}
          </h1>
          <p style={{ color:'#94a3b8', fontSize: '12px' }}>
            {view === 'login' ? 'Secure Login System v2.0' : 'Join the fleet'}
          </p>
        </div>

        {view === 'login' && (
          <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <label style={{ fontSize:'10px', color:'#94a3b8', textTransform:'uppercase', fontWeight:'bold', display:'block', marginBottom:'8px' }}>Select Suit / Device</label>
            <select 
              className="custom-input custom-select"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              style={{ width: '100%', marginBottom: selectedDevice ? '12px' : '0' }}
            >
              <option value="">-- Pair New Suit / Device --</option>
              {PAIRED_DEVICES.map(dev => (
                <option key={dev.id} value={dev.id}>{dev.name} ({dev.model}) {dev.trusted ? '★' : ''}</option>
              ))}
            </select>
            
            {currentDevice && (
              <div className="fade-in" style={{ fontSize:'11px', color:'#cbd5e1', padding:'8px', background:'rgba(99, 102, 241, 0.1)', borderRadius:'8px', display:'flex', flexDirection:'column', gap:'4px' }}>
                <div style={{display:'flex', justifyContent:'space-between'}}><span>Model:</span> <span style={{fontWeight:'bold'}}>{currentDevice.model}</span></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span>Firmware:</span> <span style={{fontWeight:'bold', color: currentDevice.firmware === 'v2.4.1' ? '#4ade80' : '#facc15'}}>{currentDevice.firmware}</span></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span>Last Sync:</span> <span>{currentDevice.syncStatus}</span></div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={view === 'login' ? handleLoginSubmit : view === '2fa' ? handle2FASubmit : view === 'forgot_pass' ? handleForgotSubmit : handleLoginSubmit}>
          
          {view === 'login' && (
            <div className="fade-in">
              <div style={{ display: 'flex', gap:'10px', marginBottom: '20px' }}>
                 <button type="button" onClick={() => {setAuthMethod('phone'); setError('');}} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: authMethod === 'phone' ? 'rgba(99,102,241,0.2)' : 'transparent', color: authMethod==='phone'?'#818cf8':'#64748b', border:'1px solid ' + (authMethod==='phone'?'#818cf8':'rgba(255,255,255,0.1)'), cursor:'pointer', fontSize:'12px', fontWeight:'bold' }}>Phone</button>
                 <button type="button" onClick={() => {setAuthMethod('email'); setError('');}} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: authMethod === 'email' ? 'rgba(99,102,241,0.2)' : 'transparent', color: authMethod==='email'?'#818cf8':'#64748b', border:'1px solid ' + (authMethod==='email'?'#818cf8':'rgba(255,255,255,0.1)'), cursor:'pointer', fontSize:'12px', fontWeight:'bold' }}>Email</button>
              </div>

              <div className="input-group">
                <label>{authMethod === 'phone' ? 'Mobile Number' : 'Email Address'}</label>
                <div style={{position:'relative'}}>
                  <input className="custom-input" type={authMethod === 'phone' ? 'tel' : 'email'} placeholder={authMethod === 'phone' ? "9876543210" : "pilot@smartsuit.com"} value={contact} onChange={e=>setContact(e.target.value)} required />
                  {authMethod === 'phone' ? <Smartphone size={16} style={{position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', color:'#64748b'}} /> : <Mail size={16} style={{position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', color:'#64748b'}} />}
                </div>
              </div>

              {authMethod === 'email' && (
                <div className="input-group">
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <label>Password</label>
                    <span onClick={handleForgotPass} style={{fontSize:'10px', color:'#818cf8', cursor:'pointer'}}>Forgot?</span>
                  </div>
                  <div style={{position:'relative'}}>
                    <input className="custom-input" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
                    <div onClick={() => setShowPassword(!showPassword)} style={{position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#64748b'}}>
                      {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom:'20px', display:'flex', alignItems:'center', gap:'8px' }}>
                <input type="checkbox" id="signout" checked={signOutOthers} onChange={e=>setSignOutOthers(e.target.checked)} style={{accentColor:'#6366f1'}} />
                <label htmlFor="signout" style={{fontSize:'12px', color:'#94a3b8', cursor:'pointer'}}>Sign out from other devices</label>
              </div>
            </div>
          )}

          {view === '2fa' && (
            <div className="fade-in">
              <div style={{ textAlign:'center', marginBottom:'20px' }}>
                <div style={{ width:'60px', height:'60px', background:'rgba(99,102,241,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
                  <ShieldAlert size={30} color="#818cf8" />
                </div>
                <p style={{fontSize:'12px', color:'#cbd5e1'}}>Enter the code sent to your device.</p>
              </div>
              <div className="input-group">
                 <div className="otp-container">
                   <input className="otp-input" style={{width:'100%', letterSpacing:'10px'}} maxLength="4" value={otp} onChange={e=>setOtp(e.target.value)} autoFocus placeholder="••••" />
                 </div>
              </div>
              <div style={{textAlign:'center', marginTop:'10px', fontSize:'12px'}}>
                <span style={{color:'#94a3b8'}}>Resend code in </span><span style={{color:'#818cf8'}}>30s</span>
              </div>
            </div>
          )}

          {view === 'forgot_pass' && (
            <div className="fade-in">
               <p style={{fontSize:'12px', color:'#94a3b8', marginBottom:'16px'}}>Enter your registered contact to receive a recovery link.</p>
               <div className="input-group">
                 <label>Email / Phone</label>
                 <input className="custom-input" value={contact} onChange={e=>setContact(e.target.value)} placeholder="Contact Info" />
               </div>
            </div>
          )}

          {view === 'signup' && (
             <div className="fade-in">
                <div className="input-group"><label>Full Name</label><input className="custom-input" value={regData.name} onChange={e=>setRegData({...regData, name:e.target.value})} placeholder="John Doe" /></div>
                <div className="input-group"><label>Gender</label><select className="custom-input" value={regData.gender} onChange={e=>setRegData({...regData, gender:e.target.value})}><option>Male</option><option>Female</option></select></div>
                <div className="input-group"><label>Mobile</label><input className="custom-input" placeholder="9876543210" /></div>
             </div>
          )}

          {error && <div className="fade-in" style={{ color:'#ef4444', fontSize:'12px', marginBottom:'16px', background:'rgba(239, 68, 68, 0.1)', padding:'10px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'6px' }}><AlertTriangle size={14}/> {error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{marginTop:'10px'}}>
             {loading ? <div className="spinner" style={{width:'20px', height:'20px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 1s linear infinite'}}></div> : 
              view === 'login' ? (authMethod === 'email' ? 'Login' : 'Send OTP') : 
              view === '2fa' ? 'Verify & Access' : 
              view === 'signup' ? 'Create Account' : 'Send Recovery Link'}
          </button>

          {view !== 'login' && (
            <button type="button" className="btn btn-ghost" onClick={()=>{setView('login'); setError('');}} style={{marginTop:'10px', fontSize:'14px'}}>
              Cancel
            </button>
          )}
        </form>

        {view === 'login' && (
          <>
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
               Don't have an account? <span onClick={()=>setView('signup')} style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 'bold' }}>Create New</span>
            </div>
            
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:'12px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', cursor:'pointer' }}>Privacy</span>
                <span style={{ fontSize: '10px', color: '#64748b', cursor:'pointer' }}>Terms</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'4px', color:'#818cf8', fontSize:'10px', cursor:'pointer' }}>
                <HelpCircle size={12} /> Support
              </div>
            </div>
            
            <button onClick={onGuest} style={{ marginTop:'16px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}>
              Continue as Guest <ArrowRight size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* --- HEALTH ONBOARDING SCREEN --- */
const HealthOnboardingScreen = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [conditions, setConditions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    const summary = await callGeminiAI(`Generate Indian diet and exercise plan for a person with ${conditions}`);
    
    const plan = {
      summary: summary.includes("Analysis based") ? "Customized Plan Ready" : summary,
      conditions: conditions,
      diet: [
         { time: '08:00 AM', meal: 'Breakfast', items: conditions.toLowerCase().includes('sugar') ? 'Oats Idli & Sambhar' : 'Poha with Peanuts', cals: '300' },
         { time: '01:00 PM', meal: 'Lunch', items: 'Roti, Dal, Sabzi & Salad', cals: '450' },
         { time: '08:00 PM', meal: 'Dinner', items: 'Grilled Paneer & Soup', cals: '350' }
      ],
      exercise: [
         { type: 'Morning', activity: 'Yoga (Surya Namaskar)', duration: '20 mins' },
         { type: 'Evening', activity: 'Brisk Walking', duration: '30 mins' }
      ],
      report: [
         { metric: 'Risk Status', value: conditions || 'Healthy', status: 'Managed', color: '#facc15' },
         { metric: 'Hydration', value: '3 Liters', status: 'Target', color: '#60a5fa' }
      ]
    };
    
    onComplete(plan); 
    setIsGenerating(false);
  };

  return (
    <div className="login-wrapper">
       <div className="glass-panel fade-in" style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
          <h2 className="glow-text" style={{ fontSize: '24px', textAlign: 'center', marginBottom: '20px' }}>Health Profile</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
               <label>Full Name</label>
               <input className="custom-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your Name" required/>
            </div>
            <div className="input-group">
               <label>Medical Conditions / Issues</label>
               <input className="custom-input" value={conditions} onChange={e=>setConditions(e.target.value)} placeholder="e.g. Diabetes, Back Pain, None" required/>
               <p style={{fontSize:'10px', color:'#94a3b8', marginTop:'4px'}}>AI will customize your plan based on this.</p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={isGenerating}>
               {isGenerating ? 'Generating AI Plan...' : 'Create My Plan'} <ArrowRight size={16}/>
            </button>
          </form>
       </div>
    </div>
  );
};

/* --- EDIT NAME MODAL --- */
const EditNameModal = ({ currentName, onSave, onCancel }) => {
  const [name, setName] = useState(currentName);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.8)', zIndex:2000 }}>
      <div className="glass-panel" style={{ width:'100%', maxWidth:'320px', padding:'24px', background: 'rgba(30, 41, 59, 0.9)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h3 style={{ fontSize:'18px', fontWeight:'bold', color:'white' }}>Edit Profile Name</h3>
          <button onClick={onCancel} style={{ background:'transparent', border:'none', color:'#94a3b8', cursor:'pointer' }}><X size={20}/></button>
        </div>
        <div style={{ marginBottom:'24px' }}>
          <label style={{ display:'block', fontSize:'12px', color:'#94a3b8', marginBottom:'8px', textTransform:'uppercase', fontWeight:'bold' }}>Display Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width:'100%', background:'rgba(15, 23, 42, 0.6)', border:'1px solid rgba(255,255,255,0.1)', color:'white', padding:'12px', borderRadius:'12px', fontSize:'16px', outline:'none' }} autoFocus />
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={onCancel} style={{ flex:1, padding:'12px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'12px', cursor:'pointer', fontWeight:'bold' }}>Cancel</button>
          <button onClick={() => onSave(name)} style={{ flex:1, padding:'12px', background:'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border:'none', color:'white', borderRadius:'12px', cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}><Save size={16} /> Save</button>
        </div>
      </div>
    </div>
  );
};

/* --- LOCATION PERMISSION MODAL --- */
const LocationPermissionModal = ({ onAllow, onDeny }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.8)', zIndex:2000 }}>
    <div className="glass-panel" style={{ width:'100%', maxWidth:'300px', padding:'0', overflow:'hidden' }}>
      <div style={{ padding:'24px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width:'60px', height:'60px', background:'rgba(59, 130, 246, 0.2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}><MapPin size={30} color="#60a5fa" /></div>
        <h3 style={{ fontSize:'18px', fontWeight:'bold', marginBottom:'8px', color:'white' }}>Allow "SmartHealth" to use your location?</h3>
        <p style={{ fontSize:'12px', color:'#94a3b8' }}>
          We need this to track your run distance and provide live GPS data.
        </p>
      </div>
      <div style={{ display:'flex', flexDirection:'column' }}>
        <button 
          onClick={() => onAllow('always')}
          style={{ width:'100%', padding:'16px', background:'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,0.1)', color:'#60a5fa', fontWeight:'bold', cursor:'pointer' }}
        >
          Allow Always
        </button>
        <button 
          onClick={() => onAllow('once')}
          style={{ width:'100%', padding:'16px', background:'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,0.1)', color:'#60a5fa', fontWeight:'bold', cursor:'pointer' }}
        >
          Allow This Time
        </button>
        <button 
          onClick={onDeny}
          style={{ width:'100%', padding:'16px', background:'transparent', border:'none', color:'#94a3b8', fontWeight:'500', cursor:'pointer' }}
        >
          Don't Allow
        </button>
      </div>
    </div>
  </div>
);

/* --- LANGUAGE MODAL --- */
const LanguageModal = ({ currentLang, onSelect, onClose }) => {
  const languages = ['English', 'Tamil (தமிழ்)', 'Kannada (ಕನ್ನಡ)', 'Hindi (हिंदी)', 'Malayalam (മലയാളം)'];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.8)', zIndex:2000 }}>
      <div className="glass-panel" style={{ width:'100%', maxWidth:'300px', padding:'24px', background: 'rgba(30, 41, 59, 0.95)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h3 style={{ fontSize:'18px', fontWeight:'bold', color:'white' }}>Select Language</h3>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#94a3b8', cursor:'pointer' }}><X size={20}/></button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {languages.map((lang) => (
            <button 
              key={lang} 
              onClick={() => onSelect(lang)}
              style={{ 
                padding:'14px', 
                background: currentLang === lang ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)', 
                border: currentLang === lang ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)', 
                color: currentLang === lang ? '#818cf8' : 'white', 
                borderRadius:'12px', 
                cursor:'pointer', 
                fontWeight:'bold', 
                textAlign:'left'
              }}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* --- HAMBURGER MENU --- */
const SideMenu = ({ isOpen, onClose, onSelect, onOpenLanguage, onLogout }) => {
  return (
    <>
      {isOpen && (
        <div 
          onClick={onClose}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1001, backdropFilter:'blur(4px)' }}
        />
      )}
      <div style={{
        position: 'fixed', top:0, left:0, height:'100%', width:'280px',
        background: 'rgba(15, 23, 42, 0.95)', borderRight: '1px solid rgba(255,255,255,0.1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease', zIndex: 1002, padding: '24px', paddingTop: '60px'
      }}>
        <div style={{ position:'absolute', top:'20px', right:'20px', cursor:'pointer' }} onClick={onClose}><X size={24} color="#94a3b8"/></div>
        
        <h2 style={{ fontSize:'20px', fontWeight:'800', color:'white', marginBottom:'30px' }}>Smart Menu</h2>
        
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div onClick={() => onSelect('profile_setup')} style={{ display:'flex', gap:'12px', alignItems:'center', color:'#cbd5e1', cursor:'pointer', padding:'12px', borderRadius:'12px', background:'rgba(255,255,255,0.05)' }}>
            <User size={20} /> <span>Health Profile Setup</span>
          </div>
          <div onClick={() => onSelect('diet_plan')} style={{ display:'flex', gap:'12px', alignItems:'center', color:'#cbd5e1', cursor:'pointer', padding:'12px' }}>
            <Utensils size={20} /> <span>My Diet Plan</span>
          </div>
          <div onClick={() => onSelect('exercise_plan')} style={{ display:'flex', gap:'12px', alignItems:'center', color:'#cbd5e1', cursor:'pointer', padding:'12px' }}>
            <Activity size={20} /> <span>My Exercise Plan</span>
          </div>
           <div onClick={() => onSelect('health_report')} style={{ display:'flex', gap:'12px', alignItems:'center', color:'#cbd5e1', cursor:'pointer', padding:'12px' }}>
            <FileText size={20} /> <span>Health Report</span>
          </div>
          
          <div style={{ width:'100%', height:'1px', background:'rgba(255,255,255,0.1)', margin:'8px 0' }}></div>
          
          {/* Firmware Option */}
          <div onClick={() => onSelect('firmware_source')} style={{ display:'flex', gap:'12px', alignItems:'center', color:'#cbd5e1', cursor:'pointer', padding:'12px' }}>
            <Code size={20} /> <span>Firmware Source</span>
          </div>

          {/* Language Option */}
          <div onClick={onOpenLanguage} style={{ display:'flex', gap:'12px', alignItems:'center', color:'#cbd5e1', cursor:'pointer', padding:'12px' }}>
            <Globe size={20} /> <span>Language</span>
          </div>

          <div onClick={onLogout} style={{ display:'flex', gap:'12px', alignItems:'center', color:'#ef4444', cursor:'pointer', padding:'12px', marginTop:'20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <LogOut size={20} /> <span>Sign Out</span>
          </div>
        </div>

        <div style={{ position:'absolute', bottom:'40px', left:'24px', fontSize:'12px', color:'#64748b' }}>
          Smart Health Suite v2.7 (India Edition)
        </div>
      </div>
    </>
  );
};

/* --- HEALTH PROFILE & PLAN COMPONENTS (REUSED FOR MENU) --- */
const HealthProfileSetup = ({ onSave }) => {
    // Re-use logic from HealthOnboardingScreen but render inside dashboard context
    const [conditions, setConditions] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        const summary = await callGeminiAI(`Generate Indian diet and exercise plan for a person with ${conditions}`);
        
        const detailedPlan = {
          summary: summary.includes("Analysis based") ? "Customized Indian diet & fitness plan created based on your profile." : summary,
          diet: [
            { time: '07:00 AM', meal: 'Morning', items: 'Warm Lemon Water / Methi Water', cals: '10 kcal' },
            { time: '08:30 AM', meal: 'Breakfast', items: conditions.toLowerCase().includes('diab') ? 'Ragi Idli with Sambhar' : 'Idli/Dosa with Vegetable Sambhar', cals: '300 kcal' },
            { time: '01:30 PM', meal: 'Lunch', items: 'Rice/Roti + Dal Tadka + Sabzi + Curd', cals: '450 kcal' },
            { time: '08:00 PM', meal: 'Dinner', items: 'Grilled Paneer / Fish + Salad', cals: '350 kcal' },
          ],
          exercise: [
            { type: 'Warmup', activity: 'Joint Rotations & Neck Exercises', duration: '5 mins' },
            { type: 'Yoga', activity: 'Surya Namaskar (5-10 cycles)', duration: '20 mins' },
            { type: 'Cardio', activity: 'Brisk Walking', duration: '30 mins' },
          ],
          report: [
             { metric: 'Risk Assessment', value: conditions || 'None', status: 'Managed', color: '#facc15' },
             { metric: 'Hydration Goal', value: '3 Liters', status: 'Target', color: '#60a5fa' },
          ]
        };
        onSave({ conditions, ...detailedPlan });
        setIsGenerating(false);
    };

    return (
        <div className="app-container fade-in">
            <h1 className="glow-text" style={{ fontSize:'24px', marginBottom:'20px' }}>Update Profile</h1>
            <div className="glass-panel" style={{ padding:'24px' }}>
                <div className="input-group"><label>Conditions</label><input className="custom-input" value={conditions} onChange={e=>setConditions(e.target.value)} placeholder="Diabetes, BP..." /></div>
                <button onClick={handleGenerate} className="btn btn-primary" disabled={isGenerating}>{isGenerating ? 'Updating...' : 'Update Plan'}</button>
            </div>
        </div>
    );
};

const HealthPlanView = ({ planData, type }) => {
  if (!planData) return <div className="app-container"><div className="glass-panel" style={{padding:'24px', textAlign:'center', color:'#94a3b8'}}>No plan generated yet. Please setup your profile.</div></div>;

  const renderContent = () => {
    if (type === 'diet') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {planData.diet && planData.diet.map((item, idx) => (
             <div key={idx} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #6366f1' }}>
               <div>
                 <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={12}/> {item.time} - {item.meal}</div>
                 <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{item.items}</div>
               </div>
               <div style={{ textAlign: 'right', fontSize: '14px', color: '#818cf8', fontWeight: 'bold' }}>{item.cals}</div>
             </div>
           ))}
        </div>
      );
    }
    if (type === 'exercise') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {planData.exercise && planData.exercise.map((item, idx) => (
             <div key={idx} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #10b981' }}>
               <div>
                 <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>{item.type}</div>
                 <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{item.activity}</div>
               </div>
               <div style={{ textAlign: 'right', fontSize: '14px', color: '#34d399', fontWeight: 'bold' }}>{item.duration}</div>
             </div>
           ))}
        </div>
      );
    }
    if (type === 'report') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
           {planData.report && planData.report.map((item, idx) => (
             <div key={idx} className="glass-panel" style={{ padding: '16px', textAlign: 'center', borderTop: `4px solid ${item.color}` }}>
               <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.metric}</div>
               <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: '8px 0' }}>{item.value}</div>
               <div style={{ fontSize: '12px', color: item.color, fontWeight: 'bold', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'inline-block' }}>{item.status}</div>
             </div>
           ))}
           <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '16px' }}>
             <h4 style={{ fontSize: '14px', color: '#818cf8', marginBottom: '8px' }}>AI Note:</h4>
             <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>{planData.summary}</p>
           </div>
        </div>
      );
    }
  };

  return (
    <div className="app-container fade-in">
      <h1 className="glow-text" style={{ fontSize:'24px', marginBottom:'20px' }}>{type === 'diet' ? 'Diet Chart' : type === 'exercise' ? 'Exercise Routine' : 'Health Report'}</h1>
      <div style={{ maxHeight:'75vh', overflowY:'auto', paddingBottom: '100px' }}>
        {renderContent()}
      </div>
    </div>
  );
};

/* --- FIRMWARE SOURCE VIEW --- */
const FirmwareView = () => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(ARDUINO_FIRMWARE_CODE);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="app-container fade-in">
            <h1 className="glow-text" style={{ fontSize:'24px', marginBottom:'20px' }}>Firmware Source</h1>
            <div className="glass-panel" style={{ padding:'20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                    <div style={{fontSize:'12px', color:'#94a3b8'}}>health_backend.ino</div>
                    <button onClick={handleCopy} style={{background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontSize:'12px'}}>
                        {copied ? <CheckCircle size={14} color="#4ade80"/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy Code'}
                    </button>
                </div>
                <div className="code-block">{ARDUINO_FIRMWARE_CODE}</div>
            </div>
        </div>
    );
};

/* --- Send Data() --- */
const App = () => {

  const sendData = () => {

    set(ref(database, 'SmartHealthSuit/Patient_001/LiveData'), {
      heartRate: 78,
      temperature: 36.8,
      spo2: 98,
      timestamp: new Date().toLocaleString()
    });

    alert("Data Sent Successfully");
  };

  return (
    <div>
    <h1>Dashboard</h1>

    <button onClick={sendData}>
      Send Health Data
    </button>

  </div>
)};

/* --- DASHBOARD --- */
const Dashboard = ({ 
  isConnected, toggleConnection, sensorData, 
  isWorkoutActive, setIsWorkoutActive, timer, 
  handleQuickMeal, placeName, setPlaceName, showPermissionModal, setShowPermissionModal,
  userName, onEditName, userImage, handleImageUpload, rawData, isHardwareConnected, connectionType,
  onOpenMenu, connectToSerial
}) => {
  const fileInputRef = useRef(null);

  return (
    <div className="app-container fade-in">
      <header className="header" style={{ marginBottom:'16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display:'flex', gap:'12px', alignItems:'center', flex: 1 }}>
          <div onClick={onOpenMenu} style={{ cursor:'pointer', padding:'8px', background:'rgba(255,255,255,0.1)', borderRadius:'12px' }}>
            <Menu size={24} color="white" />
          </div>
          <div>
            <div style={{ fontSize:'12px', color:'#e2e8f0', marginBottom: '2px' }}>Welcome back,</div>
            <div onClick={onEditName} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <h2 style={{ fontSize:'20px', fontWeight:'800', color: 'white', margin: '0' }}>{userName}</h2>
            </div>
          </div>
        </div>
        <div className="avatar" onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', width:'40px', height:'40px', borderRadius:'50%', border: '2px solid #6366f1' }}>
          <img src={userImage} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
        </div>
      </header>

      {/* ... Rest of Dashboard (Location, Sensors, etc.) ... */}
      <div style={{ marginBottom:'20px' }}>
        {!placeName ? (
          <button onClick={() => setShowPermissionModal(true)} className="glass-panel" style={{ width:'100%', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', border:'1px dashed #6366f1' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(99, 102, 241, 0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}><LocateFixed size={16} color="#818cf8" /></div>
              <div style={{ textAlign:'left' }}><div style={{ fontSize:'14px', fontWeight:'bold', color:'white' }}>Enable Location</div><div style={{ fontSize:'10px', color:'#94a3b8' }}>Tap to track route</div></div>
            </div>
            <div style={{ color:'#818cf8' }}><Play size={16} /></div>
          </button>
        ) : (
          <div className="glass-panel" style={{ width:'100%', padding:'16px', display:'flex', alignItems:'center', gap:'12px', background:'rgba(16, 185, 129, 0.1)', borderColor:'rgba(16, 185, 129, 0.3)' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'#10b981', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 15px rgba(16, 185, 129, 0.4)' }}><MapPin size={20} color="white" /></div>
            <div><div style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'1px', color:'#6ee7b7', fontWeight:'bold' }}>Current Location</div><div style={{ fontSize:'16px', fontWeight:'bold', color:'white' }}>{placeName}</div></div>
            <div style={{ marginLeft:'auto' }}><div className="spinner" style={{ width:'16px', height:'16px', borderTopColor:'#10b981', borderRightColor:'#10b981' }}></div></div>
          </div>
        )}
      </div>

      <div className="glass-panel status-card">
        <div style={{ display:'flex', gap:'16px', alignItems:'center' }}>
          <div className={`status-icon ${isConnected ? 'active' : ''}`}>
             {isHardwareConnected ? <Usb size={20} /> : <Bluetooth size={20} />}
          </div>
          <div>
            <div style={{ fontWeight:'bold' }}>{isConnected ? 'Smart Shirt Active' : 'Sensor Disconnected'}</div>
            <div style={{ fontSize:'12px', color:'#94a3b8' }}>{isConnected ? (isHardwareConnected ? 'Connected via USB' : 'Running Simulation Mode') : 'Pair device to start'}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          {!isHardwareConnected && (
            <button 
              onClick={toggleConnection} 
              style={{ background: isConnected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)', color: isConnected?'#f87171':'white', border:'none', padding:'8px 12px', borderRadius:'12px', fontSize:'12px', cursor:'pointer' }}
            >
              {isConnected ? 'Stop Demo' : 'Demo Mode'}
            </button>
          )}
          
          <button 
            onClick={connectToSerial}
            disabled={isHardwareConnected}
            style={{ background: isHardwareConnected ? '#10b981' : '#4f46e5', color: 'white', border:'none', padding:'8px 16px', borderRadius:'20px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}
          >
            {isHardwareConnected ? <CheckCircle size={14}/> : <Usb size={14}/>}
            {isHardwareConnected ? 'Connected' : 'Connect USB'}
          </button>
        </div>
      </div>

      <div className="grid-stats">
        <StatCard icon={Heart} label="Pulse" value={isWorkoutActive ? sensorData.hr : "--"} unit="BPM" color="red" />
        <StatCard icon={Droplets} label="SpO2" value={isWorkoutActive ? sensorData.spo2 : "--"} unit="%" color="cyan" />
        <StatCard icon={Thermometer} label="Temp" value={isWorkoutActive ? sensorData.temp : "--"} unit="°C" color="orange" />
        <StatCard icon={Zap} label="Fatigue" value={isWorkoutActive ? `${sensorData.fatigue.toFixed(0)}%` : "--"} unit="Lvl" color="yellow" />
        <StatCard icon={Footprints} label="Steps" value={isWorkoutActive ? sensorData.steps : "--"} unit="steps" color="purple" />
        <StatCard icon={Activity} label="ECG" value={isWorkoutActive ? sensorData.ecg : "--"} unit="mV" color="green" />
      </div>

      <div style={{ height: '160px' }}></div>
      <div style={{ position:'fixed', bottom:'100px', left:'20px', right:'20px', zIndex:50 }}>
         {!isWorkoutActive ? (
           <button className="btn btn-success" disabled={!isConnected} onClick={() => setIsWorkoutActive(true)}>
             <Play size={20} fill="currentColor" /> START WORKOUT
           </button>
         ) : (
           <div style={{ display:'flex', gap:'10px' }}>
             <div className="glass-panel" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontFamily:'monospace', fontWeight:'bold' }}>
                {Math.floor(timer/60)}:{(timer%60)<10?'0':''}{timer%60}
             </div>
             <button className="btn btn-danger" style={{ flex:1 }} onClick={() => setIsWorkoutActive(false)}>
               <Square size={20} fill="currentColor" /> STOP
             </button>
           </div>
         )}
      </div>
    </div>
  );
};

/* --- MAIN COMPONENT --- */
export default function SmartHealthApp() {
  const [screen, setScreen] = useState('splash'); // splash -> login -> wifi -> onboarding -> main
  const [activeTab, setActiveTab] = useState('home');
  const [userName, setUserName] = useState("Guest");
  
  const [userContact, setUserContact] = useState('');
  const [otpInput, setOtpInput] = useState('');
  
  const [isConnected, setIsConnected] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [activeAlert, setActiveAlert] = useState(null);
  
  const [sensorData, setSensorData] = useState({ hr: 0, spo2: 0, temp: 0, ecg: 0, emg: 0, fatigue: 0, hydration: 100, steps: 0, posture: 100 });
  const [rawData, setRawData] = useState("");
  const [healthPlan, setHealthPlan] = useState(null);
  
  const [showNameModal, setShowNameModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [points, setPoints] = useState(2450);

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [placeName, setPlaceName] = useState(null);
  const [isHardwareConnected, setIsHardwareConnected] = useState(false);
  const [userImage, setUserImage] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Alex");
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [language, setLanguage] = useState('English');
  const [connectionType, setConnectionType] = useState(null);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);

  const timerRef = useRef(null);
  const sensorRef = useRef(null);

  // Splash Screen Logic
  useEffect(() => {
    if (screen === 'splash') {
      setTimeout(() => setScreen('login'), 3500);
    }
  }, [screen]);

  // Handle Login Success
  const handleAuthSuccess = (userData) => {
    if (typeof userData === 'object') {
        setUserName(userData.name || "User");
        saveToFirebase({
            name: userData.name,
            gender: userData.gender,
            joinedAt: new Date().toISOString()
        });
    } else {
        setUserName(userData || "User");
    }
    setScreen('wifi');
  };

  const handleWifiSuccess = () => {
    setScreen('onboarding'); // Go to Health Form first
  };

  const handleOnboardingComplete = (plan) => {
    setHealthPlan(plan);
    saveToFirebase({ healthPlan: plan });
    setScreen('main'); // Finally go to Dashboard
    setActiveTab('home'); // Ensure we start at Dashboard
  };
  
  /* --- OTHER HANDLERS --- */
  const handleMenuSelect = (item) => {
    setIsMenuOpen(false);
    setActiveTab(item);
  };
  
  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    setShowLanguageModal(false);
  };
  
  const handleProfileSave = (data) => {
    setHealthPlan(data);
    saveToFirebase({ conditions: data.conditions });
    setActiveTab('diet_plan'); 
  };
  
  const handleImageUpload = (e) => { 
      const file = e.target.files[0]; 
      if (file) { 
          const reader = new FileReader(); 
          reader.onloadend = () => setUserImage(reader.result); 
          reader.readAsDataURL(file); 
      } 
  };
  
  /* --- FIREBASE SYNC --- */
  useEffect(() => {
    if (typeof __firebase_config === 'undefined') return;
    try {
      const firebaseConfig = JSON.parse(__firebase_config);
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      const appId = (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id').replace(/\//g, '_');
      
      const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      };
      initAuth();
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'profile');
          const unsubDoc = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const d = docSnap.data();
              setUserName(d.name || "Alex Racer ⚡");
              setPoints(d.points || 2450);
              if(d.healthPlan) setHealthPlan(d.healthPlan);
            } else setDoc(docRef, { name: userName, points: points });
          });
          return () => unsubDoc();
        }
      });
      return () => unsubscribe();
    } catch (e) { console.error("Firebase init failed:", e); }
  }, []);

  const saveToFirebase = (data) => {
    if (typeof __firebase_config === 'undefined') return;
    try {
      const app = initializeApp(JSON.parse(__firebase_config));
      const auth = getAuth(app);
      const db = getFirestore(app);
      const appId = (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id').replace(/\//g, '_');
      if (auth.currentUser) {
        const docRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'data', 'profile');
        setDoc(docRef, data, { merge: true });
      }
    } catch(e){}
  };

  /* --- C++ DATA PARSING LOGIC (SERIAL) --- */
  const connectToSerial = async () => {
    try {
      if ('serial' in navigator) {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        setIsHardwareConnected(true);
        setIsConnected(true);

        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();

        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
             // PARSING C++ DATA: Temp,Pulse,SpO2,ECG,EMG,Status
             try {
                const parts = line.trim().split(',');
                if (parts.length >= 6) {
                    const t = parseFloat(parts[0]);
                    const p = parseInt(parts[1]);
                    const s = parseInt(parts[2]);
                    const ecg = parseFloat(parts[3]);
                    const emg = parseInt(parts[4]);
                    
                    // Reconstruct Status (it might contain commas due to URL)
                    const statusStr = parts.slice(5).join(',');

                    setSensorData(prev => ({
                        ...prev, temp: t, hr: p, spo2: s, ecg: ecg, emg: emg
                    }));
                    
                    // Handle GPS URL from Alert
                    if (statusStr.includes("http")) {
                        const urlMatch = statusStr.match(/q=([-0-9.]+),([-0-9.]+)/);
                        if (urlMatch) {
                           setPlaceName(`${urlMatch[1]}, ${urlMatch[2]}`);
                        }
                    }
                    
                    // Handle Alert Type
                    if (statusStr.includes("TEMP_HIGH")) setActiveAlert(ALERT_TYPES["TEMP_HIGH"]);
                    else if (statusStr.includes("SWEAT")) setActiveAlert(ALERT_TYPES["SWEAT"]);
                }
             } catch(e) { console.error("Parse Error", e); }
          }
        }
      } else { alert("Web Serial not supported."); }
    } catch (err) { console.error(err); setIsHardwareConnected(false); }
  };

  /* ... Timer Logic ... */
  useEffect(() => { if (isWorkoutActive) { timerRef.current = setInterval(() => setTimer(t => t + 1), 1000); } else { clearInterval(timerRef.current); } return () => clearInterval(timerRef.current); }, [isWorkoutActive]);
  
  // SIMULATION LOGIC (Only runs if NO hardware connected)
  useEffect(() => { 
    if (isConnected && isWorkoutActive && !isHardwareConnected) { 
      sensorRef.current = setInterval(() => { 
        const packet = generateCPPDataPacket(true); 
        setRawData(packet); 
        
        // Use SAME parsing logic as Serial to ensure consistency
        const parts = packet.trim().split(',');
        const statusStr = parts.slice(5).join(',');
        
        setSensorData(prev => ({ 
           temp: parts[0], hr: parts[1], spo2: parts[2], ecg: parts[3], emg: parts[4], 
           fatigue: Math.min(100, prev.fatigue+0.5), hydration: Math.max(0, prev.hydration-0.2), steps: prev.steps, posture: 98 
        })); 
        
        if (statusStr.includes("TEMP_HIGH")) setActiveAlert(ALERT_TYPES["TEMP_HIGH"]);
        else if (statusStr.includes("SWEAT")) setActiveAlert(ALERT_TYPES["SWEAT"]);
        
        if (statusStr.includes("http")) {
             // Simulate updating location from "GPS"
             setPlaceName("12.9716, 80.2746"); 
        }

      }, 1000); 
    } else clearInterval(sensorRef.current); 
    return () => clearInterval(sensorRef.current); 
  }, [isConnected, isWorkoutActive, isHardwareConnected]);
  
  const handleAllowGPS = () => {
    if ("geolocation" in navigator) {
        setPlaceName("Locating...");
        setShowPermissionModal(false);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                const address = data.address;
                const area = address.suburb || address.neighbourhood || address.road || "";
                const city = address.city || address.town || address.county || "";
                setPlaceName(`${area}, ${city}`);
            } catch (e) {
                setPlaceName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
        }, (error) => {
            console.error(error);
            setPlaceName("Signal Lost"); 
            alert("GPS Error. Check permissions.");
        }, { enableHighAccuracy: true });
    } else {
        alert("Geolocation not supported");
        setShowPermissionModal(false);
    }
  };

  const triggerAlert = (type) => {
      if (ALERT_TYPES[type]) {
          setActiveAlert(ALERT_TYPES[type]);
      }
  };

  if (screen === 'splash') return <SplashScreen onFinish={() => setScreen('login')} />;
  if (screen === 'login') return <LoginScreen onLogin={handleAuthSuccess} onGuest={() => handleAuthSuccess("Guest")} setAlert={setActiveAlert} />;
  if (screen === 'wifi') return <WifiConnectionScreen onConnect={handleWifiSuccess} />;
  if (screen === 'onboarding') return <HealthOnboardingScreen onComplete={handleOnboardingComplete} />;

  return (
    <div>
      <AppStyles />
      <AlertOverlay alert={activeAlert} onClose={() => setActiveAlert(null)} />
      {showNameModal && <EditNameModal currentName={userName} onSave={(n)=>{setUserName(n); setShowNameModal(false)}} onCancel={()=>setShowNameModal(false)} />}
      {showPermissionModal && <LocationPermissionModal onAllow={handleAllowGPS} onDeny={()=>{setShowPermissionModal(false); alert("Denied");}} />}
      {showLanguageModal && <LanguageModal currentLang={language} onSelect={handleLanguageSelect} onClose={() => setShowLanguageModal(false)} />}

      <SideMenu isOpen={isMenuOpen} onClose={()=>setIsMenuOpen(false)} onSelect={handleMenuSelect} onOpenLanguage={() => { setIsMenuOpen(false); setShowLanguageModal(true); }} onLogout={() => setScreen('login')} />

      {/* --- ADD VOICE ASSISTANT HERE --- */}
      {screen === 'main' && <VoiceAssistant sensorData={sensorData} triggerAlert={triggerAlert} />}

      <main>
        {activeTab === 'home' && <Dashboard isConnected={isConnected} toggleConnection={() => setIsConnected(!isConnected)} sensorData={sensorData} isWorkoutActive={isWorkoutActive} setIsWorkoutActive={setIsWorkoutActive} timer={timer} handleQuickMeal={()=>{}} placeName={placeName} setPlaceName={setPlaceName} showPermissionModal={showPermissionModal} setShowPermissionModal={setShowPermissionModal} userName={userName} onEditName={()=>setShowNameModal(true)} userImage={userImage} handleImageUpload={handleImageUpload} rawData={rawData} isHardwareConnected={isHardwareConnected} onOpenMenu={()=>setIsMenuOpen(true)} connectToSerial={connectToSerial} />}
        {activeTab === 'analytics' && <Analytics aiAnalysis={null} isAnalyzing={false} handleAnalyzeData={()=>{}} />}
        {activeTab === 'ai' && <AIChat sensorData={sensorData} />}
        {activeTab === 'profile' && <Profile />}
{activeTab === 'test' && <TestHub triggerAlert={(t)=>setActiveAlert(ALERT_TYPES[t] || {msg:'Test Alert', type:'info'})} />}

        
        {/* Planner Tabs */}
        {activeTab === 'profile_setup' && <HealthProfileSetup onSave={handleProfileSave} />}
        {activeTab === 'diet_plan' && <HealthPlanView planData={healthPlan} type="diet" />}
        {activeTab === 'exercise_plan' && <HealthPlanView planData={healthPlan} type="exercise" />}
        {activeTab === 'health_report' && <HealthPlanView planData={healthPlan} type="report" />}
        {activeTab === 'firmware_source' && <FirmwareView />}
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab==='home'?'active':''}`} onClick={()=>setActiveTab('home')}><Home size={24}/><span>Home</span></button>
        <button className={`nav-item ${activeTab==='analytics'?'active':''}`} onClick={()=>setActiveTab('analytics')}><TrendingUp size={24}/><span>Data</span></button>
        <button className="nav-center" onClick={()=>setActiveTab('ai')}><MessageSquare size={24}/></button>
        <button className={`nav-item ${activeTab==='profile'?'active':''}`} onClick={()=>setActiveTab('profile')}><User size={24}/><span>Profile</span></button>
        <button className={`nav-item ${activeTab==='settings'?'active':''}`} onClick={()=>setActiveTab('settings')}><Settings size={24}/><span>Settings</span></button>
      </nav>
    </div>
  );
}