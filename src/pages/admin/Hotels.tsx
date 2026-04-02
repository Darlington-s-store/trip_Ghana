import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import axios from 'axios';

const hotelSchema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
  location: z.string().min(1, 'Location required'),
  destination_id: z.string().min(1, 'Destination required'),
  price_per_night: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('GHS'),
  amenities: z.array(z.string()).optional(),
});

type HotelFormData = z.infer<typeof hotelSchema>;

const API_BASE = 'http://localhost:5000/api';

export default function HotelsAdmin() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const token = localStorage.getItem('accessToken');

  // Fetch hotels
  const { data: hotelsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/admin/hotels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Create/Update hotel mutation
  const mutation = useMutation({
    mutationFn: async (data: HotelFormData) => {
      if (editingId) {
        return axios.put(`${API_BASE}/admin/hotels/${editingId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        return axios.post(`${API_BASE}/admin/hotels`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      toast.success(editingId ? 'Hotel updated' : 'Hotel created');
      refetch();
      setIsOpen(false);
      form.reset();
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Operation failed');
    },
  });

  // Delete hotel mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.delete(`${API_BASE}/admin/hotels/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      toast.success('Hotel deleted');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Delete failed');
    },
  });

  const form = useForm<HotelFormData>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      currency: 'GHS',
      amenities: [],
    },
  });

  const onSubmit = (data: HotelFormData) => {
    mutation.mutate(data);
  };

  const handleEdit = (hotel: any) => {
    form.reset(hotel);
    setEditingId(hotel.id);
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this hotel?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewHotel = () => {
    form.reset();
    setEditingId(null);
    setIsOpen(true);
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Hotels Management</h1>
        <Button onClick={handleNewHotel} className="bg-blue-600 hover:bg-blue-700">
          + New Hotel
        </Button>
      </div>

      {/* Hotels Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Rating</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hotelsData?.data?.map((hotel: any) => (
              <tr key={hotel.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{hotel.name}</td>
                <td className="px-6 py-3">{hotel.location}</td>
                <td className="px-6 py-3">
                  {hotel.price_per_night} {hotel.currency}
                </td>
                <td className="px-6 py-3">⭐ {hotel.rating || 'N/A'}</td>
                <td className="px-6 py-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(hotel)}
                    className="text-blue-600"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(hotel.id)}
                    className="text-red-600"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Hotel' : 'Create New Hotel'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hotel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Hotel name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, address" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_per_night"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per Night</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Hotel description"
                        {...field}
                        className="w-full border rounded px-3 py-2"
                        rows={4}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : 'Save Hotel'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
