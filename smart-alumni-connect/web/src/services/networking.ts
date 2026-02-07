import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { NetworkingStats, UserProfile } from "../types";
import { getUserConnections } from "./connections";

// Get Networking Statistics for a user
export const getNetworkingStats = async (userId: string): Promise<NetworkingStats> => {
    try {
        // Get total connections
        const connections = await getUserConnections(userId);
        const totalConnections = connections.length;

        // Get messages sent
        const chatsRef = collection(db, 'chats');
        const allChats = await getDocs(chatsRef);

        let messagesSent = 0;
        let messagesReceived = 0;
        const connectionMessageCounts: { [uid: string]: number } = {};

        for (const chatDoc of allChats.docs) {
            const chatId = chatDoc.id;
            if (!chatId.includes(userId)) continue;

            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const messagesSnapshot = await getDocs(messagesRef);

            messagesSnapshot.docs.forEach(msgDoc => {
                const msg = msgDoc.data();
                if (msg.senderId === userId) {
                    messagesSent++;
                } else {
                    messagesReceived++;
                    // Track messages per connection
                    const otherUserId = msg.senderId;
                    connectionMessageCounts[otherUserId] = (connectionMessageCounts[otherUserId] || 0) + 1;
                }
            });
        }

        // Calculate response rate (simplified)
        const responseRate = messagesReceived > 0
            ? Math.round((messagesSent / (messagesSent + messagesReceived)) * 100)
            : 0;

        // Get connection growth (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const connectionGrowth: { date: string; count: number }[] = [];
        const dailyCounts: { [date: string]: number } = {};

        connections.forEach(conn => {
            const createdAt = conn.createdAt?.toDate ? conn.createdAt.toDate() : new Date(conn.createdAt);
            if (createdAt >= thirtyDaysAgo) {
                const dateStr = createdAt.toISOString().split('T')[0];
                dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
            }
        });

        // Fill in missing days with 0
        for (let i = 0; i < 30; i++) {
            const date = new Date(thirtyDaysAgo);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            connectionGrowth.push({
                date: dateStr,
                count: dailyCounts[dateStr] || 0
            });
        }

        // Get most active connections (top 5)
        const mostActiveConnections = Object.entries(connectionMessageCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([uid, count]) => {
                const connection = connections.find(c =>
                    c.requesterId === uid || c.recipientId === uid
                );
                const name = connection?.requesterId === uid
                    ? connection.requesterName
                    : connection?.recipientName || 'Unknown';

                return {
                    uid,
                    name,
                    messageCount: count
                };
            });

        return {
            totalConnections,
            messagesSent,
            messagesReceived,
            responseRate,
            connectionGrowth,
            mostActiveConnections
        };
    } catch (error) {
        console.error("Error getting networking stats:", error);
        return {
            totalConnections: 0,
            messagesSent: 0,
            messagesReceived: 0,
            responseRate: 0,
            connectionGrowth: [],
            mostActiveConnections: []
        };
    }
};

// Get Connection Suggestions (AI-powered)
export const getConnectionSuggestions = async (userId: string, currentUser: UserProfile, allUsers: UserProfile[]): Promise<UserProfile[]> => {
    try {
        // Get existing connections
        const connections = await getUserConnections(userId);
        const connectedUserIds = new Set<string>();

        connections.forEach(conn => {
            if (conn.requesterId === userId) {
                connectedUserIds.add(conn.recipientId);
            } else {
                connectedUserIds.add(conn.requesterId);
            }
        });

        // Filter out self and existing connections
        const potentialConnections = allUsers.filter(user =>
            user.uid !== userId && !connectedUserIds.has(user.uid)
        );

        // Score users based on similarity
        const scoredUsers = potentialConnections.map(user => {
            let score = 0;

            // Same industry: +3 points
            if (user.industry === currentUser.industry) score += 3;

            // Same location: +2 points
            if (user.location === currentUser.location) score += 2;

            // Shared skills: +1 point per skill
            const userSkills = user.skills || [];
            const currentSkills = currentUser.skills || [];
            const sharedSkills = userSkills.filter(skill => currentSkills.includes(skill));
            score += sharedSkills.length;

            // Same graduation year: +1 point
            if (user.graduationYear === currentUser.graduationYear) score += 1;

            // Same role category (e.g., both engineers, both managers): +2 points
            const roleCategories = ['Engineer', 'Manager', 'Designer', 'Analyst', 'Developer'];
            const userRoleCategory = roleCategories.find(cat => user.role?.includes(cat));
            const currentRoleCategory = roleCategories.find(cat => currentUser.role?.includes(cat));
            if (userRoleCategory && userRoleCategory === currentRoleCategory) score += 2;

            return { user, score };
        });

        // Sort by score and return top 10
        return scoredUsers
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(item => item.user);
    } catch (error) {
        console.error("Error getting connection suggestions:", error);
        return [];
    }
};

// Get mutual connections between two users
export const getMutualConnections = async (user1Id: string, user2Id: string): Promise<string[]> => {
    try {
        const [user1Connections, user2Connections] = await Promise.all([
            getUserConnections(user1Id),
            getUserConnections(user2Id)
        ]);

        const user1ConnectedIds = new Set<string>();
        user1Connections.forEach(conn => {
            if (conn.requesterId === user1Id) {
                user1ConnectedIds.add(conn.recipientId);
            } else {
                user1ConnectedIds.add(conn.requesterId);
            }
        });

        const mutualIds: string[] = [];
        user2Connections.forEach(conn => {
            const otherId = conn.requesterId === user2Id ? conn.recipientId : conn.requesterId;
            if (user1ConnectedIds.has(otherId)) {
                mutualIds.push(otherId);
            }
        });

        return mutualIds;
    } catch (error) {
        console.error("Error getting mutual connections:", error);
        return [];
    }
};
