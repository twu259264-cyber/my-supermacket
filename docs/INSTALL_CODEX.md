# Codex 安装与验证（Windows）

## 目前真正已完成的步骤
已将 `.agents/skills/` 提交到此 GitHub 仓库。它们是 **项目级技能文件**，不会因为 GitHub 文件存在就自动装到普通 ChatGPT 手机会话。要让 Codex 使用，先在电脑上克隆并打开本仓库。

```powershell
git clone https://github.com/twu259264-cyber/my-supermacket.git
cd my-supermacket
```

在 Codex 桌面应用或 Codex CLI 打开本地 `my-supermacket` 目录，并询问：
`列出本项目的 .agents/skills；然后使用 frontend-design 和 framer-motion-scroll 构建启星程校服首页`。
如果 Codex 未识别，重启会话，核对项目工作目录和 Codex 版本。

## 可选：全局安装到 Windows Codex（需要你本机运行）
需要 Node.js/npm，安装前检查源码以及依赖版本、权限。请逐条执行，每一步先确认结果：

```powershell
npx skills add anthropics/skills --skill frontend-design -a codex -g
npx skills add C-Jeril/framer-motion-skills -a codex -g
npx skills add vercel-labs/agent-skills --skill web-design-guidelines -a codex -g
```

官方完整 UI UX Pro Max 使用：
```powershell
npm install -g ui-ux-pro-max-cli
uipro init --ai codex
```

官方完整版本可能使用 Python 3.x。先运行 `uipro init --dry-run` 预览修改，再安装。官方项目 README 提供全局和卸载选项。

验证已安装的原版/全局技能：
```powershell
npx skills ls -g
```

不要直接使用未经审计的 `curl | bash` 安装命令。

## ChatGPT 手机端
这些是 Codex Skills，不是普通 ChatGPT 聊天可自动加载的插件；手机可使用 ChatGPT 原生网页制作工具、讨论品牌设计，也可以上传 SKILL.md 作为参考。需要实际开发、部署时以能读取文件并运行代码的 Codex 环境为准。
