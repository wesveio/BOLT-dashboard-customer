/**
 * User Profile Builder for BoltX
 * 
 * Builds comprehensive user profiles from session data for personalization
 */

import { UserProfile } from './types';

export interface ProfileData {
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  behavior: {
    timeOnSite: number;
    pagesVisited: number;
    checkoutAttempts: number;
    previousPurchases?: number;
    avgOrderValue?: number;
  };
  preferences?: {
    preferredPaymentMethod?: string;
    preferredShippingMethod?: string;
    preferredLanguage?: string;
  };
  inferredIntent?: {
    urgency: 'low' | 'medium' | 'high';
    priceSensitivity: 'low' | 'medium' | 'high';
    devicePreference: 'mobile' | 'desktop';
  };
}

export class UserProfileBuilder {
  /**
   * Build user profile from session events and metadata
   */
  buildProfile(
    sessionId: string,
    events: any[],
    metadata?: Record<string, any>
  ): UserProfile {
    const profile: ProfileData = {
      behavior: {
        timeOnSite: 0,
        pagesVisited: 0,
        checkoutAttempts: 1,
      },
    };

    // Extract device type
    if (metadata?.deviceType) {
      profile.deviceType = metadata.deviceType;
    } else if (events[0]?.metadata?.deviceType) {
      profile.deviceType = events[0].metadata.deviceType;
    }

    // Extract browser
    if (metadata?.browser) {
      profile.browser = metadata.browser;
    } else if (events[0]?.metadata?.browser) {
      profile.browser = events[0].metadata.browser;
    }

    // Extract location
    if (metadata?.location) {
      profile.location = metadata.location;
    } else if (events[0]?.metadata?.location) {
      profile.location = events[0].metadata.location;
    }

    // Calculate behavior metrics
    const sessionStart = events[0] ? new Date(events[0].timestamp) : new Date();
    const now = new Date();
    profile.behavior.timeOnSite = (now.getTime() - sessionStart.getTime()) / 1000;

    // Count unique steps visited
    const stepsVisited = new Set(events.map((e) => e.step).filter(Boolean));
    profile.behavior.pagesVisited = stepsVisited.size;

    // Count checkout attempts (checkout_start events)
    const checkoutStarts = events.filter(
      (e) => e.event_type === 'checkout_start' || e.event_type === 'checkout_started'
    ).length;
    profile.behavior.checkoutAttempts = checkoutStarts;

    // Infer intent from behavior
    profile.inferredIntent = this.inferIntent(profile, events);

    // Extract preferences from historical data if available
    if (metadata?.preferences) {
      profile.preferences = metadata.preferences;
    }

    return {
      sessionId,
      deviceType: profile.deviceType || 'desktop',
      browser: profile.browser || 'unknown',
      location: profile.location,
      behavior: profile.behavior,
      preferences: profile.preferences,
      inferredIntent: profile.inferredIntent,
    };
  }

  /**
   * Infer user intent from behavior patterns
   */
  private inferIntent(
    profile: ProfileData,
    events: any[]
  ): UserProfile['inferredIntent'] {
    const intent: UserProfile['inferredIntent'] = {
      urgency: 'low',
      priceSensitivity: 'medium',
      devicePreference: profile.deviceType || 'desktop',
    };

    // Urgency: based on time spent and speed of progression
    const timeOnSite = profile.behavior.timeOnSite;
    const stepsVisited = profile.behavior.pagesVisited;
    
    if (timeOnSite < 60 && stepsVisited >= 3) {
      // Fast progression = high urgency
      intent.urgency = 'high';
    } else if (timeOnSite < 180 && stepsVisited >= 2) {
      intent.urgency = 'medium';
    }

    // Check for errors - if many errors, might be price sensitive (looking for best deal)
    const errorCount = events.filter((e) => e.event_type === 'error_occurred').length;
    if (errorCount > 2) {
      intent.priceSensitivity = 'high';
    }

    // Check for coupon usage attempts
    const couponEvents = events.filter((e) => 
      e.event_type === 'coupon_applied' || 
      e.metadata?.couponCode
    );
    if (couponEvents.length > 0) {
      intent.priceSensitivity = 'high';
    }

    // Device preference
    intent.devicePreference = profile.deviceType || 'desktop';

    return intent;
  }

  /**
   * Update profile with new data
   */
  updateProfile(
    currentProfile: UserProfile,
    newData: Partial<ProfileData>
  ): UserProfile {
    return {
      ...currentProfile,
      deviceType: newData.deviceType || currentProfile.deviceType,
      browser: newData.browser || currentProfile.browser,
      location: newData.location || currentProfile.location,
      behavior: {
        ...currentProfile.behavior,
        ...newData.behavior,
      },
      preferences: {
        ...currentProfile.preferences,
        ...newData.preferences,
      },
      inferredIntent: {
        ...currentProfile.inferredIntent,
        ...newData.inferredIntent,
      },
    };
  }

  /**
   * Extract preferences from historical checkout data
   */
  extractPreferences(historicalEvents: any[]): UserProfile['preferences'] {
    const preferences: UserProfile['preferences'] = {};

    // Find most used payment method
    const paymentMethods = historicalEvents
      .filter((e) => e.event_type === 'payment_method_selected')
      .map((e) => e.metadata?.paymentMethod || e.metadata?.payment_method)
      .filter(Boolean);

    if (paymentMethods.length > 0) {
      const methodCounts = paymentMethods.reduce((acc, method) => {
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      preferences.preferredPaymentMethod = Object.entries(methodCounts)
        .sort(([, a], [, b]) => b - a)[0][0];
    }

    // Find most used shipping method
    const shippingMethods = historicalEvents
      .filter((e) => e.event_type === 'shipping_option_selected')
      .map((e) => e.metadata?.shippingMethod || e.metadata?.shipping_method)
      .filter(Boolean);

    if (shippingMethods.length > 0) {
      const methodCounts = shippingMethods.reduce((acc, method) => {
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      preferences.preferredShippingMethod = Object.entries(methodCounts)
        .sort(([, a], [, b]) => b - a)[0][0];
    }

    return preferences;
  }
}

