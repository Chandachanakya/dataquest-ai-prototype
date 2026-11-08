const stored = new Map<string, string>();
(globalThis as typeof globalThis & { localStorage: Storage }).localStorage = { getItem: k => stored.get(k) ?? null, setItem: (k, v) => void stored.set(k, v), removeItem: k => void stored.delete(k), clear: () => stored.clear(), key: i => [...stored.keys()][i] ?? null, get length() { return stored.size; } };
const { calculateLearnerMetricsForTesting, stateDistributionArgmax } = await import('../src/lib/learnerEngine');
const reference = '2026-01-31T00:00:00.000Z';
const valid = (id: string, started_at: string, score = 80) => ({ quest_id: id, started_at, score, completion_time: 120, status: 'completed' });
function client(attempts: unknown[] | null, attemptError?: { message: string }, questError?: { message: string }) { return { from(table: string) { if (table === 'quest_attempts') return { select: () => ({ eq: async () => ({ data: attempts, error: attemptError ?? null }) }) }; if (table === 'quests') return { select: () => ({ in: async () => ({ data: [{ id: 'q1', difficulty: 'beginner' }], error: questError ?? null }) }) }; if (table === 'profiles') return { select: () => ({ eq: () => ({ single: async () => ({ data: { xp: 5 }, error: null }) }) }) }; throw new Error(`Unexpected table ${table}`); } }; }
const assert = (value: unknown, message: string): asserts value => { if (!value) throw new Error(message); };
const metrics = (attempts: unknown[]) => calculateLearnerMetricsForTesting('learner', client(attempts) as never, reference);
const finite = (m: Record<string, unknown>) => Object.entries(m).forEach(([k, v]) => { if (typeof v === 'number') assert(Number.isFinite(v), `${k} is finite`); });
await calculateLearnerMetricsForTesting('learner', client(null, { message: 'offline' }) as never, reference).then(() => assert(false, 'attempt error swallowed'), e => assert(String(e).includes('Unable to fetch quest attempts'), 'attempt error propagated'));
await calculateLearnerMetricsForTesting('learner', client([valid('q1', '2026-01-01')], undefined, { message: 'denied' }) as never, reference).then(() => assert(false, 'quest error swallowed'), e => assert(String(e).includes('Unable to fetch quest difficulties'), 'quest error propagated'));
const zero = await metrics([]); assert(zero.totalAttempts === 0 && zero.lastActiveDate === null, 'zero successful query is cold start');
for (const count of [1, 2, 3, 4, 5]) { const m = await metrics(Array.from({ length: count }, (_, i) => valid('q1', `2026-01-${String(i + 1).padStart(2, '0')}`))); assert(m.totalAttempts === count, `${count} attempts`); finite(m); }
const dormant = await metrics([valid('q1', '2025-12-01')]); assert(dormant.days_since_last_active > 30, 'returning learner retained');
const mixed = await metrics([valid('q1', '2026-01-20'), valid('q2', 'invalid'), valid('q3', '2026-02-01')]); assert(mixed.totalAttempts === 1 && mixed.lastActiveDate?.toISOString() === '2026-01-20T00:00:00.000Z', 'invalid/future excluded'); finite(mixed);
const distribution = { NEW_LEARNER: 0, STRUGGLING: 0.1, FAST: 0.2, CONSISTENT: 0.3, DROP_RISK: 0.4 }; assert(stateDistributionArgmax(distribution) === 'DROP_RISK', 'argmax state'); assert(Object.values(distribution).every(Number.isFinite) && Object.values(distribution).reduce((a, b) => a + b, 0) === 1, 'normalized finite distribution');
console.log('PASS: learner-engine regressions');
