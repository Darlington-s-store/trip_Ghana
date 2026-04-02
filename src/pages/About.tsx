import { MapPin, Users, Globe, Heart, Award, Shield } from 'lucide-react';

export default function About() {
  return (
    <div>
      <section className="bg-gradient-hero text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">About GhanaTravel</h1>
          <p className="text-lg text-primary-foreground/70 max-w-xl mx-auto">
            We're on a mission to make Ghana the top travel destination in West Africa.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-heading font-bold text-3xl text-foreground mb-4">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed">
              Founded in Accra by a team passionate about showcasing Ghana's beauty to the world, GhanaTravel connects travellers with verified accommodations, curated experiences, and local expertise. We believe that travel should be seamless, authentic, and memorable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: 'Global Reach', desc: 'Serving travellers from over 40 countries exploring Ghana.' },
              { icon: Heart, title: 'Community First', desc: 'Supporting local businesses and sustainable tourism practices.' },
              { icon: Shield, title: 'Trust & Safety', desc: 'Every hotel is verified and every payment is secured via Paystack.' },
              { icon: Award, title: 'Quality Curated', desc: 'Hand-picked destinations and experiences by local experts.' },
              { icon: Users, title: '10,000+ Travellers', desc: 'Trusted by thousands of happy adventurers since 2022.' },
              { icon: MapPin, title: '50+ Destinations', desc: 'Covering every region of Ghana, from coast to savanna.' },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 rounded-xl border border-border bg-card">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-card-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
