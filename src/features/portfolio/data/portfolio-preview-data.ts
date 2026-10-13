import { approvalPreviewRequests } from '@/features/approvals/data/approval-preview-data'
import type { TeamApprovalRequest } from '@/features/approvals/types'
import { requestPreviewData } from '@/features/requests/data/request-preview-data'
import { teamPreviewData } from '@/features/teams/data/team-preview-data'

// Reuse existing, explicitly simulated fixtures. Never seed or write the database.
export const portfolioPreviewRequests: TeamApprovalRequest[] = [
  ...approvalPreviewRequests,
  ...requestPreviewData.map((request) => ({
    ...request,
    requesterId: 'jose',
    requesterName: approvalPreviewRequests[0].requesterName,
    requesterJobTitle: approvalPreviewRequests[0].requesterJobTitle,
    requesterAvatarUrl: null,
    permittedStartTime: '13:00:00',
    permittedEndTime: '15:00:00',
    updatedAt: request.submittedAt ?? request.createdAt,
    finalDecidedAt: null,
    usageConfirmedAt: null,
  })),
]
export const portfolioPreviewWorkspace = {
  requests: portfolioPreviewRequests,
  teams: teamPreviewData,
}
