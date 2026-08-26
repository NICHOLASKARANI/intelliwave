import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% error rate
  },
};

export default function () {
  // Test homepage
  const home = http.get('https://www.intelliwavve.com/');
  check(home, { 'homepage 200': (r) => r.status === 200 });

  // Test ERP login page
  const login = http.get('https://www.intelliwavve.com/wavecore-erp/auth/login');
  check(login, { 'login 200': (r) => r.status === 200 });

  // Test API health
  const health = http.get('https://www.intelliwavve.com/api/wavecore/health');
  check(health, { 'health reachable': (r) => r.status === 200 || r.status === 403 });

  sleep(1);
}