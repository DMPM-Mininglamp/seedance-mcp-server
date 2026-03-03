/**
 * 测试 Railway MCP 服务器（增加超时时间）
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import EventSource from 'eventsource';

// 全局设置 EventSource 超时为 60 秒
global.EventSource = class ExtendedEventSource extends EventSource {
    constructor(url, eventSourceInitDict) {
        super(url, {
            ...eventSourceInitDict,
            timeout: 60000 // 60秒超时
        });
    }
};

async function testRailwayMCP() {
    console.log('🚂 测试 Railway MCP 服务器（60秒超时）...\n');

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
        console.log('\n🎉 Railway MCP 服务器工作正常！');

    } catch (error) {
        console.error('❌ 错误:', error.message);
        if (error.event) {
            console.error('事件详情:', error.event.message);
        }
    }
}

testRailwayMCP();
