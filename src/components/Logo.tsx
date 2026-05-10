export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg flex items-center justify-center"
    >
      <div
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #5856D6, #AF52DE)",
          borderRadius: size * 0.28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 32 32" fill="none">
          <path d="M6 24V8L11 16L16 8L21 16L26 8V24" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
