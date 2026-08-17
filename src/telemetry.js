// telemetry.js
const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');

// 1. Identify the service
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'web-app-service',
});

// 2. Configure the OTLP/HTTP exporter pointing to the OTel Collector sidecar.
//    Inside ECS awsvpc networking, localhost reaches the sidecar container.
//    Override OTEL_EXPORTER_OTLP_ENDPOINT if you ever need a different address.
const collectorEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

const metricExporter = new OTLPMetricExporter({
  url: `${collectorEndpoint}/v1/metrics`,
});

// 3. Send metrics every 15 seconds
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 15000,
});

// 4. Initialise the MeterProvider
const meterProvider = new MeterProvider({
  resource,
  readers: [metricReader],
});

// 5. Create instruments shared across the app
const meter = meterProvider.getMeter('web-app-meter');

const httpRequestsTotal = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

const httpRequestDuration = meter.createHistogram('http_request_duration_seconds', {
  description: 'HTTP request duration in seconds',
  unit: 's',
});

module.exports = { meter, httpRequestsTotal, httpRequestDuration };