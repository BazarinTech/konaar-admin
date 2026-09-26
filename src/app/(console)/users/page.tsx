import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { count, money, date, ago } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Empty } from '@/components/empty';

interface UserRow {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string | null;
  emailVerified: boolean;
  banned: { at: string; reason: string } | null;
  plan: { code: string; name: string; subscriptionStatus: string | null } | null;
  workspaces: number;
  builds: number;
  projects: number;
  paid: number;
  modelSpend: number;
  creditsSpent: number;
  creditBalance: number;
}

interface UserList {
  data: UserRow[];
  page: number;
  perPage: number;
  total: number;
}

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
  const page = Math.max(Number(one('page')) || 1, 1);

  const search = new URLSearchParams({
    status,
    sort,
    page: String(page),
    perPage: '25',
  });
  if (query) search.set('query', query);

  const users = await apiPage<UserList>(`/admin/users?${search}`);
  const pages = Math.max(Math.ceil(users.total / users.perPage), 1);
  /**
   * A link to this same list with one thing changed.
   *
   * A `UrlObject` rather than a built string: typed routes check the pathname,
   * and the query is exactly the shape this page reads back out of it.
   */
  const link = (patch: Record<string, string>) => ({
    pathname: '/users' as const,
    query: Object.fromEntries(
      Object.entries({ query, status, sort, page: String(page), ...patch }).filter(
        ([, value]) => value !== '',
      ),
    ),
  });

  return (
    <>
      <PageHeader
        title="Users"
        description={`${count(users.total)} accounts. What each one has paid, and what serving them cost.`}
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
              <Link href={link({ status: option.value, page: '1' })}>
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
            <Link href={link({ sort: option.value, page: '1' })}>
              {option.label}
            </Link>
          </Button>
        ))}
      </div>

      {users.data.length === 0 ? (
        <Empty>No account matches that.</Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Cost</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Credits left</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Builds</TableHead>
                  <TableHead className="hidden md:table-cell">Last seen</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link
                        href={{ pathname: `/users/${user.id}` }}
                        className="flex flex-col hover:underline"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          {user.name}
                          {user.banned ? (
                            <Badge variant="destructive">banned</Badge>
                          ) : null}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {user.email}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {user.plan ? (
                        <Badge
                          variant={
                            user.plan.code === 'free' ? 'outline' : 'default'
                          }
                        >
                          {user.plan.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          no workspace
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {money(user.paid)}
                    </TableCell>
                    <TableCell className="tabular text-muted-foreground hidden text-right md:table-cell">
                      {money(user.modelSpend)}
                    </TableCell>
                    <TableCell className="tabular hidden text-right lg:table-cell">
                      {count(user.creditBalance)}
                    </TableCell>
                    <TableCell className="tabular hidden text-right sm:table-cell">
                      {count(user.builds)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs md:table-cell">
                      {ago(user.lastLoginAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                      {date(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-muted-foreground text-xs">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              disabled={page <= 1}
              className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
            >
              <Link href={link({ page: String(page - 1) })}>Previous</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className={page >= pages ? 'pointer-events-none opacity-50' : ''}
            >
              <Link href={link({ page: String(page + 1) })}>Next</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
