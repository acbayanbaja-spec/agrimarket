import { Router, Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { successResponse } from '../utils/response';

const router = Router();

// @route   POST /api/ai/diagnose-crop
// @desc    Diagnose crop quality, grade, freshness and shelf-life
// @access  Public / Authenticated
router.post('/diagnose-crop', (req: Request, res: Response) => {
  const { cropName, imageUri, notes } = req.body;
  if (!cropName) {
    return res.status(400).json({
      success: false,
      message: 'Crop name is required for diagnostic evaluation',
      data: null,
    });
  }

  const diagnosis = aiService.diagnoseCrop(cropName, imageUri, notes);
  return res.json(successResponse(diagnosis, 'Crop quality diagnosed successfully'));
});

// @route   GET /api/ai/price-forecast/:crop
// @desc    Get 14-day price prediction & fair price guidance
// @access  Public
router.get('/price-forecast/:crop', (req: Request, res: Response) => {
  const crop = req.params.crop;
  const forecast = aiService.getPriceForecast(crop);
  return res.json(successResponse(forecast, 'Price forecast generated'));
});

// @route   POST /api/ai/agri-chat
// @desc    Chat with multilingual Agronomy AI ("AgriKaibigan")
// @access  Public
router.post('/agri-chat', (req: Request, res: Response) => {
  const { message, language } = req.body;
  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message cannot be empty',
      data: null,
    });
  }

  const result = aiService.chatAgronomy(message, language);
  return res.json(successResponse(result, 'AI response ready'));
});

export default router;
