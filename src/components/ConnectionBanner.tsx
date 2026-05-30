interface ConnectionBannerProps {
  isConnected: boolean;
}

export default function ConnectionBanner({ isConnected }: ConnectionBannerProps) {
  if (isConnected) return null;

  return (
    <div className="bg-amber-900/50 border border-amber-600/40 text-amber-200 text-xs px-4 py-2 flex items-center gap-2 flex-shrink-0">
      <span className="animate-spin">⟳</span>
      <span>
        <strong>Connecting to sync server...</strong> — Video player works offline, but sync
        requires the backend. See README for setup.
      </span>
    </div>
  );
}
