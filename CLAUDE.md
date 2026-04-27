# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

魔方教学应用 (cubeTeacher) - 交互式3D魔方学习平台，支持3D模拟器、公式动画演示和交互式教程。

**部署目标**: Cloudflare Pages (前端) + Cloudflare Workers (后端，如需)

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **3D Engine**: Three.js + React Three Fiber (@react-three/fiber) + @react-three/drei
- **Styling**: CSS Modules / Tailwind CSS (待定)

## 常用命令

```bash
npm run dev          # 开发服务器 (localhost:5173)
npm run build        # 生产构建
npm run lint         # ESLint 检查
npm run preview      # 预览生产构建
```

## 项目结构

```
src/
├── components/      # React 组件
│   └── cube/        # 魔方3D相关组件
├── hooks/           # 自定义 React Hooks
├── utils/           # 工具函数 (魔方逻辑、公式库)
├── data/            # 静态数据 (教程内容、公式定义)
└── App.tsx          # 应用入口
```

## 魔方核心逻辑

魔方状态和算法逻辑放在 `utils/` 下，包括：
- 魔方状态表示 (state representation)
- 转动操作 (R, L, U, D, F, B 及其反向)
- 公式库 (CFOP 等解法)
- 打乱算法 (scramble generator)

## 部署

### Cloudflare Pages
```bash
npm run build
# 将 dist/ 目录部署到 Cloudflare Pages
```

Cloudflare Pages 支持 React 静态站点，配置 `wrangler.toml` 或通过 Cloudflare Dashboard 上传。
