import { getTranslations } from 'next-intl/server';
import { AnimatedWrapperCSS } from '@/components/Dashboard/AnimatedWrapper/AnimatedWrapperCSS';
import { PublicHeader } from '@/components/Public/PublicHeader/PublicHeader';
import { PublicFooter } from '@/components/Public/PublicFooter/PublicFooter';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('public.terms');
  return {
    title: t('title'),
    description: t('introduction.content'),
  };
}

export default async function TermsPage() {
  const t = await getTranslations('public.terms');

  return (
    <AnimatedWrapperCSS>
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1">
          <article className="py-12 md:py-20 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
              {/* Header */}
              <header className="mb-12 animate-fade-in-up">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {t('title')}
                </h1>
                <p className="text-lg text-foreground/70">
                  {t('lastUpdated')}: {t('lastUpdatedDate')}
                </p>
              </header>

              {/* Content Sections */}
              <div className="prose prose-lg max-w-none stagger-container">
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('introduction.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('introduction.content')}</p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('acceptance.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('acceptance.content')}</p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('serviceDescription.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('serviceDescription.content')}</p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('userAccounts.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('userAccounts.content')}</p>
                  <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                    <li>{t('userAccounts.items.accountability')}</li>
                    <li>{t('userAccounts.items.security')}</li>
                    <li>{t('userAccounts.items.notification')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('userObligations.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('userObligations.content')}</p>
                  <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                    <li>{t('userObligations.items.lawful')}</li>
                    <li>{t('userObligations.items.prohibited')}</li>
                    <li>{t('userObligations.items.accuracy')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('intellectualProperty.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('intellectualProperty.content')}</p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('paymentTerms.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('paymentTerms.content')}</p>
                  <p className="text-foreground/80 mb-4">{t('paymentTerms.refunds')}</p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('limitationLiability.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('limitationLiability.content')}</p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('termination.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('termination.content')}</p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('disputeResolution.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('disputeResolution.content')}</p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('changes.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('changes.content')}</p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('contact.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('contact.content')}</p>
                  <p className="text-foreground/80">
                    <strong>{t('contact.email')}:</strong>{' '}
                    <a href="mailto:legal@bckstg.com" className="text-blue-600 hover:text-blue-700">
                      legal@bckstg.com
                    </a>
                  </p>
                </section>
              </div>
            </div>
          </article>
        </main>
        <PublicFooter privacyPolicyUrl="/privacy" termsUrl="/terms" />
      </div>
    </AnimatedWrapperCSS>
  );
}

