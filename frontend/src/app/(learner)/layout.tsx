import type { ReactNode } from 'react';

import { AuthGate } from '@/components/AuthGate';

export default function LearnerLayout({ children }: { children: ReactNode }) {
  return <AuthGate roles={['LEARNER']}>{children}</AuthGate>;
}
