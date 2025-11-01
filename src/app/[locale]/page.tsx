import { permanentRedirect } from 'next/navigation';

export default function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Redirect to dashboard
  // With localePrefix: 'never', the URL won't show the locale
  permanentRedirect('/dashboard');
}

