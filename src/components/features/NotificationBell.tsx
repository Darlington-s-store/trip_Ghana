import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useApi';
import { Notification } from '@/types';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notificationsRes, isLoading } = useNotifications();
  
  const notifications = (notificationsRes?.data || []) as Notification[];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden transform-origin-top-right">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="font-heading font-semibold text-sm text-card-foreground">Notifications</h3>
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {notifications.length} Total
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border scrollbar-thin">
              {isLoading ? (
                <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : (
                notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 transition-colors hover:bg-muted/30 ${!n.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                      <p className="text-sm font-semibold text-card-foreground line-clamp-1">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-muted-foreground italic text-sm">
                    No new notifications.
                  </div>
                )
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-3 border-t border-border text-center bg-muted/10">
                <a href="/dashboard/notifications" className="text-xs text-primary font-medium hover:underline" onClick={() => setIsOpen(false)}>
                  View all notifications
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

