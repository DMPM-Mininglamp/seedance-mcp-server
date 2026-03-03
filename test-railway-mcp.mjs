/**
 * 测试 Railway 部署的 MCP 服务器
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function testRailwayMCP() {
    console.log('🚂 测试 Railway MCP 服务器...\n');

    const baseUrl = 'https://seedance-mcp-server-production.up.railway.app';

    const client = new Client({
        name: 'railway-test-client',
        version: '1.0.0',
    }, {
        capabilities: {}
    });

    const transport = new SSEClientTransport(new URL(`${baseUrl}/sse`));

    try {
        console.log(`📡 连接到 ${baseUrl}/sse ...`);
        await client.connect(transport);
        console.log('✅ 连接成功！\n');

        // List tools
        console.log('🔧 查询可用工具...');
        const toolsResult = await client.listTools();
        console.log(`✅ 找到 ${toolsResult.tools.length} 个工具:`);
        toolsResult.tools.forEach(tool => {
            console.log(`   - ${tool.name}`);
        });
        console.log('');

        // Submit task
        console.log('📹 提交视频生成任务...');
        const submitResult = await client.callTool({
            name: 'submit_video_task',
            arguments: {
                prompt: '一只可爱的小猫在阳光下玩耍',
                generate_audio: true
            }
        });

        console.log('✅ 任务提交成功！');
        console.log(submitResult.content[0].text);

        await client.close();
        console.log('\n✅ Railway MCP 服务器工作正常！');

    } catch (error) {
        console.error('❌ 错误:', error.message);
        console.error('\n详细错误:');
        console.error(error);
    }
}

testRailwayMCP();
