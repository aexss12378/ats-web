#!/bin/sh
set -e

: "${PORT:=8080}"
: "${NGINX_RESOLVER:=127.0.0.11}"
: "${JOB_SERVICE_URL:=http://job-service:8080}"
: "${APPLICANT_SERVICE_URL:=http://applicant-service:8080}"
: "${TRACKED_APPLICANT_SERVICE_URL:=http://tracked-applicant-service:8080}"
: "${INTERVIEW_SERVICE_URL:=http://interview-service:8080}"

export PORT NGINX_RESOLVER JOB_SERVICE_URL APPLICANT_SERVICE_URL TRACKED_APPLICANT_SERVICE_URL INTERVIEW_SERVICE_URL

envsubst '${PORT} ${NGINX_RESOLVER} ${JOB_SERVICE_URL} ${APPLICANT_SERVICE_URL} ${TRACKED_APPLICANT_SERVICE_URL} ${INTERVIEW_SERVICE_URL}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
