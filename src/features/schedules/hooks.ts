import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, type Account, type Branch } from '../equipment/catalogApi';
import { PAGE_SIZE, scheduleApi } from './api';

export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Unable to connect. Please try again.';
export function useResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const previousLoader = useRef(loader);
  const refresh = useCallback(() => setRevision(n => n + 1), []);
  useEffect(() => {
    let active = true;
    if (previousLoader.current !== loader) setData(null);
    previousLoader.current = loader;
    setLoading(true); setError('');
    loader().then(value => { if (active) setData(value); }).catch(e => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loader, revision]);
  return { data, error, loading, refresh };
}
export function usePages<T extends { id: number }>(loader: (page: number) => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [more, setMore] = useState(true);
  const state = useRef({ page: 0, busy: false, generation: 0 });
  const fetchPage = useCallback(async (reset = false) => {
    const current = state.current;
    if (current.busy && !reset) return;
    if (reset) { current.generation++; current.page = 0; setItems([]); setMore(true); }
    const generation = current.generation, page = current.page;
    current.busy = true; setLoading(true); setError('');
    try {
      const result = await loader(page);
      if (generation !== current.generation) return;
      setItems(previous => [...new Map([...(reset ? [] : previous), ...result].map(x => [x.id, x])).values()]);
      current.page = page + 1; setMore(result.length === PAGE_SIZE);
    } catch (e) { if (generation === current.generation) setError(errorMessage(e)); }
    finally { if (generation === current.generation) { current.busy = false; setLoading(false); } }
  }, [loader]);
  useEffect(() => { void fetchPage(true); return () => { state.current.generation++; state.current.busy = false; }; }, [fetchPage]);
  return { items, loading, error, more, loadMore: () => void fetchPage(), refresh: () => void fetchPage(true) };
}
export function useClock(interval = 15000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), interval); return () => clearInterval(timer); }, [interval]);
  return now;
}
// Always validate with the real account endpoint; never use the application's demo auth fallback.
export function useScheduleAccount() {
  return useResource(useCallback(async () => {
    if (!sessionStorage.getItem('treektour.catalog.token')) return null;
    try {
      const account = await scheduleApi.me();
      if (account.status !== 'ACTIVE') throw new Error('Your account is inactive.');
      return account;
    } catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; }
  }, []));
}
export async function managedBranches(account: Account): Promise<Branch[]> {
  const branches = (await scheduleApi.branches()).filter(b => b.status === 'ACTIVE');
  if (account.role === 'ADMIN') return branches;
  if (account.role !== 'STAFF') return [];
  const assignments = await Promise.all(branches.map(async branch => ({ branch, staff: await scheduleApi.staff(branch.id) })));
  return assignments.filter(({ staff }) => staff.some(s => s.userId === account.id && s.status === 'ACTIVE')).map(x => x.branch);
}
