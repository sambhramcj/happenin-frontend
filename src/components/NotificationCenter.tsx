"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  type?: "reminder" | "update" | "message" | "achievement";
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch notifications
    fetchNotifications();

    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.log("Failed to fetch notifications:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      });

      if (response.ok) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.log("Failed to mark notification as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== id));
        setUnreadCount(prev => Math.max(0, prev - (notifications.find(n => n.id === id)?.isRead ? 0 : 1)));
      }
    } catch (error) {
      console.log("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "reminder":
        return <Icons.Bell className="h-5 w-5 text-yellow-500" />;
      case "achievement":
        return <Icons.Award className="h-5 w-5 text-blue-500" />;
      case "update":
        return <Icons.Info className="h-5 w-5 text-purple-500" />;
      case "message":
        return <Icons.Users className="h-5 w-5 text-green-500" />;
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
                onClick={async () => {
                  try {
                    await fetch("/api/notifications/read-all", { method: "PUT" });
                    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                    setUnreadCount(0);
                  } catch (error) {
                    toast.error("Failed to mark all as read");
                  }
                }}
                className="text-sm text-primary hover:text-primaryHover font-medium"
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
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary text-sm">
                        {notification.title}
                      </p>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-text-muted mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
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
