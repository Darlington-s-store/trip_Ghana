import { Link } from 'react-router-dom';
import { Star, MapPin, Clock } from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';
import type { Attraction } from '@/types';

export function AttractionCard({ attraction }: { attraction: Attraction }) {
  const { format, convert, currency } = useCurrencyStore();
  const displayFee = attraction.currency === currency ? attraction.entryFee : convert(attraction.entryFee, attraction.currency, currency);

  return (
    <Link to={`/attractions/${attraction.id}`} className="group block rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all">
      <div className="relative h-48 overflow-hidden bg-muted">
        <img src={attraction.image} alt={attraction.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">{attraction.category}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <MapPin className="h-3 w-3" /> {attraction.location}
        </div>
        <h3 className="font-heading font-semibold text-card-foreground group-hover:text-primary transition-colors">{attraction.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{attraction.description}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-accent text-accent" /> {attraction.rating}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {attraction.openingHours}
            </span>
          </div>
          <p className="font-heading font-bold text-primary text-sm">{format(displayFee)}</p>
        </div>
      </div>
    </Link>
  );
}
