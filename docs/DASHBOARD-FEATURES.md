# Dashboard Features Documentation

This document provides a comprehensive overview of all features available in the BOLT Dashboard.

## Table of Contents

1. [Overview](#overview)
2. [Performance](#performance)
3. [Revenue](#revenue)
4. [Analytics](#analytics)
5. [Themes](#themes)
6. [Insights](#insights)
7. [Plans & Pricing](#plans--pricing)
8. [Integrations](#integrations)
9. [Settings](#settings)
10. [Profile](#profile)

---

## Overview

**Route:** `/dashboard`

**Description:** Main dashboard page providing a comprehensive overview of checkout performance metrics and key insights.

### Features

- **Core Metrics Cards:**
  - Total Revenue (with growth trend)
  - Total Orders
  - Conversion Rate
  - Total Sessions
  - Average Order Value
  - Abandonment Rate
  - Average Checkout Time
  - Revenue Growth

- **Revenue Trend Chart:**
  - Line chart showing revenue over time
  - Configurable time periods (Today, Last 7 days, Last 30 days, Last 12 months)

- **Top Insights Preview:**
  - Displays top 3 high-impact insights
  - Quick access to full insights page
  - Color-coded by insight type (success, warning, info, recommendation)

- **Quick Links:**
  - Revenue
  - Performance
  - Analytics
  - Insights

---

## Performance

**Route:** `/dashboard/performance`

**Description:** Monitor checkout funnel performance and conversion rates at each step.

### Features

- **Performance Metrics:**
  - Conversion Rate
  - Average Checkout Time
  - Abandonment Rate
  - Total Sessions

- **Checkout Funnel Visualization:**
  - Step-by-step conversion analysis
  - Conversion rate by step
  - Visual funnel chart showing drop-off points

- **Time Period Filtering:**
  - Today
  - Last 7 days
  - Last 30 days
  - Last 12 months

---

## Revenue

**Route:** `/dashboard/revenue`

**Description:** Track sales and revenue performance with detailed analytics.

### Features

- **Revenue Metrics:**
  - Total Revenue
  - Average Order Value
  - Total Orders
  - Revenue per Hour

- **Charts:**
  - Revenue Trend (line chart)
  - Revenue by Hour (hourly breakdown)
  - Revenue by Day (daily breakdown)

- **Time Period Filtering:**
  - Today
  - Last 7 days
  - Last 30 days
  - Last 12 months

---

## Analytics

**Route:** `/dashboard/analytics`

**Description:** Deep dive into checkout analytics with detailed event tracking and session analysis.

### Main Analytics Page

- **Event Summary:**
  - Total Events
  - Unique Sessions
  - Error Count & Error Rate
  - API Calls

- **Events by Category:**
  - User Actions
  - API Calls
  - Metrics
  - Errors

- **Sessions Table:**
  - Session ID
  - Event Count
  - Duration
  - First/Last Event Timestamps
  - Category Breakdown
  - Detailed event view per session

- **Filters:**
  - Time Period
  - Event Type
  - Category
  - Session-level event filtering

### Analytics Sub-Pages

#### Payment Methods

**Route:** `/dashboard/analytics/payment`

- Payment method usage analysis
- Conversion rates by payment type
- Revenue by payment method
- Payment method distribution

#### Shipping & Delivery

**Route:** `/dashboard/analytics/shipping`

- Shipping method selection tracking
- Delivery preferences analysis
- Conversion rates by shipping method
- Shipping cost impact

#### Device Breakdown

**Route:** `/dashboard/analytics/devices`

- Conversion rates by device type
- Device distribution
- Performance metrics by device
- Mobile vs Desktop analysis

#### Browser & Platform

**Route:** `/dashboard/analytics/browsers`

- Browser distribution
- Platform breakdown (Desktop, Mobile, Tablet)
- Conversion rates by browser/platform
- Performance metrics by platform

#### Coupons & Discounts

**Route:** `/dashboard/analytics/coupons`

- Coupon usage tracking
- Discount impact on revenue
- Conversion rates with/without coupons
- Most effective coupons

#### Micro-conversions

**Route:** `/dashboard/analytics/micro-conversions`

- Detailed step-by-step conversion analysis
- Conversion rates at each micro-step
- Drop-off point identification
- User journey analysis

#### Geographic Analysis

**Route:** `/dashboard/analytics/geography`

- Conversion and revenue metrics by location
- Geographic distribution
- Regional performance analysis
- Country/region breakdown

#### Customer Lifetime Value (LTV)

**Route:** `/dashboard/analytics/ltv`

- Average Customer Lifetime Value
- LTV distribution by segment
- LTV by customer segment
- Top customers by LTV
- Recurring customer analysis
- Purchase frequency metrics

#### Customer Acquisition Cost (CAC)

**Route:** `/dashboard/analytics/cac`

- Average CAC
- LTV:CAC Ratio
- CAC by acquisition channel
- Channel performance metrics
- Acquisition efficiency analysis

#### Retention & Churn

**Route:** `/dashboard/analytics/retention`

- Retention Rate
- Churn Rate
- Average Purchase Frequency
- Days Between Orders
- Cohort Retention Analysis
- Retention rates by period (D30, D60, D90)

#### Abandonment Prediction

**Route:** `/dashboard/analytics/abandonment-prediction`

- Real-time risk scores for checkout abandonment
- High-risk session detection
- Risk distribution analysis
- Abandonment rate by risk level
- Intervention recommendations

#### Cohort Analysis

**Route:** `/dashboard/analytics/cohorts`

- Cohort retention analysis
- LTV by cohort
- Average retention trends
- Cohort retention matrix
- Cohort size and performance metrics

#### Behavioral Segments

**Route:** `/dashboard/analytics/segments`

- Customer segmentation by behavior and value
- Segment distribution
- LTV by segment
- Segment metrics (AOV, Orders, Revenue)
- VIP, Frequent Buyers, New, At-Risk, Dormant customers

#### Optimization ROI

**Route:** `/dashboard/analytics/optimization-roi`

- Measure impact and ROI of checkout optimizations
- Before/After comparison
- Revenue impact
- Conversion rate changes
- Additional orders gained
- AOV changes

#### Friction Score

**Route:** `/dashboard/analytics/friction-score`

- Average friction score
- High friction session detection
- Friction trend analysis
- Friction distribution
- Friction breakdown by contributor
- Conversion rates by friction level

#### Revenue Forecast

**Route:** `/dashboard/analytics/revenue-forecast`

- Predictive revenue forecasting
- 7-day, 30-day, 90-day forecasts
- Confidence intervals
- Historical vs forecasted comparison
- Forecast accuracy metrics
- Growth trend analysis

---

## Themes

**Route:** `/dashboard/themes`

**Description:** Customize checkout appearance with a visual theme editor.

### Features

- **Default Themes:**
  - Default Theme (step-by-step layout with sidebar)
  - Single Page Theme (all steps visible simultaneously)
  - Liquid Glass Theme (glassmorphism design)

- **Custom Themes:**
  - Create new themes
  - Edit existing themes
  - Duplicate themes
  - Delete themes
  - Activate themes

- **Theme Editor (WYSIWYG):**
  - Layout customization
  - Color customization (Primary, Secondary, Accent, Background, Text)
  - Font customization (Heading, Body)
  - Text content editing (step titles, descriptions, messages)
  - Preview functionality
  - Save/Update themes

- **Theme Management:**
  - Active theme indicator
  - Theme activation
  - Theme duplication with custom names
  - Theme deletion (with protection for active theme)

---

## Insights

**Route:** `/dashboard/insights`

**Description:** Actionable recommendations based on checkout data analysis.

### Features

- **Insight Types:**
  - Success (positive trends)
  - Warning (issues requiring attention)
  - Info (informational insights)
  - Recommendation (optimization suggestions)

- **Impact Levels:**
  - High Impact
  - Medium Impact
  - Low Impact

- **Insight Cards:**
  - Title and description
  - Impact badge
  - Timestamp
  - Action links (when applicable)

- **Summary Metrics:**
  - Total Insights
  - High Impact count
  - Medium Impact count
  - Low Impact count

---

## Plans & Pricing

**Route:** `/dashboard/plans`

**Description:** Manage subscription plans and view available pricing tiers.

### Features

- **Current Plan Display:**
  - Plan name and features
  - Billing cycle
  - Status (Active, Cancelled, Expired, Pending)

- **Available Plans:**
  - Starter
  - Professional
  - Enterprise

- **Plan Management:**
  - Upgrade/Downgrade options
  - Plan change confirmation
  - Contact Sales for Enterprise

- **Subscription History:**
  - Past subscriptions
  - Start/End dates
  - Billing cycles

---

## Integrations

**Route:** `/dashboard/integrations`

**Description:** Manage API keys for integrations and external services.

### Features

- **Metrics API Key:**
  - Generate metrics API key
  - Copy to clipboard
  - Regenerate key
  - Integration instructions
  - Key for Bolt plugin to send metrics from checkout

- **Custom API Keys:**
  - Create custom API keys
  - Name keys
  - View creation date
  - View last used date
  - Delete keys
  - Copy keys

---

## Settings

**Route:** `/dashboard/settings`

**Description:** Manage account settings and preferences.

### Features

- **General Settings:**
  - Language selection
  - Timezone configuration
  - Currency selection
  - Date format preferences

- **Notification Settings:**
  - Email Reports
  - Weekly Digest
  - Conversion Alerts
  - Payment Alerts
  - System Updates

- **Security Settings:**
  - Two-Factor Authentication
  - Session Timeout configuration

- **Analytics Settings:**
  - Data Retention Period
  - Export Format

- **Danger Zone:**
  - Account Deletion (with confirmation)

---

## Profile

**Route:** `/dashboard/profile`

**Description:** Manage personal and professional information.

### Features

- **Personal Information:**
  - Full Name
  - Email (read-only)
  - Phone Number

- **Professional Information:**
  - Company Name
  - Job Title

- **Account Statistics:**
  - Member Since
  - Last Login
  - Account Status

- **Profile Management:**
  - Edit Profile
  - Save Changes
  - Avatar Upload (coming soon)

---

## Additional Features

### Authentication

- **Passwordless Authentication:**
  - Email-based login
  - 6-digit access code
  - Code expiration and resend
  - Sign up flow

### User Management

- **Team Management:**
  - Invite users
  - Role-based permissions (Viewer, Editor, Admin, Owner)
  - User removal
  - Invitation management
  - Pending invitations

### Role-Based Access Control (RBAC)

- **Roles:**
  - Viewer (Read-only)
  - Editor (Can edit themes)
  - Administrator (Can manage most settings)
  - Owner (Full access)

- **Permissions:**
  - Resource-based permissions
  - Action-based permissions (read, write)
  - Role guards on components

### Internationalization

- **Supported Languages:**
  - English (en)
  - Portuguese (pt-BR)
  - Spanish (es)

- **Features:**
  - Language switcher
  - Locale-based content
  - Cookie-based locale storage

---

## Data & Analytics

### Time Periods

All analytics pages support filtering by:
- Today
- Last 7 days
- Last 30 days
- Last 12 months

### Metrics Calculation

- Real-time metrics from checkout events
- Aggregated data from Supabase
- Cached results for performance
- Automatic refresh on data changes

### Event Tracking

- User actions
- API calls
- Metrics tracking
- Error logging
- Session tracking

---

## Technical Details

### API Integration

- RESTful API endpoints
- Supabase backend
- Real-time data synchronization
- Error handling and retry logic

### Performance

- Optimistic UI updates
- Data caching
- Lazy loading
- Responsive design
- Mobile-first approach

### Security

- PCI DSS compliance
- Secure credential handling
- Rate limiting
- Session management
- Role-based access control

---

## Future Enhancements

- Real-time data integration (currently using mock data in some areas)
- Advanced A/B testing
- Custom report builder
- Export functionality (CSV, PDF)
- Webhook integrations
- More theme customization options
- Advanced segmentation
- Predictive analytics improvements

---

*Last Updated: 2024*

