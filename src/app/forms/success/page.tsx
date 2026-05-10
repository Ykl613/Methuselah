export default function Success() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-bg-base">
      <div className="w-full max-w-sm bg-white border border-border rounded-2xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 bg-green-soft rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ti ti-check text-2xl text-green-text" aria-hidden />
        </div>
        <h1 className="text-lg font-semibold tracking-tight mb-2">Thank you!</h1>
        <p className="text-xs text-text-muted mb-1">Your application has been submitted successfully.</p>
        <p className="text-xs text-text-muted">We&apos;ll review and get back to you within 5 business days.</p>
        <div className="mt-5 pt-4 border-t border-border text-[10.5px] text-text-subtle flex items-center justify-center gap-1">
          <i className="ti ti-shield-check" aria-hidden /> Your data is encrypted and secure
        </div>
      </div>
    </div>
  );
}
