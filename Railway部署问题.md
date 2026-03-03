# Railway 部署 SSE 连接问题

## 问题现象

- ✅ Railway 部署成功
- ✅ Health check 正常: `https://seedance-mcp-server-production.up.railway.app/health`
- ❌ SSE 连接无法建立: `https://seedance-mcp-server-production.up.railway.app/sse`

## 原因分析

从响应头可以看到：
```
x-railway-cdn-edge: fastly/cache-mnl9729-MNL
x-cache: MISS
```

Railway 使用了 Fastly CDN 作为边缘缓存，而 **Fastly CDN 默认不支持 SSE 长连接**。

SSE (Server-Sent Events) 需要：
1. 保持长时间的 HTTP 连接
2. 持续推送数据流
3. Content-Type: text/event-stream

但是 CDN 通常会：
- 缓存响应
- 设置连接超时
- 不支持流式传输

## 解决方案

### 方案 1: 使用本地服务器（推荐）

**优点**:
- 立即可用
- 无需额外配置
- 完全控制

**配置**:
```json
{
  "seedance-video": {
    "baseUrl": "http://localhost:3002/sse"
  }
}
```

**限制**: 只能在本地机器使用

### 方案 2: 配置 Railway 禁用 CDN

在 Railway 项目设置中：
1. 进入项目设置 (Settings)
2. 找到 Networking 部分
3. 禁用 CDN / Edge Caching

**注意**: 这可能需要 Railway Pro 账户

### 方案 3: 切换到支持 SSE 的托管平台

推荐平台：
- **Render.com**: 原生支持 SSE
- **Fly.io**: 支持长连接
- **Vercel**: 支持流式响应（需要配置）
- **自建服务器**: VPS (AWS EC2, DigitalOcean, etc.)

### 方案 4: 修改为 HTTP/HTTPS 模式（不推荐）

MCP 也支持标准 HTTP 传输，但需要：
1. 修改服务器代码支持 HTTP 模式
2. 修改客户端配置
3. 性能会降低（需要轮询）

## 当前推荐方案

**使用本地服务器 + Ngrok/Cloudflare Tunnel 公网暴露**

### 使用 Cloudflare Tunnel (免费)

1. 安装 cloudflared:
```bash
brew install cloudflared
```

2. 登录 Cloudflare:
```bash
cloudflared tunnel login
```

3. 创建隧道:
```bash
cloudflared tunnel create seedance-mcp
```

4. 配置隧道:
```yaml
# ~/.cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /Users/ml/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: seedance-mcp.your-domain.com
    service: http://localhost:3002
  - service: http_status:404
```

5. 运行隧道:
```bash
cloudflared tunnel run seedance-mcp
```

**优点**:
- 免费
- 稳定
- 支持 SSE
- 自定义域名

## 快速测试命令

### 测试本地服务器
```bash
curl http://localhost:3002/health
```

### 测试 Railway 部署
```bash
curl https://seedance-mcp-server-production.up.railway.app/health
```

### 测试 SSE 连接（本地）
```bash
curl -H "Accept: text/event-stream" http://localhost:3002/sse
```

## 当前状态

- ✅ **本地服务器**: 正常工作 (localhost:3002)
- ✅ **Railway 部署**: Health check 正常
- ❌ **Railway SSE**: 无法建立连接（CDN 限制）
- ✅ **API 调用**: 正常工作
- ✅ **视频生成**: 功能正常

## 建议

1. **短期**: 使用本地服务器 `http://localhost:3002/sse`
2. **中期**: 设置 Cloudflare Tunnel 暴露本地服务器
3. **长期**: 考虑部署到 Render.com 或 Fly.io
