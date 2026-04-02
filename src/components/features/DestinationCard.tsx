import { Link } from 'react-router-dom';
import { MapPin, Building, Landmark } from 'lucide-react';
import type { Destination } from '@/types';

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link to={`/destinations/${destination.slug}`} className="group block rounded-xl overflow-hidden relative h-72">
      <img src={destination.image} alt={destination.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-1 text-primary-foreground/80 text-xs mb-1">
          <MapPin className="h-3 w-3" />
          <span>{destination.region}</span>
        </div>
        <h3 className="font-heading font-bold text-xl text-primary-foreground mb-2">{destination.name}</h3>
        <p className="text-sm text-primary-foreground/70 line-clamp-2 mb-3">{destination.shortDescription}</p>
        <div className="flex items-center gap-4 text-xs text-primary-foreground/60">
          <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {destination.hotels} Hotels</span>
          <span className="flex items-center gap-1"><Landmark className="h-3 w-3" /> {destination.attractions} Attractions</span>
        </div>
      </div>
    </Link>
  );
}
