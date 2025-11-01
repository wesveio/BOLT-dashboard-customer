'use client';

import { useRouter } from 'next/navigation';
import { AnimatedWrapper } from '@/components/Dashboard/AnimatedWrapper/AnimatedWrapper';
import { motion as m } from 'framer-motion';
import { fadeIn, staggerContainer } from '@/utils/animations';
import { NextSeo } from 'next-seo';

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
      title: 'Customizable Theme System',
      description:
        'Default, Single Page, and Liquid Glass themes. Completely transform your checkout visual experience.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      title: 'Enterprise-Grade Security',
      description:
        'PCI DSS compliant with complete protection of sensitive data. Your customers can shop with total confidence.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: 'Intelligent Checkout Flow',
      description:
        'Optimized 4-step flow that reduces friction and increases conversion. Full support for B2C and B2B.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      ),
      title: 'Native VTEX Integration',
      description:
        'Directly connected to VTEX Checkout API. Leverage the full power of the VTEX platform.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      title: 'Fully Responsive & Accessible',
      description:
        'Mobile-first design with WCAG 2.1 AA accessibility. Perfect experience on any device.',
    },
  ];

  return (
    <>
      <NextSeo
        title="BOLT Checkout"
        description="Experience a modern, customizable checkout flow powered by BCKSTG."
        canonical="https://pivotree.myvtex.com/"
      />
      <AnimatedWrapper>
        <div className="min-h-screen">
          {/* Hero Section */}
          <m.section
            className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 md:py-32"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
            </div>

            <div className="container-custom relative z-10">
              <m.div className="max-w-4xl mx-auto text-center" variants={fadeIn}>
                <m.div
                  className="inline-block mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    powered by BCKSTG
                  </span>
                </m.div>

                <m.h1
                  className="heading-hero mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  BOLT
                  <br />A Modern Checkout
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Built for Success
                  </span>
                </m.h1>

                <m.p
                  className="text-lead mb-10 max-w-2xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Experience a frictionless, secure, and lightning-fast checkout process designed
                  with modern e-commerce best practices.
                </m.p>

                <m.div
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="btn-primary-enhanced w-full sm:w-auto group"
                  >
                    Access Dashboard
                    <svg
                      className="inline-block w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="btn-secondary-enhanced w-full sm:w-auto"
                  >
                    Sign In
                  </button>
                </m.div>

                {/* Trust Indicators */}
                <m.div
                  className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    SSL Encrypted
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                    Fast Delivery
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-purple-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    24/7 Support
                  </div>
                </m.div>
              </m.div>
            </div>
          </m.section>

          {/* Features Section */}
          <m.section
            className="py-20 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="container-custom">
              <m.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="heading-section mb-4">Key Features</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Built with cutting-edge technology and best practices to ensure a frictionless
                  checkout experience.
                </p>
              </m.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <m.div
                    key={feature.title}
                    className="card-elevated-md p-8 text-center group hover:scale-105 transition-transform duration-200"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </m.section>

          {/* Feature Detail: Customizable Theme System */}
          <m.section
            className="py-20 bg-gradient-to-br from-gray-50 to-blue-50"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="container-custom">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <m.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    Customization
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    Customizable Theme System
                  </h2>
                  <p className="text-xl text-gray-600 mb-6">
                    Transform your checkout experience with three beautifully designed themes. Each
                    theme offers unique visual styles and layouts to match your brand identity.
                  </p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Default Theme</h3>
                        <p className="text-gray-600">
                          Traditional step-by-step layout with sidebar navigation, perfect for users
                          who prefer a familiar checkout experience.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Single Page Theme</h3>
                        <p className="text-gray-600">
                          All steps visible simultaneously with smooth scrolling, ideal for users
                          who want to see the full checkout process at once.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Liquid Glass Theme</h3>
                        <p className="text-gray-600">
                          Modern glassmorphism design with transparent overlays and animated
                          backgrounds, creating a premium, contemporary feel.
                        </p>
                      </div>
                    </li>
                  </ul>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="btn-primary-enhanced group"
                  >
                    Access Dashboard
                    <svg
                      className="inline-block w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </button>
                </m.div>
                <m.div
                  className="relative"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center border-2 border-gray-200">
                    <p className="text-gray-500 font-medium">Theme Preview Placeholder</p>
                  </div>
                </m.div>
              </div>
            </div>
          </m.section>

          {/* Feature Detail: Enterprise Security */}
          <m.section
            className="py-20 bg-white"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="container-custom">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <m.div
                  className="lg:order-2"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-blue-100 rounded-2xl flex items-center justify-center border-2 border-gray-200">
                    <p className="text-gray-500 font-medium">Security Badge Placeholder</p>
                  </div>
                </m.div>
                <m.div
                  className="lg:order-1"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Security
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    Enterprise-Grade Security
                  </h2>
                  <p className="text-xl text-gray-600 mb-6">
                    PCI DSS Level 1 compliant with comprehensive security controls. Your customers'
                    sensitive data is protected with bank-level encryption and industry-leading
                    security practices.
                  </p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">PCI DSS Compliant</h3>
                        <p className="text-gray-600">
                          Meet the highest standards for payment card data security and compliance.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Data Encryption</h3>
                        <p className="text-gray-600">
                          All sensitive data is encrypted in transit and at rest using
                          industry-standard protocols.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Secure Proxy Pattern</h3>
                        <p className="text-gray-600">
                          Server-side credential handling ensures sensitive data never touches the
                          client-side code.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Rate Limiting & Monitoring
                        </h3>
                        <p className="text-gray-600">
                          Advanced security monitoring and rate limiting protect against malicious
                          attacks.
                        </p>
                      </div>
                    </li>
                  </ul>
                </m.div>
              </div>
            </div>
          </m.section>

          {/* Feature Detail: Intelligent Checkout Flow */}
          <m.section
            className="py-20 bg-gradient-to-br from-purple-50 to-indigo-50"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="container-custom">
              <div className="text-center mb-16">
                <m.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  User Experience
                </m.div>
                <m.h2
                  className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  Intelligent Checkout Flow
                </m.h2>
                <m.p
                  className="text-xl text-gray-600 max-w-3xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  A streamlined 4-step process designed to minimize friction and maximize conversion
                  rates. Perfect for both B2C and B2B transactions.
                </m.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    step: '1',
                    title: 'Cart Review',
                    description: 'Review items, update quantities, and apply discounts',
                  },
                  {
                    step: '2',
                    title: 'Profile Data',
                    description: 'Fast customer data collection with smart validation',
                  },
                  {
                    step: '3',
                    title: 'Shipping Address',
                    description: 'Automatic address lookup and shipping calculation',
                  },
                  {
                    step: '4',
                    title: 'Payment',
                    description: 'Secure payment processing with multiple options',
                  },
                ].map((item, index) => (
                  <m.div
                    key={item.step}
                    className="card-elevated-md p-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </m.div>
                ))}
              </div>

              <m.div
                className="mt-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
              >
                <div className="inline-flex items-center gap-4 p-6 bg-white rounded-xl shadow-md">
                  <div className="text-left">
                    <p className="text-sm text-gray-500 mb-1">Supports</p>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        B2C
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        B2B
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-px bg-gray-200"></div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500 mb-1">Features</p>
                    <p className="text-gray-900 font-semibold">
                      Corporate Profiles • Coupon Codes • Real-time Validation
                    </p>
                  </div>
                </div>
              </m.div>
            </div>
          </m.section>

          {/* Feature Detail: Native VTEX Integration */}
          <m.section
            className="py-20 bg-white"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="container-custom">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <m.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                      />
                    </svg>
                    Integration
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    Native VTEX Integration
                  </h2>
                  <p className="text-xl text-gray-600 mb-6">
                    Built from the ground up for VTEX. Direct integration with VTEX Checkout API
                    ensures seamless data flow and access to all platform capabilities.
                  </p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Direct API Access</h3>
                        <p className="text-gray-600">
                          Full access to VTEX Checkout API endpoints with proper authentication and
                          error handling.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">OrderForm Management</h3>
                        <p className="text-gray-600">
                          Complete OrderForm lifecycle management with real-time updates and
                          synchronization.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Payment Processing</h3>
                        <p className="text-gray-600">
                          Seamless integration with VTEX payment providers and transaction
                          management.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Shipping Simulation</h3>
                        <p className="text-gray-600">
                          Automatic shipping cost calculation and delivery options based on VTEX
                          logistics.
                        </p>
                      </div>
                    </li>
                  </ul>
                </m.div>
                <m.div
                  className="relative"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center border-2 border-gray-200">
                    <p className="text-gray-500 font-medium">
                      VTEX Architecture Diagram Placeholder
                    </p>
                  </div>
                </m.div>
              </div>
            </div>
          </m.section>

          {/* Feature Detail: Fully Responsive & Accessible */}
          <m.section
            className="py-20 bg-gradient-to-br from-blue-50 to-gray-50"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="container-custom">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <m.div
                  className="lg:order-2"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-gray-100 rounded-2xl flex items-center justify-center border-2 border-gray-200">
                    <p className="text-gray-500 font-medium">Multi-Device Preview Placeholder</p>
                  </div>
                </m.div>
                <m.div
                  className="lg:order-1"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    Accessibility
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    Fully Responsive & Accessible
                  </h2>
                  <p className="text-xl text-gray-600 mb-6">
                    Built with a mobile-first approach and WCAG 2.1 AA compliance. Every user, on
                    any device, gets a perfect checkout experience.
                  </p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Mobile-First Design</h3>
                        <p className="text-gray-600">
                          Optimized for touch interactions and smaller screens with responsive
                          breakpoints.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">WCAG 2.1 AA Compliant</h3>
                        <p className="text-gray-600">
                          Full keyboard navigation, screen reader support, and proper ARIA labels
                          throughout.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Cross-Device Compatibility
                        </h3>
                        <p className="text-gray-600">
                          Tested and optimized for desktop, tablet, and mobile devices across all
                          major browsers.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Performance Optimized</h3>
                        <p className="text-gray-600">
                          Fast load times and smooth animations ensure a delightful user experience
                          on any connection.
                        </p>
                      </div>
                    </li>
                  </ul>
                </m.div>
              </div>
            </div>
          </m.section>

          {/* CTA Section */}
          <m.section
            className="py-20 bg-gradient-to-r from-blue-600 to-purple-600"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="container-custom text-center">
              <m.h2
                className="text-4xl md:text-5xl font-bold text-white mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Ready to Get Started?
              </m.h2>
              <m.p
                className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                Join thousands of satisfied customers experiencing our frictionless checkout
                process.
              </m.p>
              <m.button
                onClick={() => router.push('/dashboard')}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Access Dashboard
              </m.button>
            </div>
          </m.section>
        </div>
      </AnimatedWrapper>
    </>
  );
}
