// ============================================
// InsuranceIQ — Notification List Page Component
// ============================================
// Full-page notification list with filtering, pagination,
// and batch actions.
//
// Usage:
//   <NotificationList userId={5} />
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const NOTIFICATION_SERVER_URL = 'http://localhost:5001';

export default function NotificationList({ userId }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filterUnread, setFilterUnread] = useState(false);
    const limit = 10;

    // ── Fetch notifications ──
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const url = `${NOTIFICATION_SERVER_URL}/api/notifications/${userId}?page=${page}&limit=${limit}&unread=${filterUnread}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setNotifications(response.data.data.notifications);
                setTotalPages(response.data.data.totalPages);
                setTotal(response.data.data.total);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error.message);
        } finally {
            setLoading(false);
        }
    }, [userId, page, filterUnread]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // ── Mark as read ──
    const handleMarkRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${NOTIFICATION_SERVER_URL}/api/notifications/read/${notificationId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications((prev) =>
                prev.map((n) =>
                    n.notificationId === notificationId ? { ...n, isRead: true } : n
                )
            );
        } catch (error) {
            console.error('Failed to mark as read:', error.message);
        }
    };

    // ── Mark all as read ──
    const handleMarkAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${NOTIFICATION_SERVER_URL}/api/notifications/read-all/${userId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error.message);
        }
    };

    // ── Delete notification ──
    const handleDelete = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${NOTIFICATION_SERVER_URL}/api/notifications/${notificationId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
            setTotal((prev) => prev - 1);
        } catch (error) {
            console.error('Failed to delete notification:', error.message);
        }
    };

    // ── Event type badge ──
    const getEventBadge = (eventType) => {
        const badges = {
            CLAIM_FILED: { label: 'Claim Filed', color: '#3b82f6' },
            CLAIM_STATUS_UPDATED: { label: 'Status Update', color: '#22c55e' },
            FRAUD_ALERT: { label: 'Fraud Alert', color: '#ef4444' },
            POLICY_RENEWAL_DUE: { label: 'Renewal Due', color: '#f59e0b' },
            PREMIUM_PAYMENT_RECEIVED: { label: 'Payment', color: '#10b981' },
            CLAIM_SETTLED: { label: 'Settled', color: '#8b5cf6' },
            TEST: { label: 'Test', color: '#6b7280' },
        };
        return badges[eventType] || { label: eventType, color: '#6b7280' };
    };

    // ── Format date ──
    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    // ── Styles ──
    const styles = {
        container: {
            maxWidth: '800px',
            margin: '0 auto',
            padding: '30px 20px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
        },
        title: {
            fontSize: '24px',
            fontWeight: '700',
            color: '#f1f5f9',
            margin: 0,
        },
        actions: {
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
        },
        filterBtn: {
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #475569',
            background: filterUnread ? '#6366f1' : 'transparent',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
        },
        markAllBtn: {
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#334155',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
        },
        card: {
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            transition: 'border-color 0.2s',
        },
        unreadCard: {
            borderLeft: '3px solid #6366f1',
            background: 'rgba(99, 102, 241, 0.05)',
        },
        badge: (color) => ({
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '600',
            color: 'white',
            background: color,
        }),
        notifTitle: {
            fontSize: '15px',
            fontWeight: '600',
            color: '#f1f5f9',
            margin: '0 0 4px 0',
        },
        notifMessage: {
            fontSize: '13px',
            color: '#94a3b8',
            margin: '0 0 8px 0',
            lineHeight: '1.5',
        },
        meta: {
            fontSize: '12px',
            color: '#475569',
        },
        deleteBtn: {
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '13px',
        },
        pagination: {
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '24px',
        },
        pageBtn: (active) => ({
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #475569',
            background: active ? '#6366f1' : 'transparent',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '13px',
        }),
        loading: {
            textAlign: 'center',
            color: '#94a3b8',
            padding: '40px',
            fontSize: '14px',
        },
        empty: {
            textAlign: 'center',
            color: '#475569',
            padding: '60px 20px',
            fontSize: '16px',
        },
        totalCount: {
            color: '#64748b',
            fontSize: '14px',
        },
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>🔔 Notifications</h2>
                    <span style={styles.totalCount}>{total} notification(s)</span>
                </div>
                <div style={styles.actions}>
                    <button
                        style={styles.filterBtn}
                        onClick={() => { setFilterUnread(!filterUnread); setPage(1); }}
                    >
                        {filterUnread ? '✓ Unread Only' : 'Show Unread Only'}
                    </button>
                    <button style={styles.markAllBtn} onClick={handleMarkAllRead}>
                        Mark All Read
                    </button>
                </div>
            </div>

            {/* Notification List */}
            {loading ? (
                <div style={styles.loading}>Loading notifications...</div>
            ) : notifications.length === 0 ? (
                <div style={styles.empty}>
                    <p>📭 No notifications found</p>
                </div>
            ) : (
                notifications.map((notification, index) => {
                    const badge = getEventBadge(notification.eventType);
                    return (
                        <div
                            key={notification.notificationId || index}
                            style={{
                                ...styles.card,
                                ...(!notification.isRead ? styles.unreadCard : {}),
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={styles.badge(badge.color)}>{badge.label}</span>
                                </div>
                                <p style={styles.notifTitle}>{notification.title}</p>
                                <p style={styles.notifMessage}>{notification.message}</p>
                                <span style={styles.meta}>{formatDate(notification.timestamp)}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {!notification.isRead && (
                                    <button
                                        style={styles.deleteBtn}
                                        onClick={() => handleMarkRead(notification.notificationId)}
                                        title="Mark as read"
                                    >
                                        ✓
                                    </button>
                                )}
                                <button
                                    style={styles.deleteBtn}
                                    onClick={() => handleDelete(notification.notificationId)}
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    );
                })
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={styles.pagination}>
                    <button
                        style={styles.pageBtn(false)}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            style={styles.pageBtn(p === page)}
                            onClick={() => setPage(p)}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        style={styles.pageBtn(false)}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
