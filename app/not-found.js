import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>404</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/">Back to Home</Link>
    </main>
  );
}
