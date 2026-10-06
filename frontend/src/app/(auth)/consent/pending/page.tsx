export default function ConsentPendingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-semibold">Waiting for a parent</h1>
      <p className="mt-2 max-w-sm text-base text-gray-600">
        Because you are under 18, a parent or guardian must approve your account before you can
        start. Check with them to approve your invite.
      </p>
    </main>
  );
}
