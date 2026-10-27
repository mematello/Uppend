export type DropzoneState = 'drag' | 'selected' | 'idle';

export function getDropzoneState(isDragging: boolean, hasFile: boolean): DropzoneState {
  if (isDragging) return 'drag';
  return hasFile ? 'selected' : 'idle';
}
