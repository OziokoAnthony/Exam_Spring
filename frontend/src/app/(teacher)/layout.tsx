import type { ReactNode } from 'react';

import { AuthGate } from '@/components/AuthGate';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return <AuthGate roles={['TEACHER']}>{children}</AuthGate>;
}
