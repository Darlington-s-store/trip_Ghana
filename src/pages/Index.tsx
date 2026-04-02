import { Link } from 'react-router-dom';
import { ArrowRight, Star, MapPin, Shield, Clock, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DestinationCard } from '@/components/features/DestinationCard';
import { HotelCard } from '@/components/features/HotelCard';
import { AttractionCard } from '@/components/features/AttractionCard';
import { useDestinations, useHotels, useAttractions } from '@/hooks/useApi';

const Index = () => {
  const { data: destinationsData, isLoading: destLoading } = useDestinations({ limit: 6, featured: true });
  const { data: hotelsData, isLoading: hotelsLoading } = useHotels({ limit: 4, featured: true });
  const { data: attractionsData, isLoading: attrLoading } = useAttractions({ limit: 3 });

  const destinations = destinationsData || [];
  const hotels = hotelsData || [];
  const attractions = attractionsData || [];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, hsl(40 90% 52% / 0.3) 0%, transparent 50%), radial-gradient(circle at 75% 30%, hsl(170 55% 32% / 0.3) 0%, transparent 50%)' }} />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 mb-6">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm text-primary-foreground/80">Discover the heart of West Africa</span>
            </div>
            <h1 className="font-heading font-extrabold text-5xl md:text-7xl text-primary-foreground leading-tight mb-6">
              Explore the Magic of{' '}
              <span className="text-gradient-accent">Ghana</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/70 max-w-xl mb-8 leading-relaxed">
              From golden coastlines and ancient castles to lush rainforests and vibrant culture — plan your perfect Ghanaian adventure.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/destinations">
                <Button size="lg" className="bg-gradient-accent text-accent-foreground hover:opacity-90 font-semibold px-8 h-12 rounded-xl">
                  Explore Destinations <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/hotels">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-12 rounded-xl">
                  Browse Hotels
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Trusted Bookings', desc: 'Verified hotels with secure Paystack payments and instant confirmation.' },
              { icon: Clock, title: 'Plan & Save', desc: 'Build custom trip itineraries with our smart trip planner and budgeting tools.' },
              { icon: Star, title: 'Local Expertise', desc: 'Curated recommendations from locals who know Ghana inside out.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-card-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-sm font-semibold text-accent uppercase tracking-wider">Explore</span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mt-1">Popular Destinations</h2>
            </div>
            <Link to="/destinations" className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {destLoading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map((dest) => (
                <DestinationCard key={dest.id} destination={dest} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-sm font-semibold text-accent uppercase tracking-wider">Stay</span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mt-1">Top-Rated Hotels</h2>
            </div>
            <Link to="/hotels" className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {hotelsLoading ? (
             <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Attractions */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-sm font-semibold text-accent uppercase tracking-wider">Experience</span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mt-1">Must-See Attractions</h2>
            </div>
            <Link to="/attractions" className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {attrLoading ? (
             <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attractions.map((attr) => (
                <AttractionCard key={attr.id} attraction={attr} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">Ready to Explore Ghana?</h2>
          <p className="text-lg text-primary-foreground/70 max-w-lg mx-auto mb-8">
            Create your account and start planning your dream trip today. Join thousands of happy travellers.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-gradient-accent text-accent-foreground hover:opacity-90 font-semibold px-10 h-12 rounded-xl">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;

