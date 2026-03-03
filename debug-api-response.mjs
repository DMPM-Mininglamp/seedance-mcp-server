/**
 * 直接调用火山方舟 API 查看原始响应
 */
import dotenv from 'dotenv';
dotenv.config();

const ARK_API_KEY = process.env.ARK_API_KEY;
const taskId = 'cgt-20260303182841-xdzd8';

async function debugApiResponse() {
    console.log('🔍 直接查询火山方舟 API 原始响应\n');
    console.log(`Task ID: ${taskId}`);
    console.log(`API Key: ${ARK_API_KEY ? ARK_API_KEY.substring(0, 20) + '...' : '未设置'}\n`);

    const url = `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${taskId}`;

    try {
        console.log(`📡 GET ${url}\n`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ARK_API_KEY}`
            }
        });

        console.log(`HTTP Status: ${response.status} ${response.statusText}\n`);

        const data = await response.json();

        console.log('=' .repeat(80));
        console.log('📋 完整 API 响应:');
        console.log('=' .repeat(80));
        console.log(JSON.stringify(data, null, 2));
        console.log('=' .repeat(80));
        console.log('');

        // 分析响应
        console.log('📊 响应分析:');
        console.log(`   状态: ${data.status}`);
        console.log(`   模型: ${data.model}`);
        console.log(`   创建时间: ${new Date(data.created_at * 1000).toLocaleString()}`);
        console.log(`   更新时间: ${new Date(data.updated_at * 1000).toLocaleString()}`);

        if (data.output) {
            console.log(`   Output 对象存在: ✅`);
            console.log(`   Output 内容:`, JSON.stringify(data.output, null, 2));
        } else {
            console.log(`   Output 对象: ❌ 不存在`);
        }

        if (data.content) {
            console.log(`   Content 数组存在: ✅ (${data.content.length} 项)`);
            data.content.forEach((item, idx) => {
                console.log(`   Content[${idx}]:`, JSON.stringify(item, null, 2));
            });
        } else {
            console.log(`   Content 数组: ❌ 不存在`);
        }

        if (data.error) {
            console.log(`   错误: ${data.error.code} - ${data.error.message}`);
        }

        console.log('');

    } catch (error) {
        console.error('❌ 错误:', error.message);
        console.error(error);
    }
}

debugApiResponse();
