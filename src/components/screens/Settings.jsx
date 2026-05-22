import React, { useState } from 'react';
import { Settings, Bell, Shield, UserCog, Moon, Sun, Download, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '../../shared/index.jsx';

const SettingsScreen = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [units, setUnits] = useState('metric');
  const [privacy, setPrivacy] = useState('all');

  const toggleNotifications = () => setNotifications(!notifications);
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const handleLogout = () => console.log('Logout triggered');

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 settings-screen">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 glass-panel rounded-2xl flex items-center justify-center">
          <Settings size={20} className="text-accent-neon" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Settings</h1>
          <p className="text-gray-400 text-sm">App preferences & account</p>
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2 mb-4">
          <Bell size={18} /> Quick Controls
        </h3>
        <div className="space-y-3">
          <label className="settings-toggle flex items-center justify-between">
            <span className="font-medium text-white">Push Notifications</span>
            <div 
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notifications ? 'bg-accent-success' : 'bg-gray-600'}`}
              onClick={toggleNotifications}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 shadow-md ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </label>
          <label className="settings-toggle flex items-center justify-between">
            <span className="font-medium text-white">Dark Mode</span>
            <div 
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${darkMode ? 'bg-accent-neon' : 'bg-gray-600'}`}
              onClick={toggleDarkMode}
            >
              <div className={`w-4 h-4 rounded-full absolute top-1 transition-transform duration-300 shadow-md flex items-center justify-center ${darkMode ? 'translate-x-6 text-yellow-400' : 'translate-x-1 text-gray-400'}`}>
                {darkMode ? <Moon size={10} /> : <Sun size={10} />}
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Measurement Units */}
      <div className="glass-panel p-6">
        <h3 className="font-bold text-white flex items-center gap-2 mb-4">
          <UserCog size={18} /> Measurement Units
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 cursor-pointer">
            <input type="radio" name="units" value="metric" checked={units === 'metric'} onChange={(e) => setUnits(e.target.value)} className="w-4 h-4 text-accent-primary bg-gray-700 border-gray-500 rounded" />
            <span className="text-white font-medium">Metric (kg, cm, °C)</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 cursor-pointer">
            <input type="radio" name="units" value="imperial" checked={units === 'imperial'} onChange={(e) => setUnits(e.target.value)} className="w-4 h-4 text-accent-primary bg-gray-700 border-gray-500 rounded" />
            <span className="text-white font-medium">Imperial (lbs, ft, °F)</span>
          </label>
        </div>
      </div>

      {/* Privacy & Data */}
      <div className="glass-panel p-6">
        <h3 className="font-bold text-white flex items-center gap-2 mb-4">
          <Shield size={18} /> Privacy & Data
        </h3>
        <div className="space-y-3 text-sm">
          <label className="settings-row flex items-center justify-between py-3 border-b border-gray-700/50 last:border-b-0">
            <span>Data Sharing</span>
            <select value={privacy} onChange={(e) => setPrivacy(e.target.value)} className="settings-select bg-gray-800 border-gray-600 text-white px-3 py-1 rounded-xl text-sm">
              <option value="all">All Devices</option>
              <option value="trusted">Trusted Only</option>
              <option value="none">Private</option>
            </select>
          </label>
          <Button variant="outline" className="w-full justify-center gap-2 text-sm">
            <Download size={16} /> Export Health Data
          </Button>
        </div>
      </div>

      {/* Account Actions */}
      <div className="glass-panel p-6 pt-4">
        <button className="settings-row w-full flex items-center justify-between py-3 text-left hover:bg-red-500/10 border-b border-gray-700/50 text-red-400 group transition-all duration-200">
          <span className="flex items-center gap-3 font-medium">
            <LogOut size={18} className="group-hover:-rotate-12 transition-transform" />
            Sign Out
          </span>
          <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </div>
  );
};

export default SettingsScreen;
