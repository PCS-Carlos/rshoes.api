import http from 'http';
import https from 'https';

export type AnalyticsPeriod = '7d' | '30d' | '90d';

type QueryRow = Record<string, any>;

type EventBreakdown = Record<string, number>;

const TRACKED_EVENTS = [
  'customer_service_viewed',
  'customer_result_viewed',
  'customer_order_reviewed',
  'customer_order_lookup_failed',
  'customer_sent_to_whatsapp',
  'customer_social_link_clicked',
];

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const EMPTY_EVENTS: Record<string, number> = {
  customer_service_viewed: 0,
  customer_result_viewed: 0,
  customer_order_reviewed: 0,
  customer_order_lookup_failed: 0,
  customer_sent_to_whatsapp: 0,
  customer_social_link_clicked: 0,
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeEnv = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');

const escapedSqlString = (value: string) => value.replace(/'/g, "''");

const getApiConfig = () => {
  const host = process.env.POSTHOG_HOST;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;

  if (!host || !projectId || !apiKey) {
    throw new Error('Faltan variables de PostHog (POSTHOG_HOST, POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY).');
  }

  return {
    host,
    projectId,
    apiKey,
  };
};

const isPosthogConfigured = () =>
  Boolean(process.env.POSTHOG_HOST && process.env.POSTHOG_PROJECT_ID && process.env.POSTHOG_PERSONAL_API_KEY);

const requestJson = (
  url: string,
  method: 'POST' | 'GET',
  headers: Record<string, string>,
  body?: string,
): Promise<any> =>
  new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const transport = parsedUrl.protocol === 'http:' ? http : https;

    const request = transport.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method,
        headers,
        timeout: 25000,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk) => {
          chunks.push(Buffer.from(chunk));
        });

        response.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          const statusCode = response.statusCode ?? 500;

          if (statusCode < 200 || statusCode >= 300) {
            return reject(new Error(`PostHog respondió con ${statusCode}: ${raw}`));
          }

          if (!raw) {
            return resolve({});
          }

          try {
            return resolve(JSON.parse(raw));
          } catch {
            return reject(new Error('No se pudo parsear la respuesta de PostHog como JSON.'));
          }
        });

        response.on('error', (error) => reject(error));
      },
    );

    request.on('error', (error) => reject(error));
    request.on('timeout', () => {
      request.destroy(new Error('Timeout de conexión hacia PostHog.'));
    });

    if (body) {
      request.write(body);
    }

    request.end();
  });

const normalizeQueryRows = (rows: unknown, columns: unknown): QueryRow[] => {
  if (!Array.isArray(rows)) {
    return [];
  }

  const safeColumns = Array.isArray(columns) ? columns.map((column) => String(column)) : [];

  return rows.map((row) => {
    if (Array.isArray(row) && safeColumns.length > 0) {
      const mappedRow: QueryRow = {};
      safeColumns.forEach((columnName, index) => {
        mappedRow[columnName] = row[index];
      });
      return mappedRow;
    }

    return (row ?? {}) as QueryRow;
  });
};

const getResultsFromResponse = (payload: any): QueryRow[] => {
  if (payload && Array.isArray(payload.results)) {
    return normalizeQueryRows(payload.results, payload.columns);
  }

  if (payload && payload.query_status && Array.isArray(payload.query_status.results)) {
    return normalizeQueryRows(payload.query_status.results, payload.query_status.columns);
  }

  return [];
};

const runHogQL = async (query: string, name: string): Promise<QueryRow[]> => {
  const config = getApiConfig();
  const host = config.host.replace(/\/$/, '');
  const url = `${host}/api/projects/${config.projectId}/query/`;

  const body = JSON.stringify({
    name,
    refresh: 'force_blocking',
    query: {
      kind: 'HogQLQuery',
      query,
    },
  });

  const response = await requestJson(
    url,
    'POST',
    {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(body)),
    },
    body,
  );

  return getResultsFromResponse(response);
};

const getBaseDateFilter = (period: AnalyticsPeriod) => {
  const days = PERIOD_DAYS[period];

  return `timestamp >= now() - INTERVAL ${days} DAY
    AND event != '$pageleave'
    AND NOT startsWith(toString(properties.$pathname), '/admin')`;
};

const getTrackedEventsFilter = (period: AnalyticsPeriod, env: string) => {
  const days = PERIOD_DAYS[period];
  const safeEnv = escapedSqlString(sanitizeEnv(env) || 'prod');
  const eventList = TRACKED_EVENTS.map((eventName) => `'${eventName}'`).join(', ');

  return `event IN (${eventList}) AND timestamp >= now() - INTERVAL ${days} DAY AND lower(toString(properties.env)) = '${safeEnv}'`;
};

const buildDailyLabels = (period: AnalyticsPeriod) => {
  if (period === '7d') {
    return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  }

  if (period === '30d') {
    return ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
  }

  return ['Mes 1', 'Mes 2', 'Mes 3'];
};

const buildEmptyDashboardData = (period: AnalyticsPeriod, env: string) => ({
  meta: {
    period,
    env,
  },
  summary: {
    visitors: 0,
    views: 0,
    sessions: 0,
    whatsapp: 0,
    orderLookupFailed: 0,
    socialClicks: 0,
  },
  daily: buildDailyLabels(period).map((day) => ({day, visitors: 0, views: 0})),
  countries: [],
  retention: {
    week0: 0,
    week1: 0,
  },
  technology: [
    {label: 'Desktop', value: 0, color: '#1677ff'},
    {label: 'Mobile', value: 0, color: '#52c41a'},
    {label: 'Tablet', value: 0, color: '#faad14'},
  ],
  events: {...EMPTY_EVENTS},
  servicesByType: {},
  resultsByType: {},
  ordersByStatus: {},
  lookupFailuresByStatus: {},
  whatsappBySource: {},
  socialByPlatform: {},
});

const queryDailyMetrics = async (period: AnalyticsPeriod, whereClause: string) => {
  if (period === '7d') {
    const rows = await runHogQL(
      `
      SELECT
        toDate(timestamp) AS bucket,
        uniqExact(distinct_id) AS visitors,
        count() AS views
      FROM events
      WHERE ${whereClause}
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      'analytics_dashboard_daily_7d',
    );

    const byBucket: Record<string, {visitors: number; views: number}> = {};
    for (const row of rows) {
      byBucket[String(row.bucket)] = {
        visitors: toNumber(row.visitors),
        views: toNumber(row.views),
      };
    }

    const labels = buildDailyLabels(period);
    const start = new Date();
    start.setDate(start.getDate() - 6);

    return labels.map((label, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const iso = date.toISOString().slice(0, 10);
      const item = byBucket[iso];
      return {
        day: label,
        visitors: item ? item.visitors : 0,
        views: item ? item.views : 0,
      };
    });
  }

  if (period === '30d') {
    const rows = await runHogQL(
      `
      SELECT
        least(4, intDiv(dateDiff('day', toDate(now()) - INTERVAL 29 DAY, toDate(timestamp)), 7) + 1) AS segment,
        uniqExact(distinct_id) AS visitors,
        count() AS views
      FROM events
      WHERE ${whereClause}
      GROUP BY segment
      ORDER BY segment ASC
      `,
      'analytics_dashboard_daily_30d',
    );

    const bySegment: Record<number, {visitors: number; views: number}> = {};
    for (const row of rows) {
      const segment = toNumber(row.segment);
      bySegment[segment] = {
        visitors: toNumber(row.visitors),
        views: toNumber(row.views),
      };
    }

    return buildDailyLabels(period).map((label, index) => {
      const segment = index + 1;
      const item = bySegment[segment];
      return {
        day: label,
        visitors: item ? item.visitors : 0,
        views: item ? item.views : 0,
      };
    });
  }

  const rows = await runHogQL(
    `
    SELECT
      least(3, intDiv(dateDiff('day', toDate(now()) - INTERVAL 89 DAY, toDate(timestamp)), 30) + 1) AS segment,
      uniqExact(distinct_id) AS visitors,
      count() AS views
    FROM events
    WHERE ${whereClause}
    GROUP BY segment
    ORDER BY segment ASC
    `,
    'analytics_dashboard_daily_90d',
  );

  const bySegment: Record<number, {visitors: number; views: number}> = {};
  for (const row of rows) {
    const segment = toNumber(row.segment);
    bySegment[segment] = {
      visitors: toNumber(row.visitors),
      views: toNumber(row.views),
    };
  }

  return buildDailyLabels(period).map((label, index) => {
    const segment = index + 1;
    const item = bySegment[segment];
    return {
      day: label,
      visitors: item ? item.visitors : 0,
      views: item ? item.views : 0,
    };
  });
};

const queryBreakdown = async (
  whereClause: string,
  eventName: string,
  propertyName: string,
): Promise<EventBreakdown> => {
  const rows = await runHogQL(
    `
    SELECT
      coalesce(nullIf(toString(properties.${propertyName}), ''), 'unknown') AS label,
      count() AS value
    FROM events
    WHERE ${whereClause} AND event = '${eventName}'
    GROUP BY label
    ORDER BY value DESC
    LIMIT 10
    `,
    `analytics_breakdown_${eventName}`,
  );

  const breakdown: EventBreakdown = {};

  for (const row of rows) {
    breakdown[String(row.label)] = toNumber(row.value);
  }

  return breakdown;
};

export const getPosthogDashboardData = async (period: AnalyticsPeriod, env = 'prod') => {
  const safeEnv = sanitizeEnv(env) || 'prod';

  if (!isPosthogConfigured()) {
    return buildEmptyDashboardData(period, safeEnv);
  }

  try {
    const baseWhereClause = getBaseDateFilter(period);
    const trackedWhereClause = getTrackedEventsFilter(period, safeEnv);

    const summaryRows = await runHogQL(
      `
    SELECT
      uniqExact(distinct_id) AS visitors,
      count() AS views,
      uniqExactIf(toString(properties.$session_id), toString(properties.$session_id) != '') AS sessions,
      countIf(event = 'customer_sent_to_whatsapp' AND lower(toString(properties.env)) = '${escapedSqlString(safeEnv)}') AS whatsapp,
      countIf(event = 'customer_order_lookup_failed' AND lower(toString(properties.env)) = '${escapedSqlString(safeEnv)}') AS orderLookupFailed,
      countIf(event = 'customer_social_link_clicked' AND lower(toString(properties.env)) = '${escapedSqlString(safeEnv)}') AS socialClicks
    FROM events
    WHERE ${baseWhereClause}
    `,
      'analytics_dashboard_summary',
    );

    const summary = summaryRows[0] || {};

    const countriesRows = await runHogQL(
      `
    SELECT
      coalesce(nullIf(toString(properties.$geoip_country_name), ''), 'Sin datos') AS country,
      uniqExact(distinct_id) AS visitors,
      count() AS views
    FROM events
    WHERE ${baseWhereClause}
    GROUP BY country
    ORDER BY visitors DESC
    LIMIT 10
    `,
      'analytics_dashboard_countries',
    );

    const totalCountryVisitors = countriesRows.reduce((sum, row) => sum + toNumber(row.visitors), 0);
    const countries = countriesRows.map((row) => {
      const visitors = toNumber(row.visitors);
      const share = totalCountryVisitors > 0 ? Number(((visitors / totalCountryVisitors) * 100).toFixed(1)) : 0;

      return {
        country: String(row.country),
        visitors,
        views: toNumber(row.views),
        share,
      };
    });

    const technologyRows = await runHogQL(
      `
    SELECT
      lower(coalesce(nullIf(toString(properties.$device_type), ''), 'unknown')) AS label,
      count() AS value
    FROM events
    WHERE ${baseWhereClause}
    GROUP BY label
    ORDER BY value DESC
    LIMIT 3
    `,
      'analytics_dashboard_technology',
    );

    const totalTechnology = technologyRows.reduce((sum, row) => sum + toNumber(row.value), 0);
    const colorByLabel: Record<string, string> = {
      desktop: '#1677ff',
      mobile: '#52c41a',
      tablet: '#faad14',
      unknown: '#8c8c8c',
    };

    const technology = technologyRows.map((row) => {
      const rawLabel = String(row.label);
      const value = toNumber(row.value);
      const percent = totalTechnology > 0 ? Number(((value / totalTechnology) * 100).toFixed(1)) : 0;
      const label =
        rawLabel === 'desktop'
          ? 'Desktop'
          : rawLabel === 'mobile'
            ? 'Mobile'
            : rawLabel === 'tablet'
              ? 'Tablet'
              : 'Unknown';

      return {
        label,
        value: percent,
        color: colorByLabel[rawLabel] || '#8c8c8c',
      };
    });

    const eventTotalsRows = await runHogQL(
      `
    SELECT event, count() AS value
    FROM events
    WHERE ${trackedWhereClause}
    GROUP BY event
    `,
      'analytics_dashboard_events_total',
    );

    const events: Record<string, number> = {...EMPTY_EVENTS};

    for (const row of eventTotalsRows) {
      const eventName = String(row.event);
      if (eventName in events) {
        events[eventName] = toNumber(row.value);
      }
    }

    const servicesByType = await queryBreakdown(trackedWhereClause, 'customer_service_viewed', 'service_type');
    const resultsByType = await queryBreakdown(trackedWhereClause, 'customer_result_viewed', 'product_type');
    const ordersByStatus = await queryBreakdown(trackedWhereClause, 'customer_order_reviewed', 'order_status');
    const lookupFailuresByStatus = await queryBreakdown(
      trackedWhereClause,
      'customer_order_lookup_failed',
      'error_status',
    );
    const whatsappBySource = await queryBreakdown(trackedWhereClause, 'customer_sent_to_whatsapp', 'source');
    const socialByPlatform = await queryBreakdown(trackedWhereClause, 'customer_social_link_clicked', 'platform');

    const retentionRows = await runHogQL(
      `
    WITH user_weeks AS (
      SELECT DISTINCT distinct_id, toStartOfWeek(toDate(timestamp), 1) AS event_week
      FROM events
      WHERE ${baseWhereClause} AND event = '$pageview' AND toString(distinct_id) != ''
    ),
    first_seen AS (
      SELECT distinct_id, min(event_week) AS cohort_week
      FROM user_weeks
      GROUP BY distinct_id
    ),
    cohort_retention AS (
      SELECT
        f.cohort_week AS cohort_week,
        uniqExact(f.distinct_id) AS cohort_size,
        uniqExactIf(u.distinct_id, dateDiff('week', f.cohort_week, u.event_week) = 0) AS week0_users,
        uniqExactIf(u.distinct_id, dateDiff('week', f.cohort_week, u.event_week) = 1) AS week1_users
      FROM first_seen f
      LEFT JOIN user_weeks u ON f.distinct_id = u.distinct_id
      GROUP BY cohort_week
    )
    SELECT
      if(sum(cohort_size) = 0, 0, round(100.0 * sum(week0_users) / sum(cohort_size), 2)) AS week0,
      if(sum(cohort_size) = 0, 0, round(100.0 * sum(week1_users) / sum(cohort_size), 2)) AS week1
    FROM cohort_retention
    `,
      'analytics_dashboard_retention',
    );

    const retention = retentionRows[0] || {};

    const daily = await queryDailyMetrics(period, baseWhereClause);

    return {
      meta: {
        period,
        env: safeEnv,
      },
      summary: {
        visitors: toNumber(summary.visitors),
        views: toNumber(summary.views),
        sessions: toNumber(summary.sessions),
        whatsapp: toNumber(summary.whatsapp),
        orderLookupFailed: toNumber(summary.orderLookupFailed),
        socialClicks: toNumber(summary.socialClicks),
      },
      daily,
      countries,
      retention: {
        week0: toNumber(retention.week0),
        week1: toNumber(retention.week1),
      },
      technology,
      events,
      servicesByType,
      resultsByType,
      ordersByStatus,
      lookupFailuresByStatus,
      whatsappBySource,
      socialByPlatform,
    };
  } catch (error) {
    console.error('[PostHog Analytics] Fallback aplicado por error:', error);
    return buildEmptyDashboardData(period, safeEnv);
  }
};
