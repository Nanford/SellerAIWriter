import multer from "multer";
import sharp from "sharp";

const storage = multer.memoryStorage();
const upload = multer({ storage });

// 压缩长边 1024px (middleware chaining 示例，可在 routes 中调用)
export const compressImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const resized = await sharp(req.file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    req.file.buffer = resized;
    next();
  } catch (err) {
    next(err);
  }
};

export default upload;