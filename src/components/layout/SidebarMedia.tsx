export function SidebarBrandMedia() {
  return (
    <div className="sidebar-brand-media" aria-label="Early Fridays PMO">
      <video
        className="sidebar-media-video"
        src="/brand/sidebar-brand-loop.webm"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
    </div>
  )
}
