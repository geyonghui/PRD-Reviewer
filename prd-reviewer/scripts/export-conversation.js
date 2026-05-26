#!/usr/bin/env node

/**
 * Claude Code 对话记录导出工具
 *
 * 用法：
 *   node scripts/export-conversation.js
 *   node scripts/export-conversation.js <input.jsonl> <output.md>
 *
 * 说明：
 *   从 Claude Code 的对话日志文件中导出可读的 Markdown 格式对话记录。
 *   自动过滤系统消息、命令输出、技能加载信息等，只保留有意义的对话内容。
 */

const fs = require('fs');
const path = require('path');

// 默认路径（Claude Code 项目对话日志位置）
const DEFAULT_OUTPUT = path.join(__dirname, '..', 'conversation-export.md');

function findLatestSession() {
  const projectsDir = path.join(process.env.USERPROFILE || process.env.HOME, '.claude/projects');
  const cwd = process.cwd().replace(/[:/\\]/g, '-').replace(/^-/, '');
  const projectPath = process.env.CLAUDE_PROJECT_PATH || cwd;
  const projectDir = path.join(projectsDir, projectPath);

  if (!fs.existsSync(projectDir)) {
    console.error(`找不到项目目录: ${projectDir}`);
    console.error('请设置环境变量 CLAUDE_PROJECT_PATH 或手动指定输入文件路径');
    process.exit(1);
  }

  const files = fs.readdirSync(projectDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(projectDir, f)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    console.error(`在 ${projectDir} 中没有找到 .jsonl 对话文件`);
    process.exit(1);
  }

  return path.join(projectDir, files[0].name);
}

const DEFAULT_INPUT = findLatestSession();

// 命令行参数
const inputFile = process.argv[2] || DEFAULT_INPUT;
const outputFile = process.argv[3] || DEFAULT_OUTPUT;

if (!fs.existsSync(inputFile)) {
  console.error(`输入文件不存在: ${inputFile}`);
  console.error('用法: node scripts/export-conversation.js [input.jsonl] [output.md]');
  process.exit(1);
}

console.log(`读取: ${inputFile}`);

const lines = fs.readFileSync(inputFile, 'utf-8').split('\n').filter(Boolean);

let output = '# 对话记录\n\n';
output += `> 导出时间：${new Date().toLocaleString('zh-CN')}\n\n---\n\n`;

let messageCount = 0;

// 需要过滤的系统消息关键词
const systemKeywords = [
  'Base directory for this skill',
  'system-reminder',
  '<command-name>',
  'Launching skill',
  'Task #',
  'Updated task',
  'created successfully',
  'task-notification',
  'The user wants to clarify',
  "The user doesn't want to proceed",
  'Start by asking them what they would like to clarify',
  'This means they may have additional information',
  'Take their response into account and then reformulate'
];

function isSystemMessage(text) {
  if (!text || text.length < 5) return true;
  return systemKeywords.some(kw => text.includes(kw));
}

function isRealUserInput(text) {
  if (!text || text.length < 3) return false;
  if (text.startsWith('>') || text.startsWith('$') || text.startsWith('git ') || text.startsWith('cd ')) return false;
  if (text.startsWith('npm ') || text.startsWith('npx ') || text.startsWith('ls ') || text.startsWith('cat ')) return false;
  if (text.startsWith('head ') || text.startsWith('tail ') || text.startsWith('echo ') || text.startsWith('node ')) return false;
  if (isSystemMessage(text)) return false;
  if (!/[一-龥]/.test(text) && text.length < 30) return false;
  return true;
}

for (const line of lines) {
  try {
    const entry = JSON.parse(line);

    // 用户消息
    if (entry.type === 'user' && entry.message) {
      const content = entry.message.content;
      const time = entry.timestamp ? new Date(entry.timestamp).toLocaleString('zh-CN') : '';

      // content 是字符串
      if (typeof content === 'string' && content.trim()) {
        const text = content.trim();
        if (isRealUserInput(text) && text.length > 5) {
          messageCount++;
          output += `## 用户 ${messageCount}\n\n`;
          if (time) output += `*${time}*\n\n`;
          output += text + '\n\n---\n\n';
        }
      }

      // content 是数组
      if (Array.isArray(content)) {
        for (const block of content) {
          // 用户对提问的回答
          if (block.type === 'tool_result') {
            const resultContent = typeof block.content === 'string' ? block.content : '';
            const answerMatch = resultContent.match(/User has answered your questions: "(.+?)"="(.+?)"/);
            if (answerMatch) {
              const question = answerMatch[1];
              const answer = answerMatch[2];
              if (!answer.includes('The user') && !answer.includes('want to clarify') && answer.length < 200) {
                output += `**回答：** ${answer}\n\n`;
                output += `*（针对问题：${question}）*\n\n---\n\n`;
              }
            }
          }

          // 用户输入的文本
          if (block.type === 'text') {
            const text = block.text || '';
            if (isRealUserInput(text) && text.length > 10) {
              messageCount++;
              output += `## 用户 ${messageCount}\n\n`;
              if (time) output += `*${time}*\n\n`;
              output += text.trim() + '\n\n---\n\n';
            }
          }
        }
      }
    }

    // Claude 消息
    if (entry.type === 'assistant' && entry.message) {
      const blocks = Array.isArray(entry.message.content) ? entry.message.content : [];
      let textParts = [];
      let questions = [];

      for (const block of blocks) {
        if (block.type === 'text' && block.text) {
          textParts.push(block.text);
        }
        if (block.type === 'tool_use' && block.name === 'AskUserQuestion') {
          const input = block.input;
          if (input && input.questions) {
            for (const q of input.questions) {
              let qText = `**${q.question}**\n\n`;
              if (q.options) {
                for (const opt of q.options) {
                  qText += `- ${opt.label}`;
                  if (opt.description) qText += ` — ${opt.description}`;
                  qText += '\n';
                }
              }
              questions.push(qText);
            }
          }
        }
      }

      if (questions.length > 0) {
        output += `### Claude（提问）\n\n`;
        output += questions.join('\n') + '\n\n---\n\n';
      }

      if (textParts.length > 0) {
        const text = textParts.join('\n\n').trim();
        if (text && text.length > 15 && !isSystemMessage(text)) {
          output += `### Claude\n\n`;
          output += text + '\n\n---\n\n';
        }
      }
    }
  } catch (e) {
    // skip malformed lines
  }
}

fs.writeFileSync(outputFile, output, 'utf-8');
console.log(`导出完成！共 ${messageCount} 条用户消息`);
console.log(`文件：${outputFile}`);
