'use client';

import { NativeWindStyleSheet } from 'nativewind';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NativeWindStyleSheet>
      {children}
    </NativeWindStyleSheet>
  );
}