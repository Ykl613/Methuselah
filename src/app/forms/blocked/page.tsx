export default function Blocked() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-bg-base">
      <div className="w-full max-w-sm bg-white border border-border rounded-2xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 bg-red-soft rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ti ti-info-circle text-2xl text-red-text" aria-hidden />
        </div>
        <h1 className="text-lg font-semibold tracking-tight mb-2">Already Registered</h1>
        <p className="text-xs text-text-muted mb-1">This email address is already registered in our system.</p>
        <p className="text-xs text-text-muted">If you need assistance, please contact us directly.</p>
        <div className="mt-5 pt-4 border-t border-border text-[10.5px] text-text-subtle flex items-center justify-center gap-1">
          <i className="ti ti-mail" aria-hidden /> support@methuselah.app
        </div>
      </div>
    </div>
  );
}
