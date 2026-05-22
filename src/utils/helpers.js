import { User, Zap, Heart, Droplets, ShieldAlert } from 'lucide-react';

export const MOCK_HISTORY = [
  { day: 'Mon', hr: 72, steps: 4500 },
  { day: 'Tue', hr: 75, steps: 6200 },
  { day: 'Wed', hr: 82, steps: 8100 },
  { day: 'Thu', hr: 78, steps: 5400 },
  { day: 'Fri', hr: 85, steps: 9000 },
  { day: 'Sat', hr: 90, steps: 12000 },
  { day: 'Sun', hr: 76, steps: 3500 },
];

export const ALERT_TYPES = [
  { id: 1, msg: "Wrong Posture Detected!", type: "warning", icon: User },
  { id: 2, msg: "Muscle Fatigue High", type: "warning", icon: Zap },
  { id: 3, msg: "Heart Rate Exceeded Safe Level", type: "danger", icon: Heart },
  { id: 4, msg: "Dehydration Risk", type: "warning", icon: Droplets },
  { id: 5, msg: "FALL DETECTED", type: "critical", icon: ShieldAlert },
];

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};
