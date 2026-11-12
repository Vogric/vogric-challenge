# Load test

Requires [k6](https://k6.io/docs/get-started/installation/).

```bash
BASE_URL=http://localhost:3000 \
ORG_ID=<acme-org-id> \
DEMO_EMAIL=demo@example.com \
DEMO_PASSWORD=password123 \
k6 run load/tasks.js
```

Thresholds: p95 for the tasks endpoint < 300 ms and failed requests < 1%.
The script logs in once in `setup()` and reuses the session cookie.
