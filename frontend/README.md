# LanShare 前端开发说明

## TailwindCSS 语法说明

本项目使用 TailwindCSS 作为CSS框架。如果您在IDE中看到关于 `@tailwind` 和 `@apply` 的错误提示，这是正常的，不会影响构建和运行。

### 解决IDE警告的方法

#### VS Code 用户
1. 安装推荐的扩展：
   - Tailwind CSS IntelliSense
   - Prettier
   - ESLint

2. 项目已经配置了 `.vscode/settings.json` 来支持TailwindCSS语法

#### 其他IDE用户
- WebStorm/IntelliJ: 安装 "Tailwind CSS" 插件
- Sublime Text: 安装 "Tailwind CSS Autocomplete" 包

### TailwindCSS 指令说明

- `@tailwind base` - 导入基础样式
- `@tailwind components` - 导入组件样式  
- `@tailwind utilities` - 导入工具类样式
- `@apply` - 在自定义CSS中应用TailwindCSS类

### 开发脚本

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 项目结构

```
src/
├── components/     # React组件
├── contexts/       # React上下文
├── utils/          # 工具函数
├── styles/         # 样式文件
└── main.jsx       # 入口文件
```

## 注意事项

1. CSS警告不会影响实际构建和运行
2. 建议安装TailwindCSS相关的IDE插件以获得更好的开发体验
3. 项目已配置Prettier和ESLint来保证代码质量