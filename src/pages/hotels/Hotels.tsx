import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { HotelCard } from '@/components/features/HotelCard';
import { useHotels } from '@/hooks/useApi';
import { Input } from '@/components/ui/input';

const COMMON_LOCATIONS = ['all', 'Accra', 'Kumasi', 'Cape Coast', 'Takoradi', 'Tamale', 'Akosombo'];

export default function Hotels() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');

  const { data: hotels, isLoading } = useHotels({
    search: search.length > 2 ? search : undefined,
    location: location === 'all' ? undefined : location
  });

  const filtered = hotels || [];

  return (
    <div>
      <section className="bg-gradient-hero text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">Hotels</h1>
          <p className="text-lg text-primary-foreground/70 max-w-lg mx-auto">
            Find the perfect stay across Ghana — from luxury resorts to boutique guesthouses.
          </p>
        </div>
      </section>

      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search hotels..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10" 
            />
          </div>
          <div className="flex gap-2 flex-wrap justify-center md:justify-start">
            {COMMON_LOCATIONS.map(l => (
              <button 
                key={l} 
                onClick={() => setLocation(l)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  location === l ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {l === 'all' ? 'All Locations' : l}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 min-h-[400px]">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map(hotel => <HotelCard key={hotel.id} hotel={hotel} />)}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">No hotels found matching your search.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

