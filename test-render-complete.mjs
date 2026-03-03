/**
 * 完整测试 Render 服务器的视频生成功能
 * 包含详细日志和错误追踪
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function testRenderVideoGeneration() {
    console.log('=' .repeat(80));
    console.log('🧪 完整测试 Render MCP 服务器 - 视频生成功能');
    console.log('=' .repeat(80));
    console.log('');

    const baseUrl = 'https://seedance-mcp-server-1kh1.onrender.com';

    const client = new Client({
        name: 'render-complete-test',
        version: '1.0.0',
    }, {
        capabilities: {}
    });

    const transport = new SSEClientTransport(new URL(`${baseUrl}/sse`));

    try {
        // Step 1: Connect
        console.log('📡 [步骤 1/4] 连接到 Render MCP 服务器...');
        console.log(`   URL: ${baseUrl}/sse`);
        await client.connect(transport);
        console.log('   ✅ SSE 连接成功\n');

        // Step 2: List tools
        console.log('🔧 [步骤 2/4] 列出可用工具...');
        const toolsResult = await client.listTools();
        console.log(`   ✅ 找到 ${toolsResult.tools.length} 个工具`);
        toolsResult.tools.forEach(tool => {
            console.log(`      - ${tool.name}`);
        });
        console.log('');

        // Step 3: Submit a REAL video task (not draft mode)
        console.log('🎬 [步骤 3/4] 提交真实视频生成任务...');
        console.log('   Prompt: "一只可爱的小猫在阳光明媚的花园里玩耍"');
        console.log('   模式: 正式生成（非 draft）');
        console.log('   音频: 开启');
        console.log('');

        const submitResult = await client.callTool({
            name: 'submit_video_task',
            arguments: {
                prompt: '一只可爱的小猫在阳光明媚的花园里玩耍，画面温馨明亮，充满生机',
                generate_audio: true,
                draft: false  // 正式生成
            }
        });

        console.log('   📋 MCP 工具返回:');
        console.log('   ' + '-'.repeat(76));
        const responseText = submitResult.content[0].text;
        responseText.split('\n').forEach(line => {
            console.log('   ' + line);
        });
        console.log('   ' + '-'.repeat(76));
        console.log('');

        // Extract task ID
        const taskIdMatch = responseText.match(/Task ID: ([\w-]+)/);
        if (!taskIdMatch) {
            console.error('   ❌ 无法从响应中提取 Task ID');
            console.error('   完整响应:', submitResult);
            return;
        }

        const taskId = taskIdMatch[1];
        console.log(`   ✅ 任务已提交`);
        console.log(`   📋 Task ID: ${taskId}`);
        console.log('');

        // Step 4: Query status multiple times
        console.log('🔍 [步骤 4/4] 查询任务状态...');
        console.log('');

        for (let i = 1; i <= 3; i++) {
            console.log(`   查询 #${i} (${new Date().toLocaleTimeString()}):`);

            const statusResult = await client.callTool({
                name: 'check_video_status',
                arguments: {
                    task_id: taskId
                }
            });

            const statusText = statusResult.content[0].text;
            statusText.split('\n').forEach(line => {
                console.log('      ' + line);
            });

            // Check if completed or failed
            if (statusText.includes('✅ 视频生成完成')) {
                console.log('');
                console.log('   🎉 视频生成成功！');
                break;
            } else if (statusText.includes('❌ 任务失败')) {
                console.log('');
                console.log('   ⚠️  任务失败');
                break;
            }

            // Wait before next query
            if (i < 3) {
                console.log('      ⏳ 等待 15 秒后再次查询...');
                console.log('');
                await new Promise(resolve => setTimeout(resolve, 15000));
            }
        }

        await client.close();

        console.log('');
        console.log('=' .repeat(80));
        console.log('📊 测试完成总结');
        console.log('=' .repeat(80));
        console.log('✅ MCP 连接: 正常');
        console.log('✅ 工具列表: 正常');
        console.log('✅ 任务提交: 成功');
        console.log(`📋 任务 ID: ${taskId}`);
        console.log('');
        console.log('⚠️  重要提示:');
        console.log('   请前往火山方舟控制台检查 API 调用记录:');
        console.log('   https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey');
        console.log('');
        console.log('   如果控制台显示"调用次数: 0"，说明:');
        console.log('   1. Render 服务器的 ARK_API_KEY 环境变量未正确设置');
        console.log('   2. 或者 Render 服务器无法访问火山方舟 API');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('❌ 测试失败');
        console.error('=' .repeat(80));
        console.error('错误类型:', error.constructor.name);
        console.error('错误消息:', error.message);
        if (error.stack) {
            console.error('');
            console.error('堆栈追踪:');
            console.error(error.stack);
        }
        console.error('=' .repeat(80));
    }
}

testRenderVideoGeneration();
