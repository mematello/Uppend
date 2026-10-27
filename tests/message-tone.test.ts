import { describe, it, expect } from 'vitest';
import { messageTone } from '../lib/utils/message-tone';

describe('messageTone helper', () => {
  it('identifies error with timezone string', () => {
    expect(messageTone('Error: Invalid timezone string "x".')).toBe('error');
  });

  it('identifies error with permission denied', () => {
    expect(messageTone('Error: permission denied')).toBe('error');
  });

  it('identifies error with leading space', () => {
    expect(messageTone('  Error: leading space')).toBe('error');
  });

  it('identifies success for profile update', () => {
    expect(messageTone('Profile updated successfully!')).toBe('success');
  });

  it('identifies success for reminder preferences', () => {
    expect(messageTone('Reminder preferences saved!')).toBe('success');
  });

  it('identifies success for daily goal', () => {
    expect(messageTone('Daily goal saved!')).toBe('success');
  });

  it('identifies success for empty string', () => {
    expect(messageTone('')).toBe('success');
  });

  it('identifies success when "error" is not at start', () => {
    expect(messageTone('No error occurred')).toBe('success');
  });

  it('identifies success for plural "Errors:"', () => {
    expect(messageTone('Errors: plural')).toBe('success');
  });
});
