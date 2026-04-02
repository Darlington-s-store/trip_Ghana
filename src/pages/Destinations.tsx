import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { destinationsAPI } from '@/services/api';
import { toast } from 'sonner';

interface Destination {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  image: string;
  region: string;
  featured: boolean;
}

export default function Destinations() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      const response = await destinationsAPI.getAll();
      setDestinations(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load destinations');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = destinations.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Explore Ghana</h1>
        <p className="text-gray-600">Discover amazing destinations</p>
      </div>

      <Input
        placeholder="Search destinations..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <div>Loading destinations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((destination) => (
            <Card
              key={destination.id}
              className="cursor-pointer hover:shadow-lg transition"
              onClick={() => navigate(`/destination/${destination.id}`)}
            >
              <CardContent className="p-0">
                {destination.image && (
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{destination.name}</h3>
                  <p className="text-sm text-gray-600">{destination.region}</p>
                  <p className="text-sm mt-2">{destination.shortDescription}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
