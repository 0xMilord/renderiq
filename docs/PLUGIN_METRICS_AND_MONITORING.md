# Plugin Metrics & Monitoring Guide

## Success Metrics to Track Daily

### Installation & Onboarding Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Plugin install → first render time | < 5 minutes | Time from plugin install to first successful render |
| First render success rate | > 95% | % of users who successfully complete first render |
| Plugin activation rate | > 80% | % of installs that result in at least one API call |

### Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Median render latency (standard) | ≤ 30 seconds | P50 render processing time |
| P95 render latency (standard) | ≤ 60 seconds | P95 render processing time |
| P99 render latency (standard) | ≤ 120 seconds | P99 render processing time |
| Webhook delivery success rate | > 99% | % of webhook calls that succeed |
| Webhook delivery latency | < 5 seconds | Time from render completion to webhook delivery |
| Resumable upload failure rate | < 1% | % of resumable uploads that fail |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Plugin conversion (install → paid) | 3-8% | % of plugin users who upgrade to paid plan |
| Renders per day per platform | Trending up | Daily render count per platform |
| Average renders per user (plugin) | > 10/month | Monthly render count per active plugin user |
| Credit usage efficiency | Monitor | Credits used vs. credits purchased ratio |

### Platform-Specific Metrics

Track separately for each platform (SketchUp, Revit, AutoCAD, Rhino, ArchiCAD, Blender):

- Installs per platform
- Active users per platform
- Renders per platform
- Error rates per platform
- Average session duration per platform

---

## Telemetry Tags

All render requests should include these tags for observability:

### Required Tags

```typescript
{
  platform: 'sketchup' | 'revit' | 'autocad' | 'rhino' | 'archicad' | 'blender',
  pluginVersion: '1.0.0',
  userAgent: 'Renderiq-Plugin/SketchUp/1.0.0',
  source: 'plugin',
  // ... existing tags
}
```

### Extended Tags (Optional)

```typescript
{
  deviceId: 'uuid',           // Unique device identifier
  installationId: 'uuid',     // Unique installation ID
  osVersion: 'Windows 11',    // Operating system
  hostAppVersion: '2024',     // Host application version
  renderType: 'image',        // Render type
  quality: 'high',            // Quality tier
  style: 'photorealistic',    // Style preset
}
```

---

## Metrics Export

### Prometheus Metrics

Export these metrics for Prometheus scraping:

```prometheus
# Counter: Total render requests
renderiq_plugin_renders_total{platform, quality, status} 1234

# Histogram: Render latency
renderiq_plugin_render_duration_seconds{platform, quality} bucket={0.5, 1, 5, 30, 60}

# Counter: API errors
renderiq_plugin_api_errors_total{platform, error_code} 5

# Gauge: Active plugin users
renderiq_plugin_active_users{platform} 42

# Counter: Webhook deliveries
renderiq_plugin_webhook_deliveries_total{platform, status} 1000

# Histogram: Webhook latency
renderiq_plugin_webhook_latency_seconds{platform} bucket={0.1, 0.5, 1, 5}

# Counter: Credit transactions
renderiq_plugin_credits_used_total{platform, quality} 500
```

### DataDog Metrics

Send to DataDog with tags:

```typescript
// Example metric
dogstatsd.increment('renderiq.plugin.renders.total', 1, {
  platform: 'sketchup',
  quality: 'high',
  status: 'completed'
});

dogstatsd.histogram('renderiq.plugin.render.duration', 28.5, {
  platform: 'sketchup',
  quality: 'high'
});
```

---

## Monitoring Alerts

### Critical Alerts (P0 - Page On-Call)

| Alert | Condition | Threshold |
|-------|-----------|-----------|
| Render success rate drop | Success rate < 90% | 5 minutes |
| API error rate spike | Error rate > 5% | 5 minutes |
| Webhook delivery failure | Success rate < 95% | 10 minutes |
| Service degradation | Health check fails | Immediate |

### Warning Alerts (P1 - Slack Notification)

| Alert | Condition | Threshold |
|-------|-----------|-----------|
| Render latency increase | P95 > 2x baseline | 15 minutes |
| Credit usage spike | Usage > 2x daily average | 1 hour |
| Platform-specific error spike | Error rate > 3% per platform | 15 minutes |

### Info Alerts (P2 - Dashboard Only)

| Alert | Condition | Threshold |
|-------|-----------|-----------|
| New platform adoption | New platform installs > 10/day | Daily |
| High-value user activity | User renders > 100/day | Daily |

---

## Dashboard Queries

### Grafana Dashboard Queries

**Render Success Rate**
```promql
sum(rate(renderiq_plugin_renders_total{status="completed"}[5m])) 
/ 
sum(rate(renderiq_plugin_renders_total[5m]))
```

**Median Render Latency by Platform**
```promql
histogram_quantile(0.5, 
  sum(rate(renderiq_plugin_render_duration_seconds_bucket[5m])) by (platform, le)
)
```

**Active Plugin Users**
```promql
sum(renderiq_plugin_active_users) by (platform)
```

**Webhook Delivery Success Rate**
```promql
sum(rate(renderiq_plugin_webhook_deliveries_total{status="success"}[5m]))
/
sum(rate(renderiq_plugin_webhook_deliveries_total[5m]))
```

---

## Logging Standards

### Structured Logging

All plugin API requests should include:

```json
{
  "timestamp": "2025-01-01T12:00:00Z",
  "level": "info",
  "message": "Render request received",
  "platform": "sketchup",
  "pluginVersion": "1.0.0",
  "userId": "uuid",
  "renderId": "uuid",
  "quality": "high",
  "statusCode": 202,
  "duration": 150,
  "userAgent": "Renderiq-Plugin/SketchUp/1.0.0"
}
```

### Log Levels

- **ERROR**: Failed requests, exceptions, critical failures
- **WARN**: Rate limit exceeded, invalid input, retryable failures
- **INFO**: Successful requests, important state changes
- **DEBUG**: Detailed request/response data (only in development)

---

## Performance Baselines

### Expected Performance

| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| Render (standard quality) | 25s | 50s | 90s |
| Render (high quality) | 30s | 60s | 120s |
| Render (ultra quality) | 45s | 90s | 180s |
| API authentication | < 100ms | < 200ms | < 500ms |
| Credit check | < 50ms | < 100ms | < 200ms |
| File upload (10MB) | 2s | 5s | 10s |
| Webhook delivery | < 1s | < 3s | < 5s |

---

## Anomaly Detection

### Automated Anomaly Detection

Monitor for:

1. **Sudden drop in render success rate** → Potential service issue
2. **Spike in error rate for specific platform** → Platform-specific bug
3. **Unusual credit usage patterns** → Potential abuse or billing issue
4. **Latency regression** → Performance degradation
5. **Webhook delivery failures** → Network or webhook endpoint issues

### Investigation Playbook

When an alert fires:

1. **Check Service Health**: Verify all services are operational
2. **Review Recent Deployments**: Check if recent changes caused the issue
3. **Examine Platform-Specific Metrics**: Is the issue isolated to one platform?
4. **Review Error Logs**: Look for error patterns or new error types
5. **Check External Dependencies**: Verify AI SDK, storage, and CDN are operational

---

## Retention Policy

| Metric Type | Retention Period | Purpose |
|-------------|------------------|---------|
| Render metrics | 90 days | Performance analysis, SLA tracking |
| Error logs | 30 days | Debugging, incident response |
| Access logs | 7 days | Security audit, debugging |
| User activity | 365 days | Business analytics, billing |
| Aggregated stats | Indefinite | Historical trends, capacity planning |

---

## Reporting

### Daily Reports (Automated)

Email summary with:
- Total renders (by platform)
- Success rate
- Average latency
- Error count (top 5 error types)
- Webhook delivery stats
- New installs/activations

### Weekly Reports

- Week-over-week trends
- Platform adoption rates
- User engagement metrics
- Performance trends
- Top issues and resolutions

### Monthly Reports

- Business metrics (conversion, revenue)
- Platform growth trends
- Feature usage analysis
- Performance benchmarks
- Strategic recommendations

---

**Last Updated**: 2025-01-01

