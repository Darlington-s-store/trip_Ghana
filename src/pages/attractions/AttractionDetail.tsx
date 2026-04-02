import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAttraction } from '@/hooks/useApi';
import { useCurrencyStore } from '@/store/currencyStore';

export default function AttractionDetail() {
  const { id } = useParams();
  const { data: attraction, isLoading } = useAttraction(id || '');
  const { format, convert, currency } = useCurrencyStore();

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!attraction) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-heading font-bold text-2xl mb-4">Attraction not found</h1>
        <Link to="/attractions"><Button>Back to Attractions</Button></Link>
      </div>
    );
  }

  const displayFee = attraction.currency === currency ? attraction.entryFee : convert(attraction.entryFee, attraction.currency, currency);

  return (
    <div>
      <section className="relative h-[50vh] min-h-[400px] bg-muted">
        <img src={attraction.image} alt={attraction.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Link to="/attractions" className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Attractions
            </Link>
            <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold mb-3">{attraction.category}</span>
            <h1 className="font-heading font-bold text-4xl text-primary-foreground mb-2">{attraction.name}</h1>
            <div className="flex items-center gap-4 text-primary-foreground/70 text-sm">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {attraction.location}</span>
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent text-accent" /> {attraction.rating}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {attraction.openingHours}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="font-heading font-bold text-2xl text-foreground mb-4">About</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">{attraction.description}</p>
            <div className="rounded-xl border border-border bg-card p-6 inline-block">
              <p className="text-sm text-muted-foreground mb-1">Entry Fee</p>
              <p className="font-heading font-bold text-2xl text-primary">{format(displayFee)}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

