#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://127.0.0.1:8001}

echo "Checking health..."
curl -sS ${BASE_URL}/api/v1/health | jq '.'

echo "Testing analyze_text endpoint..."
curl -sS -X POST ${BASE_URL}/api/v1/student/resume/analyze_text \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test user. Skills: Python, React, AWS.", "target_job_description":"Full Stack"}' | jq '.'

echo "Testing company rank endpoint..."
curl -sS -X POST ${BASE_URL}/api/v1/company/candidates/rank \
  -H 'Content-Type: application/json' \
  -d '{"title":"Full Stack","description":"Python React"}' | jq '.'

echo "E2E smoke tests completed."
