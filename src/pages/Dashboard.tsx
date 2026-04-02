import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { tripsAPI, notificationsAPI } from '@/services/api';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [trips, setTrips] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [tripsRes, notificationsRes] = await Promise.all([
        tripsAPI.getMyTrips(),
        notificationsAPI.getAll(),
      ]);
      setTrips(tripsRes.data.data || []);
      setNotifications(notificationsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.firstName}!</h1>
        <p className="text-gray-600">Manage your trips and bookings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{trips.length}</CardTitle>
            <CardDescription>Active Trips</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{notifications.length}</CardTitle>
            <CardDescription>Notifications</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{user?.role === 'admin' ? 'Admin' : 'User'}</CardTitle>
            <CardDescription>Account Type</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {trips.length === 0 ? (
            <p className="text-gray-600">No trips yet. Create your first trip!</p>
          ) : (
            <div className="space-y-4">
              {trips.slice(0, 5).map((trip: any) => (
                <div key={trip.id} className="border-b pb-4">
                  <h3 className="font-semibold">{trip.name}</h3>
                  <p className="text-sm text-gray-600">Status: {trip.status}</p>
                </div>
              ))}
            </div>
          )}
          <Button className="mt-4" onClick={() => navigate('/trips')}>
            View All Trips
          </Button>
        </CardContent>
      </Card>

      {user?.role === 'admin' && (
        <Button onClick={() => navigate('/admin')} variant="outline">
          Go to Admin Dashboard
        </Button>
      )}
    </div>
  );
}
