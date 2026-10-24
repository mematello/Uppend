export function resolveBackNavigation(historyLength: number, isDirty: boolean): 'back' | 'dashboard' {
  return historyLength > (isDirty ? 2 : 1) ? 'back' : 'dashboard';
}
