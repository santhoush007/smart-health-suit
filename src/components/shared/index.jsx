import React from 'react';
import { TrendingUp, MessageCircle } from 'lucide-react';

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled, isLoading }) => {
  const baseClasses = "btn w-full";
  const variantClasses = {
    primary: "btn-primary",
    success: "btn-secondary", // Using gradient-2 for success
    danger: "btn-secondary", // Using gradient-2 for danger
    outline: "glass text-gray-300 hover:text-white",
    ghost: "bg-transparent text-gray-400 hover:text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {isLoading ? (
        <div className="spinner"></div>
      ) : children}
    </button>
  );
};

export const StatCard = ({ icon: Icon, label, value, unit, color = 'primary', subValue, trend }) => {
  const colorMap = {
    primary: 'text-primary',
    pink: 'text-accent-pink',
    purple: 'text-accent-purple',
    cyan: 'text-accent-cyan',
    neon: 'text-accent-neon',
  };

  return (
    <div className="stats-card group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl glass ${colorMap[color] || colorMap.primary}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="text-sm font-bold text-accent-neon flex items-center gap-1 animate-pulse">
            +{trend}% <TrendingUp size={14} />
          </span>
        )}
      </div>
      <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</h3>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-black text-white tracking-tight">{value}</span>
        <span className="text-sm text-gray-500 mb-1 font-medium">{unit}</span>
      </div>
      {subValue && <p className="text-xs text-gray-500 mt-2">{subValue}</p>}
    </div>
  );
};

export const AlertOverlay = ({ alert, onClose }) => {
    if (!alert) return null;
    const isCritical = alert.type === 'critical';
    const isSuccess = alert.type === 'success';
    const isNotification = alert.type === 'notification';

    if (isNotification) {
      return (
        <div className="fixed top-4 left-4 right-4 z-50 animate-slide-in-up cursor-pointer" onClick={onClose}>
          <div className="glass p-4 rounded-3xl shadow-xl flex items-start gap-4">
            <div className="bg-accent-neon/20 p-3 rounded-full">
              <MessageCircle size={24} className="text-accent-neon" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">New Message</h4>
              <p className="text-sm text-gray-300">{alert.msg}</p>
              <p className="text-xl font-mono font-bold text-white mt-2 tracking-widest">{alert.code}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
        <div className="modal-overlay">
            <div className={`modal text-center ${isCritical ? 'border-red-500' : isSuccess ? 'border-emerald-500' : 'border-amber-500'}`}>
                {isCritical && <div className="absolute inset-0 bg-red-500/20 animate-pulse"></div>}
                {isSuccess && <div className="absolute inset-0 bg-emerald-500/10"></div>}

                <div className={`relative w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${isCritical ? 'bg-red-500 text-white' : isSuccess ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'} shadow-glow`}>
                    {alert.icon && <alert.icon size={40} />}
                </div>

                <h2 className="text-3xl font-black text-white mb-4 uppercase">{alert.msg}</h2>
                <p className="text-gray-400 mb-8 text-lg">{alert.description || "Sensors have detected an anomaly. Please check your status immediately."}</p>

                <div className="space-y-4">
                    <Button onClick={onClose} variant={isCritical ? 'danger' : isSuccess ? 'success' : 'primary'}>
                        {isSuccess ? 'THANKS!' : 'I AM OKAY'}
                    </Button>
                    {isCritical && (
                        <p className="text-sm text-red-400 font-mono">SENDING SOS IN 10s...</p>
                    )}
                </div>
            </div>
        </div>
    );
};
