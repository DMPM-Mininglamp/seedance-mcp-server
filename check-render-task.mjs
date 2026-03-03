/**
 * 持续查询 Render 任务直到完成
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const taskId = 'cgt-20260303182841-xdzd8';
const baseUrl = 'https://seedance-mcp-server-1kh1.onrender.com';

async function checkTaskUntilComplete() {
    console.log(`🔍 持续查询任务: ${taskId}\n`);

    const client = new Client({
        name: 'task-monitor',
        version: '1.0.0',
    }, {
        capabilities: {}
    });

    const transport = new SSEClientTransport(new URL(`${baseUrl}/sse`));

    try {
        await client.connect(transport);
        console.log('✅ 已连接到 Render MCP 服务器\n');

        let attempts = 0;
        const maxAttempts = 20; // 最多查询 20 次（约 5 分钟）

        while (attempts < maxAttempts) {
            attempts++;
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] 查询 #${attempts}:`);

            const statusResult = await client.callTool({
                name: 'check_video_status',
                arguments: {
                    task_id: taskId
                }
            });

            const statusText = statusResult.content[0].text;
            console.log(statusText);
            console.log('');

            // Check if completed
            if (statusText.includes('✅ 视频生成完成')) {
                console.log('🎉 视频生成成功！');

                // Extract video URL
                const urlMatch = statusText.match(/视频下载链接: (https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    console.log('');
                    console.log('=' .repeat(80));
                    console.log('📹 视频下载链接:');
                    console.log(urlMatch[1]);
                    console.log('=' .repeat(80));
                }
                break;
            } else if (statusText.includes('❌ 任务失败')) {
                console.log('⚠️  任务失败');
                break;
            }

            // Wait 15 seconds before next check
            if (attempts < maxAttempts) {
                console.log(`⏳ 等待 15 秒后继续查询...`);
                console.log('');
                await new Promise(resolve => setTimeout(resolve, 15000));
            }
        }

        if (attempts >= maxAttempts) {
            console.log('⏱️  已达到最大查询次数，任务可能仍在生成中');
        }

        await client.close();

    } catch (error) {
        console.error('❌ 错误:', error.message);
        console.error(error);
    }
}

checkTaskUntilComplete();
