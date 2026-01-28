
---

## 4. 故障排查手册 (Troubleshooting Guide)

### 4.1 常见问题 (FAQ)

**Q: 为什么我在仪表盘上看不到数据？**
*   **检查时间戳**: 确保您的服务器时间与标准时间同步。StarLight 会丢弃时间戳偏差超过 1 小时的数据。
*   **检查 AppKey**: 确认 AppKey 是否正确，且未被禁用。
*   **检查网络**: 使用 `curl` 或 `telnet` 测试接入节点到 StarLight API 的连通性。

**Q: 收到 "Rate Limit Exceeded" 错误？**
*   StarLight 对每个 AppKey 有默认的速率限制（例如 1000 TPS）。如果您的流量较大，请联系管理员申请提升配额。

**Q: Agent 启动失败？**
*   检查 `config.yaml` 格式是否正确。
*   查看 `agent.log` 日志文件，寻找具体的错误堆栈。
*   确认运行 Agent 的用户具有读取系统指标（如 `/proc` 文件系统）的权限。

### 4.2 诊断工具

您可以使用以下命令快速诊断连接问题：

```bash
# 测试 API 连通性
curl -v https://api.your-starlight-domain.com/health

# 验证 AppKey 有效性
curl -H "x-app-key: YOUR_KEY" https://api.your-starlight-domain.com/api/auth/validate
```
