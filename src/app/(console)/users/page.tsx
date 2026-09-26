import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { count } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Empty } from '@/components/empty';
import { UsersTable } from './users-table';
import type { UserList } from './types';

const STATUSES = [
  { value: 'all', label: 'Everyone' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
  { value: 'dormant', label: 'Dormant' },
] as const;

const SORTS = [
  { value: 'created', label: 'Newest' },
  { value: 'lastLogin', label: 'Last seen' },
  { value: 'paid', label: 'Paid most' },
  { value: 'spend', label: 'Costs most' },
  { value: 'builds', label: 'Most builds' },
] as const;

export const metadata = { title: 'Users — Konar Console' };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const query = one('query') ?? '';
  const status = one('status') ?? 'all';
  const sort = one('sort') ?? 'created';

  const search = new URLSearchParams({ status, sort });
  if (query) search.set('query', query);

  const users = await apiPage<UserList>(`/admin/users?${search}`);
  /**
   * A link to this same list with one thing changed.
   *
   * A `UrlObject` rather than a built string: typed routes check the pathname,
   * and the query is exactly the shape this page reads back out of it.
   */
  const link = (patch: Record<string, string>) => ({
    pathname: '/users' as const,
    query: Object.fromEntries(
      Object.entries({ query, status, sort, ...patch }).filter(
        ([, value]) => value !== '',
      ),
    ),
  });

  return (
    <>
      <PageHeader
        title="Users"
        description={`${count(users.total ?? users.data.length)} accounts. What each one has paid, and what serving them cost.`}
      />

      <form
        action="/users"
        className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="sort" value={sort} />
        <div className="relative w-full sm:max-w-xs sm:flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            name="query"
            defaultValue={query}
            placeholder="Search name or email"
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm" className="self-start">
          Search
        </Button>
        {/* -mx-1 px-1 so the first and last pill are not clipped while scrolling. */}
        <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 sm:ml-auto sm:overflow-visible sm:pb-0">
          {STATUSES.map((option) => (
            <Button
              key={option.value}
              asChild
              size="sm"
              variant={status === option.value ? 'secondary' : 'ghost'}
            >
              <Link href={link({ status: option.value })}>
                {option.label}
              </Link>
            </Button>
          ))}
        </div>
      </form>

      <div className="-mx-1 mb-3 flex items-center gap-1 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        <span className="text-muted-foreground mr-1 shrink-0 text-xs">Sort</span>
        {SORTS.map((option) => (
          <Button
            key={option.value}
            asChild
            size="sm"
            variant={sort === option.value ? 'secondary' : 'ghost'}
          >
            <Link href={link({ sort: option.value })}>
              {option.label}
            </Link>
          </Button>
        ))}
      </div>

      {users.data.length === 0 ? (
        <Empty>No account matches that.</Empty>
      ) : (
        <UsersTable initial={users} query={{ query, status, sort }} />
      )}
    </>
  );
}
