import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  // Test Vercel directly (bypasses Cloudflare)
  const home = http.get('https://intelliwave-fts2o2ymc-nicholaskaranis-projects.vercel.app/');
  check(home, { 'homepage 200': (r) => r.status === 200 });
  sleep(1);
}