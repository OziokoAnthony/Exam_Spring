import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-4">
      <h1 className="text-3xl font-semibold">ExamSpring</h1>
      <p className="text-lg text-gray-700">
        Practise for WAEC and JAMB with questions checked by real teachers. Find your weak topics,
        fix them, and track your progress, even without data.
      </p>
      <Link href="/signup" className="rounded bg-black p-3 text-center text-white">
        Create a free account
      </Link>
      <Link href="/login" className="rounded border p-3 text-center">
        Log in
      </Link>
      <p className="text-sm text-gray-600">
        No ads. We never sell your data. Learners under 18 need a parent or guardian to approve.
      </p>
    </main>
  );
}
