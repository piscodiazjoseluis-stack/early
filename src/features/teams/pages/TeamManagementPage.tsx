import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Ellipsis,
  FolderKanban,
  House,
  Info,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserPlus,
  Users,
  UsersRound,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { SidebarFooter } from '@/components/layout/SidebarFooter'
import { SidebarBrandMedia } from '@/components/layout/SidebarMedia'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUnreadNotifications } from '@/features/collaborator/hooks/useUnreadNotifications'
import { cn } from '@/lib/utils'

import { TeamActionModal, type TeamAction } from '../components/TeamActionModal'
import { teamPreviewData } from '../data/team-preview-data'
import { getTeams } from '../services/team-service'
import type { TeamMemberView, TeamView } from '../types'

const portfolioNavigation = [
  { label: 'Resumen ejecutivo', icon: House, path: '/panel' },
  { label: 'Aprobaciones finales', icon: BriefcaseBusiness, path: '/aprobaciones' },
  { label: 'Calendario global', icon: FolderKanban, path: '/calendario' },
  { label: 'Equipos', icon: UsersRound, path: '/equipos' },
  { label: 'BI y analítica', icon: BarChart3, path: '/bi-global' },
  { label: 'Análisis inteligente', icon: RotateCcw, path: '/analisis-inteligente' },
  { label: 'Excepciones y auditoría', icon: Settings, path: '/excepciones-auditoria' },
  { label: 'Notificaciones', icon: Bell, path: '/notificaciones' },
]

const eligibilityPresentation = {
  eligible: { label: 'Elegible', tone: 'success' as const, dot: 'bg-success' },
  not_eligible: { label: 'No elegible', tone: 'danger' as const, dot: 'bg-danger' },
  under_review: { label: 'En evaluación', tone: 'warning' as const, dot: 'bg-warning' },
}

function TeamManagementContent({
  preview,
  navigate,
}: {
  preview: boolean
  navigate: (path: string) => void
}) {
  const { access } = useAuth()
  const unreadNotifications = useUnreadNotifications()
  const [query, setQuery] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<TeamAction | null>(null)
  const [detailTeam, setDetailTeam] = useState<TeamView | null>(null)
  const canManage =
    preview ||
    Boolean(access?.roles.some((role) => role === 'ADMIN' || role === 'PORTFOLIO_MANAGER'))
  const portfolioName = preview
    ? 'Maria Luisa Temoche'
    : (access?.profile.full_name ?? 'Portfolio Manager')
  const portfolioJob = preview
    ? 'Portfolio Manager'
    : (access?.profile.job_title ?? 'Portfolio Manager')

  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
    enabled: !preview,
  })

  const teams = useMemo(
    () => (preview ? teamPreviewData : (teamsQuery.data ?? [])),
    [preview, teamsQuery.data],
  )
  const filteredTeams = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    if (!normalized) return teams
    return teams.filter(
      (team) =>
        team.name.toLocaleLowerCase('es').includes(normalized) ||
        team.members.some((member) => member.fullName.toLocaleLowerCase('es').includes(normalized)),
    )
  }, [query, teams])
  const selectedTeam =
    teams.find((team) => team.id === selectedTeamId) ?? filteredTeams[0] ?? teams[0]

  return (
    <div className="app-shell bg-background min-h-screen lg:grid lg:grid-cols-[268px_minmax(0,1fr)]">
      {sidebarOpen ? (
        <button
          type="button"
          className="bg-primary-strong/40 fixed inset-0 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar navegación"
        />
      ) : null}
      <aside
        className={cn(
          'app-sidebar fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col overflow-hidden border-r px-4 py-4 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="sidebar-brand-row flex shrink-0 items-start justify-between gap-2">
          <SidebarBrandMedia />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close grid size-9 shrink-0 place-items-center rounded-lg lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav aria-label="Navegación de portfolio" className="sidebar-nav-scroll mt-3 space-y-1.5">
          {portfolioNavigation.map(({ label, icon: Icon, path }) => {
            const active =
              window.location.pathname === path ||
              (preview && path === '/equipos' && window.location.pathname.endsWith('/equipos'))
            return (
              <button
                key={label}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => navigate(path)}
                className={cn(
                  'sidebar-nav-item flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-bold',
                  active
                    ? 'sidebar-nav-item-active bg-primary'
                    : 'sidebar-nav-item-idle',
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span>{label}</span>
                {label === 'Notificaciones' && unreadNotifications > 0 ? (
                  <span
                    className="sidebar-notification-count ml-auto"
                    aria-label={`${unreadNotifications} notificaciones pendientes`}
                  >
                    {unreadNotifications}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>
        <SidebarFooter onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <div className="min-w-0">
        <header className="border-sidebar-border flex min-h-[118px] items-center justify-between gap-5 border-b bg-white px-4 sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="border-border text-primary grid size-11 shrink-0 place-items-center rounded-xl border lg:hidden"
              aria-label="Abrir navegación"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <h1 className="text-primary-strong text-2xl font-extrabold">Gestión de equipos</h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                Administra la estructura de equipos, roles y elegibilidad del PMO.
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <label className="border-border focus-within:border-electric-blue flex h-11 w-[270px] items-center gap-2 rounded-xl border px-3 transition">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre"
                className="text-primary min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <Search className="text-muted-foreground size-5" />
            </label>
            <button
              type="button"
              onClick={() => navigate('/notificaciones')}
              className="text-primary hover:bg-info-soft relative grid size-11 place-items-center rounded-xl transition"
              aria-label={`Notificaciones, ${unreadNotifications} pendientes`}
            >
              <Bell className="size-5" />
              {unreadNotifications > 0 ? (
                <span className="bg-electric-blue absolute mt-[-30px] ml-[30px] grid size-5 place-items-center rounded-full text-[10px] font-extrabold text-white">
                  {unreadNotifications}
                </span>
              ) : null}
            </button>
            <span className="relative grid size-11 place-items-center rounded-full bg-[#f0e7e3] text-xs font-extrabold text-[#704435]">
              {portfolioName
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')}
              <span className="border-surface bg-success absolute right-0 bottom-0 size-3.5 rounded-full border-2" />
            </span>
            <div className="hidden xl:block">
              <p className="text-primary text-xs font-extrabold">{portfolioName}</p>
              <p className="text-muted-foreground text-[11px]">{portfolioJob}</p>
            </div>
            <ChevronDown className="text-muted-foreground size-4" />
          </div>
        </header>

        {preview ? (
          <div className="preview-mode-banner" role="status">
            Vista de demostración visual · Los datos mostrados son simulados y no corresponden a
            una sesión real de Supabase.
          </div>
        ) : null}

        <main className="app-main p-4 sm:p-6 lg:p-7">
          <label className="border-border mb-4 flex h-11 items-center gap-2 rounded-xl border bg-white px-3 md:hidden">
            <Search className="text-muted-foreground size-5" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>

          <div className="mb-5 flex flex-wrap gap-2.5">
            <Button disabled={!canManage} onClick={() => setActiveAction('create')}>
              <Plus className="size-4" />
              Crear equipo
            </Button>
            <Button
              variant="secondary"
              disabled={!canManage || !selectedTeam}
              onClick={() => setActiveAction('edit')}
            >
              <Pencil className="size-4" />
              Editar equipo
            </Button>
            <Button
              variant="secondary"
              disabled={!canManage || !selectedTeam}
              onClick={() => setActiveAction('leader')}
            >
              <UserPlus className="size-4" />
              Asignar jefe
            </Button>
            <Button
              variant="secondary"
              disabled={!canManage || !selectedTeam}
              onClick={() => setActiveAction('member')}
            >
              <UserPlus className="size-4" />
              Agregar integrante
            </Button>
            <Button
              variant="secondary"
              disabled={!canManage || !selectedTeam}
              onClick={() => setActiveAction('eligibility')}
            >
              <ShieldCheck className="size-4" />
              Configurar elegibilidad
            </Button>
            <button
              type="button"
              className="text-muted-foreground ml-auto grid size-11 place-items-center rounded-xl transition hover:bg-white"
              aria-label="Más acciones"
            >
              <Ellipsis className="size-5" />
            </button>
          </div>

          {!canManage && !preview ? (
            <div className="border-warning/30 bg-warning-soft text-primary mb-4 rounded-xl border px-4 py-3 text-xs">
              Puedes consultar la estructura. Las modificaciones están reservadas a Portfolio y
              Administración.
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
            <section className="space-y-3" aria-label="Equipos">
              {teamsQuery.isLoading && !preview ? <TeamLoadingState /> : null}
              {teamsQuery.isError && !preview ? (
                <Card className="p-6">
                  <p className="text-danger font-extrabold">No pudimos cargar los equipos.</p>
                  <button
                    type="button"
                    onClick={() => void teamsQuery.refetch()}
                    className="text-electric-blue mt-3 flex items-center gap-2 text-sm font-bold"
                  >
                    <RefreshCw className="size-4" />
                    Reintentar
                  </button>
                </Card>
              ) : null}
              {filteredTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  selected={selectedTeam?.id === team.id}
                  onSelect={() => setSelectedTeamId(team.id)}
                />
              ))}
              {!teamsQuery.isLoading && filteredTeams.length === 0 ? (
                <Card className="p-8 text-center">
                  <UsersRound className="text-electric-blue mx-auto size-8" />
                  <p className="text-primary mt-3 font-extrabold">No encontramos equipos</p>
                  <p className="text-muted-foreground mt-1 text-sm">Prueba con otra búsqueda.</p>
                </Card>
              ) : null}
            </section>
            <RotationPanel
              team={selectedTeam}
              onViewDetails={() => selectedTeam && setDetailTeam(selectedTeam)}
            />
          </div>
        </main>

        <footer className="border-sidebar-border text-muted-foreground flex items-center justify-between gap-4 border-t bg-white px-5 py-4 text-[11px]">
          <span className="flex items-center gap-2">
            <Info className="text-electric-blue size-4" />
            La elegibilidad se actualiza según el cumplimiento de criterios definidos por el PMO.
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            Última actualización: hace 5 minutos
            <RefreshCw className="size-3.5" />
          </span>
        </footer>
        <TeamActionModal
          key={`${activeAction ?? 'none'}-${selectedTeam?.id ?? 'none'}`}
          action={activeAction}
          team={selectedTeam}
          preview={preview}
          onClose={() => setActiveAction(null)}
        />
        <TeamDetailModal team={detailTeam} onClose={() => setDetailTeam(null)} />
      </div>
    </div>
  )
}

export function TeamManagementPage() {
  const navigate = useNavigate()
  return (
    <TeamManagementContent
      preview={false}
      navigate={(path) => {
        void navigate(path)
      }}
    />
  )
}

export function TeamManagementPreviewPage() {
  return (
    <TeamManagementContent
      preview
      navigate={(path) => {
        window.location.assign(path)
      }}
    />
  )
}

function TeamCard({
  team,
  selected,
  onSelect,
}: {
  team: TeamView
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      className={cn(
        'grid cursor-pointer overflow-hidden md:grid-cols-[270px_minmax(0,1fr)]',
        selected && 'border-electric-blue/45 shadow-soft',
      )}
      onClick={onSelect}
    >
      <div className="border-border p-5 md:border-r">
        <div className="flex items-center gap-3">
          <span className="bg-info-soft text-electric-blue grid size-12 place-items-center rounded-full">
            <UsersRound className="size-6" />
          </span>
          <div>
            <h2 className="text-primary font-extrabold">{team.name}</h2>
            <p className="text-muted-foreground mt-1 text-xs">Jefe directo</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Avatar name={team.leaderName} />
          <div>
            <p className="text-primary text-sm font-extrabold">{team.leaderName}</p>
            <p className="text-muted-foreground text-xs">{team.leaderJobTitle}</p>
          </div>
        </div>
        <p className="text-muted-foreground mt-5 flex items-center gap-2 text-xs">
          <Users className="size-4" />
          {team.members.length} integrantes
        </p>
      </div>
      <div className="p-4 sm:p-5">
        <p className="text-primary mb-2 text-xs font-extrabold">Integrantes</p>
        <div className="bounded-records divide-border divide-y">
          {team.members.map((member) => (
            <MemberRow key={member.membershipId} member={member} />
          ))}
          {team.members.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              Este equipo aún no tiene integrantes activos.
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

function MemberRow({ member }: { member: TeamMemberView }) {
  const status = getEligibilityStatus(member)
  const statusPresentation = eligibilityPresentation[status]

  return (
    <div className="hover:bg-info-soft/40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg py-2.5 transition sm:grid-cols-[minmax(0,1fr)_116px_132px_28px] sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={member.fullName} />
        <div className="min-w-0">
          <p className="text-primary truncate text-xs font-extrabold">{member.fullName}</p>
          <p className="text-muted-foreground truncate text-[11px]">{member.jobTitle}</p>
        </div>
      </div>
      <Badge tone={statusPresentation.tone} className="w-full justify-center text-center">
        {statusPresentation.label}
      </Badge>
      <span className="text-muted-foreground hidden items-center justify-center gap-1.5 text-[11px] sm:flex">
        <Star className="text-warning size-4 fill-current" />
        Prioridad {member.priority}
      </span>
      <button
        type="button"
        className="text-muted-foreground hover:text-electric-blue hidden sm:block"
        aria-label={`Acciones de ${member.fullName}`}
      >
        <Ellipsis className="size-4" />
      </button>
    </div>
  )
}

function RotationPanel({
  team,
  onViewDetails,
}: {
  team?: TeamView
  onViewDetails: () => void
}) {
  const eligible =
    team?.members.filter((member) => getEligibilityStatus(member) === 'eligible') ?? []
  const notEligible =
    team?.members.filter((member) => getEligibilityStatus(member) === 'not_eligible') ?? []
  const underReview =
    team?.members.filter((member) => getEligibilityStatus(member) === 'under_review') ?? []
  const nextMember = eligible[0]
  const waitingMembers =
    team?.members.filter(
      (member) => member.participatesInRotation && member.userId !== nextMember?.userId,
    ) ?? []

  return (
    <Card className="h-fit p-5">
      <h2 className="text-primary flex items-center gap-2 text-sm font-extrabold">
        Siguiente prioridad de rotación
        <Info className="text-muted-foreground size-4" />
      </h2>
      {team ? (
        <>
          <div className="bg-info-soft text-primary mt-4 flex items-center gap-2 rounded-t-xl p-4 text-sm font-extrabold">
            <UsersRound className="text-electric-blue size-5" />
            {team.name}
          </div>
          <div className="border-border rounded-b-xl border border-t-0 p-4">
            <p className="text-muted-foreground text-[11px] font-bold">Próximo en rotación</p>
            {nextMember ? (
              <div className="border-border mt-3 flex items-center gap-3 rounded-xl border p-3">
                <Avatar name={nextMember.fullName} large />
                <div>
                  <p className="text-primary text-xs font-extrabold">{nextMember.fullName}</p>
                  <p className="text-muted-foreground text-[11px]">{nextMember.jobTitle}</p>
                  <Badge tone="success" className="mt-2">
                    Elegible
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-5 text-center text-xs">
                Sin personas elegibles.
              </p>
            )}
          </div>
          <div className="mt-5">
            <p className="text-primary text-xs font-extrabold">En lista de espera</p>
            <div className="mt-2 space-y-2">
              {waitingMembers.length > 0 ? (
                waitingMembers.slice(0, 2).map((member) => (
                  <div
                    key={member.membershipId}
                    className="border-border hover:border-electric-blue/40 hover:bg-info-soft/45 flex items-center gap-3 rounded-xl border p-3 transition"
                  >
                    <Avatar name={member.fullName} />
                    <div className="min-w-0 flex-1">
                      <p className="text-primary truncate text-xs font-extrabold">
                        {member.fullName}
                      </p>
                      <p className="text-muted-foreground truncate text-[11px]">
                        {member.jobTitle}
                      </p>
                    </div>
                    <div className="shrink-0 space-y-1.5 text-right text-[10px]">
                      <EligibilityIndicator member={member} />
                      <span className="text-muted-foreground flex items-center justify-end gap-1 capitalize">
                        <Star className="text-warning size-3.5 fill-current" />
                        Prioridad {member.priority}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground border-border rounded-xl border border-dashed p-4 text-center text-xs">
                  No hay integrantes en espera.
                </p>
              )}
            </div>
          </div>
          <div className="border-border mt-4 rounded-xl border p-4">
            <p className="text-primary text-xs font-extrabold">Resumen del equipo</p>
            <dl className="text-muted-foreground mt-3 space-y-2 text-xs">
              <SummaryRow label="Total integrantes" value={team.members.length} />
              <SummaryRow label="Elegibles" value={eligible.length} tone="success" />
              <SummaryRow label="No elegibles" value={notEligible.length} tone="danger" />
              <SummaryRow label="En evaluación" value={underReview.length} tone="warning" />
            </dl>
          </div>
          <Button className="mt-4 w-full" onClick={onViewDetails}>
            Ver detalle del equipo
            <ChevronRight className="ml-auto size-4" />
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground py-10 text-center text-xs">Selecciona un equipo.</p>
      )}
    </Card>
  )
}

function TeamDetailModal({ team, onClose }: { team: TeamView | null; onClose: () => void }) {
  if (!team) return null
  const eligible = team.members.filter(
    (member) => getEligibilityStatus(member) === 'eligible',
  ).length
  const underReview = team.members.filter(
    (member) => getEligibilityStatus(member) === 'under_review',
  ).length
  return (
    <Modal open title={`Detalle de ${team.name}`} onClose={onClose} showFooter={false}>
      <div className="space-y-4">
        <section className="bg-info-soft/55 rounded-2xl p-4">
          <p className="text-muted-foreground text-[11px] font-bold uppercase">Jefe directo</p>
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={team.leaderName} large />
            <div>
              <p className="text-primary text-sm font-extrabold">{team.leaderName}</p>
              <p className="text-muted-foreground text-xs">{team.leaderJobTitle}</p>
            </div>
          </div>
        </section>
        <dl className="grid grid-cols-3 gap-2">
          <DetailMetric label="Integrantes" value={team.members.length} />
          <DetailMetric label="Elegibles" value={eligible} tone="text-success" />
          <DetailMetric label="En evaluación" value={underReview} tone="text-warning" />
        </dl>
        <section>
          <h3 className="text-primary text-sm font-extrabold">Integrantes y rotación</h3>
          <div className="border-border mt-2 max-h-72 divide-y overflow-y-auto rounded-xl border">
            {team.members.map((member) => (
              <div
                key={member.membershipId}
                className="hover:bg-info-soft/40 flex items-center gap-3 p-3 transition"
              >
                <Avatar name={member.fullName} />
                <div className="min-w-0 flex-1">
                  <p className="text-primary truncate text-xs font-extrabold">{member.fullName}</p>
                  <p className="text-muted-foreground truncate text-[11px]">{member.jobTitle}</p>
                </div>
                <div className="shrink-0 text-right">
                  <EligibilityIndicator member={member} />
                  <p className="text-muted-foreground mt-1 text-[10px] capitalize">
                    Prioridad {member.priority}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Cerrar detalle
        </Button>
      </div>
    </Modal>
  )
}

function DetailMetric({
  label,
  value,
  tone = 'text-primary',
}: {
  label: string
  value: number
  tone?: string
}) {
  return (
    <div className="border-border rounded-xl border p-3 text-center">
      <dt className="text-muted-foreground text-[10px] font-bold">{label}</dt>
      <dd className={`mt-1 text-xl font-extrabold ${tone}`}>{value}</dd>
    </div>
  )
}

function getEligibilityStatus(member: TeamMemberView) {
  return member.eligibilityStatus ?? (member.isEligible ? 'eligible' : 'not_eligible')
}

function EligibilityIndicator({ member }: { member: TeamMemberView }) {
  const presentation = eligibilityPresentation[getEligibilityStatus(member)]

  return (
    <span className="text-muted-foreground flex items-center justify-end gap-1.5 whitespace-nowrap">
      <span className={cn('size-2 rounded-full', presentation.dot)} aria-hidden="true" />
      {presentation.label}
    </span>
  )
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'success' | 'danger' | 'warning'
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2">
        {tone ? (
          <span
            className={cn(
              'size-2 rounded-full',
              tone === 'success' && 'bg-success',
              tone === 'danger' && 'bg-danger',
              tone === 'warning' && 'bg-warning',
            )}
          />
        ) : null}
        {label}
      </dt>
      <dd className="text-primary font-extrabold">{value}</dd>
    </div>
  )
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-[#f0e7e3] font-extrabold text-[#704435]',
        large ? 'size-12 text-sm' : 'size-9 text-xs',
      )}
    >
      {initials}
    </span>
  )
}

function TeamLoadingState() {
  return (
    <div className="space-y-3" aria-label="Cargando equipos">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="border-border h-48 animate-pulse rounded-[18px] border bg-white"
        />
      ))}
    </div>
  )
}
