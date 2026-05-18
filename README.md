# ats-web

ATS（Applicant Tracking System）前端，Angular 19 + PrimeNG + Tailwind CSS。

## 技術棧

| 項目 | 版本 |
|------|------|
| Angular | 19.2.1 |
| PrimeNG | 19.0.10 |
| Tailwind CSS | 4.1.4 |
| Node.js | 18+ |

## 本地開發

```bash
npm install
npm start        # ng serve，預設 http://localhost:4200
npm run mock-api # 啟動 json-server（port 3001）
```

## 部署

使用 Docker + docker-compose，詳見 [ats-api](https://github.com/aexss12378/ats-api) 的 `ROADMAP.md`。
