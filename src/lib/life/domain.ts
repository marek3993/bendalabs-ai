import { z } from "zod";

/** The personal workspace stores facts; no example or private user data is seeded. */
const idSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const shortText = z.string().trim().min(1).max(200);
const noteText = z.string().trim().max(10000);
const sourceSchema = z.string().trim().min(1).max(300);
const centsSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const signedCentsSchema = z.number().int().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Neplatný dátum.");
const instantSchema = z.iso.datetime({ offset: true });
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const optionalProject = idSchema.nullable();

export const transactionSchema = z.object({
  id: idSchema,
  date: dateSchema,
  title: shortText,
  amountCents: centsSchema,
  kind: z.enum(["income", "expense", "internal_transfer", "debt_principal", "cash_withdrawal", "refund"]),
  category: shortText,
  projectId: optionalProject,
  source: sourceSchema,
  confirmed: z.boolean(),
  note: noteText,
}).strict();

export const invoiceSchema = z.object({
  id: idSchema,
  number: shortText,
  client: shortText,
  issueDate: dateSchema,
  dueDate: dateSchema,
  grossCents: centsSchema,
  passThroughCents: centsSchema,
  status: z.enum(["draft", "unconfirmed", "issued", "partially_paid", "paid", "cancelled"]),
  paidCents: centsSchema,
  projectId: optionalProject,
  source: sourceSchema,
  note: noteText,
}).strict().superRefine((invoice, ctx) => {
  if (invoice.passThroughCents > invoice.grossCents) ctx.addIssue({ code: "custom", path: ["passThroughCents"], message: "Preúčtované náklady nemôžu prekročiť sumu faktúry." });
  if (invoice.paidCents > invoice.grossCents) ctx.addIssue({ code: "custom", path: ["paidCents"], message: "Úhrada nemôže prekročiť sumu faktúry." });
  if (invoice.status === "paid" && invoice.paidCents !== invoice.grossCents) ctx.addIssue({ code: "custom", path: ["paidCents"], message: "Uhradená faktúra musí mať zaznamenanú celú úhradu." });
  if (invoice.status === "partially_paid" && !(invoice.paidCents > 0 && invoice.paidCents < invoice.grossCents)) ctx.addIssue({ code: "custom", path: ["paidCents"], message: "Čiastočná úhrada musí byť menšia než celá faktúra." });
  if (["draft", "unconfirmed", "issued", "cancelled"].includes(invoice.status) && invoice.paidCents !== 0) ctx.addIssue({ code: "custom", path: ["paidCents"], message: "Zaznamenaj zodpovedajúci stav úhrady faktúry." });
  if (invoice.dueDate < invoice.issueDate) ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Splatnosť nemôže predchádzať vystaveniu." });
});

/** Verified historical aggregates are retained as aggregates, never invented transactions. */
export const monthlySnapshotSchema = z.object({
  id: idSchema,
  month: monthSchema,
  asOfDate: dateSchema,
  confirmed: z.boolean(),
  source: sourceSchema,
  note: noteText,
  incomeCents: centsSchema.nullable(),
  refundCents: centsSchema.nullable(),
  expenseCents: centsSchema.nullable(),
  debtPrincipalCents: centsSchema.nullable(),
  cashWithdrawalCents: centsSchema.nullable(),
  cashOutflowCents: centsSchema.nullable(),
  invoicedGrossCents: centsSchema.nullable(),
  invoicedPassThroughCents: centsSchema.nullable(),
  openingBalanceCents: signedCentsSchema.nullable(),
  closingBalanceCents: signedCentsSchema.nullable(),
  categories: z.array(z.object({ category: shortText, amountCents: signedCentsSchema }).strict()).max(100),
}).strict().superRefine((snapshot, ctx) => {
  if (snapshot.invoicedGrossCents !== null && snapshot.invoicedPassThroughCents !== null && snapshot.invoicedPassThroughCents > snapshot.invoicedGrossCents) ctx.addIssue({ code: "custom", path: ["invoicedPassThroughCents"], message: "Preúčtované náklady prevyšujú fakturáciu." });
  if (snapshot.expenseCents !== null && snapshot.debtPrincipalCents !== null && snapshot.cashWithdrawalCents !== null && snapshot.cashOutflowCents !== null) {
    const components = snapshot.expenseCents + snapshot.debtPrincipalCents + snapshot.cashWithdrawalCents;
    if (!Number.isSafeInteger(components) || components !== snapshot.cashOutflowCents) ctx.addIssue({ code: "custom", path: ["cashOutflowCents"], message: "Celkový odtok nezodpovedá svojim položkám." });
  }
  if (new Set(snapshot.categories.map(item => item.category.toLocaleLowerCase("sk"))).size !== snapshot.categories.length) ctx.addIssue({ code: "custom", path: ["categories"], message: "Kategória je uvedená viackrát." });
});

export const healthEntrySchema = z.object({
  id: idSchema,
  date: dateSchema,
  sleepHours: z.number().min(0).max(24).nullable(),
  energy: z.number().int().min(1).max(10).nullable(),
  hrv: z.number().min(0).max(1000).nullable(),
  restingHr: z.number().min(20).max(250).nullable(),
  steps: z.number().int().min(0).max(200000).nullable(),
  trainingMinutes: z.number().int().min(0).max(1440).nullable(),
  note: noteText,
  source: sourceSchema,
}).strict();

export const projectSchema = z.object({
  id: idSchema,
  title: shortText,
  description: noteText,
  status: z.enum(["active", "paused", "completed"]),
  nextStep: z.string().trim().max(1000),
  dueDate: dateSchema.nullable(),
  budgetCents: centsSchema.nullable(),
  priority: z.enum(["low", "normal", "high"]),
}).strict();

export const taskSchema = z.object({
  id: idSchema,
  title: shortText,
  projectId: optionalProject,
  dueDate: dateSchema.nullable(),
  done: z.boolean(),
  priority: z.enum(["low", "normal", "high"]),
  note: noteText,
}).strict();

const memoryFields = {
  title: shortText,
  content: z.string().trim().min(1).max(10000),
  scope: z.enum(["general", "finance", "health", "projects"]),
  active: z.boolean(),
  source: sourceSchema,
};
export const memoryInputSchema = z.object({ id: idSchema, ...memoryFields }).strict();
export const memoryRevisionSchema = z.object({
  ...memoryFields,
  revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  changedAt: instantSchema,
}).strict();
export const memorySchema = memoryInputSchema.extend({
  revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  updatedAt: instantSchema,
  history: z.array(memoryRevisionSchema).min(1).max(1000),
}).strict().superRefine((memory, ctx) => {
  const latest = memory.history.at(-1);
  if (!latest || latest.revision !== memory.revision || latest.changedAt !== memory.updatedAt || Object.keys(memoryFields).some(key => latest[key as keyof typeof memoryFields] !== memory[key as keyof typeof memoryFields])) {
    ctx.addIssue({ code: "custom", path: ["history"], message: "História pamäte nezodpovedá aktuálnej verzii." });
  }
  if (memory.history.some((item, index) => item.revision !== index + 1)) ctx.addIssue({ code: "custom", path: ["history"], message: "Verzie pamäte musia byť súvislé." });
});

export const reminderSchema = z.object({
  id: idSchema,
  title: shortText,
  dueAt: instantSchema.nullable(),
  enabled: z.boolean(),
  repeat: z.enum(["none", "daily", "weekdays", "weekly", "monthly"]),
  taskId: idSchema.nullable(),
  note: noteText,
}).strict().refine(item => !item.enabled || item.dueAt !== null, { path: ["dueAt"], message: "Aktívna pripomienka potrebuje čas." });

export const documentSchema = z.object({
  id: idSchema,
  title: shortText,
  kind: z.enum(["statement", "invoice", "health", "note", "other"]),
  date: dateSchema,
  note: noteText,
  projectId: optionalProject,
  source: sourceSchema,
}).strict();

export const radarItemSchema = z.object({
  id: idSchema,
  title: shortText,
  url: z.string().max(2000).url().refine(value => ["http:", "https:"].includes(new URL(value).protocol), "Povolené sú iba http a https odkazy."),
  topic: shortText,
  note: noteText,
  savedDate: dateSchema,
  projectId: optionalProject,
  archived: z.boolean(),
}).strict();

export const chatMessageSchema = z.object({
  id: idSchema,
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(10000),
  createdAt: instantSchema,
}).strict();

const categoryLimitSchema = z.object({ category: shortText, limitCents: centsSchema }).strict();
export const financeSettingsSchema = z.object({
  expectedMonthlyIncomeCents: centsSchema,
  monthlyBudgetCents: centsSchema,
  monthlySavingGoalCents: centsSchema,
  reservedCents: centsSchema,
  // A bank-account opening balance at the START of this date. Not additional income.
  openingBalanceCents: signedCentsSchema.nullable(),
  openingBalanceDate: dateSchema.nullable(),
  dataThroughDate: dateSchema.nullable(),
  reconciled: z.boolean(),
  completeMonths: z.array(monthSchema).max(1200),
  categoryLimits: z.array(categoryLimitSchema).max(100),
}).strict().superRefine((settings, ctx) => {
  if ((settings.openingBalanceDate === null) !== (settings.openingBalanceCents === null)) ctx.addIssue({ code: "custom", path: ["openingBalanceDate"], message: "Počiatočný zostatok potrebuje aj dátum." });
  if (settings.openingBalanceDate && settings.dataThroughDate && settings.dataThroughDate < settings.openingBalanceDate) ctx.addIssue({ code: "custom", path: ["dataThroughDate"], message: "Koniec údajov predchádza počiatočnému zostatku." });
  if (settings.reconciled && (!settings.dataThroughDate || settings.openingBalanceCents === null)) ctx.addIssue({ code: "custom", path: ["reconciled"], message: "Overený zostatok potrebuje počiatočný stav aj dátum úplnosti údajov." });
  if (new Set(settings.categoryLimits.map(item => item.category.toLocaleLowerCase("sk"))).size !== settings.categoryLimits.length) ctx.addIssue({ code: "custom", path: ["categoryLimits"], message: "Kategória môže mať iba jeden limit." });
});

export const lifeSettingsSchema = z.object({
  displayName: shortText,
  timezone: z.string().min(1).max(80).refine(value => { try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; } }, "Neplatné časové pásmo."),
  currency: z.literal("EUR"),
  finance: financeSettingsSchema,
}).strict();

export const collectionNames = ["transactions", "invoices", "monthlySnapshots", "healthEntries", "projects", "tasks", "memories", "reminders", "documents", "radarItems", "chatMessages"] as const;
export type LifeCollection = typeof collectionNames[number];
export const lifeStateSchema = z.object({
  schemaVersion: z.literal(1),
  version: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  updatedAt: instantSchema,
  settings: lifeSettingsSchema,
  transactions: z.array(transactionSchema).max(20000),
  invoices: z.array(invoiceSchema).max(5000),
  monthlySnapshots: z.array(monthlySnapshotSchema).max(1200),
  healthEntries: z.array(healthEntrySchema).max(10000),
  projects: z.array(projectSchema).max(2000),
  tasks: z.array(taskSchema).max(20000),
  memories: z.array(memorySchema).max(1000),
  reminders: z.array(reminderSchema).max(2000),
  documents: z.array(documentSchema).max(5000),
  radarItems: z.array(radarItemSchema).max(5000),
  chatMessages: z.array(chatMessageSchema).max(2000),
}).strict().superRefine((state, ctx) => {
  const safeTotal = (values: number[]) => {
    let total = 0;
    for (const value of values) {
      total += Math.abs(value);
      if (!Number.isSafeInteger(total)) return false;
    }
    return true;
  };
  // Reject amounts that would make the next overview unrenderable before persisting them.
  const finance = state.settings.finance;
  if (!safeTotal([...state.transactions.map(item => item.amountCents), finance.openingBalanceCents ?? 0, finance.reservedCents, finance.monthlySavingGoalCents])) ctx.addIssue({ code: "custom", path: ["transactions"], message: "Súčet platieb a rezerv prekračuje bezpečný číselný rozsah." });
  if (!safeTotal(state.invoices.map(item => item.grossCents))) ctx.addIssue({ code: "custom", path: ["invoices"], message: "Celková fakturácia prekračuje bezpečný číselný rozsah." });
  if (!safeTotal([finance.expectedMonthlyIncomeCents, finance.monthlyBudgetCents, finance.monthlySavingGoalCents])) ctx.addIssue({ code: "custom", path: ["settings", "finance"], message: "Finančný plán prekračuje bezpečný číselný rozsah." });
  state.monthlySnapshots.forEach((snapshot, index) => {
    if (!safeTotal([snapshot.incomeCents ?? 0, snapshot.refundCents ?? 0, snapshot.cashOutflowCents ?? 0, snapshot.expenseCents ?? 0, finance.monthlySavingGoalCents])) ctx.addIssue({ code: "custom", path: ["monthlySnapshots", index], message: "Mesačný súhrn prekračuje bezpečný číselný rozsah." });
  });
  for (const collection of collectionNames) {
    const entries = state[collection];
    if (new Set(entries.map(item => item.id)).size !== entries.length) ctx.addIssue({ code: "custom", path: [collection], message: "Duplicitné ID záznamu." });
  }
  if (new Set(state.monthlySnapshots.map(item => item.month)).size !== state.monthlySnapshots.length) ctx.addIssue({ code: "custom", path: ["monthlySnapshots"], message: "Pre mesiac môže existovať iba jeden historický súhrn." });
  const projects = new Set(state.projects.map(item => item.id));
  for (const collection of ["transactions", "invoices", "tasks", "documents", "radarItems"] as const) {
    state[collection].forEach((item, index) => {
      if (item.projectId && !projects.has(item.projectId)) ctx.addIssue({ code: "custom", path: [collection, index, "projectId"], message: "Projekt neexistuje." });
    });
  }
  const tasks = new Set(state.tasks.map(item => item.id));
  state.reminders.forEach((item, index) => {
    if (item.taskId && !tasks.has(item.taskId)) ctx.addIssue({ code: "custom", path: ["reminders", index, "taskId"], message: "Úloha neexistuje." });
  });
});

const upsert = <C extends LifeCollection, T extends z.ZodType>(collection: C, record: T) => z.object({ type: z.literal("upsert"), collection: z.literal(collection), record }).strict();
export const lifeCommandSchema = z.union([
  upsert("transactions", transactionSchema), upsert("invoices", invoiceSchema),
  upsert("monthlySnapshots", monthlySnapshotSchema),
  upsert("healthEntries", healthEntrySchema), upsert("projects", projectSchema),
  upsert("tasks", taskSchema), upsert("memories", memoryInputSchema),
  upsert("reminders", reminderSchema), upsert("documents", documentSchema),
  upsert("radarItems", radarItemSchema),
  upsert("chatMessages", chatMessageSchema),
  z.object({ type: z.literal("remove"), collection: z.enum(collectionNames), id: idSchema }).strict(),
  z.object({ type: z.literal("settings"), patch: lifeSettingsSchema.partial() }).strict(),
  z.object({ type: z.literal("restore_memory"), id: idSchema, revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER) }).strict(),
]);

export type LifeState = z.infer<typeof lifeStateSchema>;
export type LifeCommand = z.infer<typeof lifeCommandSchema>;
export type LifeTransaction = z.infer<typeof transactionSchema>;
export type LifeInvoice = z.infer<typeof invoiceSchema>;
export type LifeMonthlySnapshot = z.infer<typeof monthlySnapshotSchema>;
export type LifeHealthEntry = z.infer<typeof healthEntrySchema>;
export type LifeProject = z.infer<typeof projectSchema>;
export type LifeTask = z.infer<typeof taskSchema>;
export type LifeMemory = z.infer<typeof memorySchema>;
export type LifeMemoryInput = z.infer<typeof memoryInputSchema>;
export type LifeReminder = z.infer<typeof reminderSchema>;
export type LifeDocument = z.infer<typeof documentSchema>;
export type LifeRadarItem = z.infer<typeof radarItemSchema>;
export type LifeChatMessage = z.infer<typeof chatMessageSchema>;
export type LifeSettings = z.infer<typeof lifeSettingsSchema>;

export function createEmptyLifeState(nowIso = new Date().toISOString()): LifeState {
  return lifeStateSchema.parse({
    schemaVersion: 1, version: 0, updatedAt: nowIso,
    settings: {
      displayName: "Môj priestor", timezone: "Europe/Paris", currency: "EUR",
      finance: { expectedMonthlyIncomeCents: 0, monthlyBudgetCents: 0, monthlySavingGoalCents: 0, reservedCents: 0, openingBalanceCents: null, openingBalanceDate: null, dataThroughDate: null, reconciled: false, completeMonths: [], categoryLimits: [] },
    },
    transactions: [], invoices: [], monthlySnapshots: [], healthEntries: [], projects: [], tasks: [], memories: [], reminders: [], documents: [], radarItems: [], chatMessages: [],
  });
}

function same(a: unknown, b: unknown): boolean { return JSON.stringify(a) === JSON.stringify(b); }
function addSafe(a: number, b: number): number {
  const value = a + b;
  if (!Number.isSafeInteger(value)) throw new Error("Finančný súčet prekročil bezpečný číselný rozsah.");
  return value;
}
function memoryInput(memory: LifeMemory | LifeMemoryInput): LifeMemoryInput {
  return { id: memory.id, title: memory.title, content: memory.content, scope: memory.scope, active: memory.active, source: memory.source };
}
function reviseMemory(previous: LifeMemory | undefined, input: LifeMemoryInput, now: string): LifeMemory {
  const revision = addSafe(previous?.revision ?? 0, 1);
  const { id, ...fields } = input;
  return { id, ...fields, revision, updatedAt: now, history: [...(previous?.history ?? []), { ...fields, revision, changedAt: now }] };
}

/** Pure, validated record-level writes. Deleting a project keeps its records and detaches links. */
export function applyLifeCommand(inputState: LifeState, inputCommand: LifeCommand, nowIso = new Date().toISOString()): LifeState {
  const state = lifeStateSchema.parse(inputState);
  const command = lifeCommandSchema.parse(inputCommand);
  const now = instantSchema.parse(nowIso);
  let next: LifeState = structuredClone(state);
  if (command.type === "settings") {
    next.settings = { ...state.settings, ...command.patch };
  } else if (command.type === "restore_memory") {
    const current = state.memories.find(item => item.id === command.id);
    const snapshot = current?.history.find(item => item.revision === command.revision);
    if (!current || !snapshot) throw new Error("Požadovaná verzia pamäte neexistuje.");
    const input = memoryInput({ id: current.id, ...snapshot });
    if (!same(memoryInput(current), input)) next.memories = state.memories.map(item => item.id === current.id ? reviseMemory(current, input, now) : item);
  } else if (command.type === "remove") {
    const records = next[command.collection] as { id: string }[];
    records.splice(0, records.length, ...records.filter(item => item.id !== command.id));
    if (command.collection === "projects") {
      for (const collection of ["transactions", "invoices", "tasks", "documents", "radarItems"] as const) for (const item of next[collection]) if (item.projectId === command.id) item.projectId = null;
    }
    if (command.collection === "tasks") for (const reminder of next.reminders) if (reminder.taskId === command.id) { reminder.taskId = null; reminder.enabled = false; }
  } else {
    const records = next[command.collection] as { id: string }[];
    const index = records.findIndex(item => item.id === command.record.id);
    let record: { id: string } = command.record;
    if (command.collection === "memories") {
      const current = state.memories.find(item => item.id === command.record.id);
      const input = memoryInputSchema.parse(command.record);
      record = current && same(memoryInput(current), input) ? current : reviseMemory(current, input, now);
    }
    if (index === -1) records.push(record); else records[index] = record;
  }
  if (same(state, next)) return state;
  // Any financial record edit invalidates the previously reconciled balance.
  if ((command.type === "upsert" || command.type === "remove") && command.collection === "transactions") {
    next.settings.finance.reconciled = false;
    const id = command.type === "upsert" ? command.record.id : command.id;
    const affectedMonths = new Set([state.transactions.find(item => item.id === id)?.date.slice(0, 7), command.type === "upsert" ? command.record.date.slice(0, 7) : undefined]);
    next.settings.finance.completeMonths = next.settings.finance.completeMonths.filter(month => !affectedMonths.has(month));
  }
  next = { ...next, version: addSafe(state.version, 1), updatedAt: now };
  return lifeStateSchema.parse(next);
}

const flowSign: Record<LifeTransaction["kind"], number> = { income: 1, refund: 1, expense: -1, debt_principal: -1, cash_withdrawal: -1, internal_transfer: 0 };
function nullableSum(...values: (number | null)[]): number | null {
  return values.some(value => value === null) ? null : (values as number[]).reduce(addSafe, 0);
}
function negative(value: number | null): number | null { return value === null ? null : -value; }
export function lifeToday(timezone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function summarizeFinances(state: LifeState, month: string, today = lifeToday(state.settings.timezone)) {
  dateSchema.parse(today);
  monthSchema.parse(month);
  const selected = state.transactions.filter(item => item.date.startsWith(`${month}-`));
  const confirmed = selected.filter(item => item.confirmed);
  const settings = state.settings.finance;
  const monthComplete = settings.completeMonths.includes(month) && selected.every(item => item.confirmed);
  const snapshot = !monthComplete ? state.monthlySnapshots.find(item => item.month === month && item.confirmed) : undefined;
  const basis = snapshot ? "snapshot" : monthComplete ? "transactions" : confirmed.length ? "partial_transactions" : "empty";
  const sum = (kind: LifeTransaction["kind"]) => confirmed.filter(item => item.kind === kind).reduce((total, item) => addSafe(total, item.amountCents), 0);
  const raw = (kind: LifeTransaction["kind"]): number | null => basis === "empty" ? null : sum(kind);
  const incomeCents = snapshot ? snapshot.incomeCents : raw("income");
  const refundCents = snapshot ? snapshot.refundCents : raw("refund");
  const expenseCents = snapshot ? snapshot.expenseCents : raw("expense");
  const debtPrincipalCents = snapshot ? snapshot.debtPrincipalCents : raw("debt_principal");
  const cashWithdrawalCents = snapshot ? snapshot.cashWithdrawalCents : raw("cash_withdrawal");
  const internalTransferCents = snapshot ? null : raw("internal_transfer");
  const netConsumptionCents = nullableSum(expenseCents, negative(refundCents));
  const cashOutflowCents = snapshot ? snapshot.cashOutflowCents : nullableSum(expenseCents, debtPrincipalCents, cashWithdrawalCents);
  const recordedNetFlowCents = nullableSum(incomeCents, refundCents, negative(cashOutflowCents));
  const categories = new Map<string, { category: string; amountCents: number }>();
  for (const item of confirmed) if (item.kind === "expense" || item.kind === "refund") {
    const key = item.category.trim().toLocaleLowerCase("sk");
    const previous = categories.get(key);
    categories.set(key, { category: previous?.category ?? item.category.trim(), amountCents: addSafe(previous?.amountCents ?? 0, item.amountCents * (item.kind === "expense" ? 1 : -1)) });
  }
  const invoices = state.invoices.filter(item => item.issueDate.startsWith(`${month}-`) && item.status !== "draft" && item.status !== "cancelled");
  const invoicedGrossCents = snapshot ? snapshot.invoicedGrossCents : invoices.reduce((sum, item) => addSafe(sum, item.grossCents), 0);
  const invoicedPassThroughCents = snapshot ? snapshot.invoicedPassThroughCents : invoices.reduce((sum, item) => addSafe(sum, item.passThroughCents), 0);
  const invoiceOutstandingCents = invoices.filter(item => ["issued", "partially_paid"].includes(item.status)).reduce((sum, item) => addSafe(sum, item.grossCents - item.paidCents), 0);
  const through = settings.dataThroughDate;
  const balanceTransactions = state.transactions.filter(item => settings.openingBalanceDate && through && item.date >= settings.openingBalanceDate && item.date <= through);
  // Own transfers are not income, but may change an individual bank-account balance.
  // Without account/direction information we cannot reconstruct that balance honestly.
  const hasUnscopedTransfers = balanceTransactions.some(item => item.kind === "internal_transfer");
  let recordedBalanceCents: number | null = null;
  if (settings.openingBalanceCents !== null && settings.openingBalanceDate && through && !hasUnscopedTransfers) {
    recordedBalanceCents = balanceTransactions.filter(item => item.confirmed).reduce((sum, item) => addSafe(sum, item.amountCents * flowSign[item.kind]), settings.openingBalanceCents);
  }
  const daysStale = through ? Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${through}T00:00:00Z`)) / 86400000) : null;
  const hasUnconfirmedBalanceTransactions = balanceTransactions.some(item => !item.confirmed);
  const balanceVerified = recordedBalanceCents !== null && settings.reconciled && daysStale !== null && daysStale >= 0 && !hasUnconfirmedBalanceTransactions;
  const balanceUnavailableReason = hasUnscopedTransfers ? "transfer_scope_unknown" : recordedBalanceCents === null ? "missing_baseline" : hasUnconfirmedBalanceTransactions ? "unconfirmed_transactions" : daysStale !== null && daysStale < 0 ? "future_coverage" : !settings.reconciled ? "not_reconciled" : null;
  return {
    basis, monthComplete, snapshot: snapshot ?? null,
    month, incomeCents, refundCents, expenseCents, debtPrincipalCents, cashWithdrawalCents, internalTransferCents,
    netConsumptionCents, cashOutflowCents, recordedNetFlowCents,
    // This is a monthly arithmetic difference, never a current spendable balance or actual savings.
    potentialAfterGoalCents: nullableSum(recordedNetFlowCents, -settings.monthlySavingGoalCents),
    invoicedGrossCents, invoicedPassThroughCents, invoicedBeforeTaxCents: nullableSum(invoicedGrossCents, negative(invoicedPassThroughCents)), invoiceOutstandingCents,
    invoiceUnknownPaymentCount: invoices.filter(item => item.status === "unconfirmed").length,
    overdueInvoices: state.invoices.filter(item => ["issued", "partially_paid"].includes(item.status) && item.dueDate < today && item.grossCents > item.paidCents),
    categories: snapshot ? snapshot.categories : [...categories.values()].sort((a, b) => b.amountCents - a.amountCents || a.category.localeCompare(b.category, "sk")),
    pendingCount: selected.filter(item => !item.confirmed).length,
    transactionCount: confirmed.length,
    dataThroughDate: through, daysStale, balanceVerified, balanceUnavailableReason,
    recordedBalanceCents,
    // Earmarked money is subtracted once, at balance level; it is not an expense.
    afterReservesCents: recordedBalanceCents === null ? null : addSafe(recordedBalanceCents, -settings.reservedCents),
    lastTransactionDate: state.transactions.reduce<string | null>((latest, item) => !latest || item.date > latest ? item.date : latest, null),
  };
}

export type LifeFinanceSummary = ReturnType<typeof summarizeFinances>;

function wallTimeParts(instant: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(instant);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return { day: `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`, time: `${part("hour")}:${part("minute")}:${part("second")}.${String(instant.getUTCMilliseconds()).padStart(3, "0")}` };
}
function wallEpoch(instant: Date, timezone: string) {
  const parts = wallTimeParts(instant, timezone);
  return Date.parse(`${parts.day}T${parts.time}Z`);
}
function shiftDay(day: string, days: number): string {
  const value = new Date(`${day}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Resolve a wall-clock occurrence. DST gaps shift forward; folds use the first occurrence. */
function wallToInstant(day: string, time: string, timezone: string): string {
  const target = Date.parse(`${day}T${time}Z`);
  const offsets = new Set([-36, -12, 0, 12, 36].map(hours => {
    const probe = new Date(target + hours * 3600000);
    return wallEpoch(probe, timezone) - probe.getTime();
  }));
  const candidates = [...offsets].map(offset => target - offset).sort((a, b) => a - b);
  const exact = candidates.find(candidate => wallEpoch(new Date(candidate), timezone) === target);
  if (exact !== undefined) return new Date(exact).toISOString();
  const shifted = candidates.map(instant => ({ instant, wall: wallEpoch(new Date(instant), timezone) })).filter(item => item.wall >= target).sort((a, b) => a.wall - b.wall || a.instant - b.instant)[0];
  if (!shifted) throw new Error("Čas pripomienky sa nepodarilo určiť v tomto časovom pásme.");
  return new Date(shifted.instant).toISOString();
}

/** A recurring reminder is anchored to its original LOCAL date and time, not 24-hour increments. */
export function reminderOccurrenceForDay(reminder: LifeReminder, day: string, timezone: string): string | null {
  dateSchema.parse(day);
  if (!reminder.enabled || !reminder.dueAt) return null;
  const start = new Date(reminder.dueAt);
  const anchor = wallTimeParts(start, timezone);
  if (day < anchor.day) return null;
  const dayEpoch = Date.parse(`${day}T00:00:00Z`);
  const dayDelta = Math.round((dayEpoch - Date.parse(`${anchor.day}T00:00:00Z`)) / 86400000);
  const weekday = new Date(dayEpoch).getUTCDay();
  if (reminder.repeat === "none" && day !== anchor.day) return null;
  if (reminder.repeat === "weekdays" && (weekday === 0 || weekday === 6)) return null;
  if (reminder.repeat === "weekly" && dayDelta % 7 !== 0) return null;
  if (reminder.repeat === "monthly") {
    const nextMonth = new Date(`${day.slice(0, 7)}-01T00:00:00Z`);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    nextMonth.setUTCDate(0);
    if (Number(day.slice(8)) !== Math.min(Number(anchor.day.slice(8)), nextMonth.getUTCDate())) return null;
  }
  // Preserve an explicitly chosen offset in the first ambiguous fall-back occurrence.
  if (day === anchor.day) return start.toISOString();
  return wallToInstant(day, anchor.time, timezone);
}

export function nextReminderOccurrence(reminder: LifeReminder, timezone: string, nowIso = new Date().toISOString()): string | null {
  const now = Date.parse(instantSchema.parse(nowIso));
  if (!reminder.enabled || !reminder.dueAt) return null;
  if (reminder.repeat === "none") return Date.parse(reminder.dueAt) >= now ? new Date(reminder.dueAt).toISOString() : null;
  const today = lifeToday(timezone, new Date(now));
  const startDay = lifeToday(timezone, new Date(reminder.dueAt));
  const firstDay = today > startDay ? today : startDay;
  for (let offset = 0; offset < 370; offset++) {
    const occurrence = reminderOccurrenceForDay(reminder, shiftDay(firstDay, offset), timezone);
    if (occurrence && Date.parse(occurrence) >= now) return occurrence;
  }
  return null;
}

/** In-app display only: today's recurring occurrence, otherwise the next one; one-offs can be overdue. */
export function reminderDisplayOccurrence(reminder: LifeReminder, timezone: string, nowIso = new Date().toISOString()): { dueAt: string; status: "upcoming" | "due" | "overdue" } | null {
  const now = Date.parse(instantSchema.parse(nowIso));
  if (!reminder.enabled || !reminder.dueAt) return null;
  const today = lifeToday(timezone, new Date(now));
  const dueAt = reminder.repeat === "none" ? new Date(reminder.dueAt).toISOString() : reminderOccurrenceForDay(reminder, today, timezone) ?? nextReminderOccurrence(reminder, timezone, nowIso);
  if (!dueAt) return null;
  return { dueAt, status: Date.parse(dueAt) > now ? "upcoming" : lifeToday(timezone, new Date(dueAt)) < today ? "overdue" : "due" };
}

/** Exact decimal entry conversion: no floating-point rounding, negative amounts or exponent syntax. */
export function parseEuroAmount(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(result) && result >= 0 ? result : null;
}
