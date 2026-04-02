import { Bell, Check, BookOpen, Map, Tag, Loader2, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useApi';
import { Notification } from '@/types';

const typeIcons: Record<string, LucideIcon> = { 
  booking: BookOpen, 
  trip: Map, 
  promo: Tag, 
  system: Bell 
};

export default function Notifications() {
  const { data: notificationsRes, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = (notificationsRes?.data || []) as Notification[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Notifications</h2>
          <p className="text-muted-foreground">Stay updated on your bookings, trips, and special offers.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => markAllRead.mutate()} 
          disabled={markAllRead.isPending || notifications.length === 0}
        >
          {markAllRead.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
          Mark All Read
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <div
                key={n.id}
                onClick={() => !n.read && markRead.mutate(n.id)}
                className={`rounded-xl border border-border bg-card p-5 flex items-start gap-4 cursor-pointer transition-all hover:shadow-sm ${
                  !n.read ? 'border-l-4 border-l-primary bg-primary/5' : 'bg-background'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Icon className={`h-5 w-5 ${!n.read ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-medium ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</h3>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                </div>
              </div>
            );
          })}
          {notifications.length === 0 && (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl border-border">
              <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p>No notifications yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

