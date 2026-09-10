import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom'

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { PublicOnlyRoute } from '@/features/auth/components/PublicOnlyRoute'
import { RoleRoute } from '@/features/auth/components/RoleRoute'
import { REQUEST_OWNER_ROLES } from '@/features/auth/constants/role-permissions'
import { RouteErrorPage } from '@/features/dashboard/pages/RouteErrorPage'
import { RouteLoadingPage } from '@/features/dashboard/pages/RouteLoadingPage'

const routes: RouteObject[] = [
  { path: '/', element: <Navigate to="/iniciar-sesion" replace /> },
  {
    path: '/sistema-visual',
    lazy: async () => {
      const { VisualSystemPreviewPage } =
        await import('@/features/design-system/pages/VisualSystemPage')
      return { Component: VisualSystemPreviewPage }
    },
  },
  {
    path: '/sistema-visual/equipos',
    lazy: async () => {
      const { TeamManagementPreviewPage } =
        await import('@/features/teams/pages/TeamManagementPage')
      return { Component: TeamManagementPreviewPage }
    },
  },
  {
    path: '/sistema-visual/jefe',
    lazy: async () => {
      const { TeamLeaderDashboardPage } =
        await import('@/features/approvals/pages/TeamLeaderDashboardPage')
      return { Component: TeamLeaderDashboardPage }
    },
  },
  {
    path: '/sistema-visual/jefe/aprobaciones',
    lazy: async () => {
      const { ApprovalsPage } = await import('@/features/approvals/pages/ApprovalsPage')
      return { Component: ApprovalsPage }
    },
  },
  {
    path: '/sistema-visual/jefe/aprobaciones/:requestId',
    lazy: async () => {
      const { ApprovalDetailPage } = await import('@/features/approvals/pages/ApprovalDetailPage')
      return { Component: ApprovalDetailPage }
    },
  },
  {
    path: '/sistema-visual/jefe/rotacion',
    lazy: async () => {
      const { TeamRotationPage } = await import('@/features/approvals/pages/TeamRotationPage')
      return { Component: TeamRotationPage }
    },
  },
  {
    path: '/sistema-visual/jefe/calendario',
    lazy: async () => {
      const { TeamCalendarPage } = await import('@/features/approvals/pages/TeamCalendarPage')
      return { Component: TeamCalendarPage }
    },
  },
  {
    path: '/sistema-visual/jefe/bi-equipo',
    lazy: async () => {
      const { TeamAnalyticsPage } = await import('@/features/approvals/pages/TeamAnalyticsPage')
      return { Component: TeamAnalyticsPage }
    },
  },
  {
    path: '/sistema-visual/jefe/analisis-inteligente',
    lazy: async () => {
      const { TeamInsightsPage } = await import('@/features/approvals/pages/TeamInsightsPage')
      return { Component: TeamInsightsPage }
    },
  },
  {
    path: '/sistema-visual/solicitudes',
    lazy: async () => {
      const { MyRequestsPreviewPage } = await import('@/features/requests/pages/MyRequestsPage')
      return { Component: MyRequestsPreviewPage }
    },
  },
  {
    path: '/sistema-visual/solicitudes/nueva',
    lazy: async () => {
      const { NewRequestPreviewPage } = await import('@/features/requests/pages/NewRequestPage')
      return { Component: NewRequestPreviewPage }
    },
  },
  {
    path: '/sistema-visual/solicitudes/:requestId',
    lazy: async () => {
      const { RequestDetailPreviewPage } =
        await import('@/features/requests/pages/RequestDetailPage')
      return { Component: RequestDetailPreviewPage }
    },
  },
  {
    path: '/sistema-visual/solicitudes/:requestId/corregir',
    lazy: async () => {
      const { CorrectReturnedRequestPreviewPage } =
        await import('@/features/requests/pages/CorrectReturnedRequestPage')
      return { Component: CorrectReturnedRequestPreviewPage }
    },
  },
  {
    path: '/sistema-visual/calendario',
    lazy: async () => {
      const { PersonalCalendarPreviewPage } =
        await import('@/features/collaborator/pages/PersonalCalendarPage')
      return { Component: PersonalCalendarPreviewPage }
    },
  },
  {
    path: '/sistema-visual/elegibilidad',
    lazy: async () => {
      const { EligibilityPreviewPage } =
        await import('@/features/collaborator/pages/EligibilityPage')
      return { Component: EligibilityPreviewPage }
    },
  },
  {
    path: '/sistema-visual/historial',
    lazy: async () => {
      const { HistoryPreviewPage } = await import('@/features/collaborator/pages/HistoryPage')
      return { Component: HistoryPreviewPage }
    },
  },
  {
    path: '/sistema-visual/mi-equipo',
    lazy: async () => {
      const { MyTeamPreviewPage } = await import('@/features/collaborator/pages/MyTeamPage')
      return { Component: MyTeamPreviewPage }
    },
  },
  {
    path: '/sistema-visual/notificaciones',
    lazy: async () => {
      const { NotificationsPreviewPage } =
        await import('@/features/collaborator/pages/NotificationsPage')
      return { Component: NotificationsPreviewPage }
    },
  },
  {
    path: '/sistema-visual/perfil',
    lazy: async () => {
      const { ProfilePreviewPage } = await import('@/features/collaborator/pages/ProfilePage')
      return { Component: ProfilePreviewPage }
    },
  },
  {
    path: '/sistema-visual/reglas-ayuda',
    lazy: async () => {
      const { RulesHelpPage } = await import('@/features/collaborator/pages/RulesHelpPage')
      return { Component: RulesHelpPage }
    },
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: '/iniciar-sesion',
        lazy: async () => {
          const { LoginPage } = await import('@/features/auth/pages/LoginPage')
          return { Component: LoginPage }
        },
      },
      {
        path: '/recuperar-contrasena',
        lazy: async () => {
          const { ForgotPasswordPage } = await import('@/features/auth/pages/ForgotPasswordPage')
          return { Component: ForgotPasswordPage }
        },
      },
    ],
  },
  {
    path: '/actualizar-contrasena',
    lazy: async () => {
      const { UpdatePasswordPage } = await import('@/features/auth/pages/UpdatePasswordPage')
      return { Component: UpdatePasswordPage }
    },
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/sin-acceso',
        lazy: async () => {
          const { AccessDeniedPage } = await import('@/features/dashboard/pages/AccessDeniedPage')
          return { Component: AccessDeniedPage }
        },
      },
      {
        element: <RoleRoute allowedRoles={['COLLABORATOR', 'TEAM_LEADER', 'PORTFOLIO_MANAGER']} />,
        children: [
          {
            path: '/panel',
            lazy: async () => {
              const { RoleDashboardPage } =
                await import('@/features/dashboard/pages/RoleDashboardPage')
              return { Component: RoleDashboardPage }
            },
          },
          {
            path: '/calendario',
            lazy: async () => {
              const { RoleCalendarPage } =
                await import('@/features/dashboard/pages/RoleCalendarPage')
              return { Component: RoleCalendarPage }
            },
          },
          {
            path: '/notificaciones',
            lazy: async () => {
              const { NotificationsPage } =
                await import('@/features/collaborator/pages/NotificationsPage')
              return { Component: NotificationsPage }
            },
          },
          {
            path: '/perfil',
            lazy: async () => {
              const { ProfilePage } = await import('@/features/collaborator/pages/ProfilePage')
              return { Component: ProfilePage }
            },
          },
          {
            path: '/reglas-ayuda',
            lazy: async () => {
              const { RulesHelpPage } = await import('@/features/collaborator/pages/RulesHelpPage')
              return { Component: RulesHelpPage }
            },
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={REQUEST_OWNER_ROLES} />,
        children: [
          {
            path: '/solicitudes',
            lazy: async () => {
              const { MyRequestsPage } = await import('@/features/requests/pages/MyRequestsPage')
              return { Component: MyRequestsPage }
            },
          },
          {
            path: '/solicitudes/nueva',
            lazy: async () => {
              const { NewRequestPage } = await import('@/features/requests/pages/NewRequestPage')
              return { Component: NewRequestPage }
            },
          },
          {
            path: '/solicitudes/:requestId',
            lazy: async () => {
              const { RequestDetailPage } =
                await import('@/features/requests/pages/RequestDetailPage')
              return { Component: RequestDetailPage }
            },
          },
          {
            path: '/solicitudes/:requestId/corregir',
            lazy: async () => {
              const { CorrectReturnedRequestPage } =
                await import('@/features/requests/pages/CorrectReturnedRequestPage')
              return { Component: CorrectReturnedRequestPage }
            },
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['COLLABORATOR', 'TEAM_LEADER']} />,
        children: [
          {
            path: '/elegibilidad',
            lazy: async () => {
              const { EligibilityPage } =
                await import('@/features/collaborator/pages/EligibilityPage')
              return { Component: EligibilityPage }
            },
          },
          {
            path: '/historial',
            lazy: async () => {
              const { HistoryPage } = await import('@/features/collaborator/pages/HistoryPage')
              return { Component: HistoryPage }
            },
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['COLLABORATOR', 'TEAM_LEADER']} />,
        children: [
          {
            path: '/mi-equipo',
            lazy: async () => {
              const { MyTeamPage } = await import('@/features/collaborator/pages/MyTeamPage')
              return { Component: MyTeamPage }
            },
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['TEAM_LEADER', 'PORTFOLIO_MANAGER']} />,
        children: [
          {
            path: '/aprobaciones',
            lazy: async () => {
              const { ApprovalsPage } = await import('@/features/approvals/pages/ApprovalsPage')
              return { Component: ApprovalsPage }
            },
          },
          {
            path: '/aprobaciones/:requestId',
            lazy: async () => {
              const { ApprovalDetailPage } =
                await import('@/features/approvals/pages/ApprovalDetailPage')
              return { Component: ApprovalDetailPage }
            },
          },
          {
            path: '/analisis-inteligente',
            lazy: async () => {
              const { RoleInsightsPage } =
                await import('@/features/dashboard/pages/RoleInsightsPage')
              return { Component: RoleInsightsPage }
            },
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['TEAM_LEADER']} />,
        children: [
          {
            path: '/rotacion',
            lazy: async () => {
              const { TeamRotationPage } =
                await import('@/features/approvals/pages/TeamRotationPage')
              return { Component: TeamRotationPage }
            },
          },
          {
            path: '/bi-equipo',
            lazy: async () => {
              const { TeamAnalyticsPage } =
                await import('@/features/approvals/pages/TeamAnalyticsPage')
              return { Component: TeamAnalyticsPage }
            },
          },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['PORTFOLIO_MANAGER']} />,
        children: [
          {
            path: '/equipos',
            lazy: async () => {
              const { TeamManagementPage } =
                await import('@/features/teams/pages/TeamManagementPage')
              return { Component: TeamManagementPage }
            },
          },
          {
            path: '/bi-global',
            lazy: async () => {
              const { PortfolioAnalyticsPage } =
                await import('@/features/portfolio/pages/PortfolioAnalyticsPage')
              return { Component: PortfolioAnalyticsPage }
            },
          },
          {
            path: '/excepciones-auditoria',
            lazy: async () => {
              const { PortfolioAuditPage } =
                await import('@/features/portfolio/pages/PortfolioAuditPage')
              return { Component: PortfolioAuditPage }
            },
          },
        ],
      },
    ],
  },
  {
    path: '*',
    lazy: async () => {
      const { NotFoundPage } = await import('@/features/dashboard/pages/NotFoundPage')
      return { Component: NotFoundPage }
    },
  },
]

export const router = createBrowserRouter(
  routes
    .filter(
      (route) =>
        import.meta.env.DEV ||
        import.meta.env.VITE_ENABLE_VISUAL_PREVIEW === 'true' ||
        !route.path?.startsWith('/sistema-visual'),
    )
    .map((route) => ({
      ...route,
      errorElement: <RouteErrorPage />,
      hydrateFallbackElement: <RouteLoadingPage />,
    })),
)
