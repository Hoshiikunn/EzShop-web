## 项目定位

- `EzShop-web` 是 `EzShop` 的单体前端仓库。
- 目录名 `apps/admin`：后台管理系统，供员工操作商品、订单、退货、统计等。
- 目录名 `apps/weapp`：前台系统，微信小程序，供顾客浏览商品、下单支付、评价商品等。
- 当前阶段已完成后台登录、用户管理和角色基础管理；前台微信小程序尚未开始开发。

## 接口约定

- 后端统一响应结构为 `code`、`msg`、`data`。
- `code === 200` 表示成功；其他响应码表示失败。
- `apps/admin` 需要认证的请求携带 JWT，具体请求头与后端 `JwtFilter` 保持一致。
- `apps/weapp` 后端未开发前台系统，暂不确定如何请求。
- 后端 ID 会被 JSON 转换为字符串，前端不要转成 `Number`，避免超长 ID 精度丢失。

## 当前接口范围

### 认证

- `POST /admin/auth/login`
- `POST /admin/auth/logout`

### 用户管理

- `GET /admin/sys/user/page`
- `GET /admin/sys/user/{id}`
- `POST /admin/sys/user/add`
- `PUT /admin/sys/user/update`
- `POST /admin/sys/user/batch/delete`
- `POST /admin/sys/user/change/status`

### 角色与菜单

- `GET /admin/sys/role/page`
- `GET /admin/sys/role/{id}`
- `POST /admin/sys/role/add`
- `GET /admin/sys/menu/tree`

角色新增支持 `menuIds`；角色详情返回 `menuIds`。前端可用菜单树展示和选择角色权限。

菜单管理、角色编辑、角色删除、角色启用/禁用接口尚未开放。

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

## 页面进度

- 登录页：支持账号密码登录，登录失效时展示后端 `msg` 后跳转回登录页。
- 仪表盘：显示登录状态、令牌剩余时间、用户规模和接口接入状态。
- 用户管理：支持分页、ID 精确查询、多条件查询、添加、编辑、启用/禁用、单个删除和批量删除。
- 角色管理：支持分页、条件查询、详情、添加角色和菜单权限选择。
- 动态菜单：预留入口，等待后端动态菜单接口。

## 交互约定

- 列表页优先提供筛选、分页、详情抽屉和明确的危险操作确认。
- 添加、编辑、详情等上下文信息使用右侧抽屉展示。
- 删除、禁用等危险操作必须二次确认。
- 后端返回的业务错误信息要直接展示给用户。
- 长文本、用户 ID、角色 ID 和菜单 ID 在表格中要避免布局挤压。

## 兼容性说明

- `apps/admin` 默认面向现代浏览器，不支持 IE11。
- `apps/weapp` 面向微信小程序，兼容性以项目约定的微信基础库版本为准。
