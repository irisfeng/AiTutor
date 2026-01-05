/**
 * 测试辅助脚本
 *
 * 使用方法：
 * 1. 在浏览器控制台（F12 → Console）中运行
 * 2. 复制粘贴整个脚本
 * 3. 调用测试函数
 */

// ==================== 测试辅助函数 ====================

/**
 * 测试1: 检查LocalStorage数据
 */
function checkLocalStorage() {
  console.log('🔍 检查 LocalStorage 数据...\n');

  const analytics = localStorage.getItem('aitutor_model_analytics');

  if (!analytics) {
    console.log('❌ 未找到分析数据');
    console.log('💡 提示：请先进行几轮对话');
    return;
  }

  const data = JSON.parse(analytics);
  console.log('✅ 找到分析数据');
  console.log('📊 记录数量:', data.length);
  console.log('\n最近5条记录:');
  data.slice(-5).forEach((record, index) => {
    console.log(`\n${index + 1}. 时间: ${new Date(record.timestamp).toLocaleString()}`);
    console.log(`   模型: ${record.modelUsed}`);
    console.log(`   分数: ${record.complexityScore}`);
    console.log(`   响应: ${record.responseTime}ms`);
    console.log(`   原因: ${record.reason}`);
  });

  return data;
}

/**
 * 测试2: 统计模型使用比例
 */
function analyzeModelUsage() {
  console.log('📊 分析模型使用情况...\n');

  const analytics = localStorage.getItem('aitutor_model_analytics');

  if (!analytics) {
    console.log('❌ 未找到数据，请先进行对话');
    return;
  }

  const data = JSON.parse(analytics);

  const step2Count = data.filter((r) => r.modelUsed === 'step-audio-2').length;
  const miniCount = data.filter((r) => r.modelUsed === 'step-audio-2-mini').length;
  const total = data.length;

  console.log('总对话数:', total);
  console.log('step-audio-2 使用次数:', step2Count, `(${((step2Count / total) * 100).toFixed(1)}%)`);
  console.log('step-audio-2-mini 使用次数:', miniCount, `(${((miniCount / total) * 100).toFixed(1)}%)`);

  const avgResponseTimeStep2 = data
    .filter((r) => r.modelUsed === 'step-audio-2')
    .reduce((sum, r) => sum + r.responseTime, 0) / (step2Count || 1);
  const avgResponseTimeMini = data
    .filter((r) => r.modelUsed === 'step-audio-2-mini')
    .reduce((sum, r) => sum + r.responseTime, 0) / (miniCount || 1);

  console.log('\n平均响应时间:');
  console.log('  step-audio-2:', Math.round(avgResponseTimeStep2), 'ms');
  console.log('  step-audio-2-mini:', Math.round(avgResponseTimeMini), 'ms');

  // 成本节省计算
  const costAllStep2 = total * 0.03;
  const costActual = step2Count * 0.03 + miniCount * 0.02;
  const savings = ((costAllStep2 - costActual) / costAllStep2) * 100;

  console.log('\n💰 成本分析:');
  console.log('  全部使用step-audio-2成本:', costAllStep2.toFixed(2), '元');
  console.log('  实际成本:', costActual.toFixed(2), '元');
  console.log('  节省:', savings.toFixed(1), '%');
}

/**
 * 测试3: 清空测试数据
 */
function clearTestData() {
  if (confirm('确定要清空所有测试数据吗？')) {
    localStorage.removeItem('aitutor_model_analytics');
    console.log('✅ 测试数据已清空');
  }
}

/**
 * 测试4: 导出测试报告
 */
function exportTestReport() {
  const analytics = localStorage.getItem('aitutor_model_analytics');

  if (!analytics) {
    console.log('❌ 未找到数据');
    return;
  }

  const data = JSON.parse(analytics);
  const report = {
    testDate: new Date().toISOString(),
    totalConversations: data.length,
    stepAudio2Usage: data.filter((r) => r.modelUsed === 'step-audio-2').length,
    stepAudio2MiniUsage: data.filter((r) => r.modelUsed === 'step-audio-2-mini').length,
    records: data,
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aitutor-test-report-${Date.now()}.json`;
  a.click();

  console.log('✅ 测试报告已导出');
}

/**
 * 测试5: 模拟复杂度评分（测试算法）
 */
function testComplexityScore(query) {
  console.log(`🧮 测试问题: "${query}"\n`);

  let score = 0;

  // 问题长度
  const lengthScore = Math.min(query.length * 1, 20);
  score += lengthScore;
  console.log(`问题长度: ${query.length} 字 → +${lengthScore} 分`);

  // 关键词检测
  const keywords = {
    如果: 30,
    假设: 30,
    为什么: 20,
    如何: 20,
    怎样: 20,
    比较: 25,
    分析: 25,
    推理: 30,
  };

  let keywordScore = 0;
  for (const [keyword, points] of Object.entries(keywords)) {
    if (query.includes(keyword)) {
      keywordScore += points;
      console.log(`包含关键词 "${keyword}" → +${points} 分`);
    }
  }
  score += keywordScore;

  // 搜索/工具需求
  if (query.includes('搜索') || query.includes('查')) {
    score += 30;
    console.log(`需要搜索 → +30 分`);
  }

  if (query.includes('生成图片') || query.includes('看图')) {
    score += 40;
    console.log(`需要工具调用 → +40 分`);
  }

  console.log(`\n总分: ${score} 分`);
  console.log(`推荐模型: ${score >= 50 ? 'step-audio-2' : 'step-audio-2-mini'}`);

  return score;
}

/**
 * 测试6: 快速测试套件
 */
function runQuickTestSuite() {
  console.log('🚀 开始快速测试套件...\n');

  const testQueries = [
    { query: '你好', expected: 'step-audio-2-mini', minScore: 0 },
    { query: '秦始皇是谁', expected: 'step-audio-2-mini', minScore: 10 },
    { query: '为什么秦朝会灭亡', expected: 'step-audio-2-mini', minScore: 30 },
    { query: '如果项羽不乌江自刎会怎样', expected: 'step-audio-2', minScore: 50 },
    { query: '帮我搜索最新的兵马俑发现', expected: 'step-audio-2', minScore: 60 },
  ];

  let passed = 0;
  let failed = 0;

  testQueries.forEach((test, index) => {
    console.log(`\n测试 ${index + 1}: "${test.query}"`);
    const score = testComplexityScore(test.query);
    const predicted = score >= 50 ? 'step-audio-2' : 'step-audio-2-mini';

    if (predicted === test.expected && score >= test.minScore) {
      console.log(`✅ 通过 (预测: ${predicted}, 分数: ${score})`);
      passed++;
    } else {
      console.log(`❌ 失败 (预测: ${predicted}, 期望: ${test.expected}, 分数: ${score})`);
      failed++;
    }
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
  console.log(`通过率: ${((passed / testQueries.length) * 100).toFixed(1)}%`);
  console.log(`${'='.repeat(50)}`);

  return { passed, failed, total: testQueries.length };
}

/**
 * 测试7: 显示当前客户端状态
 */
function showClientStatus() {
  console.log('📡 客户端状态检查...\n');

  // 检查WebSocket连接
  const wsConnected = performance.getEntriesByType('resource').some(
    (entry) => entry.name.includes('ws-proxy')
  );
  console.log('WebSocket连接:', wsConnected ? '✅ 已连接' : '❌ 未连接');

  // 检查API Key
  const apiKey = localStorage.getItem('aitutor_api_key');
  console.log('API Key:', apiKey ? '✅ 已配置' : '❌ 未配置');

  // 检查分析数据
  const analytics = localStorage.getItem('aitutor_model_analytics');
  console.log('分析数据:', analytics ? `✅ 有数据 (${JSON.parse(analytics).length}条)` : '⚠️  无数据');

  // 检查网络延迟（通过Performance API）
  const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navTiming) {
    const latency = navTiming.responseEnd - navTiming.requestStart;
    console.log('页面加载延迟:', `${latency}ms`);
  }
}

// ==================== 使用说明 ====================

console.log(`
╔══════════════════════════════════════════════════════════╗
║          AiTutor 测试辅助脚本 v1.0                       ║
╚══════════════════════════════════════════════════════════╝

📚 可用函数：

  checkLocalStorage()
    → 查看LocalStorage中的对话记录

  analyzeModelUsage()
    → 分析模型使用情况和成本

  clearTestData()
    → 清空所有测试数据

  exportTestReport()
    → 导出测试报告（JSON文件）

  testComplexityScore("你的问题")
    → 测试某个问题的复杂度评分

  runQuickTestSuite()
    → 运行快速测试套件（5个测试用例）

  showClientStatus()
    → 显示当前客户端状态

💡 使用示例：

  checkLocalStorage()
  testComplexityScore("如果项羽不乌江自刎会怎样")
  runQuickTestSuite()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
