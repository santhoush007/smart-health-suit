import React from 'react';
import { AlertTriangle, Zap, Heart, Droplets, Thermometer, Users, MessageSquare } from 'lucide-react';

const TestHub = ({ triggerAlert }) => {
  const testAlerts = [
    { id: 1, label: 'High Temp', type: 'TEMP_HIGH', icon: Thermometer, color: 'bg-orange-500' },
    { id: 2, label: 'Dehydration', type: 'SWEAT', icon: Droplets, color: 'bg-cyan-500' },
    { id: 3, label: 'Heart Rate ⚠️', type: 'HR_HIGH', icon: Heart, color: 'bg-red-500' },
    { id: 4, label: 'High Fatigue', type: 'FATIGUE', icon: Zap, color: 'bg-yellow-500' },
    { id: 5, label: 'Fall Alert', type: 'FALL', icon: AlertTriangle, color: 'bg-red-700' },
  ];

  return (
    <div className="pb-24 pt-6 px-6 space-y-6 animate-fade-in">
      <div>
        <h2 className="text-gray-400 text-sm font-medium">System Testing</h2>
        <h1 className="text-2xl font-bold text-white">Alert Test Hub</h1>
      </div>

      <div className="glass rounded-3xl p-6 shadow-lg">
        <p className="text-sm text-gray-400 mb-4">Test different alert types by clicking the buttons below:</p>
        <div className="grid grid-cols-2 gap-3">
          {testAlerts.map(alert => (
            <button
              key={alert.id}
              onClick={() => triggerAlert(alert.type)}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover-lift transition ${alert.color}/20 border border-${alert.color.split('-')[1]}-500/30`}
            >
              <alert.icon size={24} className="text-white" />
              <span className="text-xs font-bold text-white text-center">{alert.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-6 shadow-lg">
        <h3 className="text-accent-cyan font-semibold mb-3 flex items-center gap-2">
          <MessageSquare size={18} /> Status
        </h3>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Firmware:</span>
            <span className="text-white font-semibold">v2.7</span>
          </div>
          <div className="flex justify-between">
            <span>API Status:</span>
            <span className="text-accent-neon font-semibold">Online</span>
          </div>
          <div className="flex justify-between">
            <span>Sensors:</span>
            <span className="text-accent-cyan font-semibold">Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestHub;
