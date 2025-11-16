import { getTranslations } from 'next-intl/server';
import { AnimatedWrapperCSS } from '@/components/Dashboard/AnimatedWrapper/AnimatedWrapperCSS';
import { PublicHeader } from '@/components/Public/PublicHeader/PublicHeader';
import { PublicFooter } from '@/components/Public/PublicFooter/PublicFooter';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('public.privacy');
  return {
    title: t('title'),
    description: t('introduction.content'),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations('public.privacy');

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
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('informationCollection.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('informationCollection.content')}</p>
                  <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                    <li>{t('informationCollection.items.personal')}</li>
                    <li>{t('informationCollection.items.usage')}</li>
                    <li>{t('informationCollection.items.device')}</li>
                    <li>{t('informationCollection.items.cookies')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('dataUsage.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('dataUsage.content')}</p>
                  <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                    <li>{t('dataUsage.items.service')}</li>
                    <li>{t('dataUsage.items.communication')}</li>
                    <li>{t('dataUsage.items.improvement')}</li>
                    <li>{t('dataUsage.items.security')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('dataProtection.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('dataProtection.content')}</p>
                  <p className="text-foreground/80 mb-4">{t('dataProtection.measures')}</p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('cookies.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('cookies.content')}</p>
                  <p className="text-foreground/80 mb-4">{t('cookies.types')}</p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('userRights.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('userRights.content')}</p>
                  <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                    <li>{t('userRights.items.access')}</li>
                    <li>{t('userRights.items.correction')}</li>
                    <li>{t('userRights.items.deletion')}</li>
                    <li>{t('userRights.items.objection')}</li>
                    <li>{t('userRights.items.portability')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('thirdParty.title')}</h2>
                  <p className="text-foreground/80 mb-4">{t('thirdParty.content')}</p>
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
                    <a href="mailto:privacy@bckstg.com" className="text-blue-600 hover:text-blue-700">
                      privacy@bckstg.com
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

