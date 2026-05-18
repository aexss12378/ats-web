#!/bin/bash

echo "Starting entrypoint script..."

# 等待一下確保環境變數載入
sleep 2

# 檢查是否有 Google Cloud credentials
if [ -f "/var/run/secrets/cloud.google.com/service-account/key.json" ]; then
    echo "Using mounted service account key..."
    export GOOGLE_APPLICATION_CREDENTIALS="/var/run/secrets/cloud.google.com/service-account/key.json"
    gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS
elif [ ! -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "Using GOOGLE_APPLICATION_CREDENTIALS environment variable..."
    gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS
else
    echo "Using metadata service for authentication..."
    # 在 Cloud Run 中會自動使用 metadata service
fi

# 函數：更新 token 和 nginx 設定
update_token_and_nginx() {
    echo "$(date): Updating token..."

    # 取得各服務專用的 ID tokens
    JOB_TOKEN=$(gcloud auth print-identity-token --audiences=https://job-service-532457043033.asia-east1.run.app 2>/dev/null)
    APPLICANT_TOKEN=$(gcloud auth print-identity-token --audiences=https://applicant-service-532457043033.asia-east1.run.app 2>/dev/null)
    TRACKED_APPLICANT_TOKEN=$(gcloud auth print-identity-token --audiences=https://tracked-applicant-service-532457043033.asia-east1.run.app 2>/dev/null)
    INTERVIEW_TOKEN=$(gcloud auth print-identity-token --audiences=https://interview-service-532457043033.asia-east1.run.app 2>/dev/null)

    if [ -z "$JOB_TOKEN" ]; then
        echo "Warning: Failed to get job service token, using no authentication..."
        JOB_TOKEN=""
    else
        echo "Got job service token successfully, length: ${#JOB_TOKEN}"
    fi

    if [ -z "$APPLICANT_TOKEN" ]; then
        echo "Warning: Failed to get applicant service token, using no authentication..."
        APPLICANT_TOKEN=""
    else
        echo "Got applicant service token successfully, length: ${#APPLICANT_TOKEN}"
    fi

    if [ -z "$TRACKED_APPLICANT_TOKEN" ]; then
        echo "Warning: Failed to get tracked applicant service token, using no authentication..."
        TRACKED_APPLICANT_TOKEN=""
    else
        echo "Got tracked applicant service token successfully, length: ${#TRACKED_APPLICANT_TOKEN}"
    fi
    if [ -z "$INTERVIEW_TOKEN" ]; then
        echo "Warning: Failed to get interview service token, using no authentication..."
        INTERVIEW_TOKEN=""
    else
        echo "Got interview service token successfully, length: ${#INTERVIEW_TOKEN}"
    fi

    # 寫入新的 nginx 設定（包含 token）
    cat > /etc/nginx/nginx.conf <<EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 詳細的日誌格式，包含查詢參數
    log_format detailed '\$remote_addr - \$remote_user [\$time_local] '
                       '"\$request_method \$uri\$is_args\$args \$server_protocol" '
                       '\$status \$body_bytes_sent '
                       '"\$http_referer" "\$http_user_agent" '
                       'upstream: \$upstream_addr '
                       'upstream_response_time: \$upstream_response_time '
                       'request_time: \$request_time';

    access_log /var/log/nginx/access.log detailed;
    error_log /var/log/nginx/error.log debug;

    # 啟用 gzip 壓縮
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript application/font-woff application/font-woff2;

    server {
        listen ${PORT:-8080};
        server_name localhost;

        # 安全頭部
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Angular 靜態檔案服務
        root /usr/share/nginx/html;
        index index.html;

        # Angular 路由支援 (SPA)
        location / {
            try_files \$uri \$uri/ /index.html;

            # 設置快取頭部
            location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
                add_header Vary "Accept-Encoding";
            }

            # HTML 文件不快取
            location ~* \\.html\$ {
                add_header Cache-Control "no-cache, no-store, must-revalidate";
                add_header Pragma "no-cache";
                add_header Expires "0";
            }
        }

        # Job Service API 代理 (已部署)
        location /api/jobs {
            # 處理 CORS preflight (OPTIONS) 請求
            if (\$request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;
                add_header 'Access-Control-Max-Age' 86400 always;
                add_header 'Content-Type' 'text/plain; charset=utf-8' always;
                add_header 'Content-Length' 0 always;
                return 204;
            }

            # 代理到 Job Service (確保查詢參數被傳遞)
            proxy_pass https://job-service-532457043033.asia-east1.run.app$request_uri;
            proxy_set_header Host job-service-532457043033.asia-east1.run.app;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Forwarded-Host \$host;
EOF

    # 如果有 job token 就添加 Authorization header
    if [ ! -z "$JOB_TOKEN" ]; then
        cat >> /etc/nginx/nginx.conf <<EOF
            proxy_set_header Authorization "Bearer $JOB_TOKEN";
EOF
    fi

    cat >> /etc/nginx/nginx.conf <<EOF

            # 保持原始請求頭部
            proxy_pass_request_headers on;

            # 處理響應的 CORS 頭部
            proxy_hide_header 'Access-Control-Allow-Origin';
            proxy_hide_header 'Access-Control-Allow-Methods';
            proxy_hide_header 'Access-Control-Allow-Headers';

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;

            # 代理超時設置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 60s;
            proxy_buffering off;

            # 處理響應錯誤
            proxy_intercept_errors on;
            error_page 502 503 504 /50x.html;
        }

        # Applicant Service API 代理 (需要部署後啟用)
        location /api/applicants {
            # 處理 CORS preflight (OPTIONS) 請求
            if (\$request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;
                add_header 'Access-Control-Max-Age' 86400 always;
                add_header 'Content-Type' 'text/plain; charset=utf-8' always;
                add_header 'Content-Length' 0 always;
                return 204;
            }

            # 代理到 Applicant Service (確保查詢參數被傳遞)
            proxy_pass https://applicant-service-532457043033.asia-east1.run.app$request_uri;
            proxy_set_header Host applicant-service-532457043033.asia-east1.run.app;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Forwarded-Host \$host;
EOF

    # 如果有 applicant token 就添加 Authorization header
    if [ ! -z "$APPLICANT_TOKEN" ]; then
        cat >> /etc/nginx/nginx.conf <<EOF
            proxy_set_header Authorization "Bearer $APPLICANT_TOKEN";
EOF
    fi

    cat >> /etc/nginx/nginx.conf <<EOF

            # 保持原始請求頭部
            proxy_pass_request_headers on;

            # 處理響應的 CORS 頭部
            proxy_hide_header 'Access-Control-Allow-Origin';
            proxy_hide_header 'Access-Control-Allow-Methods';
            proxy_hide_header 'Access-Control-Allow-Headers';
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;

            # 代理超時設置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 60s;
            proxy_buffering off;
            proxy_intercept_errors on;
            error_page 502 503 504 /50x.html;
        }

        # TrackedApplicants Service API 代理 (獨立的 Tracked Applicant Service)
        location /api/trackedApplicants {
            # 處理 CORS preflight (OPTIONS) 請求
            if (\$request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;
                add_header 'Access-Control-Max-Age' 86400 always;
                add_header 'Content-Type' 'text/plain; charset=utf-8' always;
                add_header 'Content-Length' 0 always;
                return 204;
            }

            # 代理到獨立的 Tracked Applicant Service (確保查詢參數被傳遞)
            proxy_pass https://tracked-applicant-service-532457043033.asia-east1.run.app$request_uri;
            proxy_set_header Host tracked-applicant-service-532457043033.asia-east1.run.app;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Forwarded-Host \$host;
EOF

    # 如果有 tracked applicant token 就添加 Authorization header
    if [ ! -z "$TRACKED_APPLICANT_TOKEN" ]; then
        cat >> /etc/nginx/nginx.conf <<EOF
            proxy_set_header Authorization "Bearer $TRACKED_APPLICANT_TOKEN";
EOF
    fi

    cat >> /etc/nginx/nginx.conf <<EOF

            # 保持原始請求頭部
            proxy_pass_request_headers on;

            # 處理響應的 CORS 頭部
            proxy_hide_header 'Access-Control-Allow-Origin';
            proxy_hide_header 'Access-Control-Allow-Methods';
            proxy_hide_header 'Access-Control-Allow-Headers';
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;

            # 代理超時設置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 60s;
            proxy_buffering off;
            proxy_intercept_errors on;
            error_page 502 503 504 /50x.html;
        }        # Interview Service API 代理 - Interviewers
        location /api/interviewers {
            # 處理 CORS preflight (OPTIONS) 請求
            if (\$request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;
                add_header 'Access-Control-Max-Age' 86400 always;
                add_header 'Content-Type' 'text/plain; charset=utf-8' always;
                add_header 'Content-Length' 0 always;
                return 204;
            }

            # 代理到 Interview Service (確保查詢參數被傳遞)
            proxy_pass https://interview-service-532457043033.asia-east1.run.app$request_uri;
            proxy_set_header Host interview-service-532457043033.asia-east1.run.app;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Forwarded-Host \$host;
EOF

    # 如果有 interview token 就添加 Authorization header
    if [ ! -z "$INTERVIEW_TOKEN" ]; then
        cat >> /etc/nginx/nginx.conf <<EOF
            proxy_set_header Authorization "Bearer $INTERVIEW_TOKEN";
EOF
    fi

    cat >> /etc/nginx/nginx.conf <<EOF
            proxy_pass_request_headers on;

            # 處理響應的 CORS 頭部
            proxy_hide_header 'Access-Control-Allow-Origin';
            proxy_hide_header 'Access-Control-Allow-Methods';
            proxy_hide_header 'Access-Control-Allow-Headers';
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;

            # 代理超時設置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 60s;
            proxy_buffering off;
            proxy_intercept_errors on;
            error_page 502 503 504 /50x.html;
        }        # Interview Service API 代理 - Interview Sessions
        location /api/interviewSessions {
            # 處理 CORS preflight (OPTIONS) 請求
            if (\$request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;
                add_header 'Access-Control-Max-Age' 86400 always;
                add_header 'Content-Type' 'text/plain; charset=utf-8' always;
                add_header 'Content-Length' 0 always;
                return 204;
            }

            # 代理到 Interview Service (確保查詢參數被傳遞)
            proxy_pass https://interview-service-532457043033.asia-east1.run.app$request_uri;
            proxy_set_header Host interview-service-532457043033.asia-east1.run.app;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Forwarded-Host \$host;
EOF

    # 如果有 interview token 就添加 Authorization header
    if [ ! -z "$INTERVIEW_TOKEN" ]; then
        cat >> /etc/nginx/nginx.conf <<EOF
            proxy_set_header Authorization "Bearer $INTERVIEW_TOKEN";
EOF
    fi

    cat >> /etc/nginx/nginx.conf <<EOF
            proxy_pass_request_headers on;

            # 處理響應的 CORS 頭部
            proxy_hide_header 'Access-Control-Allow-Origin';
            proxy_hide_header 'Access-Control-Allow-Methods';
            proxy_hide_header 'Access-Control-Allow-Headers';
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;

            # 代理超時設置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 60s;
            proxy_buffering off;
            proxy_intercept_errors on;
            error_page 502 503 504 /50x.html;
        }        # Interview Service API 代理 - Feedbacks
        location /api/feedbacks {
            # 處理 CORS preflight (OPTIONS) 請求
            if (\$request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;
                add_header 'Access-Control-Max-Age' 86400 always;
                add_header 'Content-Type' 'text/plain; charset=utf-8' always;
                add_header 'Content-Length' 0 always;
                return 204;
            }

            # 代理到 Interview Service (確保查詢參數被傳遞)
            proxy_pass https://interview-service-532457043033.asia-east1.run.app$request_uri;
            proxy_set_header Host interview-service-532457043033.asia-east1.run.app;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Forwarded-Host \$host;
EOF

    # 如果有 interview token 就添加 Authorization header
    if [ ! -z "$INTERVIEW_TOKEN" ]; then
        cat >> /etc/nginx/nginx.conf <<EOF
            proxy_set_header Authorization "Bearer $INTERVIEW_TOKEN";
EOF
    fi

    cat >> /etc/nginx/nginx.conf <<EOF
            proxy_pass_request_headers on;

            # 處理響應的 CORS 頭部
            proxy_hide_header 'Access-Control-Allow-Origin';
            proxy_hide_header 'Access-Control-Allow-Methods';
            proxy_hide_header 'Access-Control-Allow-Headers';
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;

            # 代理超時設置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 60s;
            proxy_buffering off;
            proxy_intercept_errors on;
            error_page 502 503 504 /50x.html;
        }

        # Supervisor Service API 代理 - 主管決策相關
        location ~ ^/api/(supervisor-comments|supervisor-decisions) {
            # 處理 CORS preflight (OPTIONS) 請求
            if (\$request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;
                add_header 'Access-Control-Max-Age' 86400 always;
                add_header 'Content-Type' 'text/plain; charset=utf-8' always;
                add_header 'Content-Length' 0 always;
                return 204;
            }            # 代理到 Interview Service (主管決策功能暫時整合在 Interview Service) (確保查詢參數被傳遞)
            proxy_pass https://interview-service-532457043033.asia-east1.run.app$request_uri;
            proxy_set_header Host interview-service-532457043033.asia-east1.run.app;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Forwarded-Host \$host;
EOF

    # 如果有 interview token 就添加 Authorization header
    if [ ! -z "$INTERVIEW_TOKEN" ]; then
        cat >> /etc/nginx/nginx.conf <<EOF
            proxy_set_header Authorization "Bearer $INTERVIEW_TOKEN";
EOF
    fi

    cat >> /etc/nginx/nginx.conf <<EOF
            proxy_pass_request_headers on;

            # 處理響應的 CORS 頭部
            proxy_hide_header 'Access-Control-Allow-Origin';
            proxy_hide_header 'Access-Control-Allow-Methods';
            proxy_hide_header 'Access-Control-Allow-Headers';
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Forwarded-For,X-Real-IP' always;

            # 代理超時設置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 60s;
            proxy_buffering off;
            proxy_intercept_errors on;
            error_page 502 503 504 /50x.html;
        }

        # 健康檢查端點
        location /health {
            access_log off;
            return 200 "healthy\\n";
            add_header Content-Type text/plain;
        }

        # 錯誤頁面
        location = /50x.html {
            root /usr/share/nginx/html;
        }

        # 禁止訪問隱藏文件
        location ~ /\\. {
            deny all;
            access_log off;
            log_not_found off;
        }
    }
}
EOF

    # 重新載入 nginx（如果已經在運行）
    if pgrep nginx > /dev/null; then
        nginx -s reload
        echo "Nginx configuration reloaded"
    fi
}

# 初始化：取得 token 並設定 nginx
update_token_and_nginx

# 啟動 nginx
echo "Starting nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# 背景任務：每 45 分鐘更新 token
(
    while true; do
        sleep 2700  # 45 分鐘 (token 通常 1 小時過期)
        update_token_and_nginx
    done
) &

# 等待 nginx 程序
wait $NGINX_PID
