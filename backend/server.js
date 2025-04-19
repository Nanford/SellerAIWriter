import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";
import aiRoutes from "./routes/ai.js";
import recordsRoutes from "./routes/records.js";

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
      return res.status(400).json({ error: "没有上传文件" });
    }
    
    const filePath = req.file.path;
    res.json({ 
      success: true, 
      message: "文件上传成功",
      path: filePath
    });
  } catch (error) {
    console.error("上传错误:", error);
    res.status(500).json({ error: "文件上传失败", details: error.message });
  }
});

// 创建uploads目录
import fs from "fs";
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const PORT = process.env.PORT || 8090;
app.listen(PORT, () => console.log(`✅ API服务器运行在 http://localhost:${PORT}`));