export type MoneyNeed =
  | 'student'
  | 'daily-money'
  | 'salary'
  | 'small-business'
  | 'irregular-income'
  | 'savings-goals'
  | 'retirement'

export type HomeExperience =
  | 'simple'
  | 'full'

export interface MoneySaathiProfile {
  needs: MoneyNeed[]
  homeExperience: HomeExperience
}

const PROFILE_KEY = 'money-saathi:profile:v1'

export const MONEY_NEEDS: Array<{
  id: MoneyNeed
  title: string
  description: string
}> = [
  {
    id: 'student',
    title: 'Student / first money',
    description:
      'Learn daily money, saving, borrowing and digital-money safety without finance jargon.',
  },
  {
    id: 'daily-money',
    title: 'Track daily money',
    description:
      'Understand what comes in, what goes out and what remains.',
  },
  {
    id: 'salary',
    title: 'Manage salary',
    description:
      'Plan salary, regular expenses, EMIs and monthly commitments.',
  },
  {
    id: 'small-business',
    title: 'Run a small business',
    description:
      'Prepare Money Saathi for business cash flow without mixing it with personal money.',
  },
  {
    id: 'irregular-income',
    title: 'Manage irregular income',
    description:
      'Useful when income changes by day, week, season or assignment.',
  },
  {
    id: 'savings-goals',
    title: 'Plan savings & goals',
    description:
      'Build toward emergencies, education, a home or other life goals.',
  },
  {
    id: 'retirement',
    title: 'Manage retirement income',
    description:
      'Focus on pension, deposits, commitments and available cash.',
  },
]

const validNeedIds = new Set<MoneyNeed>(
  MONEY_NEEDS.map((need) => need.id),
)

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

export function sanitizeProfile(
  value: unknown,
): MoneySaathiProfile {
  if (!isRecord(value)) {
    return {
      needs: [],
      homeExperience: 'full',
    }
  }

  const needs = Array.isArray(value.needs)
    ? value.needs.filter(
        (need): need is MoneyNeed =>
          typeof need === 'string' &&
          validNeedIds.has(need as MoneyNeed),
      )
    : []

  const homeExperience: HomeExperience =
    value.homeExperience === 'simple'
      ? 'simple'
      : 'full'

  return {
    needs: [...new Set(needs)],
    homeExperience,
  }
}

export function getProfile(): MoneySaathiProfile {
  const raw = localStorage.getItem(PROFILE_KEY)

  if (!raw) {
    return {
      needs: [],
      homeExperience: 'full',
    }
  }

  try {
    return sanitizeProfile(JSON.parse(raw))
  } catch {
    return {
      needs: [],
      homeExperience: 'full',
    }
  }
}

export function saveProfile(
  profile: MoneySaathiProfile,
): void {
  const sanitized = sanitizeProfile(profile)

  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify(sanitized),
  )

  window.dispatchEvent(
    new Event('money-saathi-profile-change'),
  )
}

export function toggleNeed(
  profile: MoneySaathiProfile,
  need: MoneyNeed,
): MoneySaathiProfile {
  const exists = profile.needs.includes(need)

  return {
    ...profile,
    needs: exists
      ? profile.needs.filter((item) => item !== need)
      : [...profile.needs, need],
  }
}
