import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyState {
  currency: 'GHS' | 'USD';
  exchangeRate: number; // GHS per 1 USD
  setCurrency: (currency: 'GHS' | 'USD') => void;
  setExchangeRate: (rate: number) => void;
  convert: (amount: number, from: 'GHS' | 'USD', to: 'GHS' | 'USD') => number;
  format: (amount: number, curr?: 'GHS' | 'USD') => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'GHS',
      exchangeRate: 14.5,
      setCurrency: (currency) => set({ currency }),
      setExchangeRate: (exchangeRate) => set({ exchangeRate }),
      convert: (amount, from, to) => {
        if (from === to) return amount;
        const rate = get().exchangeRate;
        return from === 'USD' ? amount * rate : amount / rate;
      },
      format: (amount, curr) => {
        const c = curr || get().currency;
        return c === 'GHS'
          ? `GH₵ ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`
          : `$ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      },
    }),
    { name: 'currency-storage' }
  )
);
