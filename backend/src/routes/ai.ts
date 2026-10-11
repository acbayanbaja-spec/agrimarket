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

// @route   GET /api/ai/gemini-status
// @desc    Check whether Gemini API is active
// @access  Public
router.get('/gemini-status', (req: Request, res: Response) => {
  const hasKey = Boolean(
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') ||
    (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim())
  );
  return res.json(
    successResponse({
      active: hasKey,
      model: hasKey ? 'gemini-1.5-flash' : 'agrimarket-knowledge-engine',
      message: hasKey
        ? 'Google Gemini API is configured and live'
        : 'Running on offline agricultural knowledge base. Add GEMINI_API_KEY for universal intelligence.',
    })
  );
});

// @route   POST /api/ai/agri-chat
// @desc    Chat with multilingual Agronomy AI ("AgriKaibigan") powered by Gemini
// @access  Public
router.post('/agri-chat', async (req: Request, res: Response) => {
  try {
    const message = req.body.message || req.body.prompt;
    const { language, history, apiKey } = req.body;
    const clientKey = (req.headers['x-gemini-api-key'] as string) || apiKey;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
        data: null,
      });
    }

    const result = await aiService.chatAgronomyWithGemini(message, {
      language,
      apiKey: clientKey,
      history,
    });

    return res.json(successResponse(result, 'AI response ready'));
  } catch (error: any) {
    // Graceful fallback to static agronomy response
    const fallback = aiService.chatAgronomy(req.body.message || '', req.body.language || 'en');
    return res.json(successResponse(fallback, 'AI response ready (fallback)'));
  }
});

export default router;
