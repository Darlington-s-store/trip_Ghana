import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { AttractionCard } from '@/components/features/AttractionCard';
import { useAttractions } from '@/hooks/useApi';
import { Input } from '@/components/ui/input';

const COMMON_CATEGORIES = ['all', 'Nature', 'History', 'Culture', 'Beach', 'Wildlife', 'Adventure'];

export default function Attractions() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const { data: attractions, isLoading } = useAttractions({
    search: search.length > 2 ? search : undefined,
    category: category === 'all' ? undefined : category
  });

  const filtered = attractions || [];

  return (
    <div>
      <section className="bg-gradient-hero text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">Attractions</h1>
          <p className="text-lg text-primary-foreground/70 max-w-lg mx-auto">
            Discover Ghana's rich history, breathtaking nature, and vibrant culture.
          </p>
        </div>
      </section>

      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search attractions..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10" 
            />
          </div>
          <div className="flex gap-2 flex-wrap justify-center md:justify-start">
            {COMMON_CATEGORIES.map(c => (
              <button 
                key={c} 
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {c === 'all' ? 'All Categories' : c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 min-h-[400px]">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(attr => <AttractionCard key={attr.id} attraction={attr} />)}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">No attractions found matching your criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

