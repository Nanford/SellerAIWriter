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

    // 当使用 diskStorage 时, Multer 已经将文件保存
    // req.file.filename 包含了保存在 uploads/ 目录下的唯一文件名
    // req.file.path 包含了完整的服务器文件系统路径

    // 只需要返回前端可以访问的相对 URL 路径即可
    const relativePath = `/uploads/${req.file.filename}`; 
    console.log(`Image uploaded via diskStorage, accessible at: ${relativePath}`);

    // 返回成功响应和文件相对路径
    res.json({ 
      success: true, 
      message: "文件上传成功",
      path: relativePath 
    });
    
  } catch (error) { // 这个 catch 块现在主要捕获 Multer 本身的错误（虽然它通常会传递给 next）
    console.error("上传中间件或后续处理错误:", error);
    res.status(500).json({ success: false, error: "文件上传处理失败", details: error.message });
  }
});

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => console.log(`✅ API服务器运行在 http://localhost:${PORT}`));