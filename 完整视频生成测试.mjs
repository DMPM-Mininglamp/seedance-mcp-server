/**
 * 完整的视频生成测试 - 从提交到获取最终视频链接
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function completeVideoGenerationTest() {
    console.log('🎬 开始完整的视频生成测试\n');
    console.log('=' .repeat(60));

    const baseUrl = 'https://seedance-mcp-server-1kh1.onrender.com';

    const client = new Client({
        name: 'full-test-client',
        version: '1.0.0',
    }, {
        capabilities: {}
    });

    const transport = new SSEClientTransport(new URL(`${baseUrl}/sse`));

    try {
        // 步骤 1: 连接到 MCP 服务器
        console.log('\n📡 步骤 1: 连接到 MCP 服务器');
        console.log(`   URL: ${baseUrl}/sse`);
        await client.connect(transport);
        console.log('   ✅ 连接成功！\n');

        // 步骤 2: 提交视频生成任务
        console.log('📹 步骤 2: 提交视频生成任务');
        const prompt = '一只橘色的小猫在温暖的阳光下打哈欠，画面温馨可爱';
        console.log(`   Prompt: ${prompt}`);
        console.log(`   模式: Draft (快速预览)`);
        console.log(`   音频: 关闭\n`);

        const submitResult = await client.callTool({
            name: 'submit_video_task',
            arguments: {
                prompt: prompt,
                generate_audio: false,
                draft: true  // 使用 draft 模式，生成更快
            }
        });

        console.log('   服务器响应:');
        console.log('   ' + submitResult.content[0].text.replace(/\n/g, '\n   '));
        console.log('');

        // 提取任务 ID
        const taskIdMatch = submitResult.content[0].text.match(/Task ID: ([\w-]+)/);
        if (!taskIdMatch) {
            throw new Error('无法提取任务 ID');
        }
        const taskId = taskIdMatch[1];

        // 步骤 3: 轮询任务状态直到完成
        console.log('⏳ 步骤 3: 等待视频生成完成');
        console.log(`   任务 ID: ${taskId}`);
        console.log('   开始轮询状态...\n');

        let attempts = 0;
        const maxAttempts = 40;  // 最多等待 10 分钟
        const pollInterval = 15000;  // 每 15 秒查询一次

        while (attempts < maxAttempts) {
            attempts++;
            console.log(`   [${attempts}/${maxAttempts}] 查询中...`);

            const statusResult = await client.callTool({
                name: 'check_video_status',
                arguments: {
                    task_id: taskId
                }
            });

            const statusText = statusResult.content[0].text;
            console.log('   ' + statusText.replace(/\n/g, '\n   '));

            // 检查是否完成
            if (statusText.includes('✅ 视频生成完成')) {
                console.log('\n🎉 视频生成成功！\n');

                // 提取视频链接
                const videoUrlMatch = statusText.match(/视频下载链接: (https?:\/\/[^\s]+)/);
                if (videoUrlMatch) {
                    const videoUrl = videoUrlMatch[1];
                    console.log('=' .repeat(60));
                    console.log('🎬 最终结果');
                    console.log('=' .repeat(60));
                    console.log(`\n视频下载链接:\n${videoUrl}\n`);
                    console.log('您可以在浏览器中打开此链接观看或下载视频。\n');
                }
                break;
            } else if (statusText.includes('❌ 任务失败')) {
                console.log('\n❌ 视频生成失败\n');
                break;
            } else {
                // 任务还在进行中
                if (attempts < maxAttempts) {
                    console.log(`   等待 ${pollInterval / 1000} 秒后重试...\n`);
                    await sleep(pollInterval);
                }
            }
        }

        if (attempts >= maxAttempts) {
            console.log('\n⚠️ 已达到最大等待时间，任务可能还在生成中');
            console.log(`   您可以稍后使用以下命令手动查询:\n`);
            console.log(`   node check-status.mjs ${taskId}\n`);
        }

        await client.close();
        console.log('=' .repeat(60));
        console.log('测试完成');
        console.log('=' .repeat(60));

    } catch (error) {
        console.error('\n❌ 发生错误:', error.message);
        console.error('完整错误信息:', error);
    }
}

completeVideoGenerationTest();
