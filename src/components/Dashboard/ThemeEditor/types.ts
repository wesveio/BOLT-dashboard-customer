/**
 * Expanded Theme Configuration Types
 * 
 * Complete type definitions for the theme editor that supports:
 * - Visual customization (colors, typography, spacing, animations)
 * - Layout configuration
 * - Branding settings
 * - Feature toggles
 * - Custom texts and messages
 * - Component-specific settings
 */

export type CheckoutThemeId = 'default' | 'single-page' | 'liquid-glass';

export interface VisualConfig {
  colors: {
    primary: {
      from: string; // Gradient start color
      to: string; // Gradient end color
    };
    secondary: {
      from: string;
      to: string;
    };
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    neutral: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    background: {
      primary: string;
      secondary: string;
      overlay: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      placeholder: string;
    };
    border: {
      default: string;
      hover: string;
      focus: string;
      error: string;
    };
    glassmorphism?: {
      opacity: number; // 0-1
      blur: number; // pixels
      borderColor: string;
    };
  };
  typography: {
    primary: {
      family: string;
      weights: number[]; // [400, 500, 600, 700]
      sizes: {
        base: string; // 1rem
        sm: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
      };
    };
    heading: {
      family: string;
      weights: number[];
      sizes: {
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
      };
    };
    mono: {
      family: string;
      size: string;
    };
    lineHeight: {
      tight: string;
      normal: string;
      relaxed: string;
    };
    letterSpacing: {
      tight: string;
      normal: string;
      wide: string;
    };
    elementStyles: {
      labels: {
        size: string;
        weight: number;
      };
      inputs: {
        size: string;
        weight: number;
      };
      buttons: {
        size: string;
        weight: number;
      };
      cards: {
        size: string;
        weight: number;
      };
    };
  };
  spacing: {
    cardPadding: 'p-4' | 'p-6' | 'p-8' | 'p-10' | 'p-12';
    gap: 'gap-2' | 'gap-4' | 'gap-6' | 'gap-8' | 'gap-10';
    borderRadius: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    containerMaxWidth: string; // e.g., 'max-w-7xl'
    spacingScale: {
      mb: string[];
      mt: string[];
      mx: string[];
      my: string[];
    };
  };
  animations: {
    transitionDuration: 'duration-200' | 'duration-300' | 'duration-500';
    easing: 'ease-in' | 'ease-out' | 'ease-in-out';
    hoverEffects: {
      scale: number; // e.g., 1.05
      translate: string; // e.g., '-translate-y-0.5'
    };
    loading: {
      spinnerSpeed: number; // milliseconds
      skeletonPulse: boolean;
    };
    scrollBehavior: 'smooth' | 'auto';
    animatedBackground: boolean;
  };
}

export interface LayoutConfig {
  type: 'step-by-step' | 'single-page' | 'liquid-glass';
  showStepper: boolean;
  stepperPosition: 'top' | 'inline' | 'hidden';
  orderSummaryPosition: 'sidebar' | 'top-sticky' | 'bottom-sticky';
  containerType: 'full-width' | 'container-custom' | string; // custom max-width
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  mobileLayout: 'stack' | 'side-by-side';
  hiddenElements: {
    mobile: string[];
    tablet: string[];
    desktop: string[];
  };
  components: {
    appHeader: {
      show: boolean;
      sticky: boolean;
      transparent: boolean;
    };
    appFooter: {
      show: boolean;
      content?: string; // HTML content
    };
    userProfile: {
      position: 'header' | 'sidebar' | 'inline';
      style: 'minimal' | 'detailed';
      showInfo: string[]; // ['name', 'email', 'avatar']
    };
    modernStepper: {
      style: 'dots' | 'lines' | 'numbers';
      activeColor: string;
    };
    checkoutHeader: {
      gradient: 'orange' | 'blue' | 'purple' | 'none';
      showIcons: boolean;
      position: 'top' | 'inline';
    };
  };
}

export interface BrandingConfig {
  logo: {
    url: string;
    altText: string;
    homeLink: string;
    width?: number;
    height?: number;
    position: ('header' | 'footer')[];
  };
  favicon?: string;
  contact: {
    phone: string;
    email: string;
    businessHours?: string;
  };
  legal: {
    privacyPolicyUrl: string;
    termsUrl: string;
    returnPolicyUrl: string;
    shippingPolicyUrl?: string;
    cookiesPolicyUrl?: string;
  };
  messages: {
    success: Record<string, string>; // e.g., { orderComplete: "Order placed successfully!" }
    error: Record<string, string>;
    placeholders: Record<string, string>;
    tooltips: Record<string, string>;
  };
}

export interface FeaturesConfig {
  checkout: {
    couponCode: boolean;
    giftMessage: boolean;
    giftWrap: boolean;
    newsletterSignup: boolean;
    orderNotes: boolean;
    saveAddress: boolean;
    loginStep: boolean;
    customData: boolean;
    giftRegistry: boolean;
    openTextField: boolean;
    clientPreferences: boolean;
  };
  cart: {
    quantityControl: boolean;
    removeItems: boolean;
    editItems: boolean;
    imageDisplay: boolean;
    discountDisplay: boolean;
    undeliverableWarnings: boolean;
    itemAttachments: boolean;
  };
  profile: {
    autofillFromVTEX: boolean;
    corporateFields: boolean;
    companyName: boolean;
    taxId: boolean;
    userFoundModal: boolean;
  };
  shipping: {
    postalCodeLookup: boolean;
    addressSuggestions: boolean;
    multipleAddresses: boolean;
    shippingOptionsDisplay: boolean;
    deliveryEstimate: boolean;
  };
  payment: {
    multiplePaymentMethods: boolean;
    creditCardIcons: boolean;
    installments: boolean;
    savedCards: boolean;
    boleto: boolean;
    pix: boolean;
    walletOptions: boolean;
    cancelTransaction: boolean;
  };
  ux: {
    smoothScroll: boolean;
    stepValidation: boolean;
    autoAdvance: boolean;
    confettiAnimation: boolean;
    loadingOverlays: boolean;
    toastNotifications: boolean;
  };
  analytics: {
    eventTracking: boolean;
    gtmIntegration: boolean;
    ga4Integration: boolean;
    boltMetrics: boolean;
    consolePlugin: boolean;
    conversionTracking: boolean;
  };
  security: {
    sslBadge: boolean;
    securityBadges: boolean;
    trustSeals: boolean;
    pciComplianceInfo: boolean;
  };
}

export interface TextsConfig {
  interface: {
    stepTitles: {
      cart: string;
      login: string;
      profile: string;
      shipping: string;
      payment: string;
    };
    stepDescriptions: {
      cart: string;
      login: string;
      profile: string;
      shipping: string;
      payment: string;
    };
    labels: Record<string, string>;
    placeholders: Record<string, string>;
    buttonTexts: Record<string, string>;
    errorMessages: Record<string, string>;
    successMessages: Record<string, string>;
    helpText: Record<string, string>;
  };
  pages: {
    emptyCartMessage: string; // Rich text (HTML)
    confirmationPage: string; // Rich text (HTML)
    thankYouMessage: string; // Rich text (HTML)
    orderSummaryText: string;
    termsAndConditions: string; // Rich text (HTML) - TipTap
    privacyPolicyPreview: string; // Rich text (HTML) - TipTap
  };
  notifications: {
    toastMessages: Record<string, string>;
    validationMessages: Record<string, string>;
    warningMessages: Record<string, string>;
    infoMessages: Record<string, string>;
  };
}

export interface ComponentsConfig {
  orderSummary: {
    showItemsList: boolean;
    showSubtotal: boolean;
    showShipping: boolean;
    showDiscount: boolean;
    showTax: boolean;
    showTotal: boolean;
    showCouponField: boolean;
    stickyBehavior: 'top' | 'sidebar' | 'none';
  };
  payment: {
    showCardIcons: boolean;
    showInstallments: boolean;
    showSaveCardOption: boolean;
    cardNumberFormat: 'spaced' | 'dashed' | 'none';
    expiryFormat: 'MM/YY' | 'MM-YY' | 'MM YY';
    cvvRequired: boolean;
  };
  cart: {
    showImages: boolean;
    showQuantityControls: boolean;
    showRemoveButton: boolean;
    showDiscountBadge: boolean;
    showUndeliverableWarning: boolean;
  };
  shipping: {
    showPostalCodeLookup: boolean;
    showAddressFields: boolean;
    showDeliveryOptions: boolean;
    showDeliveryEstimate: boolean;
  };
}

/**
 * Complete theme configuration
 */
export interface ExpandedThemeConfig {
  name: string;
  baseTheme?: CheckoutThemeId | null; // 'default' | 'single-page' | 'liquid-glass' | null for custom
  visual: VisualConfig;
  layout: LayoutConfig;
  branding: BrandingConfig;
  features: FeaturesConfig;
  texts: TextsConfig;
  components: ComponentsConfig;
}

/**
 * Default theme configurations for the 3 predefined themes
 */
export const defaultThemeConfigs: Record<CheckoutThemeId, Partial<ExpandedThemeConfig>> = {
  default: {
    baseTheme: 'default',
    layout: {
      type: 'step-by-step',
      showStepper: true,
      stepperPosition: 'top',
      orderSummaryPosition: 'sidebar',
      containerType: 'container-custom',
      breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
      mobileLayout: 'stack',
      hiddenElements: { mobile: [], tablet: [], desktop: [] },
      components: {
        appHeader: { show: true, sticky: false, transparent: false },
        appFooter: { show: true },
        userProfile: { position: 'header', style: 'minimal', showInfo: ['name', 'avatar'] },
        modernStepper: { style: 'lines', activeColor: '#2563eb' },
        checkoutHeader: { gradient: 'blue', showIcons: true, position: 'top' },
      },
    },
  },
  'single-page': {
    baseTheme: 'single-page',
    layout: {
      type: 'single-page',
      showStepper: false,
      stepperPosition: 'top',
      orderSummaryPosition: 'sidebar',
      containerType: 'container-custom',
      breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
      mobileLayout: 'stack',
      hiddenElements: { mobile: [], tablet: [], desktop: [] },
      components: {
        appHeader: { show: true, sticky: false, transparent: false },
        appFooter: { show: true },
        userProfile: { position: 'header', style: 'minimal', showInfo: ['name', 'avatar'] },
        modernStepper: { style: 'dots', activeColor: '#2563eb' },
        checkoutHeader: { gradient: 'blue', showIcons: true, position: 'top' },
      },
    },
  },
  'liquid-glass': {
    baseTheme: 'liquid-glass',
    layout: {
      type: 'step-by-step',
      showStepper: true,
      stepperPosition: 'top',
      orderSummaryPosition: 'sidebar',
      containerType: 'container-custom',
      breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
      mobileLayout: 'stack',
      hiddenElements: { mobile: [], tablet: [], desktop: [] },
      components: {
        appHeader: { show: true, sticky: false, transparent: true },
        appFooter: { show: true },
        userProfile: { position: 'header', style: 'minimal', showInfo: ['name', 'avatar'] },
        modernStepper: { style: 'lines', activeColor: '#ffffff' },
        checkoutHeader: { gradient: 'purple', showIcons: true, position: 'top' },
      },
    },
  },
};

