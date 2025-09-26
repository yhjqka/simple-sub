## 简单订阅合并器 simple-xray-sublink-worker (powered by cursor，有一大堆bug)

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

### 后续开发计划

0. 订阅短链接增加二维码展示
1. 允许使用短链接提取原始配置
2. 增加浏览器本地缓存
3. 根据名称过滤订阅中非节点的（比如说“剩余流量、添加tg”，支持用户自定义）
4. 检测重复订阅的方式更稳定（使用域名/ip + 端口 + 协议 + 名称来判断是否重复）
5. 优化订阅解析结果展示画面为table样式、支持分组、过滤、单独复制导出一个或一组节点
