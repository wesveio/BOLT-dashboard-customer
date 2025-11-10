/**
 * VTEX Validation Service
 * 
 * Validates VTEX account credentials and connectivity.
 * Tests API access and verifies required permissions.
 */

export interface VTEXValidationResult {
  isValid: boolean;
  accountName: string;
  isAccessible: boolean;
  hasRequiredPermissions: boolean;
  errors: string[];
  warnings: string[];
}

// Cache for validation results (5 minutes TTL)
const validationCache = new Map<string, { result: VTEXValidationResult; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Validate VTEX account credentials and connectivity
 */
export async function validateVTEXAccount(
  vtexAccountName: string,
  vtexAppKey?: string,
  vtexAppToken?: string
): Promise<VTEXValidationResult> {
  // Check cache first
  const cacheKey = `${vtexAccountName}-${vtexAppKey || 'no-key'}`;
  const cached = validationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation: account name format
  if (!vtexAccountName || vtexAccountName.length < 3) {
    errors.push('Invalid VTEX account name format');
    const result: VTEXValidationResult = {
      isValid: false,
      accountName: vtexAccountName,
      isAccessible: false,
      hasRequiredPermissions: false,
      errors,
      warnings,
    };
    return result;
  }

  // Test connectivity to VTEX API
  let isAccessible = false;
  let hasRequiredPermissions = false;

  if (vtexAppKey && vtexAppToken) {
    try {
      // Test basic API access
      const testUrl = `https://${vtexAccountName}.vtexcommercestable.com.br/api/oms/pvt/orders`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'X-VTEX-API-AppKey': vtexAppKey,
          'X-VTEX-API-AppToken': vtexAppToken,
          'Accept': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 seconds
      });

      if (response.ok || response.status === 401 || response.status === 403) {
        // 401/403 means the API is accessible but credentials might be wrong
        // 200 means it's working
        isAccessible = true;

        if (response.ok) {
          hasRequiredPermissions = true;
        } else if (response.status === 401) {
          errors.push('Invalid VTEX API credentials');
        } else if (response.status === 403) {
          warnings.push('VTEX API credentials may not have required permissions');
        }
      } else {
        errors.push(`VTEX API returned status ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        errors.push('VTEX API request timeout');
      } else {
        errors.push(`Failed to connect to VTEX API: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } else {
    warnings.push('VTEX API credentials not provided - skipping connectivity test');
  }

  // Test account name exists (basic check via domain)
  try {
    const accountUrl = `https://${vtexAccountName}.vtexcommercestable.com.br`;
    const response = await fetch(accountUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 seconds
    });

    // If we get any response (even 404), the domain exists
    if (response.status !== 0) {
      isAccessible = true;
    } else {
      warnings.push('Could not verify VTEX account domain');
    }
  } catch (error) {
    warnings.push('Could not verify VTEX account domain accessibility');
  }

  const result: VTEXValidationResult = {
    isValid: errors.length === 0,
    accountName: vtexAccountName,
    isAccessible,
    hasRequiredPermissions,
    errors,
    warnings,
  };

  // Cache the result
  validationCache.set(cacheKey, {
    result,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return result;
}

/**
 * Clear validation cache for an account
 */
export function clearValidationCache(vtexAccountName: string): void {
  const keysToDelete: string[] = [];
  for (const [key] of Array.from(validationCache.entries())) {
    if (key.startsWith(vtexAccountName)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => validationCache.delete(key));
}

/**
 * Clear all validation cache
 */
export function clearAllValidationCache(): void {
  validationCache.clear();
}

