#!/usr/bin/env node

import { OpenAI } from 'openai';
import https from 'https';
import dns from 'dns';
import { promisify } from 'util';

// 彩色输出函数
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return colors[color] + text + colors.reset;
}

// 从命令行获取API密钥，或者使用环境变量
const apiKey = process.argv[2] || process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.log(colorize('错误: 请提供OpenAI API密钥作为命令行参数或设置OPENAI_API_KEY环境变量', 'red'));
  console.log('使用方法: node openai-test.js YOUR_API_KEY');
  process.exit(1);
}

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: apiKey,
  timeout: 30000, // 30秒超时
  maxRetries: 0,  // 不自动重试，便于观察问题
});

// 将DNS lookup转换为Promise
const dnsLookup = promisify(dns.lookup);

// 主测试函数
async function runTests() {
  try {
    // 测试DNS解析
    console.log(colorize('1. 测试DNS解析 api.openai.com...', 'cyan'));
    let dnsResult;
    
    try {
      dnsResult = await dnsLookup('api.openai.com');
      console.log(colorize(`  ✅ DNS解析成功: ${dnsResult.address} (IPv${dnsResult.family})`, 'green'));
    } catch (err) {
      console.log(colorize(`  ❌ DNS解析失败: ${err.message}`, 'red'));
    }
    
    // 测试网络连接
    console.log(colorize('\n2. 测试与OpenAI API的TCP连接...', 'cyan'));
    
    try {
      const connectionResult = await testConnection('api.openai.com', 443, 10000);
      console.log(colorize(`  ✅ 连接成功! 响应状态码: ${connectionResult.statusCode}`, 'green'));
      console.log(colorize(`  ✅ 连接延迟: ${connectionResult.duration}ms`, 'green'));
    } catch (err) {
      if (err.timeout) {
        console.log(colorize('  ❌ 连接超时 (>10秒)', 'red'));
        console.log(colorize('  🔍 提示: 网络延迟过高或连接被阻止', 'yellow'));
      } else {
        console.log(colorize(`  ❌ 连接失败: ${err.message}`, 'red'));
        console.log(colorize('  🔍 提示: 可能需要配置代理或检查网络防火墙设置', 'yellow'));
      }
    }
    
    // 测试API身份验证
    console.log(colorize('\n3. 测试OpenAI API身份验证...', 'cyan'));
    
    try {
      const models = await openai.models.list();
      console.log(colorize('  ✅ API身份验证成功!', 'green'));
      console.log(colorize(`  ✅ 获取到 ${models.data.length} 个模型`, 'green'));
    } catch (error) {
      console.log(colorize(`  ❌ API身份验证失败: ${error.message}`, 'red'));
      if (error.response) {
        console.log(colorize(`  状态码: ${error.response.status}`, 'red'));
        console.log(colorize(`  响应内容: ${JSON.stringify(error.response.data)}`, 'red'));
      }
      console.log(colorize('  🔍 提示: 检查API密钥是否正确或是否已过期', 'yellow'));
    }
    
    // 测试简单的API调用
    console.log(colorize('\n4. 测试简单的API调用...', 'cyan'));
    console.log(colorize('   发送简单的文本生成请求...', 'cyan'));
    
    const startTime = Date.now();
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello world' }],
        max_tokens: 10
      });
      
      const duration = Date.now() - startTime;
      console.log(colorize('  ✅ API调用成功!', 'green'));
      console.log(colorize(`  ✅ 响应时间: ${duration}ms`, 'green'));
      console.log(colorize(`  ✅ 生成内容: "${response.choices[0].message.content}"`, 'green'));
      console.log(colorize('\n总结: 所有测试都通过了! 您的网络环境可以正常访问OpenAI API。', 'green'));
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(colorize(`  ❌ API调用失败: ${error.message}`, 'red'));
      console.log(colorize(`  ❌ 失败时间: ${duration}ms`, 'red'));
      
      if (error.response) {
        console.log(colorize(`  状态码: ${error.response.status}`, 'red'));
        console.log(colorize(`  响应内容: ${JSON.stringify(error.response.data)}`, 'red'));
      }
      
      // 提供错误分析和建议
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        console.log(colorize('  🔍 分析: 连接超时，可能是网络延迟过高或被防火墙阻止', 'yellow'));
        console.log(colorize('  💡 建议: 尝试设置代理或增加超时时间', 'yellow'));
      } else if (error.code === 'ECONNREFUSED') {
        console.log(colorize('  🔍 分析: 连接被拒绝，服务器可能拒绝来自您IP的连接', 'yellow'));
        console.log(colorize('  💡 建议: 检查是否需要配置代理或VPN', 'yellow'));
      } else if (error.response && error.response.status === 401) {
        console.log(colorize('  🔍 分析: 身份验证失败，API密钥可能无效', 'yellow'));
        console.log(colorize('  💡 建议: 重新生成API密钥并更新', 'yellow'));
      } else if (error.response && error.response.status === 429) {
        console.log(colorize('  🔍 分析: 达到速率限制或超出配额', 'yellow'));
        console.log(colorize('  💡 建议: 检查API使用情况或增加账户额度', 'yellow'));
      } else {
        console.log(colorize('  🔍 分析: 未知错误，可能需要进一步调查', 'yellow'));
        console.log(colorize('  💡 建议: 检查服务器日志或联系OpenAI支持', 'yellow'));
      }
      
      console.log(colorize('\n总结: API测试失败。请参考上述建议解决问题。', 'red'));
    }
    
  } catch (err) {
    console.log(colorize(`测试过程中发生错误: ${err.message}`, 'red'));
  }
}

// 测试TCP连接
function testConnection(hostname, port, timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.request({
      hostname,
      port,
      path: '/',
      method: 'HEAD',
      timeout
    }, (res) => {
      const duration = Date.now() - startTime;
      resolve({ 
        statusCode: res.statusCode,
        duration
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      const error = new Error('Connection timeout');
      error.timeout = true;
      reject(error);
    });
    
    req.end();
  });
}

// 运行所有测试
runTests().catch(err => {
  console.error('测试执行失败:', err);
});