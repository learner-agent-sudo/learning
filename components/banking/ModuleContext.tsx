'use client';

import { createContext, useContext } from 'react';
import type { Strength } from '@/lib/banking';

// What differs between the volumes that share the banking tools: where they
// keep state in the browser, and how a source's legal force is explained.
export interface BankingModuleSettings {
  storage: string;
  strengthTitles?: Partial<Record<Strength, string>>;
}

const BankingModuleContext = createContext<BankingModuleSettings>({ storage: 'hk-banking' });

export const BankingModuleProvider = BankingModuleContext.Provider;

export function useBankingModule() {
  return useContext(BankingModuleContext);
}
