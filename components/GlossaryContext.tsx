'use client';

import { createContext, useContext } from 'react';
import { defineTerm } from '@/lib/glossary';

type Define = (term: string) => string | undefined;

// Each topic page provides its own glossary; M&A's is the default.
const GlossaryContext = createContext<Define>(defineTerm);

export const GlossaryProvider = GlossaryContext.Provider;

export function useDefine(): Define {
  return useContext(GlossaryContext);
}
