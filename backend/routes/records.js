import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const RECORDS_DIR = 'records';

// 确保记录目录存在
if (!fs.existsSync(RECORDS_DIR)) {
  fs.mkdirSync(RECORDS_DIR);
}

// 获取所有记录
router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(RECORDS_DIR);
    const records = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const data = fs.readFileSync(path.join(RECORDS_DIR, file), 'utf8');
        return JSON.parse(data);
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(records);
  } catch (error) {
    console.error('获取记录错误:', error);
    res.status(500).json({ error: '获取记录失败', details: error.message });
  }
});

// 保存记录
router.post('/save', (req, res) => {
  try {
    const recordData = req.body;
    
    if (!recordData) {
      return res.status(400).json({ error: '缺少记录数据' });
    }
    
    // 确保有时间戳，用于文件名
    const timestamp = recordData.timestamp || new Date().toISOString();
    const safeTimestamp = timestamp.replace(/:/g, '-');
    const filename = `record_${safeTimestamp}.json`;
    
    fs.writeFileSync(
      path.join(RECORDS_DIR, filename),
      JSON.stringify(recordData, null, 2),
      'utf8'
    );
    
    res.json({ success: true, message: '记录保存成功', filename });
  } catch (error) {
    console.error('保存记录错误:', error);
    res.status(500).json({ error: '保存记录失败', details: error.message });
  }
});

// 获取单条记录
router.get('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const filePath = path.join(RECORDS_DIR, `record_${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const record = JSON.parse(data);
    
    res.json(record);
  } catch (error) {
    console.error('获取单条记录错误:', error);
    res.status(500).json({ error: '获取记录失败', details: error.message });
  }
});

export default router; 