/**
 * 调试视频状态 - 查看完整的 API 响应
 */
import { getSeedanceTaskStatus } from './dist/seedance.js';

const taskId = 'cgt-20260303181239-stmtk';

console.log('🔍 调试任务状态');
console.log(`Task ID: ${taskId}\n`);

try {
    const result = await getSeedanceTaskStatus(taskId);
    console.log('完整响应:');
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    console.error('错误:', error.message);
    console.error('完整错误:', error);
}
