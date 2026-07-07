# PostHog: SeedanceAPI unit economics dashboard

Build these in the **SeedanceAPI** PostHog project (`phc_BwrjNm85…`), not Engram.

**Prerequisite:** Deploy web + API workers with PostHog keys. After a test generation, confirm events in **Activity**: `generation_completed`, `balance_topup`, `api_request`.

## Event reference

| Event | Source | Key properties |
|-------|--------|----------------|
| `generation_completed` | API worker | `revenue_usd`, `provider_cost_usd`, `margin_usd`, `model`, `kind`, `provider` |
| `generation_failed` | API worker | same + `error`, `refunded` |
| `generation_started` | API worker | `revenue_usd` (quoted hold), `model`, `kind` |
| `balance_topup` | Web (Dodo webhook) | `amount_usd`, `credits`, `payment_id` |
| `checkout_started` | Web | `pack_id`, `amount_usd` |
| `api_request` | API worker | `path`, `method`, `status`, `duration_ms` |
| `$pageview` | Web | standard |

**Profit filter (use on cost/margin insights):** event property `provider_cost_usd` **is set**.

---

## Dashboard: “SeedanceAPI unit economics”

Create an empty dashboard in PostHog, then add the insights below.

### Row 1 — Headline KPIs (last 30 days, Bold number)

#### 1. Gross generation revenue
- **Type:** Trends → Bold number
- **Event:** `generation_completed`
- **Aggregation:** Sum of property → `revenue_usd`
- **Date range:** Last 30 days

#### 2. WaveSpeed / provider cost
- **Event:** `generation_completed`
- **Aggregation:** Sum of property → `provider_cost_usd`
- **Filter:** `provider_cost_usd` is set
- **Date range:** Last 30 days

#### 3. Gross margin ($)
- **Event:** `generation_completed`
- **Aggregation:** Sum of property → `margin_usd`
- **Filter:** `provider_cost_usd` is set
- **Date range:** Last 30 days

#### 4. Cash collected (top-ups)
- **Event:** `balance_topup`
- **Aggregation:** Sum of property → `amount_usd`
- **Date range:** Last 30 days

---

### Row 2 — Unit economics over time (Line chart, daily)

#### 5. Revenue vs provider cost
Two series on one chart (or formula):

| Series | Event | Math |
|--------|-------|------|
| A — Revenue | `generation_completed` | Sum `revenue_usd` |
| B — Cost | `generation_completed` | Sum `provider_cost_usd` (filter: cost is set) |

Optional **formula insight:** `A - B` labeled “Gross margin”.

#### 6. Gross margin %
- Series A: Sum `margin_usd` on `generation_completed` (cost is set)
- Series B: Sum `revenue_usd` on `generation_completed` (cost is set)
- **Formula:** `A / B * 100` → display as percentage

---

### Row 3 — Usage (last 30 days)

#### 7. Completed generations
- **Event:** `generation_completed`
- **Aggregation:** Total count
- **Interval:** Day

#### 8. Generations by model
- **Event:** `generation_completed`
- **Aggregation:** Total count
- **Breakdown:** Event property `model`
- **Chart:** Bar or table

#### 9. Video vs image
- **Event:** `generation_completed`
- **Breakdown:** Event property `kind`

#### 10. API traffic by endpoint
- **Event:** `api_request`
- **Breakdown:** Event property `path`
- **Filter (optional):** `path` contains `/v1/`

---

### Row 4 — Conversion funnel (last 30 days)

#### 11. Checkout → pay → generate
| Step | Event |
|------|-------|
| 1 | `checkout_started` |
| 2 | `balance_topup` |
| 3 | `generation_started` |
| 4 | `generation_completed` |

Window: 14 days. Aggregation: unique users (Clerk `distinct_id`).

---

### Row 5 — Quality / loss

#### 12. Failed generations
- **Event:** `generation_failed`
- **Aggregation:** Total count, daily

#### 13. Margin by model (table)
- **Event:** `generation_completed`
- **Filter:** `provider_cost_usd` is set
- **Breakdown:** `model`
- **Show:** Count + Sum `revenue_usd` + Sum `provider_cost_usd` + Sum `margin_usd`

Use a **HogQL** insight for a single sortable table:

```sql
SELECT
  properties.model AS model,
  count() AS generations,
  round(sum(toFloat(properties.revenue_usd)), 2) AS revenue_usd,
  round(sum(toFloat(properties.provider_cost_usd)), 2) AS provider_cost_usd,
  round(sum(toFloat(properties.margin_usd)), 2) AS margin_usd,
  round(sum(toFloat(properties.margin_usd)) / nullIf(sum(toFloat(properties.revenue_usd)), 0) * 100, 1) AS margin_pct
FROM events
WHERE event = 'generation_completed'
  AND timestamp >= now() - INTERVAL 30 DAY
  AND properties.provider_cost_usd IS NOT NULL
GROUP BY model
ORDER BY revenue_usd DESC
```

---

## JSON query templates (Trends API / MCP)

Use these after switching PostHog MCP to the SeedanceAPI project.

### Sum revenue (Bold number)

```json
{
  "kind": "InsightVizNode",
  "source": {
    "kind": "TrendsQuery",
    "series": [{
      "kind": "EventsNode",
      "event": "generation_completed",
      "name": "Revenue",
      "math": "sum",
      "math_property": "revenue_usd"
    }],
    "dateRange": { "date_from": "-30d" },
    "interval": "day",
    "trendsFilter": { "display": "BoldNumber" }
  }
}
```

### Gross margin formula

```json
{
  "kind": "InsightVizNode",
  "source": {
    "kind": "TrendsQuery",
    "series": [
      {
        "kind": "EventsNode",
        "event": "generation_completed",
        "name": "Margin",
        "math": "sum",
        "math_property": "margin_usd",
        "properties": [{
          "key": "provider_cost_usd",
          "operator": "is_set",
          "type": "event"
        }]
      },
      {
        "kind": "EventsNode",
        "event": "generation_completed",
        "name": "Revenue",
        "math": "sum",
        "math_property": "revenue_usd",
        "properties": [{
          "key": "provider_cost_usd",
          "operator": "is_set",
          "type": "event"
        }]
      }
    ],
    "dateRange": { "date_from": "-30d" },
    "interval": "day",
    "trendsFilter": {
      "display": "ActionsLineGraph",
      "formula": "A / B * 100",
      "aggregationAxisFormat": "percentage_scaled"
    }
  }
}
```

---

## What this dashboard does *not* include yet

- **Dodo payment fees** — `balance_topup` is gross; net cash needs Stripe/Dodo fee data.
- **Historical generations** before pricing/PostHog deploy — no `provider_cost_usd`.
- **ModelArk-only runs** — `provider_cost_usd` may be null until upstream quoting exists.

---

## Quick sanity check

1. Run one image + one video generation in production.
2. In PostHog Activity, open `generation_completed` → verify `revenue_usd`, `provider_cost_usd`, `margin_usd`.
3. Top up $5 in test → confirm `balance_topup` with `amount_usd: 5`.

Expected on a **15s Seedance 2.5 i2v** (after pricing fix): ~`revenue_usd: 4`, ~`provider_cost_usd: 3.06`, ~`margin_usd: 0.94`.
