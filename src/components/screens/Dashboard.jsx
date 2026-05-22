import React from 'react';
import { Heart, Activity, Thermometer, Droplets, Zap, User, Bluetooth, Sparkles, Play, Square, LocateFixed } from 'lucide-react';
import { StatCard, Button } from '../shared/index.jsx';
import { formatTime } from '../../utils/helpers.js';

const Dashboard = ({
  isConnected, toggleConnection, sensorData,
  isWorkoutActive, setIsWorkoutActive, timer,
  handleQuickMeal, location, activateGPS, gpsStatus, showPermissionModal, setShowPermissionModal
}) => (
  <div className="pb-24 pt-6 px-6 space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-gray-400 text-sm font-medium">Welcome back,</h2>
        <h1 className="text-2xl font-bold text-white">Alex Racer ⚡</h1>
      </div>
      <div className="w-10 h-10 rounded-full bg-gradient-5 p-0.5">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="User" className="w-full h-full bg-gray-900 rounded-full" />
      </div>
    </div>

    <div className="glass rounded-3xl p-1 shadow-lg">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isConnected ? 'bg-accent-neon text-white animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
            <Bluetooth size={20} />
          </div>
          <div>
            <h3 className="text-white font-semibold">{isConnected ? 'Smart Shirt Active' : 'Sensor Disconnected'}</h3>
            <p className="text-xs text-gray-500">{isConnected ? 'Reading data stream...' : 'Pair device to start'}</p>
          </div>
        </div>
        <button
          onClick={toggleConnection}
          className={`px-4 py-2 rounded-full text-xs font-bold transition ${isConnected ? 'bg-accent-pink text-white hover-scale' : 'bg-gradient-1 text-white hover-glow'}`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </div>

    {isConnected && (
      <button
        onClick={handleQuickMeal}
        className="w-full p-4 rounded-2xl glass flex items-center justify-center gap-3 text-accent-cyan hover-lift transition"
      >
        <Sparkles size={20} className="animate-glow" /> <span>Need fuel? Get <b>AI Meal Pick</b></span>
      </button>
    )}

    <div className="grid grid-cols-2 gap-4">
      <StatCard icon={Heart} label="Heart Rate" value={sensorData.hr} unit="BPM" color="pink" trend={isConnected && isWorkoutActive ? 12 : null} />
      <StatCard icon={Droplets} label="SpO2" value={sensorData.spo2} unit="%" color="cyan" />
      <StatCard icon={Thermometer} label="Body Temp" value={sensorData.temp} unit="°C" color="orange" />
      <StatCard icon={Zap} label="Fatigue" value={`${sensorData.fatigue.toFixed(0)}%`} unit="Level" color="neon" subValue={sensorData.fatigue > 70 ? "High Load" : "Normal"} />
      <StatCard icon={User} label="Steps" value={sensorData.steps} unit="steps" color="purple" />
      <StatCard icon={Activity} label="Posture" value={sensorData.posture.toFixed(0)} unit="Score" color="neon" />
    </div>

    {/* Live Map Button & Viewer */}
    <div className="w-full">
      {!location ? (
         <button
          onClick={() => setShowPermissionModal(true)}
          className="w-full h-32 glass rounded-3xl hover-lift transition flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
         >
           <div className="w-12 h-12 bg-gradient-3 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-glow">
             <LocateFixed size={24} />
           </div>
           <span className="font-bold text-white">📍 Enable Live GPS Tracking</span>
           <span className="text-sm text-gray-400">Click to allow permissions</span>
         </button>
      ) : (
        <div className="relative w-full h-56 glass rounded-3xl overflow-hidden group animate-slide-in-up">
           <iframe
            title="User Location"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            className="opacity-80 group-hover:opacity-100 transition"
           ></iframe>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
              <div className="w-4 h-4 bg-accent-cyan rounded-full animate-ping absolute"></div>
              <div className="w-4 h-4 bg-accent-cyan border-2 border-white rounded-full z-10 relative shadow-glow"></div>
          </div>
          <div className="absolute bottom-3 left-3 glass px-3 py-2 rounded-2xl text-xs text-white flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 bg-accent-neon rounded-full animate-pulse"></div>
              <div>
                <div className="font-bold">LIVE TRACKING ACTIVE</div>
                <div className="text-gray-300 font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</div>
              </div>
          </div>
        </div>
      )}
    </div>

    <div className="fixed bottom-24 left-6 right-6 z-20">
       {!isWorkoutActive ? (
         <Button
          onClick={() => setIsWorkoutActive(true)}
          disabled={!isConnected}
          variant="success"
        >
           <Play size={20} fill="currentColor" /> START WORKOUT
         </Button>
       ) : (
         <div className="flex gap-4">
           <div className="flex-1 glass rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-mono text-white tracking-widest">{formatTime(timer)}</span>
           </div>
           <Button
            onClick={() => { setIsWorkoutActive(false); }}
            variant="danger"
            className="flex-1"
          >
             <Square size={20} fill="currentColor" /> STOP
           </Button>
         </div>
       )}
    </div>
  </div>
);

export default Dashboard;
