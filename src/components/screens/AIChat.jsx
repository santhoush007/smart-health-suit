import React, { useState } from 'react';
import { MessageSquare, Bot, User } from 'lucide-react';
import { callGeminiAI } from '../../utils/api.js';

const AIChat = ({ sensorData }) => {
  const [messages, setMessages] = useState([
      { id: 1, sender: 'bot', text: 'Hello Alex! I am your Smart Health AI. Ask me about your diet, exercise, or sensor readings.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (e) => {
      e.preventDefault();
      if(!input.trim()) return;

      const userText = input;
      const userMsg = { id: Date.now(), sender: 'user', text: userText };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      const promptContext = `
        You are a Smart Health AI assistant for a Gen Z user named Alex.
        Current Sensor Data: Heart Rate ${sensorData.hr}, SpO2 ${sensorData.spo2}%, Temp ${sensorData.temp}C, Steps ${sensorData.steps}.
        User Question: "${userText}"
        Keep the answer short (under 40 words), helpful, and use 1 emoji.
      `;

      const replyText = await callGeminiAI(promptContext);

      setMessages(prev => [...prev, { id: Date.now()+1, sender: 'bot', text: replyText }]);
      setIsTyping(false);
  };

  return (
      <div className="flex flex-col h-screen pt-6">
          <div className="px-6 mb-4">
               <h1 className="text-3xl font-black text-white">Smart Health <span className="text-accent-pink animate-glow">AI</span></h1>
               <p className="text-gray-400 text-sm mt-1">Your intelligent health companion</p>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((m) => (
                  <div key={m.id} className={`flex items-start gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.sender === 'bot' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-3 flex items-center justify-center flex-shrink-0">
                          <Bot size={16} className="text-white" />
                        </div>
                      )}
                      <div className={`max-w-[75%] p-4 rounded-3xl text-sm shadow-lg ${
                          m.sender === 'user'
                          ? 'bg-gradient-1 text-white rounded-br-md'
                          : 'glass text-gray-100 rounded-bl-md'
                      }`}>
                          {m.text}
                      </div>
                      {m.sender === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-5 flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-white" />
                        </div>
                      )}
                  </div>
              ))}
              {isTyping && (
                <div className="flex justify-start items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-3 flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="glass p-4 rounded-3xl rounded-bl-md flex gap-1">
                    <span className="w-2 h-2 bg-accent-cyan rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-accent-cyan rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                    <span className="w-2 h-2 bg-accent-cyan rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  </div>
                </div>
              )}
          </div>
          <form onSubmit={handleSend} className="p-6 glass m-6 rounded-3xl flex gap-3 shadow-xl">
              <input
                  className="flex-1 input text-base"
                  placeholder="Ask about your health..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
              />
              <button type="submit" disabled={isTyping} className="btn btn-accent p-4 rounded-2xl disabled:opacity-50 hover-scale">
                  <MessageSquare size={20} />
              </button>
          </form>
      </div>
  );
};

export default AIChat;
