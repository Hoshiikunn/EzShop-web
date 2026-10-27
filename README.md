# EzShop-web

EzShop https://github.com/Hoshiikunn/EzShop 的单体前端仓库。该前端项目由 AI Agent GLM-5.3 + Codex 开发。
当前已实现后台管理系统 `apps/admin`；前台微信小程序 `apps/weapp` 为预留目录，等待前台后端接口确定后初始化。

## 技术栈

- Vue 3 + TypeScript + Vite
- Pinia + Vue Router
- Element Plus
- Axios
- Vitest

## 快速开始

```bash
cp apps/admin/.env.example apps/admin/.env
npm install
npm run dev:admin
```

默认访问地址是 `http://localhost:5173`。开发服务会把 `/api` 代理到 `http://localhost:13830`。

## 常用命令

```bash
npm run build:admin
npm run test
npm run lint
npm run format
```
