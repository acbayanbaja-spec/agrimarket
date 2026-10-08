import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `harvest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  },
});

// @route   POST /api/upload
// @desc    Upload product photo or verification document
// @access  Public / Authenticated
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('No file uploaded', null, 'FILE_MISSING', 400));
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.status(201).json(
      successResponse(
        {
          url: fileUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        'File uploaded successfully'
      )
    );
  } catch (err: any) {
    return res.status(500).json(errorResponse(err.message, null, 'UPLOAD_ERROR', 500));
  }
});

export default router;
