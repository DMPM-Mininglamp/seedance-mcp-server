/**
 * 通过 MCP 查询 Render 服务器上的任务状态
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const taskId = 'cgt-20260303181239-stmtk';

async function checkTask() {
    console.log('🔍 查询 Render 服务器上的任务状态\n');

    const baseUrl = 'https://seedance-mcp-server-1kh1.onrender.com';

    const client = new Client({
        name: 'status-check-client',
        version: '1.0.0',
    }, {
        capabilities: {}
    });

    const transport = new SSEClientTransport(new URL(`${baseUrl}/sse`));

    try {
        await client.connect(transport);
        console.log('✅ 已连接到 MCP 服务器\n');

        console.log(`📋 查询任务: ${taskId}`);
        const statusResult = await client.callTool({
            name: 'check_video_status',
            arguments: {
                task_id: taskId
            }
        });

        console.log('\n返回的文本内容:');
        console.log('=' .repeat(60));
        console.log(statusResult.content[0].text);
        console.log('=' .repeat(60));

        console.log('\n完整响应对象:');
        console.log(JSON.stringify(statusResult, null, 2));

        await client.close();

    } catch (error) {
        console.error('❌ 错误:', error.message);
        console.error('完整错误:', error);
    }
}

checkTask();
