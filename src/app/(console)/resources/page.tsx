import {
  ActivityIcon,
  AlertTriangleIcon,
  ContainerIcon,
  CpuIcon,
  DatabaseIcon,
  HardDriveIcon,
  LayersIcon,
} from 'lucide-react';
import { apiPage } from '@/lib/api';
import { ago, bytes, count, duration, percent } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Stat } from '@/components/stat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Probe<T> = T | { error: string };

interface Resources {
  takenAt: string;
  host: {
    cpus: number;
    load: { one: number; five: number; fifteen: number };
    memory: { totalBytes: number; usedBytes: number; usedShare: number | null };
    uptimeSeconds: number;
    processUptimeSeconds: number;
    heapUsedBytes: number;
  };
  database: Probe<{
    sizeBytes: number;
    connections: number;
    activeConnections: number;
    maxConnections: number;
    oldestTransactionSeconds: number;
    largestTables: { table: string; bytes: number; estimatedRows: number }[];
  }>;
  redis: Probe<{
    latencyMs: number;
    version: string | null;
    usedMemoryBytes: number;
    peakMemoryBytes: number;
    clients: number;
    keys: number;
    evictedKeys: number;
    uptimeSeconds: number;
  }>;
  queues: Probe<
    {
      name: string;
      waiting: number;
      active: number;
      delayed: number;
      failed: number;
      completed: number;
      paused: number;
      oldestWaitingSeconds: number;
    }[]
  >;
  containers: Probe<{
    available: boolean;
    total?: number;
    running?: number;
    exited?: number;
    othersOnHost?: number;
    containers: {
      name: string;
      image: string;
      state: string;
      status: string;
      age: string;
      kind: string;
    }[];
  }>;
  workloads: Probe<{
    services: {
      total: number;
      available: number;
      suspended: number;
      deployed: number;
    };
    databases: { total: number; storageBytes: number };
    builds: { active: number; last24h: number; lastAt: string | null };
    deploys: { last24h: number };
  }>;
  storage: Probe<{
    uploads: { files: number; bytes: number };
    disk: { totalBytes: number; freeBytes: number } | null;
  }>;
}

function failed<T>(probe: Probe<T>): probe is { error: string } {
  return !!probe && typeof probe === 'object' && 'error' in probe;
}

/** A probe that could not be read says so, in place, and nothing else breaks. */
function ProbeError({ error }: { error: string }) {
  return (
    <div className="text-warning flex items-start gap-2 text-sm">
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
      <span>{error}</span>
    </div>
  );
}

export const metadata = { title: 'Resources — Konar Console' };
// Numbers this page shows are true for a second or two; never cache them.
export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const res = await apiPage<Resources>('/admin/resources');

  return (
    <>
      <PageHeader
        title="Resources"
        description={`Every service the platform runs on, read live. Taken ${ago(res.takenAt)}.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Host load"
          value={res.host.load.one.toFixed(2)}
          hint={`${res.host.cpus} CPUs · ${res.host.load.five.toFixed(2)} / ${res.host.load.fifteen.toFixed(2)} over 5 and 15 min`}
          tone={res.host.load.one > res.host.cpus ? 'warning' : 'default'}
          icon={<CpuIcon className="size-4" />}
        />
        <Stat
          label="Memory"
          value={percent(res.host.memory.usedShare)}
          hint={`${bytes(res.host.memory.usedBytes)} of ${bytes(res.host.memory.totalBytes)}`}
          tone={
            (res.host.memory.usedShare ?? 0) > 0.9 ? 'warning' : 'default'
          }
        />
        <Stat
          label="API process"
          value={duration(res.host.processUptimeSeconds)}
          hint={`heap ${bytes(res.host.heapUsedBytes)} · host up ${duration(res.host.uptimeSeconds)}`}
          icon={<ActivityIcon className="size-4" />}
        />
        {failed(res.database) ? (
          <Stat label="Database" value="—" hint={res.database.error} tone="warning" />
        ) : (
          <Stat
            label="Database"
            value={bytes(res.database.sizeBytes)}
            hint={`${res.database.connections} of ${res.database.maxConnections} connections · ${res.database.activeConnections} active`}
            icon={<DatabaseIcon className="size-4" />}
          />
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Queues</CardTitle>
            <p className="text-muted-foreground text-xs">
              Waiting work, and how long the front of each line has been there.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {failed(res.queues) ? (
              <div className="p-5">
                <ProbeError error={res.queues.error} />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queue</TableHead>
                    <TableHead className="text-right">Waiting</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="text-right">Delayed</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="text-right">Head waited</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {res.queues.map((queue) => (
                    <TableRow key={queue.name}>
                      <TableCell className="font-medium">
                        {queue.name}
                        {queue.paused ? (
                          <Badge variant="warning" className="ml-2">
                            paused
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {count(queue.waiting)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {count(queue.active)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {count(queue.delayed)}
                      </TableCell>
                      <TableCell
                        className={
                          queue.failed > 0
                            ? 'tabular text-destructive text-right'
                            : 'tabular text-right'
                        }
                      >
                        {count(queue.failed)}
                      </TableCell>
                      <TableCell className="tabular text-right text-xs">
                        {queue.oldestWaitingSeconds
                          ? duration(queue.oldestWaitingSeconds)
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redis</CardTitle>
          </CardHeader>
          <CardContent>
            {failed(res.redis) ? (
              <ProbeError error={res.redis.error} />
            ) : (
              <div className="flex flex-col gap-2 text-sm">
                <Row label="Round trip">
                  <span
                    className={
                      res.redis.latencyMs > 50 ? 'text-warning' : undefined
                    }
                  >
                    {res.redis.latencyMs} ms
                  </span>
                </Row>
                <Row label="Version">{res.redis.version ?? '—'}</Row>
                <Row label="Memory">
                  {bytes(res.redis.usedMemoryBytes)} (peak{' '}
                  {bytes(res.redis.peakMemoryBytes)})
                </Row>
                <Row label="Keys">{count(res.redis.keys)}</Row>
                <Row label="Clients">{count(res.redis.clients)}</Row>
                <Row label="Evicted">{count(res.redis.evictedKeys)}</Row>
                <Row label="Uptime">{duration(res.redis.uptimeSeconds)}</Row>
                {res.redis.latencyMs > 50 ? (
                  <p className="text-warning mt-1 text-xs">
                    Startup makes hundreds of sequential Redis calls. At this
                    latency the API takes minutes to boot.
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Containers</CardTitle>
            <ContainerIcon className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent className="p-0">
            {failed(res.containers) ? (
              <div className="p-5">
                <ProbeError error={res.containers.error} />
              </div>
            ) : !res.containers.available ? (
              <p className="text-muted-foreground p-5 text-sm">
                Docker did not answer. Deployments and sandboxes run through it,
                so this is worth looking at.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-4 px-5 pb-3 text-xs">
                  <span>
                    <strong className="tabular">
                      {count(res.containers.running)}
                    </strong>{' '}
                    running
                  </span>
                  <span className="text-muted-foreground">
                    {count(res.containers.exited)} stopped
                  </span>
                  <span className="text-muted-foreground">
                    {count(res.containers.othersOnHost)} other containers on this
                    host
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Container</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {res.containers.containers.map((container) => (
                      <TableRow key={container.name}>
                        <TableCell className="max-w-64 truncate font-mono text-xs">
                          {container.name}
                        </TableCell>
                        <TableCell className="text-xs">
                          {container.kind}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              container.state === 'running'
                                ? 'success'
                                : 'outline'
                            }
                          >
                            {container.state}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {container.age}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Workloads</CardTitle>
              <LayersIcon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              {failed(res.workloads) ? (
                <ProbeError error={res.workloads.error} />
              ) : (
                <div className="flex flex-col gap-2 text-sm">
                  <Row label="Services">
                    {count(res.workloads.services.total)} ·{' '}
                    {count(res.workloads.services.deployed)} deployed ·{' '}
                    {count(res.workloads.services.suspended)} suspended
                  </Row>
                  <Row label="Databases">
                    {count(res.workloads.databases.total)} ·{' '}
                    {bytes(res.workloads.databases.storageBytes)}
                  </Row>
                  <Row label="Builds">
                    {count(res.workloads.builds.active)} running ·{' '}
                    {count(res.workloads.builds.last24h)} in 24h
                  </Row>
                  <Row label="Last build">
                    {ago(res.workloads.builds.lastAt)}
                  </Row>
                  <Row label="Deploys (24h)">
                    {count(res.workloads.deploys.last24h)}
                  </Row>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Storage</CardTitle>
              <HardDriveIcon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              {failed(res.storage) ? (
                <ProbeError error={res.storage.error} />
              ) : (
                <div className="flex flex-col gap-2 text-sm">
                  <Row label="Uploads">
                    {count(res.storage.uploads.files)} files ·{' '}
                    {bytes(res.storage.uploads.bytes)}
                  </Row>
                  {res.storage.disk ? (
                    <>
                      <Row label="Disk free">
                        {bytes(res.storage.disk.freeBytes)} of{' '}
                        {bytes(res.storage.disk.totalBytes)}
                      </Row>
                      <Row label="Disk used">
                        {percent(
                          1 -
                            res.storage.disk.freeBytes /
                              res.storage.disk.totalBytes,
                        )}
                      </Row>
                    </>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {!failed(res.database) ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Largest tables</CardTitle>
            <p className="text-muted-foreground text-xs">
              Row counts are the planner&apos;s estimate; an exact count on a
              large table is a full scan.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Rows (est.)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {res.database.largestTables.map((table) => (
                  <TableRow key={table.table}>
                    <TableCell className="font-mono text-xs">
                      {table.table}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {bytes(table.bytes)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {count(table.estimatedRows)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="tabular text-right text-sm">{children}</span>
    </div>
  );
}
