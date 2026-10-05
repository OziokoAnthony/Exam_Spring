import DashboardShell from '@/components/DashboardShell';

export default function LearnerDashboard() {
  return (
    <>
      <DashboardShell title="Learner dashboard" />
      <nav className="flex gap-3 px-4 pb-8">
        <a href="/learner/diagnostic" className="rounded bg-black px-4 py-3 text-white">
          Take diagnostic
        </a>
        <a href="/learner/practice" className="rounded bg-black px-4 py-3 text-white">
          Practice
        </a>
      </nav>
    </>
  );
}
