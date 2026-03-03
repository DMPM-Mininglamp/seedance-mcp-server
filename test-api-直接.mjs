/**
 * 直接测试 Seedance API 调用
 */
import dotenv from 'dotenv';
dotenv.config();

const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
const SEEDANCE_MODEL = "doubao-seedance-1-5-pro-251215";

async function testDirectAPI() {
    console.log('🧪 直接测试 Seedance API...\n');
    console.log(`API Key: ${ARK_API_KEY?.substring(0, 8)}...`);
    console.log(`模型: ${SEEDANCE_MODEL}\n`);

    const requestBody = {
        model: SEEDANCE_MODEL,
        content: [
            { type: "text", text: "一只可爱的小猫在阳光下玩耍" }
        ],
        generate_audio: true,
        draft: false
    };

    console.log('📤 发送请求...');
    console.log(JSON.stringify(requestBody, null, 2));

    try {
        const response = await fetch(`${ARK_BASE_URL}/contents/generations/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ARK_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log(`\n📥 响应状态: ${response.status} ${response.statusText}`);

        const responseText = await response.text();
        console.log('\n响应内容:');
        console.log(responseText);

        if (!response.ok) {
            console.error('\n❌ API 调用失败');
            return;
        }

        const data = JSON.parse(responseText);
        console.log('\n✅ 任务创建成功！');
        console.log(`Task ID: ${data.id}`);
        console.log(`状态: ${data.status}`);

    } catch (error) {
        console.error('\n❌ 错误:', error.message);
    }
}

testDirectAPI();
