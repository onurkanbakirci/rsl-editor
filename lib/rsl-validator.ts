import { RslContent, RslLicense, RslMetadata } from './rsl-generator';

// Strategy Pattern Implementation for Validation

/**
 * Interface for validation strategies
 */
interface ValidationStrategy {
  validate(contents: RslContent[]): ValidationResult[];
}

/**
 * Validation result interface
 */
interface ValidationResult {
  type: 'error' | 'warning' | 'info';
  message: string;
  context?: string;
}

/**
 * Basic validation strategy - checks essential fields
 */
class BasicValidationStrategy implements ValidationStrategy {
  validate(contents: RslContent[]): ValidationResult[] {
    const results: ValidationResult[] = [];

    if (contents.length === 0) {
      results.push({
        type: 'error',
        message: 'No content provided for RSL generation'
      });
      return results;
    }

    contents.forEach((content, index) => {
      if (!content.url) {
        results.push({
          type: 'error',
          message: `Content at index ${index} is missing URL`
        });
      }

      if (!content.rsl.licenses || content.rsl.licenses.length === 0) {
        results.push({
          type: 'error',
          message: `Content "${content.url}" has no licenses configured`
        });
      }

      content.rsl.licenses?.forEach((license, licenseIndex) => {
        if (!license.id) {
          results.push({
            type: 'error',
            message: `License at index ${licenseIndex} for "${content.url}" is missing ID`,
            context: content.url
          });
        }
      });
    });

    return results;
  }
}

/**
 * Comprehensive validation strategy - includes business logic validation
 */
class ComprehensiveValidationStrategy implements ValidationStrategy {
  validate(contents: RslContent[]): ValidationResult[] {
    const basicValidator = new BasicValidationStrategy();
    const results = basicValidator.validate(contents);

    // Add comprehensive validations
    contents.forEach((content) => {
      this.validateContent(content, results);
    });

    return results;
  }

  private validateContent(content: RslContent, results: ValidationResult[]): void {
    const { rsl } = content;

    // Validate URL format
    if (content.url && !this.isValidUrl(content.url)) {
      results.push({
        type: 'warning',
        message: `URL "${content.url}" may not be properly formatted`,
        context: content.url
      });
    }

    // Validate licenses
    rsl.licenses?.forEach((license, index) => {
      this.validateLicense(license, content.url, index, results);
    });

    // Validate metadata
    if (rsl.metadata) {
      this.validateMetadata(rsl.metadata, content.url, results);
    }
  }

  private validateLicense(license: RslLicense, contentUrl: string, index: number, results: ValidationResult[]): void {
    const context = `${contentUrl} - License ${index + 1}`;

    // Check for conflicting permits and prohibits
    if (license.permits && license.prohibits) {
      const permitUsage = license.permits.usage || [];
      const prohibitUsage = license.prohibits.usage || [];

      const conflicts = permitUsage.filter(usage => prohibitUsage.includes(usage));
      if (conflicts.length > 0) {
        results.push({
          type: 'error',
          message: `License has conflicting permits and prohibits for usage: ${conflicts.join(', ')}`,
          context
        });
      }
    }

    // Validate payment information
    if (license.payment) {
      this.validatePayment(license.payment, context, results);
    }

    // Check for empty permits and prohibits
    const hasPermits = license.permits && (
      (license.permits.usage?.length || 0) > 0 ||
      (license.permits.user?.length || 0) > 0 ||
      (license.permits.geo?.length || 0) > 0
    );

    const hasProhibits = license.prohibits && (
      (license.prohibits.usage?.length || 0) > 0 ||
      (license.prohibits.user?.length || 0) > 0 ||
      (license.prohibits.geo?.length || 0) > 0
    );

    if (!hasPermits && !hasProhibits) {
      results.push({
        type: 'warning',
        message: 'License has no permits or prohibits defined',
        context
      });
    }
  }

  private validatePayment(payment: NonNullable<RslLicense['payment']>, context: string, results: ValidationResult[]): void {
    if (payment.type !== 'free') {
      if (!payment.amount && !payment.customUrl && !payment.standardUrls?.length) {
        results.push({
          type: 'warning',
          message: `Payment type "${payment.type}" specified but no payment details provided`,
          context
        });
      }

      if (payment.amount && !payment.currency) {
        results.push({
          type: 'error',
          message: 'Payment amount specified but currency is missing',
          context
        });
      }
    }

    // Validate URLs
    payment.standardUrls?.forEach((url, index) => {
      if (!this.isValidUrl(url)) {
        results.push({
          type: 'warning',
          message: `Standard payment URL ${index + 1} may not be properly formatted: ${url}`,
          context
        });
      }
    });

    if (payment.customUrl && !this.isValidUrl(payment.customUrl)) {
      results.push({
        type: 'warning',
        message: `Custom payment URL may not be properly formatted: ${payment.customUrl}`,
        context
      });
    }
  }

  private validateMetadata(metadata: RslMetadata, contentUrl: string, results: ValidationResult[]): void {
    const context = `${contentUrl} - Metadata`;

    // Validate URLs
    if (metadata.schemaUrl && !this.isValidUrl(metadata.schemaUrl)) {
      results.push({
        type: 'warning',
        message: `Schema URL may not be properly formatted: ${metadata.schemaUrl}`,
        context
      });
    }

    if (metadata.contactUrl && !this.isValidUrl(metadata.contactUrl)) {
      results.push({
        type: 'warning',
        message: `Contact URL may not be properly formatted: ${metadata.contactUrl}`,
        context
      });
    }

    if (metadata.termsUrl && !this.isValidUrl(metadata.termsUrl)) {
      results.push({
        type: 'warning',
        message: `Terms URL may not be properly formatted: ${metadata.termsUrl}`,
        context
      });
    }

    // Validate email
    if (metadata.contactEmail && !this.isValidEmail(metadata.contactEmail)) {
      results.push({
        type: 'warning',
        message: `Contact email may not be properly formatted: ${metadata.contactEmail}`,
        context
      });
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Validation context class that uses different strategies
 */
export class RslValidator {
  private strategy: ValidationStrategy;

  constructor(strategy: ValidationStrategy = new BasicValidationStrategy()) {
    this.strategy = strategy;
  }

  setStrategy(strategy: ValidationStrategy): void {
    this.strategy = strategy;
  }

  validate(contents: RslContent[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    results: ValidationResult[];
  } {
    const results = this.strategy.validate(contents);

    const errors = results.filter(r => r.type === 'error').map(r => r.message);
    const warnings = results.filter(r => r.type === 'warning').map(r => r.message);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      results
    };
  }
}

/**
 * Validates RSL data before generation (backward compatibility)
 */
export function validateRslData(contents: RslContent[]): {
  isValid: boolean;
  errors: string[];
} {
  const validator = new RslValidator(new BasicValidationStrategy());
  const result = validator.validate(contents);

  return {
    isValid: result.isValid,
    errors: result.errors
  };
}

/**
 * Comprehensive validation with warnings
 */
export function validateRslDataComprehensive(contents: RslContent[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  results: ValidationResult[];
} {
  const validator = new RslValidator(new ComprehensiveValidationStrategy());
  return validator.validate(contents);
}

// Export the validation strategies for advanced usage
export type { ValidationStrategy, ValidationResult };
export { BasicValidationStrategy, ComprehensiveValidationStrategy };
