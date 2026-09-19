import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DB_STORE_NAMES, DB_VERSION } from './db'
import { currentBalance, monthlyExpenses, monthlyIncome } from './analytics'
import { validateBackup } from './finance'
import {
  BUSINESS_DISCLAIMER,
  EDUCATION_DISCLAIMER,
  REGULATORY_NOTE,
  allLessons,
  findLesson,
  recommendedLessonIds,
  recommendedLessons,
  topicGroups,
} from './learn-content'
import { USER_TYPES, type UserType } from './settings'
import type { Transaction } from './transactions'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const navigation = read('../components/money-saathi/navigation.tsx')
const learnView = read('../components/money-saathi/learn-view.tsx')
const appShell = read('../components/money-saathi/app-shell.tsx')

const EXISTING_VIEWS = ['Home', 'Transactions', 'My Money', 'Reports', 'Budget', 'Goals', 'Learn', 'Settings']
const TRYIT_DESTINATIONS = ['Transactions', 'Budget', 'Goals', 'My Money']
const lessonText = (id: string) => { const lesson = findLesson(id); return lesson ? [lesson.title, ...lesson.paragraphs, lesson.example || '', lesson.keyPoint].join(' ') : '' }

function txn(overrides: Partial<Transaction> = {}): Transaction {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), type: 'income', amountChetrum: 10000, categoryId: 'salary', date: '2026-09-01', paymentMethod: 'Cash', note: '', isRecurring: false, createdAt: now, updatedAt: now, ...overrides }
}

describe('navigation placement', () => {
  it('1. Learn exists in desktop navigation', () => {
    expect(navigation).toContain("{ label: 'Learn', icon: BookOpen }")
  })

  it('2. Learn exists in mobile More', () => {
    expect(navigation).toContain("export const mobileMoreItems = ['Reports', 'Goals', 'Learn', 'Settings']")
  })

  it('3. mobile primary navigation remains unchanged', () => {
    expect(navigation).toContain("export const mobilePrimaryItems = ['Home', 'Transactions', 'My Money', 'Budget']")
  })
})

describe('LearnView personalization', () => {
  it('4. supports all four UserType values plus undefined', () => {
    for (const value of USER_TYPES) {
      const lessons = recommendedLessons(value)
      expect(lessons.length).toBeGreaterThanOrEqual(4)
      expect(lessons.every(lesson => Boolean(lesson))).toBe(true)
    }
    const general = recommendedLessons(undefined)
    expect(general.length).toBeGreaterThanOrEqual(4)
    expect(general.every(lesson => Boolean(lesson))).toBe(true)
  })

  it('5. every user type can access ALL topic groups', () => {
    // The view renders topicGroups unconditionally, with no user-type filter.
    expect(learnView).toContain('topicGroups.map')
    expect(learnView).not.toMatch(/topicGroups[\s\S]{0,40}filter/)
    const allIds = new Set(allLessons.map(lesson => lesson.id))
    for (const value of [...USER_TYPES, undefined] as (UserType | undefined)[]) {
      for (const id of recommendedLessonIds(value)) expect(allIds.has(id)).toBe(true)
    }
  })

  it('6. userType only changes recommendation ordering', () => {
    const lists = USER_TYPES.map(value => recommendedLessonIds(value).join(','))
    expect(new Set(lists).size).toBe(USER_TYPES.length) // each type has a distinct list
    // The full catalogue is constant and does not depend on user type.
    const catalogue = allLessons.map(lesson => lesson.id).join(',')
    expect(topicGroups.flatMap(group => group.lessons).map(lesson => lesson.id).join(',')).toBe(catalogue)
    // Every recommended id resolves to a lesson that already exists for everyone.
    for (const value of USER_TYPES) for (const id of recommendedLessonIds(value)) expect(findLesson(id)).toBeTruthy()
  })
})

describe('topic groups and content', () => {
  it('7. all eight topic groups exist', () => {
    expect(topicGroups).toHaveLength(8)
    expect(topicGroups.map(group => group.letter)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
    const titles = topicGroups.map(group => group.title)
    expect(titles).toContain('Money basics')
    expect(titles).toContain('Income & everyday life')
    expect(titles).toContain('Saving & banking')
    expect(titles).toContain('Loans & borrowing')
    expect(titles).toContain('Insurance & protection')
    expect(titles).toContain('Digital money & fraud safety')
    expect(titles).toContain('KYC & financial system awareness')
    expect(titles).toContain('Small business basics')
  })

  it('8. Pension education exists', () => {
    const pension = findLesson('pension')
    expect(pension).toBeTruthy()
    expect(pension!.title).toBe('Pension')
    expect(lessonText('pension').toLowerCase()).toContain('retirement')
  })

  it('9. insurance premium vs insurance proceeds distinction exists', () => {
    const claim = lessonText('insurance-claim').toLowerCase()
    expect(lessonText('insurance-premium').toLowerCase()).toContain('premium')
    expect(lessonText('insurance-premium').toLowerCase()).toContain('expense')
    expect(claim).toContain('not automatically ordinary earned income')
  })

  it('10. loan proceeds are not described as normal income', () => {
    expect(lessonText('what-is-loan').toLowerCase()).toContain('not ordinary income')
  })

  it('11. FD principal movement is not described as spending/income', () => {
    const fd = lessonText('fixed-deposit').toLowerCase()
    expect(fd).toContain('does not mean you spent')
    expect(fd).toContain('not automatically income')
  })

  it('12-16. KYC awareness terms exist', () => {
    expect(findLesson('kyc')?.title).toBe('KYC — Know Your Customer')
    expect(findLesson('source-of-funds')).toBeTruthy()
    expect(findLesson('source-of-wealth')).toBeTruthy()
    expect(findLesson('beneficial-ownership')).toBeTruthy()
    expect(findLesson('aml-cft')).toBeTruthy()
    expect(lessonText('source-of-funds').toLowerCase()).toContain('where the money')
    expect(lessonText('source-of-wealth').toLowerCase()).toContain('accumulated over time')
    expect(lessonText('beneficial-ownership').toLowerCase()).toContain('ultimately owns or controls')
    expect(lessonText('aml-cft').toLowerCase()).toContain('money laundering or terrorist financing')
  })

  it('17. regulatory note is present and shown', () => {
    expect(REGULATORY_NOTE).toContain('requirements can change')
    expect(REGULATORY_NOTE).toContain('relevant Bhutanese authority')
    expect(learnView).toContain('REGULATORY_NOTE')
    expect(EDUCATION_DISCLAIMER).toContain('general financial education')
    expect(learnView).toContain('EDUCATION_DISCLAIMER')
  })

  it('18. no invented Bhutan legal thresholds/penalties', () => {
    const kyc = topicGroups.find(group => group.id === 'kyc-awareness')!
    const text = kyc.lessons.flatMap(lesson => [...lesson.paragraphs, lesson.keyPoint, lesson.example || '']).join(' ')
    expect(text).not.toMatch(/penalt|fine|threshold|deadline|mandatory|imprison|reporting limit|Nu\.|\bAct\b|section \d/i)
  })

  it('19. Small Business section contains "Sales are not profit"', () => {
    const group = topicGroups.find(group => group.id === 'small-business')!
    expect(group.lessons.some(lesson => lesson.title === 'Sales are not profit')).toBe(true)
    expect(lessonText('sales-not-profit')).toContain('Sales are not profit')
  })

  it('20. Small Business disclaimer says it is not accounting software', () => {
    expect(BUSINESS_DISCLAIMER).toContain('not business accounting software')
    expect(learnView).toContain('BUSINESS_DISCLAIMER')
  })

  it('21. Try-it destinations use existing app navigation', () => {
    for (const lesson of allLessons) if (lesson.tryIt) expect(TRYIT_DESTINATIONS).toContain(lesson.tryIt.destination)
    for (const destination of TRYIT_DESTINATIONS) expect(EXISTING_VIEWS).toContain(destination)
    expect(appShell).toContain('<LearnView userType={userType || undefined} onNavigate={navigate}/>')
  })
})

describe('content accuracy patch', () => {
  it('26. OTP guidance says do not disclose OTP to another person, without absolute theft claim', () => {
    const otp = lessonText('otp-safety')
    expect(otp.toLowerCase()).toContain('do not tell or forward an otp to another person')
    expect(otp).toContain('Never disclose your OTP, PIN or password to another person.')
    expect(otp).not.toContain('Anyone asking for it is trying to take your money')
  })

  it('27. QR lesson drops "only sends money" claims and tells user to inspect what they authorize', () => {
    const qr = lessonText('qr-scams')
    expect(qr).not.toContain('never for receiving it')
    expect(qr).not.toContain('it never brings money in')
    expect(qr.toLowerCase()).toContain('check what the screen says you are authorizing')
    expect(qr).toContain('Read the payment screen before confirming. Never approve a payment you do not understand.')
  })

  it('28. working capital references current assets minus current liabilities', () => {
    const wc = lessonText('working-capital').toLowerCase()
    expect(wc).toContain('current assets minus current liabilities')
    expect(wc).toContain('short-term')
  })

  it('29. business records lesson does not claim tracking alone establishes profit', () => {
    const income = lessonText('business-income-expenses')
    expect(income).not.toContain('the only way to know whether the business is making or losing money')
    expect(income.toLowerCase()).toContain('formal profit calculation may also require proper accounting')
    expect(income).toContain('do not replace proper accounting')
  })

  it('30. loan prepayment guidance includes checking loan terms', () => {
    const loan = lessonText('loan-repayment')
    expect(loan.toLowerCase()).toContain('check the lender')
    expect(loan).toContain('Repay on time and check your loan terms before making extra payments.')
    expect(loan).not.toContain('reduces the principal faster and lowers total interest')
  })

  it('31. pension wording refers to Money Saathi personal cash-flow treatment', () => {
    const pension = lessonText('pension')
    expect(pension).toContain('Money Saathi treats pension receipts as income')
    expect(pension).not.toContain('It is treated as income.')
  })
})

describe('no schema or calculation changes', () => {
  it('22. DB_VERSION remains unchanged', () => {
    expect(DB_VERSION).toBe(5)
  })

  it('23. DB_STORE_NAMES remains unchanged', () => {
    expect(DB_STORE_NAMES).toEqual(['transactions', 'categories', 'budgets', 'recurring', 'settings', 'audit', 'lock', 'reminders', 'reminderDismissals', 'goals', 'financialAssets'])
  })

  it('24. backup schema remains unchanged', () => {
    const base = { schemaVersion: 1, exportedAt: new Date().toISOString(), transactions: [], settings: [{ key: 'app', currency: 'BTN', openingBalanceChetrum: 0, sampleData: false }], categories: [], budgets: [], recurring: [] }
    expect(() => validateBackup(base)).not.toThrow()
    expect(() => validateBackup({ ...base, learn: [] })).toThrow('Backup contains unknown fields.')
  })

  it('25. existing financial calculations are untouched', () => {
    const items = [txn({ type: 'income', categoryId: 'salary', amountChetrum: 50000 }), txn({ type: 'expense', categoryId: 'food', amountChetrum: 20000 })]
    expect(monthlyIncome(items, '2026-09')).toBe(50000)
    expect(monthlyExpenses(items, '2026-09')).toBe(20000)
    expect(currentBalance(10000, items)).toBe(40000)
  })
})
