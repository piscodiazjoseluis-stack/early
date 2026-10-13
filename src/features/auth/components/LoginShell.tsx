import { CheckCircle2, Clock3, Pause, Play, ShieldCheck, Target } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import '@/styles/login-experience.css'

const principles = [
  {
    icon: Target,
    title: 'Enfocados en lo importante',
    description: 'Priorizamos iniciativas de alto valor.',
  },
  {
    icon: CheckCircle2,
    title: 'Equipos alineados',
    description: 'Colaboración clara, comunicación abierta.',
  },
  {
    icon: Clock3,
    title: 'Tiempo que impulsa',
    description: 'Planificamos para vivir mejor los viernes.',
  },
]

/** Login-only presentation. The existing authentication form remains authoritative. */
export function LoginShell({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyPreference = () => {
      const video = videoRef.current
      if (!video) return
      if (preference.matches) video.pause()
      else void video.play().catch(() => undefined)
    }
    applyPreference()
    preference.addEventListener('change', applyPreference)
    return () => preference.removeEventListener('change', applyPreference)
  }, [])

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play().catch(() => undefined)
    else video.pause()
  }

  return (
    <main className="login-experience">
      <div className="login-layout">
        <section className="login-access" aria-labelledby="login-heading">
          <header className="login-brand">
            <img
              src="/brand/early-fridays-logo.svg"
              alt="Early Fridays PMO"
              width="224"
              height="72"
            />
          </header>
          <div className="login-form-region">{children}</div>
          <footer className="login-security">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Acceso seguro y protegido con Supabase Authentication.</span>
          </footer>
        </section>

        <aside className="login-story" aria-labelledby="login-story-heading">
          <div className="login-film">
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/brand/login-wellbeing-illustration.png"
              aria-hidden="true"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            >
              <source src="/brand/login-wellbeing-loop.mp4" type="video/mp4" />
            </video>
            <button
              type="button"
              className="login-playback"
              onClick={togglePlayback}
              aria-label={playing ? 'Pausar video' : 'Reproducir video'}
            >
              {playing ? (
                <Pause size={18} aria-hidden="true" />
              ) : (
                <Play size={18} aria-hidden="true" />
              )}
            </button>
          </div>
          <div className="login-story-copy">
            <h2 id="login-story-heading">Mejores resultados, más equilibrio.</h2>
            <p>
              Planificamos con propósito para que los viernes sean tuyos y el impacto sea de todos.
            </p>
          </div>
          <ul className="login-principles">
            {principles.map(({ icon: Icon, title, description }) => (
              <li key={title}>
                <Icon size={18} aria-hidden="true" />
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  )
}
