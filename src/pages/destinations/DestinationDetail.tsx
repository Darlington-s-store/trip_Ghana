import { useParams, Link } from 'react-router-dom';
import { MapPin, Building, Landmark, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HotelCard } from '@/components/features/HotelCard';
import { AttractionCard } from '@/components/features/AttractionCard';
import { useDestinationBySlug, useHotels, useAttractions } from '@/hooks/useApi';

export default function DestinationDetail() {
  const { slug } = useParams();
  const { data: destination, isLoading: loadingDest } = useDestinationBySlug(slug || '');

  const { data: hotels, isLoading: loadingHotels } = useHotels(
    destination?.id ? { destinationId: destination.id } : {}
  );
  const { data: attractions, isLoading: loadingAttractions } = useAttractions(
    destination?.id ? { destinationId: destination.id } : {}
  );

  if (loadingDest) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!destination) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-heading font-bold text-2xl text-foreground mb-4">Destination not found</h1>
        <Link to="/destinations"><Button>Back to Destinations</Button></Link>
      </div>
    );
  }

  const destHotels = hotels || [];
  const destAttractions = attractions || [];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] bg-muted">
        <img src={destination.image} alt={destination.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Link to="/destinations" className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Destinations
            </Link>
            <h1 className="font-heading font-bold text-4xl md:text-5xl text-primary-foreground mb-2">{destination.name}</h1>
            <div className="flex items-center gap-4 text-primary-foreground/70">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {destination.region}</span>
              <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {destination.hotelCount || 0} Hotels</span>
              <span className="flex items-center gap-1"><Landmark className="h-4 w-4" /> {destination.attractionCount || 0} Attractions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="font-heading font-bold text-2xl text-foreground mb-4">About {destination.name}</h2>
            <p className="text-muted-foreground leading-relaxed">{destination.description}</p>
          </div>
        </div>
      </section>

      {/* Hotels */}
      {(loadingHotels || destHotels.length > 0) && (
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="font-heading font-bold text-2xl text-foreground mb-6">Hotels in {destination.name}</h2>
            {loadingHotels ? (
              <div className="flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {destHotels.map(h => <HotelCard key={h.id} hotel={h} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Attractions */}
      {(loadingAttractions || destAttractions.length > 0) && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="font-heading font-bold text-2xl text-foreground mb-6">Attractions in {destination.name}</h2>
            {loadingAttractions ? (
              <div className="flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {destAttractions.map(a => <AttractionCard key={a.id} attraction={a} />)}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

