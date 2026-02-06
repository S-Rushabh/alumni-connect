
import React, { useState, useEffect } from 'react';
import { generateIcebreakers } from '../services/geminiService';
import { MOCK_ALUMNI } from '../constants';
import { Alum } from '../types';

interface Message {
  role: string;
  text?: string;
  type: 'text';
}

interface Props {
  initialAlum?: Alum;
}

const Networking: React.FC<Props> = ({ initialAlum }) => {
  const [selectedChat, setSelectedChat] = useState<Alum>(initialAlum || MOCK_ALUMNI[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialAlum) setSelectedChat(initialAlum);
  }, [initialAlum]);

  useEffect(() => {
    setMessages([
      { role: 'other', text: `Hey Alex! Saw your profile. I noticed we're both interested in ${selectedChat.industry}.`, type: 'text' },
      { role: 'user', text: `Hi ${selectedChat.name.split(' ')[0]}, thanks for reaching out!`, type: 'text' }
    ]);
    setIcebreakers([]);
  }, [selectedChat]);

  const getIcebreakers = async () => {
    setIsGenerating(true);
    const ideas = await generateIcebreakers(selectedChat.name, selectedChat.bio);
    setIcebreakers(ideas);
    setIsGenerating(false);
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const newMessage: Message = { role: 'user', text, type: 'text' };
    
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    
    setTimeout(() => {
      const reply = "That sounds fascinating! Tell me more about your recent project.";
      setMessages(prev => [...prev, { role: 'other', text: reply, type: 'text' }]);
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-160px)] flex gap-6">
      {/* Sidebar Chat List */}
      <div className="w-80 hidden lg:flex bg-white rounded-3xl flex-col border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50">
          <h2 className="font-bold text-xl text-slate-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {MOCK_ALUMNI.map(alum => (
            <div 
              key={alum.id}
              onClick={() => setSelectedChat(alum)}
              className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${selectedChat.id === alum.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
            >
              <img src={alum.avatar} className="w-12 h-12 rounded-full border border-gray-100" />
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate ${selectedChat.id === alum.id ? 'text-indigo-600' : 'text-slate-900'}`}>{alum.name}</p>
                <p className="text-xs text-slate-500 truncate font-medium">{alum.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-3xl flex flex-col border border-gray-100 overflow-hidden shadow-sm relative">
        {/* Chat Header */}
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div className="flex items-center gap-4">
            <img src={selectedChat.avatar} className="w-10 h-10 rounded-full border border-white shadow-sm" />
            <div>
              <p className="font-bold text-slate-900">{selectedChat.name}</p>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Active Now</span>
            </div>
          </div>
          <button 
            onClick={getIcebreakers}
            disabled={isGenerating}
            className="hidden md:flex text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-bold transition-all items-center gap-2 border border-indigo-100"
          >
            {isGenerating ? '⏳ Thinking...' : '💡 Icebreakers'}
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-[#fcfdfe]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[80%] md:max-w-md ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-br-none' 
                  : 'bg-white border border-gray-100 text-slate-700 rounded-2xl rounded-bl-none'
              } shadow-sm overflow-hidden`}>
                <div className="p-4 text-sm leading-relaxed">{m.text}</div>
              </div>
            </div>
          ))}
          
          {icebreakers.length > 0 && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <p className="text-[10px] font-bold text-indigo-400 uppercase mb-3 tracking-widest">AI Suggestions</p>
              <div className="flex flex-col gap-2">
                {icebreakers.map((ib, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSend(ib)}
                    className="text-left bg-white border border-indigo-100 p-3 rounded-xl text-xs text-indigo-600 hover:bg-indigo-50 transition-all font-medium shadow-sm"
                  >
                    {ib}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-50 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Type a message..."
              className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-inner"
            />
            <button 
              onClick={() => handleSend(input)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700 transition-all"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Networking;
