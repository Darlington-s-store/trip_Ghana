import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Globe, MessageSquare, Camera, Play } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                <MapPin className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="font-heading font-bold text-xl">GhanaTravel</span>
            </div>
            <p className="text-sm opacity-70 leading-relaxed mb-6">
              Discover the beauty of Ghana — from pristine beaches to ancient castles,
              lush rainforests to vibrant cities. Your adventure starts here.
            </p>
            <div className="flex gap-3">
              {[Globe, MessageSquare, Camera, Play].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full border border-background/20 flex items-center justify-center hover:bg-background/10 transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Explore</h4>
            <ul className="space-y-2.5">
              {['Destinations', 'Hotels', 'Attractions', 'About Us', 'Contact'].map((item) => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase().replace(' ', '-')}`} className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Top Destinations</h4>
            <ul className="space-y-2.5">
              {['Accra', 'Cape Coast', 'Kumasi', 'Volta Region', 'Ada Foah', 'Tamale'].map((item) => (
                <li key={item}>
                  <Link to={`/destinations/${item.toLowerCase().replace(' ', '-')}`} className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm opacity-70">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>15 Independence Ave, Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-3 text-sm opacity-70">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+233 30 277 0000</span>
              </li>
              <li className="flex items-center gap-3 text-sm opacity-70">
                <Mail className="h-4 w-4 shrink-0" />
                <span>hello@ghanatravel.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-60">
          <p>© 2026 GhanaTravel. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:opacity-100 transition-opacity">Privacy Policy</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
