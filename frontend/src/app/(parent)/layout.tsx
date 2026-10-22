import type { ReactNode } from 'react';

import { AuthGate } from '@/components/AuthGate';

export default function ParentLayout({ children }: { children: ReactNode }) {
  return <AuthGate roles={['PARENT']}>{children}</AuthGate>;
}
