'use client';

import Link from 'next/link';
import { loadUsers } from './actions';
import { LoadMoreButton, useLoadMore } from '@/components/load-more';
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
import { ago, count, date, money } from '@/lib/format';
import type { UserList, UserQuery, UserRow } from './types';

export function UsersTable({
  initial,
  query,
}: {
  initial: UserList;
  query: UserQuery;
}) {
  const { rows, cursor, pending, failed, loadMore } = useLoadMore<UserRow>(
    initial,
    (next) => loadUsers(query, next),
  );

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Cost
                </TableHead>
                <TableHead className="hidden text-right lg:table-cell">
                  Credits left
                </TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Builds
                </TableHead>
                <TableHead className="hidden md:table-cell">Last seen</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((user) => (
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

      <LoadMoreButton
        hasMore={cursor.hasMore}
        pending={pending}
        failed={failed}
        onClick={loadMore}
        shown={rows.length}
        total={initial.total}
      />
    </>
  );
}
