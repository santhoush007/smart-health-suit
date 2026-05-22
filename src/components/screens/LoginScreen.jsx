import React from 'react';
import { Activity, Mail, Phone } from 'lucide-react';
import { Button } from '../shared/index.jsx';

const LoginScreen = ({ loginStep, userContact, setUserContact, handleLogin, isOtpSending, otpInput, setOtpInput }) => (
  <div className="h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden animate-fade-in">
    <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-1 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
    <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-2 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse"></div>

    <div className="w-full max-w-sm z-10">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-3 mb-6 shadow-glow hover-glow">
          <Activity className="text-white w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Smart Health<br /><span className="text-accent-cyan">Suite</span></h1>
        <p className="text-gray-400">GenZ Fitness Intelligence</p>
      </div>

      <div className="glass p-8 rounded-3xl shadow-xl">
        {loginStep === 1 ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mobile Number or Email</label>
              <div className="relative">
                <input
                  type="text"
                  value={userContact}
                  onChange={(e) => setUserContact(e.target.value)}
                  className="input text-lg pl-12"
                  placeholder="9876543210"
                  inputMode="text"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                   {userContact.includes('@') ? <Mail size={20} /> : <Phone size={20} />}
                </div>
              </div>
            </div>
            <Button type="submit" isLoading={isOtpSending}>
              {isOtpSending ? 'Sending OTP...' : 'Send Verification Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enter Verification Code</label>
              <div className="flex justify-between gap-3">
                {[0,1,2,3].map((idx) => (
                  <input
                    key={idx}
                    type="tel"
                    maxLength="1"
                    value={otpInput[idx] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!/^[0-9]*$/.test(val)) return;
                      // Safe OTP update
                      const currentOtp = otpInput || "    ";
                      const newOtpArray = currentOtp.split('');
                      newOtpArray[idx] = val;
                      setOtpInput(newOtpArray.join('').trim());
                      // Auto focus next
                      if (val && e.target.nextElementSibling) e.target.nextElementSibling.focus();
                    }}
                    className="w-14 h-16 glass rounded-2xl text-center text-2xl font-black text-white focus:border-accent-cyan"
                  />
                ))}
              </div>
            </div>
            <Button type="submit" variant="success">Verify & Login</Button>
            <button
              type="button"
              onClick={() => handleLogin({ preventDefault: () => {}, target: { reset: () => {} } }, true)}
              className="w-full text-sm text-gray-500 hover:text-accent-cyan mt-4 transition"
            >
              Resend Code
            </button>
          </form>
        )}
      </div>
    </div>
  </div>
);

export default LoginScreen;
