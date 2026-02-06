"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  notification_type?: string;
  push_type?: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch notifications
    fetchNotifications();

    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications/push?limit=20");
      if (response.ok) {
        const { notifications: data, unreadCount: count } = await response.json();
        setNotifications(data || []);
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const handleMarkAsRead = async (id: string, actionUrl?: string) => {
    try {
      const response = await fetch(`/api/notifications/push/${id}`, {
        method: "PUT",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        if (actionUrl) {
          window.location.href = actionUrl;
        }
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications/push/read-all", {
        method: "PUT",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark notifications as read");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/push/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadCount((prev) =>
          prev > 0 ? prev - 1 : 0
        );
        toast.success("Notification deleted");
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "payment_success":
        return <Icons.Check className="h-5 w-5 text-green-500" />;
      case "event_reminder_24h":
      case "event_reminder_2h":
      case "event_day_reminder":
        return <Icons.Clock className="h-5 w-5 text-yellow-500" />;
      case "registration_milestone":
      case "first_registration":
        return <Icons.Users className="h-5 w-5 text-blue-500" />;
      case "volunteer_application":
        return <Icons.Heart className="h-5 w-5 text-purple-500" />;
      case "sponsor_payment_received":
        return <Icons.DollarSign className="h-5 w-5 text-emerald-500" />;
      default:
        return <Icons.Bell className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-bg-muted rounded-lg transition-colors"
      >
        <Icons.Bell className="h-6 w-6 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-bg-card rounded-xl border border-border-default shadow-lg z-40">
          {/* Header */}
          <div className="sticky top-0 bg-bg-card border-b border-border-default p-4 flex items-center justify-between">
            <h3 className="font-bold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-sm text-primary hover:text-primaryHover font-medium disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <Icons.Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border-default">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-bg-muted transition-colors cursor-pointer ${
                    !notification.is_read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id, notification.action_url);
                    } else if (notification.action_url) {
                      window.location.href = notification.action_url;
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary text-sm">
                        {notification.title}
                      </p>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-text-muted mt-2">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="flex-shrink-0 p-1 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <Icons.X className="h-4 w-4 text-text-muted" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="sticky bottom-0 bg-bg-card border-t border-border-default p-3 text-center">
            <a
              href="/notifications"
              className="text-sm text-primary hover:text-primaryHover font-medium"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
