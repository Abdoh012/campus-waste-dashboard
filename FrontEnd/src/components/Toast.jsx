export default function Toast({ message, visible }) {
  return (
    <div
      className={`fixed bottom-[88px] right-[25px] z-20 rounded-md bg-toast px-4 py-3 text-[12px] text-toast-foreground shadow-toast transition-all duration-300 max-[700px]:bottom-[calc(88px_+_env(safe-area-inset-bottom))] ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-[90px] opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
