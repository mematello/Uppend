import { describe, it, expect } from 'vitest';
import { getDropzoneState } from '../lib/utils/dropzone-state';

describe('getDropzoneState helper', () => {
  it('returns "drag" when dragging and has file', () => {
    expect(getDropzoneState(true, true)).toBe('drag');
  });

  it('returns "drag" when dragging and has no file', () => {
    expect(getDropzoneState(true, false)).toBe('drag');
  });

  it('returns "selected" when not dragging and has file', () => {
    expect(getDropzoneState(false, true)).toBe('selected');
  });

  it('returns "idle" when not dragging and has no file', () => {
    expect(getDropzoneState(false, false)).toBe('idle');
  });
});
