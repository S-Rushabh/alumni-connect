
import React, { useState, useEffect, useRef } from 'react';
import { generateIcebreakers } from '../services/geminiService';
import { getAllUsers } from '../services/user';
import { getOrCreateChat, sendMessage, subscribeToChat } from '../services/chat';
import type { UserProfile, ChatMessage } from '../types';

interface Props {
    currentUser?: UserProfile | null;
}

const Networking: React.FC<Props> = ({ currentUser }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [icebreakers, setIcebreakers] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const [chatId, setChatId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Directory for Sidebar
    useEffect(() => {
        const fetchUsers = async () => {
            const all = await getAllUsers();
            // Filter out self
            const others = all.filter(u => u.uid !== currentUser?.uid);
            setUsers(others);
            if (others.length > 0 && !selectedUser) {
                setSelectedUser(others[0]);
            }
        };
        if (currentUser) fetchUsers();
    }, [currentUser]);

    // 2. Setup Chat Subscription when selected user changes
    useEffect(() => {
        if (!currentUser || !selectedUser) return;

        const setupChat = async () => {
            const createId = await getOrCreateChat(currentUser.uid, selectedUser.uid);
            setChatId(createId);

            // Subscribe
            const unsubscribe = subscribeToChat(createId, (incoming) => {
                setMessages(incoming);
                // Scroll to bottom
                setTimeout(() => {
                    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            });

            // Clear icebreakers when switching chats
            setIcebreakers([]);

            return () => unsubscribe();
        };

        const cleanupPromise = setupChat();

        // Cleanup function for useEffect
        return () => {
            cleanupPromise.then(unsubscribe => unsubscribe && unsubscribe());
        };
    }, [currentUser, selectedUser]);

    const getIcebreakers = async () => {
        if (!selectedUser) return;
        setIsGenerating(true);
        const ideas = await generateIcebreakers(selectedUser.displayName || 'Alum', selectedUser.bio || '');
        setIcebreakers(ideas || []);
        setIsGenerating(false);
    };

    const handleSend = async (text: string) => {
        if (!text.trim() || !chatId || !currentUser) return;

        try {
            await sendMessage(chatId, currentUser.uid, text);
            setInput('');

            // Optimistic update not strictly needed as snapshot is fast, but good for UX if slow net
            // setMessages(prev => [...prev, { senderId: currentUser.uid, text, timestamp: new Date() }]);
        } catch (e) {
            console.error("Failed to send", e);
        }
    };

    if (!currentUser) return <div>Please log in to network.</div>;

    return (
        <div className="h-[calc(100vh-160px)] flex gap-6">
            {/* Sidebar Chat List (Directory View for MVP) */}
            <div className="w-80 hidden lg:flex bg-white rounded-3xl flex-col border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50">
                    <h2 className="font-bold text-xl text-slate-900">Connections</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {users.map(u => (
                        <div
                            key={u.uid}
                            onClick={() => setSelectedUser(u)}
                            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${selectedUser?.uid === u.uid ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                        >
                            <img src={u.photoURL || "https://picsum.photos/seed/user/200/200"} className="w-12 h-12 rounded-full border border-gray-100" />
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold truncate ${selectedUser?.uid === u.uid ? 'text-indigo-600' : 'text-slate-900'}`}>{u.displayName}</p>
                                <p className="text-xs text-slate-500 truncate font-medium">{u.role} @ {u.company}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            {selectedUser ? (
                <div className="flex-1 bg-white rounded-3xl flex flex-col border border-gray-100 overflow-hidden shadow-sm relative">
                    {/* Chat Header */}
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                        <div className="flex items-center gap-4">
                            <img src={selectedUser.photoURL || "https://picsum.photos/seed/user/200/200"} className="w-10 h-10 rounded-full border border-white shadow-sm" />
                            <div>
                                <p className="font-bold text-slate-900">{selectedUser.displayName}</p>
                                <p className="text-xs text-slate-500">{selectedUser.industry} • {selectedUser.location}</p>
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
                        {messages.map((m, i) => {
                            const isMe = m.senderId === currentUser.uid;
                            return (
                                <div key={m.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                    <div className={`max-w-[80%] md:max-w-md ${isMe
                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-none'
                                        : 'bg-white border border-gray-100 text-slate-700 rounded-2xl rounded-bl-none'
                                        } shadow-sm overflow-hidden`}>
                                        <div className="p-4 text-sm leading-relaxed">{m.text}</div>
                                    </div>
                                </div>
                            );
                        })}

                        <div ref={scrollRef} />

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
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    Select a connection to start chatting
                </div>
            )}
        </div>
    );
};

export default Networking;
