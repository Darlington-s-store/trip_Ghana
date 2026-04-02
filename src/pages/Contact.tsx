import { useState } from 'react';
import { MapPin, Mail, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      <section className="bg-gradient-hero text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">Contact Us</h1>
          <p className="text-lg text-primary-foreground/70 max-w-lg mx-auto">
            Have questions? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Info */}
            <div>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Whether you need help booking a hotel, planning a trip, or have a partnership inquiry — our team is here to help.
              </p>
              <div className="space-y-6">
                {[
                  { icon: MapPin, label: 'Address', value: '15 Independence Ave, Accra, Ghana' },
                  { icon: Phone, label: 'Phone', value: '+233 30 277 0000' },
                  { icon: Mail, label: 'Email', value: 'hello@ghanatravel.com' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="rounded-xl border border-border bg-card p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl text-card-foreground mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-1.5 block">First Name</label>
                      <Input placeholder="Kwame" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-1.5 block">Last Name</label>
                      <Input placeholder="Mensah" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-1.5 block">Email</label>
                    <Input type="email" placeholder="kwame@example.com" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-1.5 block">Subject</label>
                    <Input placeholder="How can we help?" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-1.5 block">Message</label>
                    <Textarea placeholder="Tell us more..." rows={5} required />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 h-11 font-semibold">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
