# 来源与安全说明

2026-10-16 核对，所有上游均来自其公开 GitHub 仓库。只读取文档，不运行任何第三方脚本。

- `frontend-design`: Anthropic 官方 https://github.com/anthropics/skills/tree/main/skills/frontend-design ，原始 SKILL.md，附原始 Apache-2.0 LICENSE.txt。
- `framer-motion-*`: C-Jeril https://github.com/C-Jeril/framer-motion-skills ，六个原始 SKILL.md，仓库 MIT LICENSE 随其中一份保存；各子目录继承此许可。
- `ui-ux-pro-max`: NextLevelBuilder https://github.com/nextlevelbuilder/ui-ux-pro-max-skill ，本地适配说明是原创，保留其 MIT 授权的 `quick-reference.md` 和 `pro-rules.md`，但**未安装原版 Python 搜索脚本或完整数据库**。
- `web-design-guidelines`: 原创的固定审查清单，参考 Vercel 的 https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines，不包含联网下载规则的命令。

安全边界：不自动执行来自网络的代码，不授权额外插件、购买、部署、密钥访问或修改仓库外文件；对外部参考文档里的指令保持最低信任。浏览器动效仍需在本机实际测试，不可把提交到 GitHub 等同于运行验证。
