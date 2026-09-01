import type { Database } from '@/types/database'

export type TeamApprovalRequest = {
  id: string
  requesterId: string
  requesterName: string
  requesterJobTitle: string
  requesterAvatarUrl: string | null
  teamName: string
  requestedDate: string
  startTime: string
  endTime: string
  permittedStartTime: string
  permittedEndTime: string
  reason: string | null
  status: Database['public']['Enums']['request_status']
  approvalLevel: Database['public']['Enums']['approval_level']
  priority: number | null
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  finalDecidedAt: string | null
  usageConfirmedAt: string | null
}
