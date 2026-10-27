## 项目定位

- `EzShop-web` 是 `EzShop` 的单体前端仓库。
- 目录名 `apps/admin`：后台管理系统，供员工操作商品、订单、退货、统计等。
- 目录名 `apps/weapp`：前台系统，微信小程序，供顾客浏览商品、下单支付、评价商品等。
- 当前阶段优先对接 `EzShop` 已有的 `/admin/auth` 和 `/admin/sys/user` 接口。

## 接口约定

- 后端统一响应结构为 `code`、`msg`、`data`。
- `code === 200` 表示成功；其他响应码表示失败。
- `apps/admin` 需要认证的请求携带 JWT，具体请求头与后端 `JwtFilter` 保持一致。
- `apps/weapp` 后端未开发前台系统，暂不确定如何请求

## 常用命令

- 安装依赖：`npm install`
- 启动后台：`npm run dev:admin`
- 启动小程序：`npm run dev:weapp`
- 构建后台：`npm run build:admin`
- 构建小程序：`npm run build:weapp`
- 运行测试：`npm run test`（每次 commit 前必须通过）

## 技术选型

- 后端使用 JDK 1.8，属于较保守的存量项目；前端不继承该限制，可以使用现代前端工具链。
- 运行环境：Node.js 20 LTS 或更新版本，包管理器使用 npm。
- 工程结构：使用 npm workspaces 管理 `apps/admin` 与 `apps/weapp`。
- 开发语言：TypeScript。
- `apps/admin` 核心框架：Vue 3 + Vite + Vue Router + Pinia。
- `apps/weapp` 核心框架：uni-app + Vue 3 + TypeScript + Vite + Pinia。
- `apps/admin` 请求库：Axios。
- `apps/weapp` 请求方式：`uni.request`，后续基于前台系统接口再确定认证与响应封装细节。
- `apps/admin` UI：Element Plus，适合后台管理系统的表格、表单和权限页面。
- `apps/weapp` UI：uni-ui，适配微信小程序；后续如有需要再评估其他 uni-app 组件库。
- 测试：`apps/admin` 使用 Vitest + Vue Test Utils；`apps/weapp` 优先对 stores、services 和工具函数做 Vitest 单测。
- 代码规范：ESLint + Prettier。
- 当前不引入 SSR；如果后续新增独立 H5 商城并要求 SEO，再单独评估 Nuxt 方案。

## 兼容性说明

- `apps/admin` 默认面向现代浏览器，不支持 IE11。
- `apps/weapp` 面向微信小程序，兼容性以项目约定的微信基础库版本为准。
