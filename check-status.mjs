import dotenv from 'dotenv';
dotenv.config();

const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

async function checkTaskStatus(taskId) {
    console.log(`🔍 查询任务状态: ${taskId}\n`);

    try {
        const response = await fetch(`${ARK_BASE_URL}/contents/generations/tasks/${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ARK_API_KEY}`
            }
        });

        const data = await response.json();
        console.log('📋 任务详情:');
        console.log(JSON.stringify(data, null, 2));

        if (data.status === 'succeeded') {
            console.log('\n✅ 视频生成完成！');
            console.log(`视频链接: ${data.output?.video_url}`);
            console.log(`时长: ${data.output?.video_duration} 秒`);
        } else if (data.status === 'queued' || data.status === 'running') {
            console.log(`\n⏳ 任务${data.status === 'queued' ? '排队中' : '生成中'}...`);
        } else if (data.status === 'failed') {
            console.log('\n❌ 任务失败');
            console.log(`错误: ${JSON.stringify(data.error)}`);
        }

    } catch (error) {
        console.error('❌ 错误:', error.message);
    }
}

checkTaskStatus('cgt-20260303173246-vb4vx');
