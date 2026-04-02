import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, ArrowLeft, Users, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHotel } from '@/hooks/useApi';
import { useCurrencyStore } from '@/store/currencyStore';
import { RoomType } from '@/types';

export default function HotelDetail() {
  const { id } = useParams();
  const { data: hotel, isLoading } = useHotel(id || '');
  const { format, convert, currency } = useCurrencyStore();

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!hotel) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-heading font-bold text-2xl mb-4">Hotel not found</h1>
        <Link to="/hotels"><Button>Back to Hotels</Button></Link>
      </div>
    );
  }

  const displayPrice = hotel.currency === currency ? hotel.pricePerNight : convert(hotel.pricePerNight, hotel.currency, currency);
  const hotelImages = hotel.images || [];
  const hotelAmenities = hotel.amenities || [];
  const roomTypes = (hotel.roomTypes || []) as RoomType[];

  return (
    <div>
      <section className="relative h-[50vh] min-h-[400px] bg-muted">
        <img src={hotelImages[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Link to="/hotels" className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Hotels
            </Link>
            <h1 className="font-heading font-bold text-4xl text-primary-foreground mb-2">{hotel.name}</h1>
            <div className="flex items-center gap-4 text-primary-foreground/70">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {hotel.location}</span>
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent text-accent" /> {hotel.rating} ({hotel.reviewCount} reviews)</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="font-heading font-bold text-2xl text-foreground mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed">{hotel.description}</p>
              </div>

              {hotelAmenities.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hotelAmenities.map(a => (
                      <div key={a} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Room Types</h3>
                <div className="space-y-4">
                  {roomTypes.length > 0 ? roomTypes.map((room) => {
                    const roomPrice = hotel.currency === currency ? room.pricePerNight : convert(room.pricePerNight, hotel.currency, currency);
                    return (
                      <div key={room.id} className="flex items-center justify-between p-5 rounded-xl border border-border bg-card">
                        <div>
                          <h4 className="font-heading font-semibold text-card-foreground">{room.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{room.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" /> Up to {room.maxGuests} guests
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-heading font-bold text-lg text-primary">{format(roomPrice)}</p>
                          <p className="text-xs text-muted-foreground">per night</p>
                          <Button size="sm" className="mt-2 bg-gradient-primary text-primary-foreground">Book Now</Button>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-muted-foreground text-sm italic">Standard room rates apply. Contact hotel for details.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Booking sidebar */}
            <div>
              <div className="sticky top-20 rounded-xl border border-border bg-card p-6">
                <p className="font-heading font-bold text-2xl text-primary mb-1">{format(displayPrice)}</p>
                <p className="text-sm text-muted-foreground mb-6">per night</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-1 block">Check-in</label>
                    <Input type="date" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-1 block">Check-out</label>
                    <Input type="date" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-1 block">Guests</label>
                    <Input type="number" min={1} max={10} defaultValue={2} />
                  </div>
                  <Button className="w-full bg-gradient-accent text-accent-foreground hover:opacity-90 h-11 font-semibold">
                    Reserve Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring/30 outline-none" />;
}

