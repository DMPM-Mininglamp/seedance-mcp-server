/**
 * Complete test for Seedance video generation via MCP
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function testVideoGeneration() {
    console.log('🎬 测试 Seedance 视频生成...\n');

    const baseUrl = 'http://localhost:3002';

    // Create MCP client
    const client = new Client({
        name: 'seedance-test-client',
        version: '1.0.0',
    }, {
        capabilities: {}
    });

    // Create SSE transport
    const transport = new SSEClientTransport(new URL(`${baseUrl}/sse`));

    try {
        // Connect to the MCP server
        console.log('📡 连接到 MCP 服务器...');
        await client.connect(transport);
        console.log('✅ 已连接\n');

        // List available tools
        console.log('🔧 查询可用工具...');
        const toolsResult = await client.listTools();
        console.log(`✅ 找到 ${toolsResult.tools.length} 个工具:`);
        toolsResult.tools.forEach(tool => {
            console.log(`   - ${tool.name}: ${tool.description.substring(0, 50)}...`);
        });
        console.log('');

        // Test 1: Submit a simple video generation task
        console.log('📹 测试 1: 提交视频生成任务...');
        const submitResult = await client.callTool({
            name: 'submit_video_task',
            arguments: {
                prompt: '一只可爱的小猫在阳光下玩耍，画面温馨明亮',
                generate_audio: true,
                draft: false
            }
        });

        console.log('✅ 任务提交响应:');
        console.log(submitResult.content[0].text);
        console.log('');

        // Extract task ID from the response
        const taskIdMatch = submitResult.content[0].text.match(/Task ID: ([\w-]+)/);
        if (!taskIdMatch) {
            throw new Error('无法从响应中提取 task_id');
        }
        const taskId = taskIdMatch[1];
        console.log(`📋 提取到 Task ID: ${taskId}\n`);

        // Test 2: Check task status
        console.log('🔍 测试 2: 查询任务状态...');
        const statusResult = await client.callTool({
            name: 'check_video_status',
            arguments: {
                task_id: taskId
            }
        });

        console.log('✅ 任务状态:');
        console.log(statusResult.content[0].text);
        console.log('');

        // Close connection
        await client.close();
        console.log('✅ 测试完成！');

        console.log('\n📝 说明:');
        console.log('   - 视频生成需要 1-3 分钟');
        console.log('   - 可以定期调用 check_video_status 查询任务进度');
        console.log('   - 任务成功后会返回视频下载链接');

        return { success: true, taskId };

    } catch (error) {
        console.error('❌ 测试失败:', error.message);

        // Check if it's an API error
        if (error.message.includes('ModelNotOpen')) {
            console.error('\n⚠️  模型未开通错误！');
            console.error('请检查:');
            console.error('1. ARK_API_KEY 是否正确配置');
            console.error('2. 账号是否已在火山方舟控制台开通 Seedance 模型');
            console.error('3. 访问: https://console.volcengine.com/ark/region:ark+cn-beijing/model');
        }

        return { success: false, error: error.message };
    }
}

testVideoGeneration().catch(console.error);
