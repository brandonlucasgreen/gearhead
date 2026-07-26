import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="text-6xl mb-4">🔇</div>
      <h1 className="text-2xl font-bold mb-2">Nothing here</h1>
      <p className="text-ink-300 mb-8">
        This showcase doesn&apos;t exist or was deleted.
      </p>
      <Link href="/" className="btn-primary inline-block">
        Create your own →
      </Link>
    </main>
  );
}