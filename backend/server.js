import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";
import aiRoutes from "./routes/ai.js";
import recordsRoutes from "./routes/records.js";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// 设置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage: storage });

// 获取当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建 uploads 目录 (如果不存在)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created directory: ${uploadsDir}`);
}

// 配置静态文件服务，让 uploads 目录下的文件可以通过 URL 访问
app.use('/uploads', express.static(uploadsDir));

// 基本路由
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "服务器运行正常" });
});

// 使用AI路由
app.use("/api", aiRoutes);

// 使用记录路由
app.use("/api/records", recordsRoutes);

// 图片上传路由
app.post("/api/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "没有上传文件" });
    }

    // 1. 构造文件名和路径
    const originalname = req.file.originalname || 'uploaded_image';
    const extension = path.extname(originalname);
    const filename = `${Date.now()}-${path.basename(originalname, extension)}${extension}`;
    const filePath = path.join(uploadsDir, filename);
    const relativePath = `/uploads/${filename}`; // 前端将使用的路径

    // 2. 将内存缓冲区写入文件
    fs.writeFileSync(filePath, req.file.buffer);
    console.log(`Image saved to: ${filePath}`);

    // 3. 返回成功响应和文件相对路径
    res.json({ 
      success: true, 
      message: "文件上传成功",
      path: relativePath // 返回相对路径，因为我们配置了静态服务
    });
  } catch (error) { // 确保捕获写入错误
    console.error("上传错误 - 保存文件失败:", error);
    res.status(500).json({ success: false, error: "文件上传失败", details: error.message });
  }
});

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => console.log(`✅ API服务器运行在 http://localhost:${PORT}`));