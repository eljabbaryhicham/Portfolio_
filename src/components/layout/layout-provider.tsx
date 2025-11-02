'use client';

import { ConditionalLayout } from './conditional-layout';

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  return (
      <ConditionalLayout>{children}</ConditionalLayout>
  );
}
