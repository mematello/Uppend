export type MessageTone = 'success' | 'error';

export function messageTone(message: string): MessageTone {
  return /^\s*Error:/.test(message) ? 'error' : 'success';
}
