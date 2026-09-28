export interface BusinessWorkspaceOption {
  id: string
}

export function resolveBusinessWorkspaceId(
  businesses: readonly BusinessWorkspaceOption[],
  requestedBusinessId: string,
  currentBusinessId = '',
): string {
  if (
    requestedBusinessId &&
    businesses.some(
      (business) =>
        business.id ===
        requestedBusinessId,
    )
  ) {
    return requestedBusinessId
  }

  if (
    currentBusinessId &&
    businesses.some(
      (business) =>
        business.id ===
        currentBusinessId,
    )
  ) {
    return currentBusinessId
  }

  return businesses[0]?.id ?? ''
}

export function businessWorkspaceSearchParams(
  searchParams: URLSearchParams,
  businessId: string,
): URLSearchParams {
  const next =
    new URLSearchParams(
      searchParams,
    )

  if (businessId) {
    next.set(
      'businessId',
      businessId,
    )
  } else {
    next.delete(
      'businessId',
    )
  }

  return next
}

export function businessWorkspaceRoute(
  route: string,
  businessId: string,
): string {
  if (!businessId) {
    return route
  }

  const [
    pathAndQuery,
    hash = '',
  ] =
    route.split(
      '#',
      2,
    )

  const [
    pathname,
    query = '',
  ] =
    pathAndQuery.split(
      '?',
      2,
    )

  const params =
    new URLSearchParams(
      query,
    )

  params.set(
    'businessId',
    businessId,
  )

  const nextQuery =
    params.toString()

  return (
    `${pathname}${
      nextQuery
        ? `?${nextQuery}`
        : ''
    }${
      hash
        ? `#${hash}`
        : ''
    }`
  )
}
