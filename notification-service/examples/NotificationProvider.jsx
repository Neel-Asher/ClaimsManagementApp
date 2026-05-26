// ============================================
// InsuranceIQ — React Notification Provider
// ============================================
// This component provides Socket.IO connection context
// and notification state to the entire React app.
//
// Usage:
//   Wrap your App with <NotificationProvider>
//   Then use useNotifications() hook in any child component
// ============================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const NotificationContext = createContext(null);

const NOTIFICATION_SERVER_URL = 'http://localhost:5001';

export function NotificationProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    // ── Connect to Socket.IO when user is logged in ──
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const newSocket = io(NOTIFICATION_SERVER_URL, {
            auth: { token },
        });

        newSocket.on('connect', () => {
            console.log('[SOCKET] 🟢 Connected to notification service');
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log(`[SOCKET] 🔴 Disconnected: ${reason}`);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('[SOCKET] ❌ Connection error:', err.message);
            setIsConnected(false);
        });

        // Listen for real-time notifications
        newSocket.on('notification', (data) => {
            console.log('[SOCKET] 📨 New notification:', data);

            setNotifications((prev) => [data, ...prev]);
            setUnreadCount((prev) => prev + 1);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            newSocket.disconnect();
        };
    }, []);

    // ── Fetch existing notifications from REST API ──
    const fetchNotifications = useCallback(async (userId, page = 1, limit = 20) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${NOTIFICATION_SERVER_URL}/api/notifications/${userId}?page=${page}&limit=${limit}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (response.data.success) {
                setNotifications(response.data.data.notifications);
                // Count unread
                const unread = response.data.data.notifications.filter((n) => !n.isRead).length;
                setUnreadCount(unread);
            }
            return response.data;
        } catch (error) {
            console.error('[API] Failed to fetch notifications:', error.message);
            return null;
        }
    }, []);

    // ── Mark single notification as read ──
    const markAsRead = useCallback(async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${NOTIFICATION_SERVER_URL}/api/notifications/read/${notificationId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setNotifications((prev) =>
                prev.map((n) =>
                    n.notificationId === notificationId ? { ...n, isRead: true } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('[API] Failed to mark as read:', error.message);
        }
    }, []);

    // ── Mark all notifications as read ──
    const markAllAsRead = useCallback(async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${NOTIFICATION_SERVER_URL}/api/notifications/read-all/${userId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('[API] Failed to mark all as read:', error.message);
        }
    }, []);

    const value = {
        socket,
        notifications,
        unreadCount,
        isConnected,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

// ── Custom Hook ──
export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

// ============================================
// Usage in App.jsx:
// ============================================
//
// import { NotificationProvider } from './NotificationProvider';
//
// function App() {
//     return (
//         <NotificationProvider>
//             <YourAppComponents />
//         </NotificationProvider>
//     );
// }
