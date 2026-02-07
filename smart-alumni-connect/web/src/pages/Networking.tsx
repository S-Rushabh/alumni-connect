import {
    Send, Paperclip,
    Smile,
    Loader2, Lightbulb, Check, Sparkles as SparklesIcon
} from 'lucide-react';

import React, { useState, useEffect, useRef } from 'react';
import { generateIcebreakers } from '../services/geminiService';
import { getAllUsers } from '../services/user';
import {
    getOrCreateChat, sendMessage, sendImageMessage, sendFileMessage,
    subscribeToChat, markAllMessagesAsRead, addMessageReaction,
    setTypingStatus, subscribeToTypingStatus, searchMessages, getRecentConnections
} from '../services/chat';
import {
    sendConnectionRequest,
    acceptConnectionRequest, rejectConnectionRequest,
    subscribeToUserConnections, subscribeToConnectionRequests
} from '../services/connections';
import { subscribeToPresence, setUserOnline, setUserOffline, getLastSeenText } from '../services/presence';
import { uploadChatImage, uploadChatFile, formatFileSize, isImageFile, validateFileSize } from '../services/fileUpload';
import { getNetworkingStats, getConnectionSuggestions } from '../services/networking';
import type { UserProfile, ChatMessage, Connection, UserPresence, NetworkingStats } from '../types';

interface Props {
    currentUser?: UserProfile | null;
    initialUser?: UserProfile | null;
}

const Networking: React.FC<Props> = ({ currentUser, initialUser }) => {
    // User & Connection State
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [connectionRequests, setConnectionRequests] = useState<Connection[]>([]);
    const [connectedUsers, setConnectedUsers] = useState<{ user: UserProfile, lastMessageTime: any }[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userPresence, setUserPresence] = useState<{ [uid: string]: UserPresence }>({});

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [chatId, setChatId] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);

    // UI State
    const [icebreakers, setIcebreakers] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'requests' | 'suggestions' | 'analytics'>('chat');
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const [connectionMessage, setConnectionMessage] = useState('');
    const [selectedUserForConnection, setSelectedUserForConnection] = useState<UserProfile | null>(null);
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showImagePreview, setShowImagePreview] = useState<string | null>(null);

    // Analytics State
    const [stats, setStats] = useState<NetworkingStats | null>(null);
    const [suggestions, setSuggestions] = useState<UserProfile[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Using icons for reactions in UI might be complex if we store them as strings. 
    // For now, let's keep data as emojis but UI as clean as possible.
    const reactions = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

    // Set user online on mount
    useEffect(() => {
        if (currentUser) {
            setUserOnline(currentUser.uid);
            return () => {
                setUserOffline(currentUser.uid);
            };
        }
    }, [currentUser]);

    // Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            const all = await getAllUsers();
            const others = all.filter(u => u.uid !== currentUser?.uid);
            setAllUsers(others);
        };
        if (currentUser) fetchUsers();
    }, [currentUser]);

    // Subscriptions for connections and requests
    useEffect(() => {
        if (!currentUser) return;

        // Subscribe to connections
        const unsubscribeConnections = subscribeToUserConnections(currentUser.uid, (conns: Connection[]) => {
            setConnections(conns);
        });

        // Subscribe to requests
        const unsubscribeRequests = subscribeToConnectionRequests(currentUser.uid, (requests: Connection[]) => {
            setConnectionRequests(requests);
        });

        return () => {
            unsubscribeConnections();
            unsubscribeRequests();
        };
    }, [currentUser]);

    const processedInitialUserRef = useRef<string | null>(null);

    // Load chat partners (recent connections)
    useEffect(() => {
        const loadChatPartners = async () => {
            if (!currentUser) return;

            // Fetch recent chat partners
            let partners = await getRecentConnections(currentUser.uid, 50);

            // Ensure initialUser is in the list from the start if passed
            if (initialUser) {
                const exists = partners.find(p => p.user.uid === initialUser.uid);
                if (!exists) {
                    partners.unshift({ user: initialUser, lastMessageTime: null });
                }
            }

            // Also ensure currently selectedUser is in the list
            if (selectedUser) {
                const exists = partners.find(p => p.user.uid === selectedUser.uid);
                if (!exists) {
                    partners.unshift({ user: selectedUser, lastMessageTime: null });
                }
            }

            // Deduplicate
            partners = partners.filter((item, index, self) =>
                index === self.findIndex((t) => t.user.uid === item.user.uid)
            );

            setConnectedUsers(partners);

            // Auto-select initialUser logic: Only if it's a new initialUser we haven't processed
            if (initialUser && initialUser.uid !== processedInitialUserRef.current) {
                setSelectedUser(initialUser);
                processedInitialUserRef.current = initialUser.uid;
            }
        };

        loadChatPartners();
    }, [currentUser, initialUser, connections.length]); // Removed selectedUser dependency

    // Subscribe to presence for connected users
    useEffect(() => {
        const unsubscribers: (() => void)[] = [];

        connectedUsers.forEach(({ user }) => {
            const unsubscribe = subscribeToPresence(user.uid, (presence) => {
                setUserPresence(prev => ({
                    ...prev,
                    [user.uid]: presence || { uid: user.uid, status: 'offline', lastSeen: new Date() }
                }));
            });
            unsubscribers.push(unsubscribe);
        });

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [connectedUsers]);

    // Setup chat subscription
    useEffect(() => {
        if (!currentUser || !selectedUser) return;

        const setupChat = async () => {
            const createId = await getOrCreateChat(currentUser.uid, selectedUser.uid);
            setChatId(createId);

            // Subscribe to messages
            const unsubscribeMessages = subscribeToChat(createId, (incoming) => {
                setMessages(incoming);
                setFilteredMessages(incoming);

                // Mark messages as read
                markAllMessagesAsRead(createId, currentUser.uid);

                setTimeout(() => {
                    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            });

            // Subscribe to typing status
            const unsubscribeTyping = subscribeToTypingStatus(createId, selectedUser.uid, (typing) => {
                setIsTyping(typing);
            });

            setIcebreakers([]);
            setSearchQuery('');

            return () => {
                unsubscribeMessages();
                unsubscribeTyping();
            };
        };

        const cleanupPromise = setupChat();

        return () => {
            cleanupPromise.then(unsubscribe => unsubscribe && unsubscribe());
        };
    }, [currentUser, selectedUser]);

    // Fetch analytics
    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!currentUser) return;
            const networkingStats = await getNetworkingStats(currentUser.uid);
            setStats(networkingStats);
        };

        if (activeTab === 'analytics' && currentUser) {
            fetchAnalytics();
        }
    }, [activeTab, currentUser]);

    // Fetch suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!currentUser) return;
            const suggested = await getConnectionSuggestions(currentUser.uid, currentUser, allUsers);
            setSuggestions(suggested);
        };

        if (activeTab === 'suggestions' && currentUser) {
            fetchSuggestions();
        }
    }, [activeTab, currentUser, allUsers]);

    // Handle search
    useEffect(() => {
        const performSearch = async () => {
            if (!chatId || !searchQuery.trim()) {
                setFilteredMessages(messages);
                return;
            }

            if (!chatId) return;
            const results = await searchMessages(chatId, searchQuery);
            setFilteredMessages(results);
        };

        performSearch();
    }, [searchQuery, messages, chatId]);

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

            // Clear typing status
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            await setTypingStatus(chatId, currentUser.uid, false);
        } catch (e) {
            console.error("Failed to send", e);
        }
    };

    const handleInputChange = async (value: string) => {
        setInput(value);

        if (!chatId || !currentUser) return;

        // Set typing status
        await setTypingStatus(chatId, currentUser.uid, true);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to clear typing status
        typingTimeoutRef.current = setTimeout(async () => {
            if (chatId && currentUser) {
                await setTypingStatus(chatId, currentUser.uid, false);
            }
        }, 3000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !chatId || !currentUser) return;

        if (!validateFileSize(file)) {
            alert('File size must be less than 10MB');
            return;
        }

        setUploading(true);
        try {
            if (isImageFile(file)) {
                const imageUrl = await uploadChatImage(file, currentUser.uid);
                await sendImageMessage(chatId, currentUser.uid, imageUrl, '');
            } else {
                const fileUrl = await uploadChatFile(file, currentUser.uid);
                await sendFileMessage(chatId, currentUser.uid, fileUrl, file.name, file.size);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleReaction = async (messageId: string, reaction: string) => {
        if (!chatId || !currentUser) return;

        try {
            await addMessageReaction(
                chatId,
                messageId,
                currentUser.uid,
                currentUser.displayName || 'Anonymous', // Fix: Handle null displayName
                reaction
            );
            setShowReactionPicker(null);
        } catch (error) {
            console.error('Failed to add reaction:', error);
        }
    };

    const handleSendConnectionRequest = async (user: UserProfile) => {
        if (!currentUser) return;

        try {
            await sendConnectionRequest(
                currentUser.uid,
                currentUser.displayName || 'Anonymous', // Fix: Handle null
                currentUser.photoURL || undefined, // Fix: Handle null
                currentUser.role,
                currentUser.company,
                user.uid,
                user.displayName || 'Amumni Member', // Fix: Handle null
                user.photoURL || undefined, // Fix: Handle null
                user.role,
                user.company,
                connectionMessage
            );
            alert('Connection request sent!');
            setShowConnectionModal(false);
            setConnectionMessage('');
            setSelectedUserForConnection(null);
        } catch (error: any) {
            alert(error.message || 'Failed to send connection request');
        }
    };

    const handleAcceptRequest = async (connectionId: string, connection: Connection) => {
        try {
            await acceptConnectionRequest(connectionId, connection);
            // Refresh connections
            if (currentUser) {
                // The subscriptions handle updates, no need to manually fetch
            }
        } catch (error) {
            console.error('Failed to accept request:', error);
        }
    };

    const handleRejectRequest = async (connectionId: string) => {
        try {
            await rejectConnectionRequest(connectionId);
            // Refresh requests
            if (currentUser) {
                // The subscriptions handle updates, no need to manually fetch
            }
        } catch (error) {
            console.error('Failed to reject request:', error);
        }
    };


    if (!currentUser) return <div className="p-8 text-center text-slate-500">Please log in to network.</div>;

    return (
        <div className="h-[calc(100vh-160px)] flex flex-col gap-6">
            {/* Header with Tabs */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-slate-900">Networking</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'chat'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                                }`}
                        >
                            💬 Chats
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all relative ${activeTab === 'requests'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                                }`}
                        >
                            🤝 Requests
                            {connectionRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {connectionRequests.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('suggestions')}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'suggestions'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                                }`}
                        >
                            ✨ Suggestions
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'analytics'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                                }`}
                        >
                            📊 Analytics
                        </button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">Connections:</span>
                        <span className="font-bold text-indigo-600">{connections.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">Pending Requests:</span>
                        <span className="font-bold text-orange-600">{connectionRequests.length}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            {activeTab === 'chat' && (
                <div className="flex-1 flex gap-6 min-h-0">
                    {/* Sidebar */}
                    <div className="w-80 hidden lg:flex bg-white rounded-3xl flex-col border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-50">
                            <h2 className="font-bold text-xl text-slate-900">Recent Chats</h2>
                            <p className="text-xs text-slate-500 mt-1">{connectedUsers.length} conversations</p>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {connectedUsers.map(({ user: u, lastMessageTime }) => {
                                const presence = userPresence[u.uid];
                                const isOnline = presence?.status === 'online';

                                return (
                                    <div
                                        key={u.uid}
                                        onClick={() => setSelectedUser(u)}
                                        className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${selectedUser?.uid === u.uid ? 'bg-indigo-50' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="relative">
                                            <img
                                                src={u.photoURL || "https://picsum.photos/seed/user/200/200"}
                                                className="w-12 h-12 rounded-full border border-gray-100"
                                                alt={u.displayName || 'User'}
                                            />
                                            {isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <p className={`font-bold truncate ${selectedUser?.uid === u.uid ? 'text-indigo-600' : 'text-slate-900'
                                                    }`}>
                                                    {u.displayName}
                                                </p>
                                                {lastMessageTime && (
                                                    <span className="text-[10px] text-slate-400">
                                                        {getLastSeenText(lastMessageTime).replace(' ago', '')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate font-medium">
                                                {isOnline ? (
                                                    <span className="text-green-600">● Online</span>
                                                ) : (
                                                    presence?.lastSeen && getLastSeenText(presence.lastSeen)
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            {connectedUsers.length === 0 && (
                                <div className="p-8 text-center text-slate-400">
                                    <p>No recent chats</p>
                                    <p className="text-xs mt-2">Start a conversation from the directory</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    {selectedUser ? (
                        <div className="flex-1 bg-white rounded-3xl flex flex-col border border-gray-100 overflow-hidden shadow-sm">
                            {/* Chat Header */}
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={selectedUser.photoURL || "https://picsum.photos/seed/user/200/200"}
                                            className="w-10 h-10 rounded-full border border-white shadow-sm"
                                            alt={selectedUser.displayName || 'User'}
                                        />
                                        {userPresence[selectedUser.uid]?.status === 'online' && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{selectedUser.displayName}</p>
                                        <p className="text-xs text-slate-500">
                                            {selectedUser.industry} • {selectedUser.location}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search messages..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="hidden md:block px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    <button
                                        onClick={getIcebreakers}
                                        disabled={isGenerating}
                                        className="hidden md:flex text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-bold transition-all items-center gap-2 border border-indigo-100"
                                    >
                                        {isGenerating ? <><Loader2 className="animate-spin" size={14} /> Generating...</> : <><Lightbulb size={14} /> Icebreakers</>}
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-[#fcfdfe]">
                                {filteredMessages.map((m, i) => {
                                    const isMe = m.senderId === currentUser.uid;
                                    const isRead = m.readBy?.includes(selectedUser.uid);

                                    return (
                                        <div key={m.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                            <div className={`max-w-[80%] md:max-w-md ${isMe
                                                ? 'bg-indigo-600 text-white rounded-2xl rounded-br-none'
                                                : 'bg-white border border-gray-100 text-slate-700 rounded-2xl rounded-bl-none'
                                                } shadow-sm overflow-hidden relative group`}>
                                                {/* Message Content */}
                                                {m.type === 'image' && m.imageUrl && (
                                                    <img
                                                        src={m.imageUrl || ''}
                                                        alt="Shared image"
                                                        className="w-full cursor-pointer hover:opacity-90"
                                                        onClick={() => m.imageUrl && setShowImagePreview(m.imageUrl)}
                                                    />
                                                )}
                                                {m.type === 'file' && m.fileUrl && (
                                                    <a
                                                        href={m.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-4 hover:bg-gray-50"
                                                    >
                                                        <div className="text-3xl text-slate-400"><Paperclip size={24} /></div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium truncate">{m.fileName}</p>
                                                            <p className="text-xs opacity-70">{m.fileSize && formatFileSize(m.fileSize)}</p>
                                                        </div>
                                                    </a>
                                                )}
                                                {m.text && (
                                                    <div className="p-4 text-sm leading-relaxed">{m.text}</div>
                                                )}

                                                {/* Reactions */}
                                                {m.reactions && Object.keys(m.reactions).length > 0 && (
                                                    <div className="px-4 pb-2 flex gap-1 flex-wrap">
                                                        {Object.entries(m.reactions).map(([emoji, users]) => (
                                                            <span key={emoji} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                                                {emoji} {users?.length || 0}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Read Receipt */}
                                                {isMe && (
                                                    <div className="px-4 pb-2 text-xs opacity-70 text-right">
                                                        {isRead ? <Check size={14} className="inline ml-1" /> : <div className="w-3 h-3 rounded-full border border-current inline-block ml-1 opacity-50" />}
                                                    </div>
                                                )}

                                                {/* Reaction Button */}
                                                <button
                                                    onClick={() => setShowReactionPicker(showReactionPicker === m.id ? null : m.id!)}
                                                    className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-full p-1 text-xs shadow-lg text-slate-500 hover:text-indigo-600"
                                                >
                                                    <Smile size={14} />
                                                </button>

                                                {/* Reaction Picker */}
                                                {showReactionPicker === m.id && (
                                                    <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 flex gap-1 z-10">
                                                        {reactions.map(reaction => (
                                                            <button
                                                                key={reaction}
                                                                onClick={() => handleReaction(m.id!, reaction)}
                                                                className="hover:bg-gray-100 rounded-lg p-2 text-xl transition-all hover:scale-110"
                                                            >
                                                                {reaction}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-4 shadow-sm">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={scrollRef} />

                                {icebreakers.length > 0 && (
                                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-3 tracking-widest flex items-center gap-2">
                                            <SparklesIcon size={12} /> AI Suggestions
                                        </p>
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
                            <div className="p-6 border-t border-gray-50 flex items-center gap-3 bg-white">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept="image/*,application/pdf,.doc,.docx,.txt"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="p-3 hover:bg-gray-100 rounded-xl transition-all text-slate-400 hover:text-indigo-600"
                                    title="Attach file"
                                >
                                    {uploading ? <Loader2 className="animate-spin" size={20} /> : <Paperclip size={20} />}
                                </button>
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                                        placeholder="Type a message..."
                                        className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-inner text-sm"
                                    />
                                    <button
                                        onClick={() => handleSend(input)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 bg-white rounded-3xl border border-gray-100">
                            <div className="text-center">
                                <p className="text-lg mb-2">Select a connection to start chatting</p>
                                <p className="text-sm">Or send connection requests to expand your network</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Connection Requests Tab */}
            {activeTab === 'requests' && (
                <div className="card-premium p-8 overflow-y-auto flex-1">
                    <h2 className="text-xl font-bold text-oxford mb-6 font-heading">Connection Requests</h2>
                    {connectionRequests.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p>No pending connection requests</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {connectionRequests.map(request => (
                                <div key={request.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all">
                                    <img
                                        src={request.requesterPhoto || "https://picsum.photos/seed/user/200/200"}
                                        className="w-16 h-16 rounded-full border border-gray-200"
                                        alt={request.requesterName}
                                    />
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">{request.requesterName}</p>
                                        <p className="text-sm text-slate-500">{request.requesterRole} @ {request.requesterCompany}</p>
                                        {request.message && (
                                            <p className="text-sm text-slate-600 mt-2 italic">"{request.message}"</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAcceptRequest(request.id!, request)}
                                            className="btn-oxford text-xs"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(request.id!)}
                                            className="px-4 py-2 bg-gray-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
                <div className="card-premium p-8 overflow-y-auto flex-1">
                    <h2 className="text-xl font-bold text-oxford mb-6 font-heading">People You May Know</h2>
                    {suggestions.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p>No suggestions available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suggestions.map(user => (
                                <div key={user.uid} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all">
                                    <img
                                        src={user.photoURL || "https://picsum.photos/seed/user/200/200"}
                                        className="w-16 h-16 rounded-full border border-gray-200"
                                        alt={user.displayName || 'User'}
                                    />
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">{user.displayName}</p>
                                        <p className="text-sm text-slate-500">{user.role} @ {user.company}</p>
                                        <p className="text-xs text-slate-400 mt-1">{user.industry} • {user.location}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedUserForConnection(user);
                                            setShowConnectionModal(true);
                                        }}
                                        className="btn-oxford text-xs"
                                    >
                                        Connect
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && stats && (
                <div className="card-premium p-8 overflow-y-auto flex-1">
                    <h2 className="text-xl font-bold text-oxford mb-6 font-heading">Networking Analytics</h2>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <p className="text-sm text-indigo-600 font-bold mb-1">Total Connections</p>
                            <p className="text-3xl font-bold text-indigo-900">{stats.totalConnections}</p>
                        </div>
                        <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                            <p className="text-sm text-green-600 font-bold mb-1">Messages Sent</p>
                            <p className="text-3xl font-bold text-green-900">{stats.messagesSent}</p>
                        </div>
                        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-sm text-blue-600 font-bold mb-1">Messages Received</p>
                            <p className="text-3xl font-bold text-blue-900">{stats.messagesReceived}</p>
                        </div>
                        <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                            <p className="text-sm text-purple-600 font-bold mb-1">Response Rate</p>
                            <p className="text-3xl font-bold text-purple-900">{stats.responseRate}%</p>
                        </div>
                    </div>

                    {/* Most Active Connections */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Most Active Connections</h3>
                        <div className="space-y-2">
                            {stats.mostActiveConnections.map((conn, i) => (
                                <div key={conn.uid} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                    <span className="text-2xl font-bold text-slate-300">#{i + 1}</span>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">{conn.name}</p>
                                        <p className="text-sm text-slate-500">{conn.messageCount} messages exchanged</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Connection Growth */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Connection Growth (Last 30 Days)</h3>
                        <div className="h-64 flex items-end gap-1">
                            {stats.connectionGrowth.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-indigo-600 rounded-t"
                                        style={{ height: `${Math.max(day.count * 20, 4)}px` }}
                                        title={`${day.date}: ${day.count} connections`}
                                    ></div>
                                    {i % 5 === 0 && (
                                        <span className="text-[8px] text-slate-400 rotate-45 origin-top-left">
                                            {new Date(day.date).getDate()}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Connection Modal */}
            {showConnectionModal && selectedUserForConnection && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConnectionModal(false)}>
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Send Connection Request</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <img
                                src={selectedUserForConnection.photoURL || "https://picsum.photos/seed/user/200/200"}
                                className="w-16 h-16 rounded-full border border-gray-200"
                                alt={selectedUserForConnection.displayName || 'User'}
                            />
                            <div>
                                <p className="font-bold text-slate-900">{selectedUserForConnection.displayName}</p>
                                <p className="text-sm text-slate-500">{selectedUserForConnection.role} @ {selectedUserForConnection.company}</p>
                            </div>
                        </div>
                        <textarea
                            value={connectionMessage}
                            onChange={(e) => setConnectionMessage(e.target.value)}
                            placeholder="Add a personal message (optional)"
                            className="w-full border border-gray-200 rounded-xl p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            rows={4}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => selectedUserForConnection && handleSendConnectionRequest(selectedUserForConnection)}
                                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                            >
                                Send Request
                            </button>
                            <button
                                onClick={() => {
                                    setShowConnectionModal(false);
                                    setConnectionMessage('');
                                    setSelectedUserForConnection(null);
                                }}
                                className="flex-1 bg-gray-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {showImagePreview && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowImagePreview(null)}>
                    <img src={showImagePreview} alt="Preview" className="max-w-full max-h-full rounded-2xl" />
                </div>
            )}
        </div>
    );
};

export default Networking;
