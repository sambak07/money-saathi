import type { UserType } from './settings'

// Phase 2 Money Guide: static financial education only. No persistence, no tracking,
// no calculations. Every lesson is available to every user; user type only reorders
// which lessons are recommended first.

export type TryItDestination = 'Transactions' | 'Budget' | 'Goals' | 'My Money'

export type Lesson = {
  id: string
  title: string
  // 2–4 short plain-language paragraphs.
  paragraphs: string[]
  example?: string
  keyPoint: string
  tryIt?: { label: string; destination: TryItDestination }
}

export type TopicGroup = {
  id: string
  letter: string
  title: string
  summary: string
  lessons: Lesson[]
}

export const REGULATORY_NOTE =
  'Banking and regulatory requirements can change. For official requirements, check with your financial institution or the relevant Bhutanese authority.'

export const EDUCATION_DISCLAIMER =
  'Money Guide is for general financial education. It does not replace professional financial, legal, tax or regulatory advice.'

export const BUSINESS_DISCLAIMER =
  'Money Saathi is not business accounting software and does not replace formal bookkeeping, tax filing or professional accounting advice.'

export const topicGroups: TopicGroup[] = [
  {
    id: 'money-basics',
    letter: 'A',
    title: 'Money basics',
    summary: 'The everyday ideas behind money in, money out, and saving.',
    lessons: [
      {
        id: 'money-in-out',
        title: 'Money in and money out',
        paragraphs: [
          'Money coming in is what you receive. Money going out is what you pay. Keeping an eye on both is the whole idea of managing money.',
          'When money in is larger than money out over time, you can save. When money out is larger, you slowly run down your savings or take on debt.',
        ],
        example: 'If Nu. 20,000 comes in this month and Nu. 15,000 goes out, Nu. 5,000 is left to save.',
        keyPoint: 'Watch both sides: what comes in and what goes out.',
        tryIt: { label: 'Open Transactions', destination: 'Transactions' },
      },
      {
        id: 'money-not-always-income',
        title: 'Money received is not always income',
        paragraphs: [
          'Salary and pension are income — money you have earned or are entitled to receive.',
          'But loan proceeds, transfers from your own account, refunds, and getting back your own savings are not automatically income. They are money moving, not money earned.',
          'The same idea works the other way: money paid is not always an expense. Moving your own money into a fixed deposit or another account is not the same as spending it.',
        ],
        example: 'A Nu. 50,000 transfer from your own savings account is not new income — it is your own money moving.',
        keyPoint: 'Earned money is income. Your own money moving around is not.',
      },
      {
        id: 'needs-wants',
        title: 'Needs and wants',
        paragraphs: [
          'Needs are the things you must pay for to live and work: food, rent, transport, basic bills.',
          'Wants are the extras that are nice to have. Neither is wrong, but knowing the difference helps you choose when money is tight.',
        ],
        example: 'Rice and vegetables are a need; a costly restaurant meal is usually a want.',
        keyPoint: 'Cover needs first, then decide on wants.',
      },
      {
        id: 'simple-budget',
        title: 'Making a simple monthly budget',
        paragraphs: [
          'A budget is just a plan for your money. Start with what comes in, then set rough limits for the main things you spend on.',
          'You do not need to be exact. A simple, realistic plan you actually follow beats a perfect plan you ignore.',
        ],
        example: 'Income Nu. 20,000 — plan Nu. 8,000 food, Nu. 6,000 rent, Nu. 3,000 transport, Nu. 3,000 saving.',
        keyPoint: 'A budget is a simple plan, not a strict rulebook.',
        tryIt: { label: 'Open Budget', destination: 'Budget' },
      },
      {
        id: 'saving-goal',
        title: 'Saving towards a goal',
        paragraphs: [
          'A goal gives your saving a reason. It could be a phone, school fees, or a trip home.',
          'Break the goal into small monthly amounts so it feels reachable instead of far away.',
        ],
        example: 'For a Nu. 12,000 goal in a year, saving Nu. 1,000 each month gets you there.',
        keyPoint: 'A clear goal makes saving easier to stick to.',
        tryIt: { label: 'Open Goals', destination: 'Goals' },
      },
      {
        id: 'emergency-savings',
        title: 'Emergency savings',
        paragraphs: [
          'Emergency savings is money set aside for surprises — a medical bill, a repair, or a gap in income.',
          'Even a small amount saved regularly builds a cushion so a surprise does not become a crisis.',
        ],
        example: 'Saving Nu. 500 a month gives you Nu. 6,000 of cushion in a year.',
        keyPoint: 'A little set aside regularly protects you from surprises.',
        tryIt: { label: 'Open Goals', destination: 'Goals' },
      },
    ],
  },
  {
    id: 'income-everyday',
    letter: 'B',
    title: 'Income & everyday life',
    summary: 'The different ways money comes in and what to expect from each.',
    lessons: [
      {
        id: 'salary',
        title: 'Salary',
        paragraphs: [
          'Salary is regular pay for a job, usually the same amount each month. It is income you have earned.',
          'Because it is steady, salary is a reliable base to plan your budget around.',
        ],
        example: 'A monthly salary of Nu. 25,000 is income you can plan your month around.',
        keyPoint: 'Salary is steady earned income — a good planning base.',
      },
      {
        id: 'pension',
        title: 'Pension',
        paragraphs: [
          'A pension is money received after or through retirement, or through an eligible pension arrangement. It is treated as income.',
          'Like a salary, a pension is usually regular, so it can anchor a monthly plan.',
        ],
        example: 'A retired person receiving Nu. 15,000 each month treats it as regular income.',
        keyPoint: 'Pension is income received in or through retirement.',
      },
      {
        id: 'allowance',
        title: 'Allowance / stipend',
        paragraphs: [
          'An allowance or stipend is money given to support you, often as a student or trainee.',
          'It is usually limited, so planning helps it last through the month.',
        ],
        example: 'A student stipend of Nu. 5,000 a month is easier to manage with a small plan.',
        keyPoint: 'Treat an allowance like income and plan it to last.',
      },
      {
        id: 'rental-income',
        title: 'Rental income',
        paragraphs: [
          'Rental income is money you receive for letting someone use property you own.',
          'It is income, but remember any costs of keeping the property come out of it.',
        ],
        example: 'Rent received Nu. 10,000, minus Nu. 1,500 upkeep, leaves Nu. 8,500.',
        keyPoint: 'Rental income counts, but subtract the costs of the property.',
      },
      {
        id: 'freelance',
        title: 'Freelance / irregular income',
        paragraphs: [
          'Freelance or irregular income arrives at uneven times and in different amounts.',
          'When income is uneven, save more in good months so lean months are easier.',
        ],
        example: 'Earn Nu. 30,000 one month and Nu. 8,000 the next — save from the high month.',
        keyPoint: 'With uneven income, let good months cover lean ones.',
        tryIt: { label: 'Open Transactions', destination: 'Transactions' },
      },
      {
        id: 'take-home-pay',
        title: 'Take-home pay',
        paragraphs: [
          'Take-home pay is what actually reaches you after deductions, not the full figure on paper.',
          'Always plan around your take-home amount, because that is the money you can really use.',
        ],
        example: 'A Nu. 30,000 salary with Nu. 4,000 deductions gives Nu. 26,000 take-home.',
        keyPoint: 'Plan around take-home pay, not the headline figure.',
      },
      {
        id: 'regular-commitments',
        title: 'Regular commitments',
        paragraphs: [
          'Regular commitments are payments that come around every month — rent, loan payments, bills, subscriptions.',
          'List them first so you know how much of your income is already promised before you spend on anything else.',
        ],
        example: 'Rent Nu. 6,000 + loan Nu. 3,000 + bills Nu. 1,500 = Nu. 10,500 already committed.',
        keyPoint: 'Know your fixed commitments before spending on the rest.',
        tryIt: { label: 'Open Budget', destination: 'Budget' },
      },
    ],
  },
  {
    id: 'saving-banking',
    letter: 'C',
    title: 'Saving & banking',
    summary: 'How saving, interest, and bank deposits actually work.',
    lessons: [
      {
        id: 'savings-account',
        title: 'Savings account',
        paragraphs: [
          'A savings account keeps your money safe at a bank while letting you take it out when you need it.',
          'It is a good place for money you may need soon, including emergency savings.',
        ],
        example: 'Keeping Nu. 10,000 in a savings account is safer than cash at home.',
        keyPoint: 'A savings account is safe and easy to reach.',
        tryIt: { label: 'Open My Money', destination: 'My Money' },
      },
      {
        id: 'interest',
        title: 'Interest',
        paragraphs: [
          'Interest is the extra money a bank pays you for keeping your savings with them.',
          'The longer your money stays and the more you save, the more interest can add up.',
        ],
        example: 'Nu. 100,000 at 5% for a year earns about Nu. 5,000 in interest.',
        keyPoint: 'Interest is a reward for letting your savings sit and grow.',
      },
      {
        id: 'fixed-deposit',
        title: 'Fixed Deposit (FD)',
        paragraphs: [
          'A fixed deposit locks a sum of money with the bank for a set time in exchange for higher interest.',
          'Putting Nu. 100,000 into an FD does not mean you spent Nu. 100,000. Receiving the principal back later is not automatically income — only the interest earned is your return.',
        ],
        example: 'Nu. 100,000 in an FD comes back as Nu. 100,000 plus, say, Nu. 6,000 interest. Only the Nu. 6,000 is a gain.',
        keyPoint: 'FD principal is your own money parked, not spent; only the interest is a return.',
        tryIt: { label: 'Open My Money', destination: 'My Money' },
      },
      {
        id: 'recurring-deposit',
        title: 'Recurring Deposit (RD)',
        paragraphs: [
          'A recurring deposit lets you put in a fixed amount every month for a set period and earn interest.',
          'Like an FD, the money you put in stays yours — it is saving, not spending.',
        ],
        example: 'Putting Nu. 2,000 into an RD each month builds a lump sum plus interest over time.',
        keyPoint: 'An RD is a habit of saving a fixed amount each month.',
        tryIt: { label: 'Open My Money', destination: 'My Money' },
      },
      {
        id: 'save-before-spend',
        title: 'Saving before spending',
        paragraphs: [
          'Saving before spending means setting aside a little as soon as money comes in, before it gets used up.',
          'Even a small amount saved first, every time, adds up more reliably than saving whatever is left over.',
        ],
        example: 'Save Nu. 1,000 the day your income arrives, then plan the rest.',
        keyPoint: 'Pay your savings first, spend what remains.',
      },
      {
        id: 'emergency-fund',
        title: 'Emergency fund',
        paragraphs: [
          'An emergency fund is savings kept ready for the unexpected, separate from money for everyday spending.',
          'Keep it somewhere safe and easy to reach, like a savings account, so it is there when you need it.',
        ],
        example: 'A fund covering a few months of basic costs gives real breathing room.',
        keyPoint: 'Keep emergency money separate and easy to reach.',
      },
    ],
  },
  {
    id: 'loans-borrowing',
    letter: 'D',
    title: 'Loans & borrowing',
    summary: 'What borrowing really costs and how to do it responsibly.',
    lessons: [
      {
        id: 'what-is-loan',
        title: 'What is a loan?',
        paragraphs: [
          'A loan is money you borrow now and agree to pay back later, usually with interest.',
          'Loan money you receive is not ordinary income. A loan creates an obligation to repay, so it is a debt, not earnings.',
        ],
        example: 'A Nu. 100,000 loan is not Nu. 100,000 of income — it is Nu. 100,000 you must repay.',
        keyPoint: 'A loan is borrowed money you must repay, not income.',
      },
      {
        id: 'principal',
        title: 'Principal',
        paragraphs: [
          'The principal is the original amount you borrowed, before any interest is added.',
          'Every repayment usually covers a bit of principal and a bit of interest.',
        ],
        example: 'Borrow Nu. 50,000 and the principal is Nu. 50,000; interest is charged on top.',
        keyPoint: 'Principal is the amount borrowed, before interest.',
      },
      {
        id: 'loan-interest',
        title: 'Interest on a loan',
        paragraphs: [
          'Interest is the cost of borrowing — what the lender charges you for the use of their money.',
          'A higher rate or a longer term means you pay more interest overall.',
        ],
        example: 'A Nu. 50,000 loan may cost several thousand Ngultrum in interest over its term.',
        keyPoint: 'Interest is what borrowing costs you.',
      },
      {
        id: 'emi',
        title: 'EMI',
        paragraphs: [
          'EMI stands for Equated Monthly Instalment — the fixed amount you pay each month on a loan.',
          'Each EMI chips away at both the principal and the interest until the loan is fully repaid.',
        ],
        example: 'An EMI of Nu. 3,000 a month is a fixed commitment until the loan ends.',
        keyPoint: 'An EMI is a fixed monthly loan payment.',
        tryIt: { label: 'Open Budget', destination: 'Budget' },
      },
      {
        id: 'why-borrowing-costs',
        title: 'Why borrowing costs money',
        paragraphs: [
          'Lenders charge interest because they take a risk and give up the use of their money while you have it.',
          'That is why the same purchase can cost more when it is bought on borrowed money.',
        ],
        example: 'A Nu. 20,000 item on a loan may end up costing Nu. 23,000 after interest.',
        keyPoint: 'Borrowing adds a cost on top of the price.',
      },
      {
        id: 'responsible-borrowing',
        title: 'Responsible borrowing',
        paragraphs: [
          'Borrow only what you truly need and are confident you can repay from your regular income.',
          'Before taking a loan, check how the repayment fits alongside your other commitments.',
        ],
        example: 'If your commitments already use most of your income, a new EMI may be too much.',
        keyPoint: 'Only borrow what you can comfortably repay.',
      },
      {
        id: 'loan-repayment',
        title: 'Loan repayment',
        paragraphs: [
          'Repaying on time keeps a loan from growing and protects your standing with lenders.',
          'Paying a little extra when you can reduces the principal faster and lowers total interest.',
        ],
        example: 'Clearing an EMI on time each month keeps the loan on track.',
        keyPoint: 'Repay on time; extra payments cut future interest.',
      },
    ],
  },
  {
    id: 'insurance-protection',
    letter: 'E',
    title: 'Insurance & protection',
    summary: 'How insurance protects you and what its payments mean.',
    lessons: [
      {
        id: 'what-insurance-does',
        title: 'What insurance does',
        paragraphs: [
          'Insurance is protection you buy against a big, uncertain loss — illness, accident, or damage.',
          'You make small regular payments so that if something serious happens, you are not left to cover the whole cost alone.',
        ],
        example: 'Paying a small premium can protect you from a large hospital bill later.',
        keyPoint: 'Insurance trades small regular payments for protection against big losses.',
      },
      {
        id: 'insurance-premium',
        title: 'Insurance premium',
        paragraphs: [
          'A premium is the amount you pay to keep an insurance policy active.',
          'A premium you pay is normally an expense — money going out to stay protected.',
        ],
        example: 'A Nu. 1,000 monthly premium is a regular expense in your plan.',
        keyPoint: 'A premium you pay is normally an expense.',
      },
      {
        id: 'insurance-claim',
        title: 'Insurance claim, reimbursement or maturity',
        paragraphs: [
          'A claim, reimbursement, or maturity payout is money you receive from an insurer.',
          'This is money received, but it is not automatically ordinary earned income — often it is repaying a loss you already had or returning value from a policy.',
        ],
        example: 'A Nu. 40,000 claim that covers a Nu. 40,000 hospital bill replaces a loss rather than adding earnings.',
        keyPoint: 'A premium paid is an expense; a claim or maturity received is not automatically ordinary earned income.',
      },
      {
        id: 'why-protection',
        title: 'Why protection matters',
        paragraphs: [
          'A single large, unexpected cost can wipe out savings that took years to build.',
          'Protection keeps one bad event from undoing your progress and your emergency fund.',
        ],
        example: 'Insurance can mean one accident does not erase a whole year of saving.',
        keyPoint: 'Protection keeps one big shock from undoing your progress.',
      },
    ],
  },
  {
    id: 'digital-fraud-safety',
    letter: 'F',
    title: 'Digital money & fraud safety',
    summary: 'Simple habits that keep your money safe from scams.',
    lessons: [
      {
        id: 'otp-safety',
        title: 'OTP safety',
        paragraphs: [
          'A one-time password (OTP) is a code sent to approve your own transactions. It is meant for you alone.',
          'No genuine bank or officer will ever need your OTP. Anyone asking for it is trying to take your money.',
        ],
        example: 'A caller who says "read me the OTP to verify your account" is a scam.',
        keyPoint: 'Never share your OTP, PIN or password with anyone.',
      },
      {
        id: 'pin-safety',
        title: 'PIN and password safety',
        paragraphs: [
          'Your PIN and passwords are the keys to your money. Keep them private and hard to guess.',
          'Do not reuse the same simple code everywhere, and never write it where others can find it.',
        ],
        example: 'A PIN like 1234 or your birth year is easy for others to guess.',
        keyPoint: 'Keep PINs and passwords private, strong, and unshared.',
      },
      {
        id: 'phishing',
        title: 'Phishing',
        paragraphs: [
          'Phishing is when someone pretends to be a trusted bank or service to trick you into giving details.',
          'They create urgency — "act now or your account is blocked" — to make you react before you think.',
        ],
        example: 'A message saying "your account is frozen, log in here now" is a common trick.',
        keyPoint: 'Slow down when a message pressures you to act instantly.',
      },
      {
        id: 'fake-apps',
        title: 'Fake banking and payment apps',
        paragraphs: [
          'Fake apps look real but exist only to steal your login details or money.',
          "Do not install banking or payment apps from unknown links; use only official app stores or your bank's own guidance.",
        ],
        example: 'A "faster banking app" sent through a chat link can be a trap.',
        keyPoint: 'Do not install banking or payment apps from unknown links.',
      },
      {
        id: 'suspicious-links',
        title: 'Suspicious links',
        paragraphs: [
          'Scam links arrive by message, email, or social media and lead to fake pages that capture your details.',
          'If you did not expect a link, do not tap it. Go to the official app or site yourself instead.',
        ],
        example: 'A "you won a prize, claim here" link is almost always a scam.',
        keyPoint: 'Do not tap links you did not expect.',
      },
      {
        id: 'qr-scams',
        title: 'QR-payment scams',
        paragraphs: [
          'Scanning a QR code is for paying money out, never for receiving it.',
          'If someone says "scan this QR to receive your money," they are trying to make you pay them.',
        ],
        example: 'A "scan to receive your refund" QR actually sends your money away.',
        keyPoint: 'Scanning a QR pays money out — it never brings money in.',
      },
      {
        id: 'money-mule',
        title: 'Money mule scams',
        paragraphs: [
          'A money mule is someone tricked into receiving money and passing it on, often for a "commission".',
          'This moves criminal money through your account and can get you into serious trouble.',
        ],
        example: 'An offer to "receive Nu. 50,000 and forward it, keep Nu. 5,000" is a serious warning sign.',
        keyPoint: 'If someone asks you to receive money and forward it for a commission, treat it as a serious warning sign.',
      },
      {
        id: 'investment-scams',
        title: 'Investment scam warning signs',
        paragraphs: [
          'Investment scams promise big, guaranteed returns with no risk and pressure you to join quickly.',
          'Real investments never guarantee high returns. Pressure, secrecy, and "act now" are warning signs.',
        ],
        example: 'A scheme promising to "double your money in a month, guaranteed" is a scam.',
        keyPoint: 'Guaranteed high returns and urgency are classic scam signs.',
      },
    ],
  },
  {
    id: 'kyc-awareness',
    letter: 'G',
    title: 'KYC & financial system awareness',
    summary: 'General terms banks use, explained in plain language.',
    lessons: [
      {
        id: 'kyc',
        title: 'KYC — Know Your Customer',
        paragraphs: [
          'KYC stands for Know Your Customer. It is the process financial institutions use to identify who their customers are.',
          'It also helps them keep important customer information current over time.',
        ],
        keyPoint: 'KYC is how a financial institution confirms who its customers are.',
      },
      {
        id: 'source-of-funds',
        title: 'Source of funds',
        paragraphs: [
          'Source of funds means where the money involved in a particular transaction or activity came from.',
          'For example, money for a specific payment might come from your salary, your savings, or a sale.',
        ],
        keyPoint: 'Source of funds is where the money in one transaction came from.',
      },
      {
        id: 'source-of-wealth',
        title: 'Source of wealth',
        paragraphs: [
          "Source of wealth means how a person's overall wealth was built up over time.",
          'It looks at the bigger picture — years of earning, saving, business, or inheritance — rather than a single payment.',
        ],
        keyPoint: 'Source of wealth is how overall wealth was accumulated over time.',
      },
      {
        id: 'beneficial-ownership',
        title: 'Beneficial ownership',
        paragraphs: [
          'The beneficial owner is the person who ultimately owns or controls a business or arrangement.',
          'It is about who really benefits, even when the name on paper is a company or someone else.',
        ],
        keyPoint: 'Beneficial ownership is about who ultimately owns or controls something.',
      },
      {
        id: 'aml-cft',
        title: 'AML/CFT',
        paragraphs: [
          'AML/CFT refers to measures that help prevent the financial system from being misused for money laundering or terrorist financing.',
          'These measures are why financial institutions take steps to understand customers and their transactions.',
        ],
        keyPoint: 'AML/CFT measures help keep the financial system from being misused.',
      },
      {
        id: 'why-fi-asks',
        title: 'Why a financial institution may ask questions',
        paragraphs: [
          'Banks and other financial institutions may sometimes need information about customers, transactions, or the origin of funds.',
          'Being asked is a normal part of how the financial system works and is not an accusation.',
        ],
        keyPoint: 'Being asked for information is a normal part of banking.',
      },
    ],
  },
  {
    id: 'small-business',
    letter: 'H',
    title: 'Small business basics',
    summary: 'Educational ideas for keeping business money in order.',
    lessons: [
      {
        id: 'separate-money',
        title: 'Separate personal and business money',
        paragraphs: [
          'Keeping business money apart from personal money makes it far easier to see how the business is really doing.',
          'When the two are mixed, it is hard to tell profit from your own spending.',
        ],
        example: 'Using one account for shop takings and home expenses hides the true picture.',
        keyPoint: 'Keep business money and personal money separate.',
      },
      {
        id: 'sales-not-profit',
        title: 'Sales are not profit',
        paragraphs: [
          'Sales are the total money coming in from what you sell. Profit is what is left after costs.',
          'Selling a lot does not mean you kept a lot — the costs of running the business come out first.',
        ],
        example: 'Sales Nu. 100,000, purchases Nu. 60,000, other costs Nu. 20,000 leaves Nu. 20,000 before other obligations. Nu. 100,000 of sales does not mean the business made Nu. 100,000 profit.',
        keyPoint: 'Sales are not profit — costs come out first.',
      },
      {
        id: 'business-income-expenses',
        title: 'Business income and expenses',
        paragraphs: [
          'Business income is what the business earns; business expenses are what it spends to operate.',
          'Recording both is the only way to know whether the business is making or losing money.',
        ],
        example: 'Rent, stock, and wages are expenses to weigh against sales income.',
        keyPoint: 'Track both what the business earns and what it spends.',
        tryIt: { label: 'Open Transactions', destination: 'Transactions' },
      },
      {
        id: 'cash-flow',
        title: 'Cash flow',
        paragraphs: [
          'Cash flow is the timing of money coming in and going out. A business can be busy yet still run short of cash.',
          'Problems arise when money is due to go out before the money coming in arrives.',
        ],
        example: 'If stock must be paid now but customers pay next month, cash can run tight.',
        keyPoint: 'Cash flow is about timing, not just totals.',
      },
      {
        id: 'working-capital',
        title: 'Working capital',
        paragraphs: [
          'Working capital is the everyday money a business needs to keep running — to buy stock and cover short-term costs.',
          'Without enough, a business may struggle even when sales are healthy.',
        ],
        example: 'Money set aside to restock and pay bills until customers pay is working capital.',
        keyPoint: 'Working capital keeps day-to-day operations going.',
      },
      {
        id: 'record-keeping',
        title: 'Record keeping',
        paragraphs: [
          'Good records mean writing down what comes in and what goes out, consistently.',
          'Clear records make it easier to see how the business is doing and to answer questions later.',
        ],
        example: 'Noting every sale and purchase builds a picture you can trust.',
        keyPoint: 'Consistent records show the true state of the business.',
        tryIt: { label: 'Open Transactions', destination: 'Transactions' },
      },
      {
        id: 'business-obligations',
        title: 'Regular business obligations',
        paragraphs: [
          'Most businesses have regular commitments — rent, supplier payments, wages, and loan repayments.',
          'Knowing these in advance helps you keep enough cash ready to meet them.',
        ],
        example: 'Monthly rent and supplier dues are obligations to plan cash around.',
        keyPoint: 'Plan cash around the regular obligations you must meet.',
      },
      {
        id: 'business-fraud',
        title: 'Fraud awareness for businesses',
        paragraphs: [
          'Businesses are targets for fake invoices, payment redirection tricks, and impersonation of suppliers.',
          'Verify payment changes directly with the supplier through a known contact before sending money.',
        ],
        example: 'An email "update our bank details for this payment" should be confirmed by phone first.',
        keyPoint: 'Confirm any change to payment details before you pay.',
      },
    ],
  },
]

export const allLessons: Lesson[] = topicGroups.flatMap(group => group.lessons)

export function findLesson(id: string): Lesson | undefined {
  return allLessons.find(lesson => lesson.id === id)
}

// User type only reorders which lessons are recommended first. Every lesson stays
// reachable through the topic groups regardless of user type.
const RECOMMENDATIONS: Record<UserType, string[]> = {
  student: ['needs-wants', 'simple-budget', 'saving-goal', 'savings-account', 'otp-safety', 'phishing'],
  salaried: ['salary', 'take-home-pay', 'regular-commitments', 'emergency-savings', 'emi', 'what-insurance-does', 'pension', 'kyc'],
  individual: ['freelance', 'pension', 'simple-budget', 'emergency-savings', 'fixed-deposit', 'what-insurance-does', 'what-is-loan', 'kyc'],
  'small-business': ['separate-money', 'sales-not-profit', 'cash-flow', 'working-capital', 'record-keeping', 'beneficial-ownership', 'aml-cft', 'phishing'],
}

// Balanced general selection when no user type is chosen.
const GENERAL_RECOMMENDATIONS = ['money-in-out', 'simple-budget', 'emergency-savings', 'savings-account', 'otp-safety', 'kyc']

export function recommendedLessonIds(userType?: UserType): string[] {
  const ids = userType ? RECOMMENDATIONS[userType] : GENERAL_RECOMMENDATIONS
  // Only surface ids that resolve to real lessons.
  return ids.filter(id => findLesson(id))
}

export function recommendedLessons(userType?: UserType): Lesson[] {
  return recommendedLessonIds(userType).map(id => findLesson(id)!).filter(Boolean)
}
