# 多階段構建 - 第一階段：構建 Angular 應用
FROM node:18-alpine AS build

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝所有依賴（包括 devDependencies，因為需要 Angular CLI 來建置）
RUN npm ci

# 複製專案檔案
COPY . .

# 構建 Angular 專案（生產模式）
RUN npm run build

# 第二階段：設置 nginx 生產環境
FROM nginx:alpine

# 安裝必要工具和 Google Cloud SDK
RUN apk add --no-cache curl gettext bash python3 py3-pip
RUN curl https://sdk.cloud.google.com | bash
RUN /root/google-cloud-sdk/bin/gcloud config set core/disable_usage_reporting true
ENV PATH="/root/google-cloud-sdk/bin:${PATH}"

# 移除預設的 nginx 配置
RUN rm /etc/nginx/conf.d/default.conf
RUN rm /etc/nginx/nginx.conf

# 複製 nginx 配置文件（作為模板）
COPY nginx.conf /etc/nginx/nginx.conf.template

# 複製 entrypoint 腳本 - 修正：確保使用 LF 換行符號並放置到容器根目錄
COPY entrypoint.sh /entrypoint.sh
# 確認文件存在並顯示內容（調試用）
RUN ls -la /entrypoint.sh && cat /entrypoint.sh
# 修正權限
RUN chmod +x /entrypoint.sh && dos2unix /entrypoint.sh || true

# 複製建置好的 Angular 檔案到 nginx 根目錄
COPY --from=build /app/dist/my-angular-app/browser /usr/share/nginx/html

# 創建錯誤頁面
RUN echo '<html><body><h1>502 Bad Gateway</h1><p>Backend service temporarily unavailable.</p></body></html>' > /usr/share/nginx/html/50x.html

# Cloud Run 會自動設定 PORT 環境變數
ENV PORT=8080
EXPOSE $PORT

# 使用 entrypoint 腳本啟動 - 確保使用絕對路徑
CMD ["/bin/bash", "/entrypoint.sh"]
