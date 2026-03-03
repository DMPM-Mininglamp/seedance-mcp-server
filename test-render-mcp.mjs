/**
 * 测试 Render MCP 服务器完整功能
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function testRenderMCP() {
    console.log('🌐 测试 Render MCP 服务器...\n');

    const baseUrl = 'https://seedance-mcp-server-1kh1.onrender.com';

    const client = new Client({
        name: 'render-test-client',
        version: '1.0.0',
    }, {
        capabilities: {}
    });

    const transport = new SSEClientTransport(new URL(`${baseUrl}/sse`));

    try {
        console.log(`📡 连接到 ${baseUrl}/sse ...`);
        await client.connect(transport);
        console.log('✅ SSE 连接成功！\n');

        // List tools
        console.log('🔧 查询可用工具...');
        const toolsResult = await client.listTools();
        console.log(`✅ 找到 ${toolsResult.tools.length} 个工具:`);
        toolsResult.tools.forEach(tool => {
            console.log(`   - ${tool.name}: ${tool.description.substring(0, 50)}...`);
        });
        console.log('');

        // Submit task
        console.log('📹 提交视频生成任务（测试模式）...');
        const submitResult = await client.callTool({
            name: 'submit_video_task',
            arguments: {
                prompt: '测试：一只可爱的小猫在阳光下玩耍',
                generate_audio: false,
                draft: true  // 使用 draft 模式测试
            }
        });

        console.log('✅ 任务提交成功！');
        console.log('返回内容:');
        console.log(submitResult.content[0].text);
        console.log('');

        // Extract task ID
        const taskIdMatch = submitResult.content[0].text.match(/Task ID: ([\w-]+)/);
        if (taskIdMatch) {
            const taskId = taskIdMatch[1];
            console.log(`📋 任务 ID: ${taskId}`);
            console.log('⏳ 等待 10 秒后查询状态...\n');

            await new Promise(resolve => setTimeout(resolve, 10000));

            console.log('🔍 查询任务状态...');
            const statusResult = await client.callTool({
                name: 'check_video_status',
                arguments: {
                    task_id: taskId
                }
            });

            console.log('返回内容:');
            console.log(statusResult.content[0].text);
        }

        await client.close();
        console.log('\n🎉 Render MCP 服务器测试完成！');
        console.log('\n📝 结论: MCP 服务器工作正常，可以在 DeepMiner Builder 中使用。');
        console.log('🔗 配置 URL: https://seedance-mcp-server-1kh1.onrender.com/sse');

    } catch (error) {
        console.error('❌ 错误:', error.message);
        if (error.event) {
            console.error('事件详情:', error.event);
        }
        console.error('\n完整错误:', error);
    }
}

testRenderMCP();
