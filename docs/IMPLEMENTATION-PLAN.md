# Implementation Plan: Update Home Page, Pricing Page, and Add Policies

## Overview

This plan outlines the implementation of:
1. Dashboard features showcase on home and pricing pages
2. Privacy Policy and Terms & Conditions pages with generic content
3. Translation support for all public pages (en, pt-BR, es)
4. Language switcher integration in public header

## Phase 1: Documentation ✅

**Status:** Complete
- Created comprehensive dashboard features documentation (`docs/DASHBOARD-FEATURES.md`)
- Documents all 50+ dashboard features across 10 main sections

## Phase 2: Create Policy Pages

### 2.1 Privacy Policy Page
**File:** `src/app/privacy/page.tsx`

**Content Structure (Generic):**
- Introduction
- Information We Collect
- How We Use Your Information
- Data Protection & Security
- Cookies and Tracking Technologies
- Your Rights
- Third-Party Services
- Changes to Privacy Policy
- Contact Information

**Design:**
- Use same design system as home page
- PublicHeader and PublicFooter components
- Responsive layout
- Proper typography hierarchy

### 2.2 Terms & Conditions Page
**File:** `src/app/terms/page.tsx`

**Content Structure (Generic):**
- Introduction
- Acceptance of Terms
- Service Description
- User Accounts
- User Obligations
- Intellectual Property
- Payment Terms
- Limitation of Liability
- Termination
- Dispute Resolution
- Changes to Terms
- Contact Information

**Design:**
- Use same design system as home page
- PublicHeader and PublicFooter components
- Responsive layout
- Proper typography hierarchy

## Phase 3: Update Home Page

### 3.1 Add Dashboard Features Section
**File:** `src/app/page.tsx`

**Location:** Add new section after existing feature details sections, before CTA section

**Content:**
Showcase dashboard capabilities with feature cards:
- **Overview & Metrics** - Real-time dashboard with key performance indicators
- **Performance Analytics** - Checkout funnel analysis and conversion tracking
- **Revenue Tracking** - Detailed revenue analytics and trends
- **Advanced Analytics** - 17+ specialized analytics including:
  - Payment Methods Analysis
  - Shipping & Delivery Tracking
  - Device Breakdown
  - Browser & Platform Analytics
  - Coupons & Discounts
  - Micro-conversions
  - Geographic Analysis
  - Customer Lifetime Value (LTV)
  - Customer Acquisition Cost (CAC)
  - Retention & Churn Analysis
  - Abandonment Prediction
  - Cohort Analysis
  - Behavioral Segments
  - Optimization ROI
  - Friction Score
  - Revenue Forecast
- **Theme Customization** - WYSIWYG theme editor with 3 default themes
- **Insights & Recommendations** - AI-powered actionable insights
- **Integrations & API Keys** - API management and integrations

**Design:**
- Card grid layout (3 columns on desktop, 2 on tablet, 1 on mobile)
- Icons matching dashboard design
- Gradient backgrounds (blue to purple)
- Hover effects and animations
- "View Dashboard" CTAs for authenticated users, "Sign In" for others

### 3.2 Keep Existing Content
- Maintain all existing hero section
- Keep all existing feature detail sections
- Preserve CTA section

## Phase 4: Update Pricing Page

### 4.1 Add Dashboard Features Showcase Section
**File:** `src/app/pricing/page.tsx`

**Location:** Add after pricing cards section, before comparison table

**Content:**
Highlight key dashboard features included in plans:
- Feature cards showing what's available in each plan tier
- Visual representation of dashboard capabilities
- Link features to plan benefits
- Icons and brief descriptions

**Design:**
- Match existing pricing page design
- Use card-based layout
- Animated reveal on scroll
- Consistent with home page feature showcase

## Phase 5: Add Language Switcher to Public Header

### 5.1 Update PublicHeader Component
**File:** `src/components/Public/PublicHeader/PublicHeader.tsx`

**Changes:**
- Import `LanguageSwitcher` from `@/components/LanguageSwitcher`
- Add to desktop navigation (right side, before login button)
- Add to mobile menu (after navigation links)
- Ensure proper styling matches header design
- Handle responsive behavior

**Implementation:**
```tsx
// Desktop: Add before Login link
<div className="flex items-center gap-4">
  <LanguageSwitcher />
  <Link href="/login">Login</Link>
</div>

// Mobile: Add to menu items
```

## Phase 6: Add Translations

### 6.1 Translation Structure
Create `public` namespace in all translation files:
- `src/i18n/messages/en.json`
- `src/i18n/messages/pt-BR.json`
- `src/i18n/messages/es.json`

### 6.2 Home Page Translations
**Namespace:** `public.home`

**Keys:**
- `dashboardFeatures.title`
- `dashboardFeatures.subtitle`
- `dashboardFeatures.overview.title`
- `dashboardFeatures.overview.description`
- `dashboardFeatures.performance.title`
- `dashboardFeatures.performance.description`
- `dashboardFeatures.revenue.title`
- `dashboardFeatures.revenue.description`
- `dashboardFeatures.analytics.title`
- `dashboardFeatures.analytics.description`
- `dashboardFeatures.themes.title`
- `dashboardFeatures.themes.description`
- `dashboardFeatures.insights.title`
- `dashboardFeatures.insights.description`
- `dashboardFeatures.integrations.title`
- `dashboardFeatures.integrations.description`
- `viewDashboard`
- `signIn`

### 6.3 Pricing Page Translations
**Namespace:** `public.pricing`

**Keys:**
- `dashboardFeatures.title`
- `dashboardFeatures.subtitle`
- `dashboardFeatures.included`
- `dashboardFeatures.availableInAllPlans`
- (Feature-specific keys as needed)

### 6.4 Policy Pages Translations
**Namespace:** `public.privacy` and `public.terms`

**Keys:**
- Page title
- Section headings
- Paragraph content
- Contact information
- Last updated date

### 6.5 Public Header Translations
**Namespace:** `public.header`

**Keys:**
- `language`
- Navigation items (if not already translated)

### 6.6 Public Footer Translations
**Namespace:** `public.footer`

**Keys:**
- `privacyPolicy`
- `termsAndConditions`
- Other footer links

## Phase 7: Update Footer Links

### 7.1 Update PublicFooter Component
**File:** `src/components/Public/PublicFooter/PublicFooter.tsx`

**Changes:**
- Add links to Privacy Policy (`/privacy`)
- Add links to Terms & Conditions (`/terms`)
- Ensure links are translated
- Add to footer navigation section
- Use proper Link components from Next.js

## Implementation Order

1. ✅ Create documentation
2. Create policy pages (generic content)
3. Add translations for policy pages
4. Update home page with dashboard features section
5. Add translations for home page
6. Update pricing page with dashboard features
7. Add translations for pricing page
8. Add language switcher to PublicHeader
9. Update PublicFooter with policy links
10. Test all translations across 3 languages

## Files to Create

1. `src/app/privacy/page.tsx`
2. `src/app/terms/page.tsx`

## Files to Modify

1. `src/app/page.tsx` - Add dashboard features section
2. `src/app/pricing/page.tsx` - Add dashboard features showcase
3. `src/components/Public/PublicHeader/PublicHeader.tsx` - Add language switcher
4. `src/components/Public/PublicFooter/PublicFooter.tsx` - Add policy links
5. `src/i18n/messages/en.json` - Add all translations
6. `src/i18n/messages/pt-BR.json` - Add all translations
7. `src/i18n/messages/es.json` - Add all translations

## Design Guidelines

### Consistency
- Use existing design system from `DESIGN-STYLE-GUIDE.md`
- Follow color palette (blue to purple gradients)
- Use Framer Motion animations consistently
- Maintain responsive design (mobile-first)
- Use HeroUI components where applicable

### Component Reuse
- Reuse `LanguageSwitcher` from `src/components/LanguageSwitcher.tsx`
- Reuse `PublicHeader` and `PublicFooter` components
- Follow existing animation patterns
- Use existing card and button styles

### Translation Implementation
- Use `useTranslations` hook from `next-intl`
- Structure translations with clear namespaces
- Ensure all user-facing text is translated
- Test language switching functionality

## Testing Checklist

- [ ] Privacy page renders correctly in all 3 languages
- [ ] Terms page renders correctly in all 3 languages
- [ ] Home page dashboard features section displays correctly
- [ ] Pricing page dashboard features showcase displays correctly
- [ ] Language switcher works in header (desktop and mobile)
- [ ] Footer links navigate correctly
- [ ] All translations are complete and accurate
- [ ] Responsive design works on all screen sizes
- [ ] Animations work smoothly
- [ ] Links and CTAs function correctly

## Notes

- Policy pages will use generic/template content that can be customized later
- Dashboard features showcase should highlight key capabilities without overwhelming users
- Language switcher should be easily accessible but not intrusive
- All translations should be reviewed for accuracy and cultural appropriateness
- Consider SEO implications for policy pages (add metadata)

---

*Plan Created: 2024*
*Last Updated: 2024*

