import React, { useState, useEffect } from 'react';
import { Trophy, Activity, Sparkles, TrendingUp, HeartPulse, Footprints, Zap, Download } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
  LineChart, Line 
} from 'recharts';
import { MOCK_HISTORY } from '../../utils/helpers.js';
import { callGeminiAI } from '../../utils/api.js';
import { Button } from '../shared/index.jsx';

const AnalyticsScreen = () => {
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeChart, setActiveChart] = useState('hr'); // hr, steps, fatigue
  const [recentData, setRecentData] = useState([]);

  // Mock recent data table
  const recentTableData = [
    { time: '09:32', hr: 82, spo2: 97, temp: 37.1, steps: 124, fatigue: 23 },
    { time: '09:30', hr: 79, spo2: 98, temp: 37.0, steps: 118, fatigue: 21 },
    { time: '09:28', hr: 85, spo2: 96, temp: 37.2, steps: 132, fatigue: 28 },
    { time: '09:26', hr: 77, spo2: 99, temp: 36.9, steps: 109, fatigue: 19 },
    { time: '09:24', hr: 88, spo2: 95, temp: 37.3, steps: 145, fatigue: 32 },
  ];

  const handleAnalyzeData = async () => {
    setIsAnalyzing(true);
    const analysis = await callGeminiAI("Analyze this health data and provide actionable insights: HR avg 82bpm, SpO2 97%, Temp stable 37.1C, increasing fatigue 28%, 145 peak steps. Suggest optimizations.");
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const COLORS = ['#f43f5e', '#06b6d4', '#eab308', '#10b981'];

  const renderChart = () => {
    const chartData = MOCK_HISTORY.map(d => ({
      ...d,
      [activeChart]: Math.floor(Math.random() * 20) + (activeChart === 'hr' ? 70 : activeChart === 'steps' ? 4000 : 20)
    }));

    switch (activeChart) {
      case 'hr':
        return (
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin', 'dataMax + 5']} />
            <Tooltip contentStyle={{ background: 'rgba(30,41,59,0.95)', border: '1px solid #475569', borderRadius: '12px' }} />
            <Area type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#hrGradient)" />
          </AreaChart>
        );
      case 'steps':
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: 'rgba(30,41,59,0.95)', border: '1px solid #475569', borderRadius: '12px' }} />
            <Bar dataKey="steps" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'fatigue':
        return (
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 50]} />
            <Tooltip contentStyle={{ background: 'rgba(30,41,59,0.95)', border: '1px solid #475569', borderRadius: '12px' }} />
            <Line type="monotone" dataKey="fatigue" stroke="#eab308" strokeWidth={4} dot={{ fill: '#eab308', strokeWidth: 2 }} activeDot={{ r: 8 }} />
          </LineChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="data-hero pb-24 px-4 space-y-6">
      {/* Performance Overview */}
      <div className="glass-panel p-8 relative overflow-hidden chart-wrapper">
        <Trophy className="absolute -right-6 -bottom-6 text-accent-cyan/10 w-24 h-24 opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">Performance <span className="text-accent-cyan">Hub</span></h1>
            <p className="text-gray-400 text-sm">Weekly insights & trends</p>
          </div>
          <div className="flex bg-black/20 backdrop-blur-sm rounded-2xl p-1 gap-1">
            {['hr', 'steps', 'fatigue'].map((chart) => (
              <button
                key={chart}
                onClick={() => setActiveChart(chart)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeChart === chart
                    ? 'bg-gradient-to-r from-accent-pink to-accent-cyan text-white shadow-glow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {chart === 'hr' ? 'Heart Rate' : chart === 'steps' ? 'Steps' : 'Fatigue'}
              </button>
            ))}
          </div>
        </div>

        {isAnalyzing ? (
          <div className="loading-overlay">
            <div className="spinner" style={{ borderColor: 'rgba(99,102,241,0.3)', borderTopColor: '#6366f1' }}></div>
            <div className="text-white font-bold text-lg">AI Analyzing Your Data...</div>
            <div className="text-gray-400 text-sm">Gemini processing trends & insights</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly Summary */}
      <div className="glass-panel p-6 md:p-8">
        <h3 className="text-accent-cyan font-bold text-lg mb-6 flex items-center gap-2">
          <TrendingUp size={20} /> Monthly Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-black text-white mb-2">A+</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Overall Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-accent-cyan mb-2">12</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Workouts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-accent-pink mb-2">4.2k</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Avg Daily Steps</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-accent-success mb-2">28</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Day Streak</div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="glass-panel p-6 relative">
        <Sparkles className="absolute -top-4 -right-4 w-12 h-12 text-accent-neon/20" />
        <div className="relative">
          <h3 className="font-bold text-xl mb-4 text-white flex items-center gap-2">
            AI <span className="text-accent-neon">Insights</span>
          </h3>
          <div className="mb-4">
            <Button 
              onClick={handleAnalyzeData} 
              disabled={isAnalyzing}
              variant="outline"
              className="w-full justify-center gap-2 !bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:from-purple-500/30"
            >
              {isAnalyzing ? (
                <>
                  <div className="spinner w-4 h-4 border-white/30 border-t-white"></div>
                  Analyzing Data...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Generate AI Report
                </>
              )}
            </Button>
          </div>
          {aiAnalysis && (
            <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl border border-accent-neon/30 min-h-[120px] animate-fade-in">
              <div className="font-bold flex items-center gap-2 mb-3 text-accent-neon text-sm">
                <Sparkles size={14} /> AI Analysis:
              </div>
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                {aiAnalysis}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Data Table */}
      <div className="glass-panel p-4 md:p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
          Recent Readings <span className="text-xs bg-accent-cyan/20 text-accent-cyan px-2 py-1 rounded-full">(Last 10min)</span>
        </h3>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>HR</th>
                <th>SpO2</th>
                <th>Temp</th>
                <th>Steps</th>
                <th>Fatigue</th>
              </tr>
            </thead>
            <tbody>
              {recentTableData.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.time}</td>
                  <td className="font-mono text-accent-pink">{row.hr}</td>
                  <td>{row.spo2}%</td>
                  <td>{row.temp}°C</td>
                  <td>{row.steps}</td>
                  <td className="font-mono text-accent-orange">{row.fatigue}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-700/50">
          <Button variant="outline" className="flex-1 gap-2">
            <Download size={16} /> Export CSV
          </Button>
          <Button variant="primary" className="flex-1 gap-2">Share Report</Button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsScreen;
