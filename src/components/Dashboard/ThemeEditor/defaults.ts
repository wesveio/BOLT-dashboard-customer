/**
 * Default theme configurations
 * Used when creating a new theme or as fallbacks
 */

import type { ExpandedThemeConfig } from './types';

export function getDefaultThemeConfig(baseTheme?: 'default' | 'single-page' | 'liquid-glass' | null): ExpandedThemeConfig {
  const defaultConfig: ExpandedThemeConfig = {
    name: '',
    baseTheme: baseTheme || null,
    visual: {
      colors: {
        primary: { from: '#2563eb', to: '#9333ea' },
        secondary: { from: '#9333ea', to: '#ec4899' },
        accent: '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        background: {
          primary: '#ffffff',
          secondary: '#f9fafb',
          overlay: 'rgba(0, 0, 0, 0.5)',
        },
        text: {
          primary: '#111827',
          secondary: '#6b7280',
          tertiary: '#9ca3af',
          placeholder: '#9ca3af',
        },
        border: {
          default: '#e5e7eb',
          hover: '#3b82f6',
          focus: '#2563eb',
          error: '#ef4444',
        },
        glassmorphism: {
          opacity: 0.1,
          blur: 12,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
      },
      typography: {
        primary: {
          family: 'Inter',
          weights: [400, 500, 600, 700],
          sizes: {
            base: '1rem',
            sm: '0.875rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
          },
        },
        heading: {
          family: 'Inter',
          weights: [600, 700, 800],
          sizes: {
            base: '1.25rem',
            lg: '1.5rem',
            xl: '1.875rem',
            '2xl': '2.25rem',
            '3xl': '3rem',
          },
        },
        mono: {
          family: 'monospace',
          size: '1rem',
        },
        lineHeight: {
          tight: '1.25',
          normal: '1.5',
          relaxed: '1.75',
        },
        letterSpacing: {
          tight: '-0.025em',
          normal: '0',
          wide: '0.025em',
        },
        elementStyles: {
          labels: { size: '0.875rem', weight: 600 },
          inputs: { size: '1rem', weight: 400 },
          buttons: { size: '1rem', weight: 700 },
          cards: { size: '1rem', weight: 400 },
        },
      },
      spacing: {
        cardPadding: 'p-6',
        gap: 'gap-4',
        borderRadius: 'rounded-xl',
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
          '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        },
        containerMaxWidth: 'max-w-7xl',
        spacingScale: {
          mb: ['mb-2', 'mb-4', 'mb-6', 'mb-8'],
          mt: ['mt-2', 'mt-4', 'mt-6', 'mt-8'],
          mx: ['mx-2', 'mx-4', 'mx-6', 'mx-8'],
          my: ['my-2', 'my-4', 'my-6', 'my-8'],
        },
      },
      animations: {
        transitionDuration: 'duration-200',
        easing: 'ease-in-out',
        hoverEffects: {
          scale: 1.05,
          translate: '-translate-y-0.5',
        },
        loading: {
          spinnerSpeed: 1000,
          skeletonPulse: true,
        },
        scrollBehavior: 'smooth',
        animatedBackground: false,
      },
    },
    layout: {
      type: baseTheme === 'single-page' ? 'single-page' : 'step-by-step',
      showStepper: baseTheme !== 'single-page',
      stepperPosition: 'top',
      orderSummaryPosition: 'sidebar',
      containerType: 'container-custom',
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      mobileLayout: 'stack',
      hiddenElements: {
        mobile: [],
        tablet: [],
        desktop: [],
      },
      components: {
        appHeader: {
          show: true,
          sticky: false,
          transparent: baseTheme === 'liquid-glass',
        },
        appFooter: {
          show: true,
        },
        userProfile: {
          position: 'header',
          style: 'minimal',
          showInfo: ['name', 'avatar'],
        },
        modernStepper: {
          style: 'lines',
          activeColor: baseTheme === 'liquid-glass' ? '#ffffff' : '#2563eb',
        },
        checkoutHeader: {
          gradient: baseTheme === 'liquid-glass' ? 'purple' : 'blue',
          showIcons: true,
          position: 'top',
        },
      },
    },
    branding: {
      logo: {
        url: '/bolt.svg',
        altText: 'Logo',
        homeLink: '/',
        position: ['header'],
      },
      contact: {
        phone: '',
        email: '',
      },
      legal: {
        privacyPolicyUrl: '#',
        termsUrl: '#',
        returnPolicyUrl: '#',
      },
      messages: {
        success: {},
        error: {},
        placeholders: {},
        tooltips: {},
      },
    },
    features: {
      checkout: {
        couponCode: true,
        giftMessage: false,
        giftWrap: false,
        newsletterSignup: false,
        orderNotes: false,
        saveAddress: true,
        loginStep: true,
        customData: false,
        giftRegistry: false,
        openTextField: true,
        clientPreferences: true,
      },
      cart: {
        quantityControl: true,
        removeItems: true,
        editItems: true,
        imageDisplay: true,
        discountDisplay: true,
        undeliverableWarnings: true,
        itemAttachments: false,
      },
      profile: {
        autofillFromVTEX: true,
        corporateFields: false,
        companyName: false,
        taxId: false,
        userFoundModal: true,
      },
      shipping: {
        postalCodeLookup: true,
        addressSuggestions: true,
        multipleAddresses: false,
        shippingOptionsDisplay: true,
        deliveryEstimate: true,
      },
      payment: {
        multiplePaymentMethods: true,
        creditCardIcons: true,
        installments: true,
        savedCards: false,
        boleto: false,
        pix: false,
        walletOptions: false,
        cancelTransaction: true,
      },
      ux: {
        smoothScroll: baseTheme === 'single-page',
        stepValidation: true,
        autoAdvance: false,
        confettiAnimation: true,
        loadingOverlays: true,
        toastNotifications: true,
      },
      analytics: {
        eventTracking: true,
        gtmIntegration: false,
        ga4Integration: false,
        boltMetrics: false,
        consolePlugin: false,
        conversionTracking: false,
      },
      security: {
        sslBadge: true,
        securityBadges: true,
        trustSeals: false,
        pciComplianceInfo: false,
      },
    },
    texts: {
      interface: {
        stepTitles: {
          cart: 'Cart',
          profile: 'Profile',
          shipping: 'Shipping',
          payment: 'Payment',
        },
        stepDescriptions: {
          cart: 'Review your items',
          profile: 'Your details',
          shipping: 'Delivery address',
          payment: 'Complete order',
        },
        labels: {},
        placeholders: {},
        buttonTexts: {},
        errorMessages: {},
        successMessages: {},
        helpText: {},
      },
      pages: {
        emptyCartMessage: '<p>Your cart is empty</p>',
        confirmationPage: '<h2>Thank you for your order!</h2>',
        thankYouMessage: '<p>Your order has been placed successfully.</p>',
        orderSummaryText: 'Order Summary',
        termsAndConditions: '',
        privacyPolicyPreview: '',
      },
      notifications: {
        toastMessages: {},
        validationMessages: {},
        warningMessages: {},
        infoMessages: {},
      },
    },
    components: {
      orderSummary: {
        showItemsList: true,
        showSubtotal: true,
        showShipping: true,
        showDiscount: true,
        showTax: true,
        showTotal: true,
        showCouponField: true,
        stickyBehavior: 'sidebar',
      },
      payment: {
        showCardIcons: true,
        showInstallments: true,
        showSaveCardOption: false,
        cardNumberFormat: 'spaced',
        expiryFormat: 'MM/YY',
        cvvRequired: true,
      },
      cart: {
        showImages: true,
        showQuantityControls: true,
        showRemoveButton: true,
        showDiscountBadge: true,
        showUndeliverableWarning: true,
      },
      shipping: {
        showPostalCodeLookup: true,
        showAddressFields: true,
        showDeliveryOptions: true,
        showDeliveryEstimate: true,
      },
    },
  };

  return defaultConfig;
}

