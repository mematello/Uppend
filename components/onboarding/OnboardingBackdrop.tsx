export default function OnboardingBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(to right, var(--hairline-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--hairline-subtle) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    />
  );
}
