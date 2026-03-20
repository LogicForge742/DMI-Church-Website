import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate must be < 1%
  },
};

export default function () {
  // Test Health Endpoint
  const healthRes = http.get('http://localhost:5000/health');
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // Test Events API (expecting cached results)
  const eventsRes = http.get('http://localhost:5000/api/events');
  check(eventsRes, {
    'events status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
