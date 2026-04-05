const publisherId = (process.env.NEXT_PUBLIC_ADSENSE_ID || process.env.ADSENSE_ID || '').replace(/^ca-/, '');

export function GET() {
  const body = publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : '# Add ADSENSE_ID or NEXT_PUBLIC_ADSENSE_ID before launch.\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
