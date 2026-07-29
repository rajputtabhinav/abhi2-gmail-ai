export function AppBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background:
          "linear-gradient(135deg, #fdf2ec 0%, #f8d9c8 34%, #f6c9d5 62%, #dbeafe 100%)",
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.62),rgba(255,255,255,0.18)_42%,rgba(24,24,27,0.08))]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(24,24,27,0.035)_0px,rgba(24,24,27,0.035)_1px,transparent_1px,transparent_34px)]" />
    </div>
  );
}
