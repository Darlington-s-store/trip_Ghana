import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';
import type { Hotel } from '@/types';

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const { format, convert, currency } = useCurrencyStore();
  const displayPrice = hotel.currency === currency ? hotel.pricePerNight : convert(hotel.pricePerNight, hotel.currency, currency);

  return (
    <Link to={`/hotels/${hotel.id}`} className="group block rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all">
      <div className="relative h-48 overflow-hidden bg-muted">
        <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {hotel.featured && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">Featured</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <MapPin className="h-3 w-3" />
          <span>{hotel.location}</span>
        </div>
        <h3 className="font-heading font-semibold text-card-foreground group-hover:text-primary transition-colors">{hotel.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{hotel.description}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="text-sm font-medium text-card-foreground">{hotel.rating}</span>
            <span className="text-xs text-muted-foreground">({hotel.reviewCount})</span>
          </div>
          <div className="text-right">
            <p className="font-heading font-bold text-primary">{format(displayPrice)}</p>
            <p className="text-xs text-muted-foreground">per night</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
