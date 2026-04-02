import { useCurrencyStore } from '@/store/currencyStore';
import { Button } from '@/components/ui/button';

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrencyStore();

  return (
    <div className="flex items-center rounded-full border border-border p-0.5 bg-muted">
      <button
        onClick={() => setCurrency('GHS')}
        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
          currency === 'GHS' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
        }`}
      >
        GH₵
      </button>
      <button
        onClick={() => setCurrency('USD')}
        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
          currency === 'USD' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
        }`}
      >
        USD
      </button>
    </div>
  );
}
