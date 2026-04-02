import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelsApi, destinationsApi, attractionsApi, bookingsApi, tripsApi, notificationsApi, usersApi, analyticsApi, paymentsApi, settingsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Trip, AnalyticsData, ApiResponse } from '@/types';

// ─── Hotels ──────────────────────────────────────────────
export function useHotels(params?: Record<string, string | number | boolean>) {
  return useQuery({ queryKey: ['hotels', params], queryFn: () => hotelsApi.getAll(params).then(r => r.data) });
}
export function useHotel(id: string) {
  return useQuery({ queryKey: ['hotel', id], queryFn: () => hotelsApi.getById(id).then(r => r.data), enabled: !!id });
}
export function useCreateHotel() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, unknown>) => hotelsApi.create(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hotels'] }); toast({ title: 'Hotel created' }); } });
}
export function useUpdateHotel() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => hotelsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hotels'] }); toast({ title: 'Hotel updated' }); } });
}
export function useDeleteHotel() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => hotelsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hotels'] }); toast({ title: 'Hotel deleted' }); } });
}

// ─── Destinations ────────────────────────────────────────
export function useDestinations(params?: Record<string, string | number | boolean>) {
  return useQuery({ queryKey: ['destinations', params], queryFn: () => destinationsApi.getAll(params).then(r => r.data) });
}
export function useDestination(id: string) {
  return useQuery({ queryKey: ['destination', id], queryFn: () => destinationsApi.getById(id).then(r => r.data), enabled: !!id });
}
export function useDestinationBySlug(slug: string) {
  return useQuery({ queryKey: ['destination-slug', slug], queryFn: () => destinationsApi.getBySlug(slug).then(r => r.data), enabled: !!slug });
}
export function useCreateDestination() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, unknown>) => destinationsApi.create(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['destinations'] }); toast({ title: 'Destination created' }); } });
}
export function useUpdateDestination() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => destinationsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['destinations'] }); toast({ title: 'Destination updated' }); } });
}
export function useDeleteDestination() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => destinationsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['destinations'] }); toast({ title: 'Destination deleted' }); } });
}

// ─── Attractions ─────────────────────────────────────────
export function useAttractions(params?: Record<string, string | number | boolean>) {
  return useQuery({ queryKey: ['attractions', params], queryFn: () => attractionsApi.getAll(params).then(r => r.data) });
}
export function useAttraction(id: string) {
  return useQuery({ queryKey: ['attraction', id], queryFn: () => attractionsApi.getById(id).then(r => r.data), enabled: !!id });
}
export function useCreateAttraction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, unknown>) => attractionsApi.create(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['attractions'] }); toast({ title: 'Attraction created' }); } });
}
export function useUpdateAttraction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => attractionsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['attractions'] }); toast({ title: 'Attraction updated' }); } });
}
export function useDeleteAttraction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => attractionsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['attractions'] }); toast({ title: 'Attraction deleted' }); } });
}

// ─── Bookings ────────────────────────────────────────────
export function useMyBookings() {
  return useQuery({ queryKey: ['my-bookings'], queryFn: () => bookingsApi.getMyBookings().then(r => r.data) });
}
export function useAllBookings(params?: Record<string, string | number | boolean>) {
  return useQuery({ queryKey: ['all-bookings', params], queryFn: () => bookingsApi.getAll(params).then(r => r.data) });
}
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, unknown>) => bookingsApi.create(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-bookings'] }); } });
}
export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => bookingsApi.cancel(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-bookings', 'all-bookings'] }); toast({ title: 'Booking cancelled' }); } });
}
export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => bookingsApi.updateStatus(id, status), onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-bookings'] }); toast({ title: 'Booking status updated' }); } });
}

// ─── Trips ───────────────────────────────────────────────
export function useMyTrips() {
  return useQuery({ queryKey: ['my-trips'], queryFn: () => tripsApi.getMyTrips().then(r => r.data) });
}
export function useAllTrips(params?: Record<string, string | number | boolean>) {
  return useQuery({ queryKey: ['all-trips', params], queryFn: () => tripsApi.getAll(params).then(r => r.data) });
}
export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, unknown>) => tripsApi.create(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-trips', 'all-trips'] }); toast({ title: 'Trip created' }); } });
}
export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => tripsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-trips', 'all-trips'] }); toast({ title: 'Trip updated' }); } });
}
export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => tripsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-trips', 'all-trips'] }); toast({ title: 'Trip deleted' }); } });
}
export function useSubmitTrip() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => tripsApi.submit(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-trips', 'all-trips'] }); toast({ title: 'Trip submitted for approval' }); } });
}
export function useApproveTrip() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => tripsApi.approve(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-trips'] }); toast({ title: 'Trip approved' }); } });
}
export function useRejectTrip() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => tripsApi.reject(id, reason), onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-trips'] }); toast({ title: 'Trip rejected' }); } });
}

// ─── Notifications ───────────────────────────────────────
export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.getAll().then(r => r.data), refetchInterval: 60000 });
}
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => notificationsApi.markRead(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
}
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => notificationsApi.markAllRead(), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
}

// ─── Admin Users ─────────────────────────────────────────
export function useUsers(params?: Record<string, string | number | boolean>) {
  return useQuery({ queryKey: ['users', params], queryFn: () => usersApi.getAll(params).then(r => r.data) });
}
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, unknown>) => usersApi.create(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast({ title: 'User created' }); } });
}
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => usersApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast({ title: 'User updated' }); } });
}
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => usersApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast({ title: 'User deleted' }); } });
}

// ─── Analytics ───────────────────────────────────────────
export function useAdminAnalytics() {
  return useQuery<ApiResponse<AnalyticsData>>({ queryKey: ['admin-analytics'], queryFn: () => analyticsApi.getOverview().then(r => r.data) });
}

// ─── Payments ────────────────────────────────────────────
export function useInitializePayment() {
  return useMutation({ mutationFn: (data: Record<string, unknown>) => paymentsApi.initialize(data) });
}
export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { booking_id: string; reference: string }) => paymentsApi.verify(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-bookings'] }); } });
}

// ─── Settings ────────────────────────────────────────────
export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.getAll().then(r => r.data) });
}
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (settings: { key: string; value: unknown }[]) => settingsApi.update(settings), onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast({ title: 'Settings updated' }); } });
}
