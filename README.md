# EzShop-web

EzShop [https://github.com/Hoshiikunn/EzShop](https://github.com/Hoshiikunn/EzShop) 的单体前端仓库。该项目由 AI Agent GLM-5.3 + Codex 开发。

## 版本与计划

- 前端版本跟随后端 `EzShop` 版本更新，当前为 `v0.0.7`。后端本版完成审计日志闭环（登录/操作日志批量删除）；`v0.0.8` 计划开发云 OSS 文件上传。
- 新功能计划也跟随后端计划展开，先以后端接口和模块规划为基准，避免前端提前锁定未确定的契约。
- 后台管理系统 `apps/admin` 已完成登录、用户、角色与菜单管理，以及个人中心、动态菜单和页面权限控制。
- 前台微信小程序 `apps/weapp` 为预留目录，等待前台后端接口确定后初始化。

## 模块结构

| 目录 | 说明 | 状态 |
| --- | --- | --- |
| `apps/admin` | 后台管理系统，供员工操作用户、角色、菜单等 | 开发中 |
| `apps/weapp` | 前台微信小程序，供顾客浏览商品、下单支付、评价商品 | 预留 |

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
npm run dev:admin     # 启动后台
npm run build:admin   # 构建后台
npm run test          # 运行测试
npm run lint          # 静态检查
npm run format        # 格式化代码
```
