import type { User, Team, Task, Notification, Comment } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    email: 'admin@projectify.com',
    fullName: 'Elena Rostova (System Admin)',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 2,
    email: 'leader@projectify.com',
    fullName: 'Marcus Vance (Platform Lead)',
    role: 'TEAM_LEADER',
    isActive: true,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 3,
    email: 'sarah@projectify.com',
    fullName: 'Sarah Chen (Senior SRE)',
    role: 'MEMBER',
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 4,
    email: 'david@projectify.com',
    fullName: 'David Kim (Fullstack Engineer)',
    role: 'MEMBER',
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 5,
    email: 'amara@projectify.com',
    fullName: 'Amara Okafor (UX / Systems Designer)',
    role: 'MEMBER',
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 6,
    email: 'john.pending@example.com',
    fullName: 'John Pendelton (New Hire)',
    role: 'MEMBER',
    isActive: false, // Inactive to demonstrate Admin Approval flow!
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const INITIAL_TEAMS: Team[] = [
  {
    _id: 'team-infra-101',
    name: 'Cloud Platform & SRE',
    description: 'High-availability infrastructure, Kubernetes multi-cluster routing, and distributed tracing.',
    leaderId: 2,
    members: [1, 2, 3, 4],
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    _id: 'team-mobile-102',
    name: 'Mobile & Edge SDKs',
    description: 'Offline-first client runtime, WebSocket state reconciliation, and responsive mobile experiences.',
    leaderId: 2,
    members: [2, 3, 5],
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    _id: 'team-design-103',
    name: 'Design Systems & UI',
    description: 'Accessible tokens, DaisyUI dark-mode styling, and micro-interaction animations.',
    leaderId: 1,
    members: [1, 3, 4, 5],
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    _id: 'task-101',
    title: 'Implement Distributed Tracing with OpenTelemetry',
    description: '<p>Instrument our Fastify microservices with <strong>OpenTelemetry spans</strong> and propagate trace headers across Nginx gateway down to Redis subscriber nodes.</p><ul><li>Trace HTTP inbound requests</li><li>Record DB query durations</li><li>Export traces to Grafana Tempo</li></ul>',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    deadline: new Date(Date.now() + 4 * 86400000).toISOString(),
    teamId: 'team-infra-101',
    creatorId: 2,
    assigneeIds: [2, 3],
    attachments: [
      {
        fileName: 'opentelemetry-arch-spec.pdf',
        originalName: 'opentelemetry-arch-spec.pdf',
        mimeType: 'application/pdf',
        size: 1048576,
        gcsFileName: 'mock-otel-spec.pdf',
        uploadedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    _id: 'task-102',
    title: 'PostgreSQL Read-Replica Connection Pooling',
    description: '<p>Configure Prisma 7 adapter pool timeouts and test failover resilience when read replicas scale horizontally in staging.</p><p>Target: <code>max: 20</code> connections per replica with 2s acquire timeout.</p>',
    status: 'TODO',
    priority: 'MEDIUM',
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    teamId: 'team-infra-101',
    creatorId: 2,
    assigneeIds: [3, 4],
    attachments: [],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    _id: 'task-103',
    title: 'Migrate Nginx Gateway to HTTP/2 with HSTS',
    description: '<p>Updated gateway configurations with <em>HSTS preload directives</em>, Brotli compression, and WebSocket connection upgrade buffering.</p>',
    status: 'DONE',
    priority: 'HIGH',
    deadline: new Date(Date.now() - 2 * 86400000).toISOString(),
    teamId: 'team-infra-101',
    creatorId: 1,
    assigneeIds: [1, 2],
    attachments: [],
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    _id: 'task-104',
    title: 'Design Accessible Dark-Mode Color Palette',
    description: '<p>Audit all UI color tokens against <strong>WCAG 2.2 AAA</strong> contrast requirements. Define CSS variables for primary and accent gradients.</p>',
    status: 'DONE',
    priority: 'LOW',
    deadline: new Date(Date.now() - 5 * 86400000).toISOString(),
    teamId: 'team-design-103',
    creatorId: 1,
    assigneeIds: [5],
    attachments: [],
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    _id: 'task-105',
    title: 'Build Offline-First Browser Storage Adapter',
    description: '<p>Implement simulated client-side storage persistence with reactive broadcast channel event dispatching for the Netlify demo release.</p>',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    teamId: 'team-mobile-102',
    creatorId: 2,
    assigneeIds: [3, 5],
    attachments: [],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'task-106',
    title: 'Audit Drag-and-Drop Kanban Stage Transitions',
    description: '<p>Verify touch accessibility on mobile viewports for dragging tasks between TODO, IN_PROGRESS, and DONE.</p>',
    status: 'TODO',
    priority: 'LOW',
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    teamId: 'team-design-103',
    creatorId: 1,
    assigneeIds: [4, 5],
    attachments: [],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const INITIAL_COMMENTS: Record<string, Comment[]> = {
  'task-101': [
    {
      _id: 'comm-101-1',
      taskId: 'task-101',
      text: '<p>I checked the OpenTelemetry Fastify plugin. It seamlessly propagates W3C <code>traceparent</code> headers across our Nginx gateway and into Redis subscriber jobs.</p><p><img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" alt="Telemetry Grafana Dashboard" style="border-radius:12px;margin-top:8px;max-height:280px;width:100%;object-fit:cover;" /></p>',
      creatorId: 3,
      creatorName: 'Sarah Chen (Senior SRE)',
      creatorRole: 'MEMBER',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      _id: 'comm-101-2',
      taskId: 'task-101',
      text: '<p>Great find Sarah! Let us make sure we sample <strong>10% in production</strong> to keep Redis network traffic and memory footprint lean.</p><blockquote><p>Sampling rate: <code>OTEL_TRACES_SAMPLER_ARG=0.1</code></p></blockquote>',
      creatorId: 2,
      creatorName: 'Marcus Vance (Platform Lead)',
      creatorRole: 'TEAM_LEADER',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      _id: 'comm-101-3',
      taskId: 'task-101',
      text: '<p>Verified in staging! Spans for PostgreSQL queries via Prisma 7 client are displaying sub-millisecond resolution now.</p>',
      creatorId: 4,
      creatorName: 'David Kim (Fullstack Engineer)',
      creatorRole: 'MEMBER',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
  'task-102': [
    {
      _id: 'comm-102-1',
      taskId: 'task-102',
      text: '<p>Benchmarked connection acquisition under load: with 50 concurrent requests, average connection latency dropped from <strong>18ms to 2.4ms</strong> using PgBouncer pooling mode.</p><pre><code>pool_mode = transaction\nmax_client_conn = 1000\ndefault_pool_size = 25</code></pre>',
      creatorId: 3,
      creatorName: 'Sarah Chen (Senior SRE)',
      creatorRole: 'MEMBER',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      _id: 'comm-102-2',
      taskId: 'task-102',
      text: '<p>Outstanding numbers Sarah! Elena, can we review replica replication lag before promoting this to production?</p>',
      creatorId: 2,
      creatorName: 'Marcus Vance (Platform Lead)',
      creatorRole: 'TEAM_LEADER',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
  'task-103': [
    {
      _id: 'comm-103-1',
      taskId: 'task-103',
      text: '<p>HSTS preload requirements are validated: <code>max-age=63072000; includeSubDomains; preload</code>. SSL Labs report gave our Nginx configuration an <strong>A+ Grade</strong>!</p><p><img src="https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80" alt="SSL Labs Benchmark" style="border-radius:12px;margin-top:8px;max-height:260px;width:100%;object-fit:cover;" /></p>',
      creatorId: 1,
      creatorName: 'Elena Rostova (System Admin)',
      creatorRole: 'ADMIN',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      _id: 'comm-103-2',
      taskId: 'task-103',
      text: '<p>Deployment rolled out to all ingress pods. Zero dropped connections during the reload.</p>',
      creatorId: 2,
      creatorName: 'Marcus Vance (Platform Lead)',
      creatorRole: 'TEAM_LEADER',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],
  'task-104': [
    {
      _id: 'comm-104-1',
      taskId: 'task-104',
      text: '<p>Here is the updated Figma color contrast matrix. All foreground text combinations achieve at least <strong>7.2:1 contrast ratio</strong> against dark backgrounds.</p><p><img src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80" alt="Design System Tokens" style="border-radius:12px;margin-top:8px;max-height:260px;width:100%;object-fit:cover;" /></p>',
      creatorId: 5,
      creatorName: 'Amara Okafor (UX / Systems Designer)',
      creatorRole: 'MEMBER',
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      _id: 'comm-104-2',
      taskId: 'task-104',
      text: '<p>The contrast on the primary purple gradient looks crisp on OLED screens. Approved!</p>',
      creatorId: 1,
      creatorName: 'Elena Rostova (System Admin)',
      creatorRole: 'ADMIN',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  'task-105': [
    {
      _id: 'comm-105-1',
      taskId: 'task-105',
      text: '<p>Mock storage adapter is fully wired! Axios requests are dispatched synchronously against <code>localStorage</code> with synthetic 30ms latency for real-world feel.</p><p><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" alt="Architecture Diagram" style="border-radius:12px;margin-top:8px;max-height:260px;width:100%;object-fit:cover;" /></p>',
      creatorId: 3,
      creatorName: 'Sarah Chen (Senior SRE)',
      creatorRole: 'MEMBER',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      _id: 'comm-105-2',
      taskId: 'task-105',
      text: '<p>Added multi-user persona switcher on login so reviewers can test Admin, Lead, and Dev roles seamlessly.</p>',
      creatorId: 5,
      creatorName: 'Amara Okafor (UX / Systems Designer)',
      creatorRole: 'MEMBER',
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
  ],
  'task-106': [
    {
      _id: 'comm-106-1',
      taskId: 'task-106',
      text: '<p>Tested HTML5 drag-and-drop on iOS Safari and Android Chrome. Adding <code>touch-action: none</code> to Kanban card drag handles solved the page scroll conflict.</p>',
      creatorId: 4,
      creatorName: 'David Kim (Fullstack Engineer)',
      creatorRole: 'MEMBER',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
};

// ============================================================================
// 100 SAMPLE NOTIFICATION TEMPLATES POOL
// ============================================================================
export const NOTIFICATION_POOL: Array<{
  type: Notification['type'];
  message: string;
  relatedId: string;
}> = [
  // 1-25: TASK ASSIGNMENTS
  { type: 'TASK_ASSIGNED', message: 'Marcus Vance assigned you to "Migrate Nginx Gateway to HTTP/2 with HSTS"', relatedId: 'task-103' },
  { type: 'TASK_ASSIGNED', message: 'Marcus Vance assigned you to "Implement Distributed Tracing with OpenTelemetry"', relatedId: 'task-101' },
  { type: 'TASK_ASSIGNED', message: 'Sarah Chen assigned you to "PostgreSQL Read-Replica Connection Pooling"', relatedId: 'task-102' },
  { type: 'TASK_ASSIGNED', message: 'Elena Rostova assigned you to "Audit Drag-and-Drop Kanban Stage Transitions"', relatedId: 'task-106' },
  { type: 'TASK_ASSIGNED', message: 'Marcus Vance assigned you to "Build Offline-First Browser Storage Adapter"', relatedId: 'task-105' },
  { type: 'TASK_ASSIGNED', message: 'Elena Rostova assigned you to "Design Accessible Dark-Mode Color Palette"', relatedId: 'task-104' },
  { type: 'TASK_ASSIGNED', message: 'Marcus Vance assigned you to "Optimize Redis Pub/Sub cluster failover"', relatedId: 'task-101' },
  { type: 'TASK_ASSIGNED', message: 'Elena Rostova assigned you to "Harden Fastify CORS and Helmet security headers"', relatedId: 'task-103' },
  { type: 'TASK_ASSIGNED', message: 'Marcus Vance assigned you to "Setup Kubernetes PodDisruptionBudgets in production"', relatedId: 'task-101' },
  { type: 'TASK_ASSIGNED', message: 'Sarah Chen assigned you to "Benchmark Prisma 7 vs raw SQL query latency"', relatedId: 'task-102' },
  { type: 'TASK_ASSIGNED', message: 'David Kim assigned you to "Implement TipTap markdown auto-formatting extensions"', relatedId: 'task-104' },
  { type: 'TASK_ASSIGNED', message: 'Marcus Vance assigned you to "Implement Docker healthcheck automated retry loop"', relatedId: 'task-103' },
  { type: 'TASK_ASSIGNED', message: 'Elena Rostova assigned you to "Add rate limit bypass for Prometheus metrics scraper"', relatedId: 'task-101' },
  { type: 'TASK_ASSIGNED', message: 'Sarah Chen assigned you to "Configure Grafana Tempo distributed trace visualizations"', relatedId: 'task-101' },
  { type: 'TASK_ASSIGNED', message: 'Marcus Vance assigned you to "Audit JWT secret rotation protocol across microservices"', relatedId: 'task-103' },
  { type: 'TASK_ASSIGNED', message: 'Amara Okafor assigned you to "Refactor responsive team member avatars to DaisyUI badges"', relatedId: 'task-104' },
  { type: 'TASK_ASSIGNED', message: 'Elena Rostova assigned you to "Automate MongoDB replica set backup snapshots via Cron"', relatedId: 'task-102' },
  { type: 'TASK_ASSIGNED', message: 'Marcus Vance assigned you to "Upgrade Node.js 20 base images to Alpine 3.20"', relatedId: 'task-103' },
  { type: 'TASK_ASSIGNED', message: 'Sarah Chen assigned you to "Tune Linux kernel TCP socket buffers for Socket.IO engine"', relatedId: 'task-105' },
  { type: 'TASK_ASSIGNED', message: 'David Kim assigned you to "Optimize Vite bundle chunking with manual rollup splitting"', relatedId: 'task-105' },
  { type: 'TASK_ASSIGNED', message: 'Elena Rostova assigned you to "Review AGPLv3 open-source compliance for 3rd-party modules"', relatedId: 'task-104' },
  { type: 'TASK_ASSIGNED', message: 'Marcus Vance assigned you to "Configure Redis maxmemory-policy to volatile-lru"', relatedId: 'task-101' },
  { type: 'TASK_ASSIGNED', message: 'Sarah Chen assigned you to "Implement graceful shutdown handlers for Fastify signals"', relatedId: 'task-103' },
  { type: 'TASK_ASSIGNED', message: 'Amara Okafor assigned you to "Design empty states with SVG illustrations for task board"', relatedId: 'task-106' },
  { type: 'TASK_ASSIGNED', message: 'Marcus Vance assigned you to "Validate schema migration rollback script for PostgreSQL"', relatedId: 'task-102' },

  // 26-50: COMMENTS & CODE DISCUSSIONS
  { type: 'COMMENT_ADDED', message: 'Sarah Chen commented on "Implement Distributed Tracing with OpenTelemetry"', relatedId: 'task-101' },
  { type: 'COMMENT_ADDED', message: 'Marcus Vance replied to your comment in "PostgreSQL Read-Replica Connection Pooling"', relatedId: 'task-102' },
  { type: 'COMMENT_ADDED', message: 'Elena Rostova mentioned you in "Migrate Nginx Gateway to HTTP/2 with HSTS"', relatedId: 'task-103' },
  { type: 'COMMENT_ADDED', message: 'Amara Okafor uploaded a design spec in "Design Accessible Dark-Mode Color Palette"', relatedId: 'task-104' },
  { type: 'COMMENT_ADDED', message: 'David Kim reviewed the PR attached to "Build Offline-First Browser Storage Adapter"', relatedId: 'task-105' },
  { type: 'COMMENT_ADDED', message: 'Sarah Chen shared benchmark traces in "Optimize Redis Pub/Sub cluster failover"', relatedId: 'task-101' },
  { type: 'COMMENT_ADDED', message: 'Marcus Vance approved your pull request on Fastify JWT verification', relatedId: 'task-103' },
  { type: 'COMMENT_ADDED', message: 'Elena Rostova posted SSL Labs benchmark results: A+ Rating achieved', relatedId: 'task-103' },
  { type: 'COMMENT_ADDED', message: 'David Kim requested changes on Dockerfile multi-stage layer caching', relatedId: 'task-105' },
  { type: 'COMMENT_ADDED', message: 'Amara Okafor left feedback on mobile viewport button tap target sizes', relatedId: 'task-106' },
  { type: 'COMMENT_ADDED', message: 'Sarah Chen flagged memory usage on Redis channel subscription listeners', relatedId: 'task-101' },
  { type: 'COMMENT_ADDED', message: 'Marcus Vance commented: "Ready for production canary deploy tomorrow"', relatedId: 'task-102' },
  { type: 'COMMENT_ADDED', message: 'Elena Rostova commented: "Please ensure unit test coverage remains > 85%"', relatedId: 'task-101' },
  { type: 'COMMENT_ADDED', message: 'David Kim uploaded a screenshot of the responsive Kanban drag handle', relatedId: 'task-106' },
  { type: 'COMMENT_ADDED', message: 'Amara Okafor mentioned you in team design sync notes', relatedId: 'task-104' },
  { type: 'COMMENT_ADDED', message: 'Sarah Chen posted Grafana p99 latency graphs: 4.2ms achieved', relatedId: 'task-102' },
  { type: 'COMMENT_ADDED', message: 'Marcus Vance approved the connection pool timeout adjustments', relatedId: 'task-102' },
  { type: 'COMMENT_ADDED', message: 'David Kim verified fix on Android Chrome browser', relatedId: 'task-106' },
  { type: 'COMMENT_ADDED', message: 'Elena Rostova signed off on the security compliance checklist', relatedId: 'task-103' },
  { type: 'COMMENT_ADDED', message: 'Sarah Chen verified OpenTelemetry trace context propagation', relatedId: 'task-101' },
  { type: 'COMMENT_ADDED', message: 'Marcus Vance requested a code review on socket room auto-cleanup', relatedId: 'task-105' },
  { type: 'COMMENT_ADDED', message: 'Amara Okafor commented: "The glowing animated border on login is incredible!"', relatedId: 'task-104' },
  { type: 'COMMENT_ADDED', message: 'David Kim commented on database migration indexing strategy', relatedId: 'task-102' },
  { type: 'COMMENT_ADDED', message: 'Elena Rostova shared the staging deployment verification link', relatedId: 'task-105' },
  { type: 'COMMENT_ADDED', message: 'Sarah Chen confirmed zero memory leaks during 24h stress test', relatedId: 'task-101' },

  // 51-75: TASK UPDATES & KANBAN STAGE MOVES
  { type: 'TASK_UPDATED', message: 'Task "Migrate Nginx Gateway to HTTP/2 with HSTS" moved to DONE', relatedId: 'task-103' },
  { type: 'TASK_UPDATED', message: 'Task "Design Accessible Dark-Mode Color Palette" moved to DONE', relatedId: 'task-104' },
  { type: 'TASK_UPDATED', message: 'Task "Build Offline-First Browser Storage Adapter" moved to IN_PROGRESS', relatedId: 'task-105' },
  { type: 'TASK_UPDATED', message: 'Task "Implement Distributed Tracing with OpenTelemetry" updated priority to HIGH', relatedId: 'task-101' },
  { type: 'TASK_UPDATED', message: 'Task "PostgreSQL Read-Replica Connection Pooling" deadline extended by 3 days', relatedId: 'task-102' },
  { type: 'TASK_UPDATED', message: 'Task "Audit Drag-and-Drop Kanban Stage Transitions" moved to IN_PROGRESS', relatedId: 'task-106' },
  { type: 'TASK_UPDATED', message: 'Task "Configure Redis Pub/Sub AOF persistence" moved to DONE', relatedId: 'task-101' },
  { type: 'TASK_UPDATED', message: 'Task "Harden API gateway rate-limiting to 10 req/s" moved to DONE', relatedId: 'task-103' },
  { type: 'TASK_UPDATED', message: 'Task "Prisma 7 Schema Generator verification" moved to DONE', relatedId: 'task-102' },
  { type: 'TASK_UPDATED', message: 'Task "Socket.IO real-time reconnect backoff policy" moved to IN_PROGRESS', relatedId: 'task-105' },
  { type: 'TASK_UPDATED', message: 'Task "DaisyUI v5 theme contrast tokens" moved to DONE', relatedId: 'task-104' },
  { type: 'TASK_UPDATED', message: 'Task "End-to-End Vitest test suite for User Service" moved to DONE', relatedId: 'task-101' },
  { type: 'TASK_UPDATED', message: 'Task "Automated GitHub Actions CI matrix build" moved to DONE', relatedId: 'task-103' },
  { type: 'TASK_UPDATED', message: 'Task "Docker Compose multi-stage caching" moved to DONE', relatedId: 'task-101' },
  { type: 'TASK_UPDATED', message: 'Task "Zod request schema validation filters" moved to DONE', relatedId: 'task-103' },
  { type: 'TASK_UPDATED', message: 'Task "Fastify error handler RFC 7807 compliance" moved to IN_PROGRESS', relatedId: 'task-102' },
  { type: 'TASK_UPDATED', message: 'Task "Clean Architecture boundary audit" moved to DONE', relatedId: 'task-101' },
  { type: 'TASK_UPDATED', message: 'Task "TipTap rich text list extension integration" moved to DONE', relatedId: 'task-104' },
  { type: 'TASK_UPDATED', message: 'Task "MongoDB connection pooling timeout configuration" moved to DONE', relatedId: 'task-102' },
  { type: 'TASK_UPDATED', message: 'Task "Bcrypt password hashing 10-round salt audit" moved to DONE', relatedId: 'task-103' },
  { type: 'TASK_UPDATED', message: 'Task "Recharts task completion velocity widget" moved to DONE', relatedId: 'task-104' },
  { type: 'TASK_UPDATED', message: 'Task "Nginx static asset caching and gzip compression" moved to DONE', relatedId: 'task-103' },
  { type: 'TASK_UPDATED', message: 'Task "Polyglot storage cross-service transaction audit" moved to IN_PROGRESS', relatedId: 'task-102' },
  { type: 'TASK_UPDATED', message: 'Task "Multi-tenant workspace isolation validation" moved to TODO', relatedId: 'task-105' },
  { type: 'TASK_UPDATED', message: 'Task "Zero-downtime container rolling restart script" moved to DONE', relatedId: 'task-101' },

  // 76-100: TEAMS, ALERTS & WORKSPACE NOTIFICATIONS
  { type: 'TEAM_ADDED', message: 'You were added to the "Cloud Platform & SRE" team workspace', relatedId: 'team-infra-101' },
  { type: 'TEAM_ADDED', message: 'You were added to the "Mobile & Edge SDKs" team workspace', relatedId: 'team-mobile-102' },
  { type: 'TEAM_ADDED', message: 'You were added to the "Design Systems & UI" team workspace', relatedId: 'team-design-103' },
  { type: 'TEAM_ADDED', message: 'Elena Rostova assigned you as Co-Lead of "Cloud Platform & SRE"', relatedId: 'team-infra-101' },
  { type: 'TEAM_ADDED', message: 'New member David Kim joined the "Cloud Platform & SRE" workspace', relatedId: 'team-infra-101' },
  { type: 'TEAM_ADDED', message: 'New member Amara Okafor joined the "Design Systems & UI" workspace', relatedId: 'team-design-103' },
  { type: 'TEAM_ADDED', message: 'Marcus Vance invited you to collaborate on the Q4 Infrastructure Sprint', relatedId: 'team-infra-101' },
  { type: 'TASK_UPDATED', message: 'Automated CI Pipeline passed successfully for branch main (Commit #7d17128)', relatedId: 'task-101' },
  { type: 'TASK_UPDATED', message: 'Vulnerability scanner reported 0 high or critical vulnerabilities', relatedId: 'task-103' },
  { type: 'TASK_UPDATED', message: 'Docker Compose healthcheck confirmed: All 7 containers healthy', relatedId: 'task-101' },
  { type: 'TASK_UPDATED', message: 'Redis cluster failover drill completed with 0 dropped events', relatedId: 'task-101' },
  { type: 'TASK_UPDATED', message: 'Nightly database snapshot uploaded to backup storage securely', relatedId: 'task-102' },
  { type: 'COMMENT_ADDED', message: 'Security Bot: No exposed secrets detected in git commit history', relatedId: 'task-103' },
  { type: 'COMMENT_ADDED', message: 'Elena Rostova approved the pending registration for John Pendelton', relatedId: 'task-101' },
  { type: 'TASK_ASSIGNED', message: 'Marcus Vance assigned you to "Sprint Retrospective: Microservices decoupling"', relatedId: 'task-101' },
  { type: 'TEAM_ADDED', message: 'Team "Cloud Platform & SRE" reached 100% sprint task completion', relatedId: 'team-infra-101' },
  { type: 'TASK_UPDATED', message: 'SSL certificate renewed automatically via Let\'s Encrypt certbot', relatedId: 'task-103' },
  { type: 'TASK_UPDATED', message: 'Prisma 7 client generated with type-safe relation queries', relatedId: 'task-102' },
  { type: 'COMMENT_ADDED', message: 'Sarah Chen shared: "All 18 unit tests passed with 100% green assertions"', relatedId: 'task-101' },
  { type: 'TASK_UPDATED', message: 'Nginx gateway configured with HTTP/2 and Brotli compression', relatedId: 'task-103' },
  { type: 'TEAM_ADDED', message: 'Sprint milestone "Modern Architecture Overhaul" marked as COMPLETED', relatedId: 'team-infra-101' },
  { type: 'TASK_ASSIGNED', message: 'Elena Rostova assigned you to "Quarterly infrastructure cost optimization"', relatedId: 'task-101' },
  { type: 'COMMENT_ADDED', message: 'Marcus Vance posted: "Production deployment scheduled for 22:00 UTC"', relatedId: 'task-103' },
  { type: 'TASK_UPDATED', message: 'Fastify v5 route schema validation benchmarked at 42,000 req/sec', relatedId: 'task-101' },
  { type: 'TASK_UPDATED', message: 'Netlify production demo deploy live at projectify-demo.netlify.app', relatedId: 'task-105' },
];

// Helper to seed 2-3 deterministic demo notifications for a specific user
export function createNotificationsForUser(userId: number): Notification[] {
  // Use user id to pick 2-3 deterministic notifications from the pool
  const offset = (userId * 7) % NOTIFICATION_POOL.length;
  const sample1 = NOTIFICATION_POOL[offset % NOTIFICATION_POOL.length];
  const sample2 = NOTIFICATION_POOL[(offset + 13) % NOTIFICATION_POOL.length];
  const sample3 = NOTIFICATION_POOL[(offset + 27) % NOTIFICATION_POOL.length];

  return [
    {
      _id: `notif-${userId}-1`,
      userId,
      type: sample1.type,
      message: sample1.message,
      relatedId: sample1.relatedId || 'task-101',
      read: false, // 1 unread notification
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(), // 25 mins ago
    },
    {
      _id: `notif-${userId}-2`,
      userId,
      type: sample2.type,
      message: sample2.message,
      relatedId: sample2.relatedId || 'task-102',
      read: false, // 1 unread notification
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    },
    {
      _id: `notif-${userId}-3`,
      userId,
      type: sample3.type,
      message: sample3.message,
      relatedId: sample3.relatedId || 'task-103',
      read: true, // 1 read notification
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), // 1 day ago
    },
  ];
}

export const INITIAL_NOTIFICATIONS: Notification[] = [
  ...createNotificationsForUser(1), // Elena (Admin)
  ...createNotificationsForUser(2), // Marcus (Lead)
  ...createNotificationsForUser(3), // Sarah (SRE)
  ...createNotificationsForUser(4), // David (Fullstack)
  ...createNotificationsForUser(5), // Amara (Design)
  ...createNotificationsForUser(6), // John (Pending)
];
