import { describe, it, expect } from 'vitest';
import { parseProviderError } from '../lib/ai/models';

describe('parseProviderError timeout & network error detection', () => {
  describe('Timeout and Network Error Shapes', () => {
    it('classifies AbortError (DOMException / Error) as TEMPORARY_PROVIDER with retryAfterSeconds 30', () => {
      const err = new DOMException('This operation was aborted', 'AbortError');
      const parsed = parseProviderError(err);

      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
      expect(parsed.retryAfterSeconds).toBe(30);
      expect(parsed.statusCode).toBeNull();
    });

    it('classifies plain object or Error with name AbortError', () => {
      const err = new Error('This operation was aborted');
      err.name = 'AbortError';
      const parsed = parseProviderError(err);

      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
      expect(parsed.retryAfterSeconds).toBe(30);
    });

    it('classifies TimeoutError as TEMPORARY_PROVIDER with retryAfterSeconds 30', () => {
      const err = new DOMException('The operation was aborted due to timeout', 'TimeoutError');
      const parsed = parseProviderError(err);

      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
      expect(parsed.retryAfterSeconds).toBe(30);
      expect(parsed.statusCode).toBeNull();
    });

    it('classifies TypeError "fetch failed" as TEMPORARY_PROVIDER with retryAfterSeconds 30', () => {
      const err = new TypeError('fetch failed');
      const parsed = parseProviderError(err);

      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
      expect(parsed.retryAfterSeconds).toBe(30);
      expect(parsed.statusCode).toBeNull();
    });

    it.each([
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'UND_ERR_CONNECT_TIMEOUT',
    ])('classifies cause code %s as TEMPORARY_PROVIDER with retryAfterSeconds 30', (code) => {
      const err = new Error('network error', { cause: { code } });
      const parsed = parseProviderError(err);

      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
      expect(parsed.retryAfterSeconds).toBe(30);
      expect(parsed.statusCode).toBeNull();
    });

    it('does not classify bare message containing "aborted" without matching name/cause/status', () => {
      const err = new Error('user aborted something manually');
      const parsed = parseProviderError(err);

      expect(parsed.errorClass).toBe('TERMINAL_EXECUTION');
      expect(parsed.isUnavailableError).toBe(false);
      expect(parsed.isQuotaError).toBe(false);
      expect(parsed.retryAfterSeconds).toBeNull();
    });
  });

  describe('HTTP Status Precedence & Regressions', () => {
    it('classifies HTTP 429 as TEMPORARY_PROVIDER with isQuotaError=true', () => {
      const parsed = parseProviderError({ status: 429, message: 'Too Many Requests' });

      expect(parsed.statusCode).toBe(429);
      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isQuotaError).toBe(true);
      expect(parsed.isUnavailableError).toBe(false);
    });

    it('classifies HTTP 503 as TEMPORARY_PROVIDER with isUnavailableError=true', () => {
      const parsed = parseProviderError({ status: 503, message: 'Service Unavailable' });

      expect(parsed.statusCode).toBe(503);
      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
    });

    it('classifies HTTP 500 as TEMPORARY_PROVIDER with isUnavailableError=true', () => {
      const parsed = parseProviderError({ status: 500, message: 'Internal Server Error' });

      expect(parsed.statusCode).toBe(500);
      expect(parsed.errorClass).toBe('TEMPORARY_PROVIDER');
      expect(parsed.isUnavailableError).toBe(true);
      expect(parsed.isQuotaError).toBe(false);
    });

    it('classifies HTTP 404 as PERMANENT_PROVIDER', () => {
      const parsed = parseProviderError({ status: 404, message: 'Model Not Found' });

      expect(parsed.statusCode).toBe(404);
      expect(parsed.errorClass).toBe('PERMANENT_PROVIDER');
      expect(parsed.isUnavailableError).toBe(false);
      expect(parsed.isQuotaError).toBe(false);
    });

    it('classifies HTTP 400 model deprecation as PERMANENT_PROVIDER', () => {
      const parsed = parseProviderError({ status: 400, message: 'The model `gemini-old` is deprecated and retired.' });

      expect(parsed.statusCode).toBe(400);
      expect(parsed.errorClass).toBe('PERMANENT_PROVIDER');
      expect(parsed.isUnavailableError).toBe(false);
      expect(parsed.isQuotaError).toBe(false);
    });

    it('classifies HTTP 400 invalid request body as TERMINAL_EXECUTION', () => {
      const parsed = parseProviderError({ status: 400, message: 'Invalid JSON request payload.' });

      expect(parsed.statusCode).toBe(400);
      expect(parsed.errorClass).toBe('TERMINAL_EXECUTION');
      expect(parsed.isUnavailableError).toBe(false);
      expect(parsed.isQuotaError).toBe(false);
    });

    it('preserves HTTP status classification even if name is AbortError', () => {
      const err = { status: 400, name: 'AbortError', message: 'Invalid parameter format' };
      const parsed = parseProviderError(err);

      expect(parsed.statusCode).toBe(400);
      expect(parsed.errorClass).toBe('TERMINAL_EXECUTION');
      expect(parsed.isUnavailableError).toBe(false);
    });
  });
});
