import { Incident, EvidenceItem, EvidenceType } from '../../src/types/incident';

export const EvidenceService = {
  getBaselineEvidence(incidentId: string, category: string, service: string): EvidenceItem[] {
    const timestamp = new Date().toISOString();
    
    if (incidentId === 'INC-2026-088' || category === 'payment') {
      return [
        {
          id: `ev-${incidentId}-1`,
          type: 'ALERT',
          timestamp: '2026-09-28T06:38:00Z',
          service: 'Payment Service',
          title: 'Webhook Processing Queue Backlog',
          value: '214 pending webhooks',
          details: 'Threshold > 50 exceeded. Delayed payment callbacks detected.',
          source: 'Prometheus Alerter'
        },
        {
          id: `ev-${incidentId}-2`,
          type: 'METRIC',
          timestamp: '2026-09-28T06:35:00Z',
          service: 'Database (PostgreSQL Primary)',
          title: 'Active Connection Pool Saturated',
          value: '98 active connections (Max: 100)',
          details: 'Read/Write connection pool exhaustion imminent.',
          source: 'AWS CloudWatch DB Metrics'
        },
        {
          id: `ev-${incidentId}-3`,
          type: 'LOG',
          timestamp: '2026-09-28T06:36:00Z',
          service: 'Payment Service',
          title: 'Database Knex Connection Timeout',
          value: 'TimeoutError: pool is exhausted',
          details: 'Failed to acquire connection after 10000ms. Thread locked at row select.',
          source: 'FluentD Log Aggregator'
        },
        {
          id: `ev-${incidentId}-4`,
          type: 'SERVICE_HEALTH',
          timestamp: '2026-09-28T06:37:00Z',
          service: 'Payment Service',
          title: 'Checkout API Latency Spiked',
          value: 'Latency: 3,240ms (Baseline: 180ms)',
          details: 'HTTP POST /api/v1/checkout performance severely degraded.',
          source: 'Vercel Analytics & Ingress Invariants'
        },
        {
          id: `ev-${incidentId}-5`,
          type: 'HISTORICAL_INCIDENT',
          timestamp: '2026-09-28T06:42:00Z',
          service: 'Payment Service',
          title: 'Historical Connection Match Found',
          value: 'Match: INC-2026-042',
          details: 'Identical symptoms matched verified historical memory from March 2026 with 98% correlation.',
          source: 'Incident IQ Memory Engine'
        }
      ];
    }
    
    // Scenario B: Search latency / deployment incident
    if (incidentId === 'INC-2026-087' || category === 'website') {
      return [
        {
          id: `ev-${incidentId}-1`,
          type: 'DEPLOYMENT',
          timestamp: '2026-09-28T04:45:00Z',
          service: 'Search API Service',
          title: 'Search Autocomplete Release v4.2.1',
          value: 'Deployed by Sarah Chen',
          details: 'Commit bf3fd34: Rewrote query cache middleware to force synchronous validation.',
          source: 'GitHub Actions / Vercel Deployer'
        },
        {
          id: `ev-${incidentId}-2`,
          type: 'METRIC',
          timestamp: '2026-09-28T05:10:00Z',
          service: 'Database (PostgreSQL Primary)',
          title: 'Database Connections Stable',
          value: '18 active connections (Max: 100)',
          details: 'CPU: 14%, Lock count: 0. Database health remains stable and nominal.',
          source: 'AWS CloudWatch DB Metrics'
        },
        {
          id: `ev-${incidentId}-3`,
          type: 'ALERT',
          timestamp: '2026-09-28T05:15:00Z',
          service: 'Website Frontend & Search API',
          title: 'Product Search Latency SLA Violated',
          value: 'SLA: 2,400ms (Max threshold: 200ms)',
          details: 'Alert triggered due to 10 consecutive slow autocomplete queries.',
          source: 'Grafana Alerting Engine'
        },
        {
          id: `ev-${incidentId}-4`,
          type: 'LOG',
          timestamp: '2026-09-28T05:18:00Z',
          service: 'Search API Service',
          title: 'Cache Miss Stack Trace',
          value: 'Warning: synchronous lock wait on search_cache_warm',
          details: 'Requests queuing behind synchronous cache invalidation lock in new build v4.2.1.',
          source: 'FluentD Log Aggregator'
        }
      ];
    }
    
    // Generic fallback evidence
    return [
      {
        id: `ev-${incidentId}-1`,
        type: 'SERVICE_HEALTH',
        timestamp,
        service,
        title: `${service} Health Degradation`,
        value: 'Degraded',
        details: 'Unusual error counts or response delays detected.',
        source: 'Kubernetes Ingress Controller'
      }
    ];
  }
};
