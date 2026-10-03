export interface HelpManualChapter {
  id: string
  number: string
  title: string
  routes: string[]
  whatItIs: string
  whenToUse: string
  whenNotToUse: string
  example: string
  steps: string
  afterSaving: string
  mistakes: string
  relatedFeatures: string
  privacyNote: string
  keywords: string[]
}

export interface HelpGlossaryEntry {
  term: string
  definition: string
}

export const helpManualChapters: HelpManualChapter[] =
[
  {
    "id": "welcome-to-money-saathi",
    "number": "01",
    "title": "Welcome to Money Saathi",
    "routes": [
      "/",
      "/app/about",
      "/app/start"
    ],
    "whatItIs": "A Bhutan-first local money notebook and planning app.",
    "whenToUse": "Understand the app before entering records.",
    "whenNotToUse": "Bank synchronization or an audited account statement.",
    "example": "Nu. 30,000 salary is entered by you, not fetched from a bank.",
    "steps": "Read /, /app/about and /app/start; choose Open Money Saathi.",
    "afterSaving": "Reading does not create records.",
    "mistakes": "Expecting the sample dashboard to contain your money.",
    "relatedFeatures": "Start Here; Privacy; Backup.",
    "privacyNote": "Records belong to this browser/device; never provide bank PIN, OTP or password.",
    "keywords": [
      "Bhutan",
      "Ngultrum",
      "local-first",
      "bank connection"
    ]
  },
  {
    "id": "start-here",
    "number": "02",
    "title": "Start Here",
    "routes": [
      "/onboarding",
      "/app/setup",
      "/app/start"
    ],
    "whatItIs": "Onboarding, local profile and home-experience choices.",
    "whenToUse": "Choose a suitable starting experience and familiar tools.",
    "whenNotToUse": "Recording salary or changing bank accounts.",
    "example": "Choosing salaried does not record Nu. 30,000.",
    "steps": "Read /onboarding; open /app/setup; choose preferences; use Home and More to find tools.",
    "afterSaving": "Profile/setup changes local preferences, not financial totals.",
    "mistakes": "Treating setup answers as money transactions.",
    "relatedFeatures": "Settings; Home; Getting Started.",
    "privacyNote": "Back up durable preferences with records; different browser origins have separate data.",
    "keywords": [
      "onboarding",
      "profile",
      "setup",
      "preferences"
    ]
  },
  {
    "id": "home",
    "number": "03",
    "title": "Home",
    "routes": [
      "/app"
    ],
    "whatItIs": "An overview of entered actual money and conservative planning room.",
    "whenToUse": "Review money before everyday spending.",
    "whenNotToUse": "Checking a bank-confirmed balance.",
    "example": "Nu. 30,000 in minus Nu. 2,500 out gives Nu. 27,500 before planning deductions.",
    "steps": "Open /app; inspect Recorded balance and Safe to Spend; follow detail links; compare actual records.",
    "afterSaving": "Home reads records; opening it saves no transaction.",
    "mistakes": "Adding savings again to ledger cash or assuming Safe to Spend is a guarantee.",
    "relatedFeatures": "Transactions; Regular Money; Safety Buffer.",
    "privacyNote": "App Lock hides screens; it does not encrypt the main financial database.",
    "keywords": [
      "recorded balance",
      "Safe to Spend",
      "dashboard",
      "actual money"
    ]
  },
  {
    "id": "transactions",
    "number": "04",
    "title": "Transactions",
    "routes": [
      "/app/transactions",
      "/app/transactions/new"
    ],
    "whatItIs": "Actual Personal income and expenses.",
    "whenToUse": "Record salary, rent received, groceries or fuel already paid.",
    "whenNotToUse": "Own-account transfers: there is no transfer record type.",
    "example": "Record Nu. 2,500 groceries as Money out, Food.",
    "steps": "Open /app/transactions/new; choose kind; enter amount/category/date/note; review; Save. Edit through Transactions.",
    "afterSaving": "Saved actual money updates Home, relevant Budget and Reports; linked recurring records affect plans.",
    "mistakes": "Calling an own-account credit income; saving a pasted message twice; treating duplicate warning as prevention.",
    "relatedFeatures": "Budget; Regular Money; Reports.",
    "privacyNote": "Paste is local; original message is not automatically persisted. User-written notes are stored/exportable.",
    "keywords": [
      "income",
      "expense",
      "salary",
      "groceries",
      "fuel",
      "paste message",
      "duplicate",
      "own-account transfer"
    ]
  },
  {
    "id": "budget",
    "number": "05",
    "title": "Budget",
    "routes": [
      "/app/budget"
    ],
    "whatItIs": "A category limit for a selected month.",
    "whenToUse": "Plan Food or Transport spending.",
    "whenNotToUse": "Recording payments or reserving cash automatically.",
    "example": "Nu. 3,000 Food limit minus Nu. 2,500 actual Food = Nu. 500.",
    "steps": "Open /app/budget; choose month/category; enter limit; save; inspect spent/remaining and unbudgeted spending.",
    "afterSaving": "Only budget limits change; actual expenses supply spent figures.",
    "mistakes": "Assuming unbudgeted expenses do not count elsewhere.",
    "relatedFeatures": "Transactions; Reports; My Month.",
    "privacyNote": "Limits remain locally stored and are included in normal backup.",
    "keywords": [
      "monthly limit",
      "Food",
      "Transport",
      "planned spending",
      "remaining"
    ]
  },
  {
    "id": "regular-money",
    "number": "06",
    "title": "Regular Money",
    "routes": [
      "/app/regular-money"
    ],
    "whatItIs": "Repeated expected income or expenses, with optional explicit actual recording.",
    "whenToUse": "Plan monthly salary, rent or EMI dates.",
    "whenNotToUse": "Assuming the app pays bills or automatically reads payments.",
    "example": "Schedule Nu. 5,000 EMI monthly; mark paid only after actual payment.",
    "steps": "Open /app/regular-money; choose income/expense, frequency, amount and dates; save; record a due occurrence only when real.",
    "afterSaving": "Schedule alone changes plans; explicitly recording an occurrence creates a linked actual transaction.",
    "mistakes": "Manually recording the payment and recording the schedule occurrence again.",
    "relatedFeatures": "Forecast; Upcoming; Calendar; Alerts.",
    "privacyNote": "Names/notes are local. Deleting a schedule does not delete existing actual transactions.",
    "keywords": [
      "recurring",
      "schedule",
      "salary",
      "rent",
      "EMI",
      "occurrence",
      "linked transaction"
    ]
  },
  {
    "id": "goals",
    "number": "07",
    "title": "Goals",
    "routes": [
      "/app/goals"
    ],
    "whatItIs": "A target and manually tracked contribution progress.",
    "whenToUse": "Plan a phone, education or another saving target.",
    "whenNotToUse": "Moving money or checking actual Savings balance.",
    "example": "Nu. 2,000 contributed toward Nu. 20,000 is 10%.",
    "steps": "Open /app/goals; create name/target and optional date; save; add contributions when appropriate; review progress.",
    "afterSaving": "Goal progress changes; no expense, transfer or asset is created.",
    "mistakes": "Counting the same contribution as a new asset or assuming it reduced spendable cash.",
    "relatedFeatures": "My Money; Debt & Goals.",
    "privacyNote": "Goal notes are ordinary local records; deletion also removes goal contributions.",
    "keywords": [
      "target",
      "contribution",
      "saving goal",
      "progress",
      "phone",
      "education"
    ]
  },
  {
    "id": "my-money",
    "number": "08",
    "title": "My Money",
    "routes": [
      "/app/my-money"
    ],
    "whatItIs": "Entered Savings, FD and RD asset references.",
    "whenToUse": "Track balances you have independently checked.",
    "whenNotToUse": "Reconciling bank statements or recording actual income/expense.",
    "example": "A Nu. 50,000 FD adds principal to tracked assets.",
    "steps": "Open /app/my-money; choose asset type; enter checked balance/principal/details; save; update manually as circumstances change.",
    "afterSaving": "Asset totals change; Personal transactions and Goal progress remain separate.",
    "mistakes": "Counting expected FD interest as cash already received.",
    "relatedFeatures": "Loans; FD/RD; Money Health.",
    "privacyNote": "Main asset records are not Vault-encrypted; readable exports include them.",
    "keywords": [
      "savings",
      "FD",
      "RD",
      "asset",
      "fixed deposit",
      "recurring deposit"
    ]
  },
  {
    "id": "loans",
    "number": "09",
    "title": "Loans",
    "routes": [
      "/app/my-money/loans"
    ],
    "whatItIs": "Entered original and current outstanding debt with optional EMI details.",
    "whenToUse": "Monitor lender-confirmed outstanding balances.",
    "whenNotToUse": "Automatic amortization, payments or lender integration.",
    "example": "Nu. 100,000 original and Nu. 80,000 outstanding describe different figures.",
    "steps": "Open /app/my-money/loans; enter loan details; save; after a payment, record actual expense separately and update confirmed outstanding.",
    "afterSaving": "Tracked debt/net assets change; no repayment transaction is created.",
    "mistakes": "Subtracting all EMI from principal despite interest/charges; confusing reminder completion with repayment.",
    "relatedFeatures": "Transactions; Loan Reminders; Debt & Goals.",
    "privacyNote": "Do not enter banking secrets; keep provider references minimal.",
    "keywords": [
      "loan",
      "outstanding",
      "principal",
      "EMI",
      "repayment",
      "debt"
    ]
  },
  {
    "id": "fd-rd-schemes",
    "number": "10",
    "title": "FD, RD & Schemes",
    "routes": [
      "/app/my-money",
      "/app/my-money/schemes"
    ],
    "whatItIs": "Deposit references and other financial-scheme records.",
    "whenToUse": "Track principal, paid RD instalments and provider dates.",
    "whenNotToUse": "Predicting guaranteed returns or automatically posting contributions.",
    "example": "Nu. 50,000 at 5% for 12 months illustrates Nu. 2,500 simple FD interest.",
    "steps": "Use /app/my-money for FD/RD; /app/my-money/schemes for schemes; enter verified terms and dates; update paid counts/status manually.",
    "afterSaving": "Asset references or scheme schedules update; no Personal payment is saved automatically.",
    "mistakes": "Assuming RD compound interest is calculated; treating scheme cover/future benefit as current savings.",
    "relatedFeatures": "Calendar; Alerts; My Money.",
    "privacyNote": "Provider terms remain authoritative; scheme values do not automatically join core asset totals.",
    "keywords": [
      "FD",
      "RD",
      "scheme",
      "simple interest",
      "instalment",
      "maturity"
    ]
  },
  {
    "id": "reports",
    "number": "11",
    "title": "Reports",
    "routes": [
      "/app/reports"
    ],
    "whatItIs": "A selected-month summary of recorded Personal transactions.",
    "whenToUse": "Review entered income, expenses and cash flow.",
    "whenNotToUse": "Audited statements, tax returns or a combined Business report.",
    "example": "Nu. 1,000 income and Nu. 250 expense give Nu. 750 net and 75% cash-flow rate.",
    "steps": "Open /app/reports; select month; review totals/categories; use CSV or browser Print / Save PDF when needed.",
    "afterSaving": "Viewing changes no record; export creates a local file through browser controls.",
    "mistakes": "Reading average expense as average daily spending; mixing Business cash with Personal totals.",
    "relatedFeatures": "Transactions; Export; Business Reports.",
    "privacyNote": "Files can reveal amounts/notes; keep them private. Personal PDF uses native print, unlike Business PDF.",
    "keywords": [
      "report",
      "CSV",
      "PDF",
      "cash flow",
      "monthly summary",
      "print"
    ]
  },
  {
    "id": "my-month",
    "number": "12",
    "title": "My Month",
    "routes": [
      "/app/month"
    ],
    "whatItIs": "This-month actual cash flow plus remaining scheduled money.",
    "whenToUse": "Compare what happened with expected remaining income/expenses.",
    "whenNotToUse": "Assuming expected salary is already spendable.",
    "example": "Nu. 30,000 expected salary stays planned until actually recorded.",
    "steps": "Open /app/month; inspect actual totals and remaining schedules; follow Regular Money links; correct source records if needed.",
    "afterSaving": "Reading saves no cash; source schedule/transaction edits refresh the view.",
    "mistakes": "Calling projected net the bank balance.",
    "relatedFeatures": "Home; Regular Money; Forecast.",
    "privacyNote": "Projection is local and depends on complete records and correct device date.",
    "keywords": [
      "month",
      "actual",
      "planned",
      "scheduled",
      "projected net"
    ]
  },
  {
    "id": "forecast",
    "number": "13",
    "title": "Forecast",
    "routes": [
      "/app/forecast"
    ],
    "whatItIs": "A 30/60/90-day schedule-based cash projection.",
    "whenToUse": "See upcoming pressure from entered regular payments.",
    "whenNotToUse": "Guaranteed future income or a full financial model.",
    "example": "An upcoming Nu. 8,000 rent schedule lowers the projected path.",
    "steps": "Open /app/forecast; choose horizon; review opening, lowest and ending figures; inspect underlying dates.",
    "afterSaving": "Changing the horizon only changes the view; schedules remain source data.",
    "mistakes": "Expecting Goals, schemes or unentered loan instalments to appear automatically.",
    "relatedFeatures": "Regular Money; Safe to Spend; My Month.",
    "privacyNote": "No bank or external forecasting service; accuracy depends on what you entered.",
    "keywords": [
      "30 day",
      "60 day",
      "90 day",
      "projection",
      "cash flow",
      "lowest balance"
    ]
  },
  {
    "id": "upcoming-calendar",
    "number": "14",
    "title": "Upcoming & Calendar",
    "routes": [
      "/app/upcoming",
      "/app/calendar"
    ],
    "whatItIs": "Dated views of entered schedules and reference events.",
    "whenToUse": "Review approaching payments, deposits and scheme dates.",
    "whenNotToUse": "Evidence that a payment was made.",
    "example": "A Nu. 5,000 EMI can appear as an upcoming scheduled expense.",
    "steps": "Open /app/upcoming or /app/calendar; inspect dates/source labels; open the relevant record to update it.",
    "afterSaving": "Viewing does not pay, settle or record money.",
    "mistakes": "Treating every calendar item as a Forecast cash movement.",
    "relatedFeatures": "Regular Money; Schemes; Alerts.",
    "privacyNote": "Dates come from local records/device clock; verify them with providers.",
    "keywords": [
      "upcoming",
      "calendar",
      "due date",
      "schedule",
      "event"
    ]
  },
  {
    "id": "financial-safety",
    "number": "15",
    "title": "Financial Safety",
    "routes": [
      "/app/financial-safety",
      "/app/safety-buffer",
      "/app/money-health",
      "/app/irregular-income",
      "/app/explain"
    ],
    "whatItIs": "Buffer, savings coverage and reflective money-health tools.",
    "whenToUse": "Compare liquid savings with recorded expense averages.",
    "whenNotToUse": "A professional suitability assessment or bank product recommendation.",
    "example": "Three months at Nu. 10,000 average expense suggests Nu. 30,000 reference cover.",
    "steps": "Open /app/financial-safety and /app/safety-buffer; inspect assumptions; use /app/money-health, /app/irregular-income and /app/explain for context.",
    "afterSaving": "Saved buffer/floor preferences alter planning references; no funds move.",
    "mistakes": "Treating excluded zero-expense months or an irregular-income average as a full-year fact.",
    "relatedFeatures": "My Money; Home; Forecast.",
    "privacyNote": "Explain tools are deterministic reflections, not external AI or financial advice.",
    "keywords": [
      "safety buffer",
      "emergency fund",
      "money health",
      "irregular income",
      "explain"
    ]
  },
  {
    "id": "business",
    "number": "16",
    "title": "Business",
    "routes": [
      "/app/business",
      "/app/business/cash",
      "/app/business/trade",
      "/app/business/credit",
      "/app/business/inventory",
      "/app/business/reports"
    ],
    "whatItIs": "Separate workspaces for Cash, Trade, dues, Inventory and reports.",
    "whenToUse": "Track a shop with clear separation from Personal money.",
    "whenNotToUse": "Automatic double-entry books or net-profit/tax filing.",
    "example": "A Nu. 400 Cash in does not automatically become a sale.",
    "steps": "Open /app/business; select correct name; use Cash for receipts/payments, Trade for documents/stock, Credit for dues; inspect Reports.",
    "afterSaving": "Only the chosen record types change; Trade lines affect stock; payments/dues need separate updates.",
    "mistakes": "Posting a sale then assuming Cash and receivable were created; mixing businesses.",
    "relatedFeatures": "Inventory; Business Reports; Export.",
    "privacyNote": "Check businessId/name every time; deleting a workspace removes its associated Business records.",
    "keywords": [
      "cash",
      "sale",
      "purchase",
      "receivable",
      "payable",
      "inventory",
      "COGS",
      "stock",
      "businessId",
      "dues"
    ]
  },
  {
    "id": "alerts-reminders",
    "number": "17",
    "title": "Alerts & Reminders",
    "routes": [
      "/app/alerts",
      "/app/loan-reminders"
    ],
    "whatItIs": "Local date-based prompts and separately verified loan reminders.",
    "whenToUse": "Notice due dates and update completed reference events.",
    "whenNotToUse": "Automatic payments or reliable background delivery when the app is closed.",
    "example": "After paying a Nu. 5,000 EMI, update reminder and actual expense separately.",
    "steps": "Open /app/alerts; inspect source; use /app/loan-reminders to enter lender-verified date/amount; mark only confirmed completion.",
    "afterSaving": "Acknowledging hides an alert today; loan reminder completion advances/disables its reminder, not debt or cash.",
    "mistakes": "Assuming acknowledge means settled; expecting every in-app alert to produce a browser notification.",
    "relatedFeatures": "Regular Money; Loans; Business dues.",
    "privacyNote": "Browser notifications are opt-in; foreground notifier coverage is narrower than Alert Centre.",
    "keywords": [
      "alert",
      "reminder",
      "loan due",
      "acknowledge",
      "notification"
    ]
  },
  {
    "id": "saathi",
    "number": "18",
    "title": "Saathi",
    "routes": [
      "/app/saathi",
      "/app/saathi/privacy",
      "/app/saathi/ask"
    ],
    "whatItIs": "A local Guide plus permission-aware supported question tools.",
    "whenToUse": "Understand entered money with deterministic answers.",
    "whenNotToUse": "General generative AI, banking integration or Vault lookup.",
    "example": "Money summary permission supports a recorded monthly Nu. 2,500 spending answer.",
    "steps": "Read /app/saathi; configure /app/saathi/privacy only if desired; ask /app/saathi/ask; restore access Off when preferred.",
    "afterSaving": "Permission changes control Ask/floating loaders; Guide has its own direct local reads.",
    "mistakes": "Assuming Off stops Guide summaries, deletes records or makes a context preview identical to all internal reads.",
    "relatedFeatures": "Home; Planning; Privacy.",
    "privacyNote": "Vault is excluded; no authored external AI transport. Explain each permission boundary honestly.",
    "keywords": [
      "Ask Saathi",
      "floating assistant",
      "Guide",
      "permissions",
      "deterministic",
      "local"
    ]
  },
  {
    "id": "money-vault",
    "number": "19",
    "title": "Money Vault",
    "routes": [
      "/app/vault"
    ],
    "whatItIs": "Separate encrypted financial references.",
    "whenToUse": "Store limited account/deposit/loan/insurance/investment references.",
    "whenNotToUse": "Bank passwords, PINs, OTPs or replacing My Money assets.",
    "example": "An FD reference does not add Nu. 50,000 to tracked assets.",
    "steps": "Open /app/vault; create a strong unique passphrase; unlock; add minimal reference; lock; keep separate Vault backup.",
    "afterSaving": "Reference payload is encrypted in the separate Vault store; main money totals do not change.",
    "mistakes": "Expecting normal backup to include Vault or a forgotten passphrase to be recoverable.",
    "relatedFeatures": "My Money; Vault Backup; App Lock.",
    "privacyNote": "Keep passphrase privately; inactivity/background rules clear the in-memory key.",
    "keywords": [
      "Vault",
      "passphrase",
      "encrypted reference",
      "separate backup",
      "account reference"
    ]
  },
  {
    "id": "app-lock",
    "number": "20",
    "title": "App Lock",
    "routes": [
      "/app/security"
    ],
    "whatItIs": "A local six-digit PIN screen gate for /app routes.",
    "whenToUse": "Reduce casual access to app screens on the device.",
    "whenNotToUse": "Encrypting the main database or reusing bank PINs.",
    "example": "Use a unique fictional six-digit PIN in training, never a bank PIN.",
    "steps": "Open /app/security; set and confirm a unique PIN; explicitly lock; unlock when needed; use current PIN to change/disable.",
    "afterSaving": "PIN verifier is stored locally; no financial record changes.",
    "mistakes": "Promising every refresh relocks; assuming forgotten PIN can be reset without site-data loss.",
    "relatedFeatures": "Vault; Backup; Settings.",
    "privacyNote": "Five valid wrong attempts trigger 30-second cooldown; protect device/browser as well.",
    "keywords": [
      "PIN",
      "screen lock",
      "six digit",
      "PBKDF2",
      "cooldown",
      "security"
    ]
  },
  {
    "id": "backup-restore",
    "number": "21",
    "title": "Backup & Restore",
    "routes": [
      "/app/backup"
    ],
    "whatItIs": "Encrypted recovery file for normal records/settings, separate from Vault backup.",
    "whenToUse": "Protect local records before device/browser change or risky actions.",
    "whenNotToUse": "Combining two datasets or using CSV as restore input.",
    "example": "A Nu. 30,000 salary record is recoverable only if included in your saved backup.",
    "steps": "Open /app/backup; create with strong unique password; save file safely; verify it; before restore retain current backup, review and type RESTORE.",
    "afterSaving": "Creation changes no records; restore replaces normal financial data with validated contents, not a merge.",
    "mistakes": "Losing password/file; assuming normal backup contains Vault, App Lock or Saathi permissions.",
    "relatedFeatures": "Vault Backup; Export; Troubleshooting.",
    "privacyNote": "AES-GCM encryption; no recovery service. Clearing browser data/device loss can erase unbacked records.",
    "keywords": [
      "backup",
      "restore",
      "encrypted",
      "password",
      "RESTORE",
      "replace",
      "not merge",
      "AES-GCM"
    ]
  },
  {
    "id": "export",
    "number": "22",
    "title": "Export",
    "routes": [
      "/app/data-export",
      "/app/reports",
      "/app/business/reports"
    ],
    "whatItIs": "Readable CSV/JSON copies and distinct report outputs.",
    "whenToUse": "Share or inspect records outside the app.",
    "whenNotToUse": "Encrypted recovery or importing a CSV through Restore.",
    "example": "A Food expense Nu. 2,500 is visible in a readable Personal CSV.",
    "steps": "Open /app/data-export; choose Personal or selected Business; choose format; save securely; use report routes for monthly PDF/CSV.",
    "afterSaving": "A file is created; database stays unchanged.",
    "mistakes": "Calling JSON encrypted; combining Business and Personal PDF by mistake.",
    "relatedFeatures": "Reports; Business Reports; Backup.",
    "privacyNote": "CSV/JSON can contain personal notes, names and figures; share deliberately.",
    "keywords": [
      "export",
      "CSV",
      "JSON",
      "PDF",
      "readable",
      "not backup"
    ]
  },
  {
    "id": "install-offline",
    "number": "23",
    "title": "Install & Offline",
    "routes": [
      "/app/install"
    ],
    "whatItIs": "Browser-supported PWA installation and cached local operation.",
    "whenToUse": "Use a convenient app entry and previously cached screens.",
    "whenNotToUse": "Guaranteeing uncached first access or every platform works offline.",
    "example": "Offline access can show a previously entered Nu. 2,500 expense when its screen is cached.",
    "steps": "Load online first; open /app/install; follow available browser instructions; allow caching; finish edits before accepting update.",
    "afterSaving": "Install/cache affects browser resources; no financial server sync is created.",
    "mistakes": "Clearing site data after install; assuming offline-ready means all lazy screens were tested.",
    "relatedFeatures": "Backup; Settings; Troubleshooting.",
    "privacyNote": "Use backups against eviction/device loss; actual offline behavior needs device-specific runtime verification.",
    "keywords": [
      "PWA",
      "install",
      "offline",
      "cache",
      "service worker"
    ]
  },
  {
    "id": "privacy-security",
    "number": "24",
    "title": "Privacy & Security",
    "routes": [
      "/app/security",
      "/app/saathi/privacy",
      "/app/backup",
      "/app/vault"
    ],
    "whatItIs": "Practical boundaries of local records, encryption and permissions.",
    "whenToUse": "Choose safe handling for financial information.",
    "whenNotToUse": "Believing the app stores no data or provides server recovery.",
    "example": "Nu. 30,000 salary is stored locally, not fetched from your bank.",
    "steps": "Review /app/security, /app/saathi/privacy, Backup and Vault; choose independent secrets; secure the device and files.",
    "afterSaving": "Only explicit settings/records you save change; reading privacy guidance changes none.",
    "mistakes": "Equating local-first with encrypted main records; pasting bank secrets into notes.",
    "relatedFeatures": "App Lock; Vault; Backup; Saathi.",
    "privacyNote": "No bank API/automatic SMS reader authored; pasted text is local. Browser/platform traffic is distinct from app financial transport.",
    "keywords": [
      "privacy",
      "security",
      "local-first",
      "bank API",
      "SMS",
      "credentials",
      "encryption"
    ]
  },
  {
    "id": "troubleshooting",
    "number": "25",
    "title": "Troubleshooting",
    "routes": [
      "/app/help",
      "/app/backup",
      "/app/install"
    ],
    "whatItIs": "Safe checks for missing records, figures, schedules and files.",
    "whenToUse": "Diagnose before erasing or restoring data.",
    "whenNotToUse": "Trying passwords repeatedly or clearing data as a first fix.",
    "example": "Missing Nu. 2,500 Food may mean wrong month, browser or origin.",
    "steps": "Check exact browser/origin/month/business; inspect source records; compare linked schedules; verify backup; seek provider terms for financial discrepancies.",
    "afterSaving": "Read-only diagnosis changes nothing; any restore/deletion needs its own explicit review.",
    "mistakes": "Refreshing to expect bank import; treating cached route failure as record loss; restoring over unsaved current data.",
    "relatedFeatures": "Transactions; Backup; Install; Reports.",
    "privacyNote": "Never send a PIN/passphrase or unredacted backup to support; no cloud recovery is implemented.",
    "keywords": [
      "missing data",
      "wrong month",
      "browser",
      "origin",
      "restore",
      "support"
    ]
  },
  {
    "id": "glossary",
    "number": "26",
    "title": "Glossary",
    "routes": [
      "/app/help"
    ],
    "whatItIs": "Definitions tying app labels to the actual model.",
    "whenToUse": "Clarify actual, planned, reference and current-position figures.",
    "whenNotToUse": "Replacing provider terms or tax/accounting definitions.",
    "example": "Nu. 750 net cash flow is Nu. 1,000 income minus Nu. 250 expenses.",
    "steps": "Read M below; find the exact label; compare related feature; check its period and record source.",
    "afterSaving": "Glossary reading does not save or move money.",
    "mistakes": "Calling verified gross margin net profit or current stock historical month-end stock.",
    "relatedFeatures": "Reports; Business; Financial Model.",
    "privacyNote": "Use fictional examples; never disclose sensitive references merely to explain a term.",
    "keywords": [
      "definition",
      "meaning",
      "term",
      "chetrum",
      "Safe to Spend",
      "COGS",
      "PWA"
    ]
  }
]

export const helpGlossary: HelpGlossaryEntry[] =
[
  {
    "term": "Nu. / Ngultrum",
    "definition": "Bhutan's currency used for app figures."
  },
  {
    "term": "Chetrum",
    "definition": "One hundredth of a Ngultrum; app stores money as integer chetrum."
  },
  {
    "term": "Money in / income",
    "definition": "Personal money actually received and recorded; not every bank credit."
  },
  {
    "term": "Money out / expense",
    "definition": "Personal money actually paid and recorded; not own-account transfer."
  },
  {
    "term": "Recorded balance",
    "definition": "Entered Personal income minus entered expenses through the relevant date; not bank balance."
  },
  {
    "term": "Net cash flow",
    "definition": "Recorded income minus expenses for the selected period."
  },
  {
    "term": "Cash-flow rate",
    "definition": "Net cash flow as percentage of recorded income; absent when income is zero."
  },
  {
    "term": "Category",
    "definition": "Label grouping recorded money, such as Food or Salary."
  },
  {
    "term": "Budget",
    "definition": "Selected month's category spending limit; not a cash movement."
  },
  {
    "term": "Commitment",
    "definition": "Planned Regular Money expense; not automatically paid."
  },
  {
    "term": "Occurrence",
    "definition": "One scheduled date of a repeating item."
  },
  {
    "term": "Linked transaction",
    "definition": "An actual record created from a scheduled occurrence with identifying linkage."
  },
  {
    "term": "Safe to Spend",
    "definition": "Non-negative conservative room from recorded cash after applicable schedules and buffer."
  },
  {
    "term": "Safety buffer",
    "definition": "Amount intentionally excluded from planning room; not a separate bank balance."
  },
  {
    "term": "Forecast",
    "definition": "Schedule-based projection, not promised future income."
  },
  {
    "term": "Liquid savings",
    "definition": "Entered Savings-account balances used as potential available reserves; may already be earmarked."
  },
  {
    "term": "FD",
    "definition": "Fixed deposit; app tracks principal and a simple-interest estimate."
  },
  {
    "term": "RD",
    "definition": "Recurring deposit; tracked principal comes from entered instalments actually paid."
  },
  {
    "term": "EMI",
    "definition": "Loan instalment; can contain principal and interest."
  },
  {
    "term": "Principal / outstanding",
    "definition": "Original borrowed capital / currently entered remaining capital."
  },
  {
    "term": "Basis point",
    "definition": "One hundredth of a percentage point; internal rate precision."
  },
  {
    "term": "Goal contribution",
    "definition": "Progress record toward a target, not an automatic transfer."
  },
  {
    "term": "Protection cover",
    "definition": "Entered insurance protection reference, not current cash/savings."
  },
  {
    "term": "Business workspace",
    "definition": "Separate shop/service record set identified by businessId."
  },
  {
    "term": "Receivable / To collect",
    "definition": "Current recorded customer amount still owed to business."
  },
  {
    "term": "Payable / To pay",
    "definition": "Current recorded amount business owes supplier."
  },
  {
    "term": "Paid at entry",
    "definition": "Payment fact entered on original trade document; not all later settlements."
  },
  {
    "term": "COGS",
    "definition": "User-entered cost of the goods sold in sale lines."
  },
  {
    "term": "Gross margin before other expenses",
    "definition": "Sales with consistent lines minus entered COGS; not net profit."
  },
  {
    "term": "Verified (report)",
    "definition": "Internal record/line consistency, not external audit verification."
  },
  {
    "term": "Stock value",
    "definition": "Current calculated quantity at entered current cost; estimated, not historical valuation."
  },
  {
    "term": "Acknowledge alert",
    "definition": "Hide this reminder for today; does not pay or settle it."
  },
  {
    "term": "Local-first",
    "definition": "Core records stored in this device/browser, without an app cloud financial database."
  },
  {
    "term": "IndexedDB",
    "definition": "Browser's local structured record storage."
  },
  {
    "term": "App Lock",
    "definition": "Local screen PIN gate; not main-database encryption."
  },
  {
    "term": "Vault passphrase",
    "definition": "Separate secret deriving encryption key for protected references."
  },
  {
    "term": "Backup password",
    "definition": "Secret protecting normal restorable backup file."
  },
  {
    "term": "Encrypted backup",
    "definition": "Password-protected restore file; user must keep file and password."
  },
  {
    "term": "Export",
    "definition": "Readable CSV/JSON/PDF for outside review, not app restore path."
  },
  {
    "term": "PWA",
    "definition": "Website that can be installed/used with cached assets where browser supports it."
  },
  {
    "term": "Service worker",
    "definition": "Browser-managed app cache/update worker; does not imply cloud sync."
  },
  {
    "term": "Current position",
    "definition": "Latest outstanding/stock figures; not reconstructed historical month-end."
  }
]
