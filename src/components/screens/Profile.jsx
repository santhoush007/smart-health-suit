import React, { useState } from 'react';
import { User, Award, Target, HeartPulse, Activity, Crown, Edit, TrendingUp, Shield, Zap, Footprints } from 'lucide-react';

const ProfileScreen = () => {
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Alex Racer ⚡',
    age: 28,
    height: '175 cm',
    weight: '70 kg',
    goals: 'Build Muscle & Improve Endurance',
    conditions: 'None'
  });
  const [achievements] = useState([
    { id: 1, name: 'Marathon Finisher', icon: Crown, points: 1000, date: '2024-01-15', color: '#fbbf24' },
    { id: 2, name: 'Hydration Master', icon: Droplets, points: 500, date: '2024-02-10', color: '#06b6d4' },
    { id: 3, name: 'HR Zone Beast', icon: HeartPulse, points: 750, date: '2024-03-05', color: '#f43f5e' }
  ]);
  const [stats] = useState({
    totalSteps: 245678,
    avgHR: 78,
    bestWorkout: '25.4 km Run',
    consistency: 28
  });

  const handleSave = () => {
    setEditMode(false);
    // Simulate save
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  return (
    <div className="profile-hero pb-24">
      {/* Profile Header */}
      <div className="glass-panel p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10"></div>
        <div className="relative z-10 text-center">
          <div 
            className="profile-avatar mx-auto"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={handleEdit}
          >
            <User size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent mb-2">
            {userData.name}
          </h1>
          <p className="text-gray-400 text-lg mb-6">{userData.goals}</p>
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4">
              <div className="text-2xl font-black text-accent-cyan mb-1">{stats.consistency}</div>
              <div className="text-xs uppercase text-gray-400 tracking-wider">Day Streak</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-black text-accent-pink mb-1">{stats.totalSteps.toLocaleString()}</div>
              <div className="text-xs uppercase text-gray-400 tracking-wider">Total Steps</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-black text-accent-neon mb-1">{stats.avgHR}</div>
              <div className="text-xs uppercase text-gray-400 tracking-wider">Avg HR</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-black text-accent-orange mb-1">{stats.bestWorkout}</div>
              <div className="text-xs uppercase text-gray-400 tracking-wider">Best Workout</div>
            </div>
          </div>

          {editMode ? (
            <div className="flex gap-3">
              <Button onClick={handleSave} variant="primary">Save Changes</Button>
              <Button onClick={() => setEditMode(false)} variant="ghost">Cancel</Button>
            </div>
          ) : (
            <Button onClick={handleEdit} className="flex items-center gap-2 mx-auto">
              <Edit size={18} /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Edit Form - Conditional */}
      {editMode && (
        <div className="glass-panel p-6 mb-8">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-white">
            <Edit size={20} /> Update Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <label>Age</label>
              <input 
                className="custom-input" 
                type="number" 
                value={userData.age} 
                onChange={(e) => setUserData({...userData, age: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Height</label>
              <input 
                className="custom-input" 
                value={userData.height} 
                onChange={(e) => setUserData({...userData, height: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Weight</label>
              <input 
                className="custom-input" 
                value={userData.weight} 
                onChange={(e) => setUserData({...userData, weight: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Medical Conditions</label>
              <input 
                className="custom-input" 
                value={userData.conditions} 
                onChange={(e) => setUserData({...userData, conditions: e.target.value})}
                placeholder="None"
              />
            </div>
          </div>
        </div>
      )}

      {/* Health Goals */}
      <div className="glass-panel p-6 mb-8 health-goal-card">
        <h3 className="font-bold text-xl mb-4 flex items-center gap-3 text-accent-success">
          <Target size={20} /> Health Goals
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
            <span className="text-white font-medium">Target Steps</span>
            <div className="text-2xl font-black text-accent-success">12,000</div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
            <span className="text-white font-medium">Weekly Workouts</span>
            <div className="text-2xl font-black text-accent-cyan">5/7</div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
            <span className="text-white font-medium">Sleep Score</span>
            <div className="text-2xl font-black text-accent-purple">87%</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="mb-8">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-accent-orange text-white">
          <Award size={20} /> Achievements ({achievements.length})
        </h3>
        <div className="achievement-grid">
          {achievements.map((ach) => {
            const Icon = ach.icon || Trophy;
            return (
              <div key={ach.id} className="achievement-badge glass-panel hover-lift" style={{ borderLeft: `4px solid ${ach.color}` }}>
                <div 
                  className="achievement-icon" 
                  style={{ background: `${ach.color}20`, color: ach.color }}
                >
                  <Icon size={24} strokeWidth={2} />
                </div>
                <h4 className="font-bold text-white mb-2 text-sm leading-tight">{ach.name}</h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">+{ach.points} pts</span>
                  <span className="text-gray-500">{ach.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-6 shadow-glow-cyan">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center">
              <TrendingUp size={20} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-white">Progress</h4>
              <p className="text-sm text-gray-400">This Month</p>
            </div>
          </div>
          <div className="text-3xl font-black text-accent-cyan">+24%</div>
        </div>
        
        <div className="glass-panel p-6 shadow-glow-pink">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center">
              <Zap size={20} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-white">Total Points</h4>
              <p className="text-sm text-gray-400">Lifetime</p>
            </div>
          </div>
          <div className="text-3xl font-black text-accent-pink animate-glow">18,450</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
