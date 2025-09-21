## 简单订阅合并器 simple-xray-sublink-worker（开发者体验demo）

基于xray结构的订阅合并，由 deno 驱动，可部署到 deno deploy

### demo
https://simple-sublink.deno.dev/

### 注意

强烈建议自行部署

### 支持
- xray格式的订阅/xboard的通用订阅
- ShadowSocks
- VMess
- VLESS
- Hysteria2
- Trojan
- TUIC

### 如何使用
每行一个，点击生成
将生成的订阅粘贴到 v2rayN nekobox 即可使用

### 致谢
inspired by https://github.com/7Sageer/sublink-worker?tab=readme-ov-file

### 原理

使用deno请求订阅，请求订阅使用 `userAgent: "v2rayN/7.14.9"`
