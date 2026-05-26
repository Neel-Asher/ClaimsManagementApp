// ============================================
// InsuranceIQ — Notification Bell Component
// ============================================
// Shows a bell icon with unread notification badge.
// Clicking opens/closes the notification dropdown.
//
// Usage:
//   <NotificationBell userId={5} />
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from './NotificationProvider';
import './NotificationBell.css';

export default function NotificationBell({ userId }) {
    const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, isConnected } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch notifications on mount
    useEffect(() => {
        if (userId) {
            fetchNotifications(userId);
        }
    }, [userId, fetchNotifications]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification.notificationId);
        }
    };

    const handleMarkAllRead = () => {
        markAllAsRead(userId);
    };

    // Format timestamp for display
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    // Get icon based on event type
    const getEventIcon = (eventType) => {
        switch (eventType) {
            case 'CLAIM_FILED': return '📋';
            case 'CLAIM_STATUS_UPDATED': return '✅';
            case 'FRAUD_ALERT': return '🚨';
            case 'POLICY_RENEWAL_DUE': return '🔔';
            case 'PREMIUM_PAYMENT_RECEIVED': return '💰';
            case 'CLAIM_SETTLED': return '🏦';
            default: return '📨';
        }
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            {/* Bell Button */}
            <button className="bell-button" onClick={handleBellClick}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
                <span className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <h4>Notifications</h4>
                        {unreadCount > 0 && (
                            <button className="mark-all-btn" onClick={handleMarkAllRead}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="dropdown-body">
                        {notifications.length === 0 ? (
                            <div className="empty-state">
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification, index) => (
                                <div
                                    key={notification.notificationId || index}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <span className="event-icon">{getEventIcon(notification.eventType)}</span>
                                    <div className="notification-content">
                                        <p className="notification-title">{notification.title}</p>
                                        <p className="notification-message">{notification.message}</p>
                                        <span className="notification-time">{formatTime(notification.timestamp)}</span>
                                    </div>
                                    {!notification.isRead && <span className="unread-dot"></span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
