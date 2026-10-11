import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  RefreshCw,
  ExternalLink,
  Briefcase,
  Terminal,
  Clock,
  Building2,
  ShieldCheck,
  Award,
  AlertCircle,
} from 'lucide-react';
import { notificationsApi } from '../services/api';
import type { InAppNotification } from '../types/worksim';
import { Pagination } from '../components/common';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, [activeTab, categoryFilter, page]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setFeedback(null);

      const [pagedRes, countRes] = await Promise.all([
        notificationsApi.getPagedNotifications({
          page,
          pageSize: 15,
          unreadOnly: activeTab === 'unread' ? true : undefined,
          type: categoryFilter || undefined,
        }),
        notificationsApi.getUnreadCount(),
      ]);

      setNotifications(pagedRes.items);
      setTotalPages(pagedRes.totalPages);
      setTotalCount(pagedRes.totalCount);
      setUnreadCount(countRes.unreadCount);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to load notifications. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, actionUrl?: string | null) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, readAtUtc: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }

    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAtUtc: new Date().toISOString() }))
      );
      setUnreadCount(0);
      setFeedback({ type: 'success', text: 'All notifications marked as read.' });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to mark all as read.' });
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('Application') || type.includes('CandidateApplied')) {
      return <Briefcase size={20} className="text-primary" />;
    }
    if (type.includes('AssessmentDeadline') || type.includes('Reminder')) {
      return <Clock size={20} className="text-amber" />;
    }
    if (type.includes('AssessmentCompleted')) {
      return <Award size={20} className="text-emerald" />;
    }
    if (type.includes('Assessment')) {
      return <Terminal size={20} className="text-primary" />;
    }
    if (type.includes('Company')) {
      return <Building2 size={20} className="text-warning" />;
    }
    return <ShieldCheck size={20} className="text-primary" />;
  };

  return (
    <div className="portal-container">
      <motion.div
        className="portal-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="page-header flex-between">
          <div>
            <div className="flex-align-gap">
              <Bell size={28} className="text-primary" />
              <h1>Notification Center</h1>
              {unreadCount > 0 && (
                <span className="badge badge-purple" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p>Review recruitment updates, candidate applications, assessment results, and operational alerts</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={loadNotifications}
              className="btn btn-outline btn-sm"
              disabled={isLoading}
              title="Refresh notifications"
            >
              <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
              <span>Refresh</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="btn btn-primary btn-sm"
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                <span>Mark All as Read</span>
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div className={`alert alert-${feedback.type}`}>
            <AlertCircle size={18} />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="admin-toolbar">
          <div className="filter-group">
            <button
              className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveTab('all'); setPage(1); }}
            >
              All Notifications
            </button>
            <button
              className={`filter-btn ${activeTab === 'unread' ? 'active' : ''}`}
              onClick={() => { setActiveTab('unread'); setPage(1); }}
            >
              Unread Only {unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
          </div>

          <div className="admin-toolbar-inputs" style={{ justifyContent: 'flex-end' }}>
            <select
              className="select-standard"
              style={{ width: '220px' }}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              <option value="ApplicationSubmitted">Application Submissions</option>
              <option value="ApplicationStageChanged">Application Stage Updates</option>
              <option value="CandidateApplied">Candidate Applications</option>
              <option value="AssessmentInvitationCreated">Assessment Invitations</option>
              <option value="AssessmentCompleted">Assessment Results</option>
              <option value="AssessmentDeadlineReminder">Assessment Reminders</option>
              <option value="CompanyStatusChanged">Company Review Updates</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 0.75rem' }} />
            Loading your notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={40} className="text-muted" />
            <h3>No Notifications Found</h3>
            <p>
              {activeTab === 'unread'
                ? "You're completely caught up! No unread notifications."
                : 'There are no notification events matching the selected filter.'}
            </p>
          </div>
        ) : (
          <>
            <div className="notification-card-list">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-full-card ${!n.isRead ? 'unread' : ''}`}
                >
                  <div
                    className="notification-item-icon"
                    style={{
                      width: 42,
                      height: 42,
                      background: n.isRead ? 'var(--bg-surface-elevated)' : '#e0f2fe',
                    }}
                  >
                    {getNotificationIcon(n.notificationType)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex-between">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {!n.isRead && <span className="unread-dot" />}
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {n.title}
                        </h3>
                      </div>
                      <span className="text-xs text-muted">
                        {new Date(n.createdAtUtc).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                      {n.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                      <span className="badge badge-outline text-xs">
                        {n.notificationType.replace(/([A-Z])/g, ' $1').trim()}
                      </span>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="btn btn-outline btn-sm"
                            title="Mark as read"
                          >
                            <Check size={13} />
                            <span>Mark as read</span>
                          </button>
                        )}

                        {n.actionUrl && (
                          <button
                            onClick={() => handleMarkAsRead(n.id, n.actionUrl)}
                            className="btn btn-primary btn-sm"
                            title="Open related portal page"
                          >
                            <span>Open Details</span>
                            <ExternalLink size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={15}
              onPageChange={setPage}
              style={{ marginTop: '1.5rem', borderRadius: 'var(--radius-md)' }}
            />
          </>
        )}
      </motion.div>
    </div>
  );
};
