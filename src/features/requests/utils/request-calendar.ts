export type CalendarRequestBase = {
  id: string
  requestedDate: string
  createdAt: string
  requesterId?: string
}

export type CalendarRequestGroup<T> = {
  current: T
  history: T[]
}

export function compareRequestRecency<T extends CalendarRequestBase>(left: T, right: T) {
  const createdDifference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  return createdDifference || right.id.localeCompare(left.id)
}

export function groupRequestsByDate<T extends CalendarRequestBase>(requests: T[]) {
  const groups = new Map<string, CalendarRequestGroup<T>>()
  for (const request of [...requests].sort(compareRequestRecency)) {
    const existing = groups.get(request.requestedDate)
    if (existing) existing.history.push(request)
    else groups.set(request.requestedDate, { current: request, history: [request] })
  }
  return groups
}

export function groupRequestsByPersonAndDate<
  T extends CalendarRequestBase & { requesterId: string },
>(requests: T[]) {
  const groups = new Map<string, CalendarRequestGroup<T>>()
  for (const request of [...requests].sort(compareRequestRecency)) {
    const key = `${request.requestedDate}:${request.requesterId}`
    const existing = groups.get(key)
    if (existing) existing.history.push(request)
    else groups.set(key, { current: request, history: [request] })
  }
  return groups
}

export function sortRequestsByRecency<T extends CalendarRequestBase>(requests: T[]) {
  return [...requests].sort(compareRequestRecency)
}
