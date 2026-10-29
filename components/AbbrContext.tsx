'use client';

import { createContext, useContext } from 'react';
import type { AbbrDict } from '@/lib/abbreviations';

// Each topic page provides its own abbreviations; none by default.
const AbbrContext = createContext<AbbrDict | null>(null);

export const AbbrProvider = AbbrContext.Provider;

export function useAbbreviations(): AbbrDict | null {
  return useContext(AbbrContext);
}
