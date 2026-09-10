import type { Database } from '@/types/database'

export type RequestStatus = Database['public']['Enums']['request_status']

export type RequestView = {
  id: string
  requesterId: string
  requestedDate: string
  startTime: string
  endTime: string
  reason: string | null
  status: RequestStatus
  approvalLevel: Database['public']['Enums']['approval_level']
  priority: number | null
  createdAt: string
  submittedAt: string | null
  cancellationReason: string | null
  teamName: string
  teamLeaderName?: string
  portfolioManagerName?: string
  approvalHistory?: RequestApprovalView[]
}

export type RequestApprovalView = {
  level: Database['public']['Enums']['approval_level']
  decision: Database['public']['Enums']['approval_decision']
  comment: string | null
  decidedAt: string
  approverName: string
}

export type EligibilityResult = {
  eligible: boolean
  reasons: string[]
  score?: number
  uses?: number
  last_used_date?: string | null
  evidence?: string[]
}

export type RequestValidationCheck = {
  key: 'date' | 'period' | 'schedule' | 'duplicate' | 'capacity' | 'rotation' | 'deadline'
  label: string
  detail: string
  valid: boolean
}

export type RequestFormContext = {
  applicant_has_team: boolean
  period: {
    name: string
    starts_on: string
    ends_on: string
    minimum_departure_time: string
    maximum_departure_time: string
    deadline_days: number
  } | null
  eligibility: {
    eligible: boolean
    score: number
    priority_label: 'Alta' | 'Media' | 'Baja'
    annual_uses: number
    annual_limit: number
    personal_last_used_date: string | null
    personal_last_approved_by: string | null
    team_last_used_date: string | null
    team_last_used_by_name: string | null
    team_last_used_by_title: string | null
    team_last_used_by_avatar: string | null
    reasons: string[]
    evidence: string[]
  }
  checks: RequestValidationCheck[]
  all_ready: boolean
}

export type NewDepartureRequestInput = {
  requestedDate: string
  departureTime: string
  reason?: string
}

export type NewRequestInput = {
  requestedDate: string
  startTime: string
  endTime: string
  reason?: string
}

export type CorrectedDepartureRequestInput = {
  requestedDate: string
  departureTime: string
  reason?: string
}
