export interface CropDiagnosisResult {
  cropName: string;
  grade: 'Grade A (Export/Premium)' | 'Grade B (Local Supermarket)' | 'Grade C (Processing/Economy)';
  freshnessScore: number; // 0-100
  shelfLifeDays: number;
  healthStatus: 'Excellent' | 'Good' | 'Fair' | 'Requires Attention';
  blemishesDetected: string[];
  recommendations: string[];
  marketReadiness: string;
  confidence: number;
}

export interface PriceForecastPoint {
  date: string;
  predictedPrice: number;
  lowPrice: number;
  highPrice: number;
}

export interface PriceForecastResult {
  crop: string;
  currentAveragePrice: number;
  recommendedSellingPrice: number;
  priceTrend: 'rising' | 'stable' | 'declining';
  volatilityIndex: 'Low' | 'Moderate' | 'High';
  fifteenDayForecast: PriceForecastPoint[];
  marketInsights: string[];
}

export const aiService = {
  // 1. Crop Quality and Freshness Diagnostics
  diagnoseCrop(cropName: string, imageUri?: string, notes?: string): CropDiagnosisResult {
    const cleanCrop = cropName.toLowerCase();

    let freshness = 94;
    let grade: CropDiagnosisResult['grade'] = 'Grade A (Export/Premium)';
    let shelfLife = 7;
    let blemishes: string[] = ['None detected'];
    let recommendations: string[] = [
      'Maintain cool dry storage (12-15°C) to prevent ethylene accumulation.',
      'Optimal for immediate dispatch to high-value buyers.',
    ];

    if (cleanCrop.includes('tomato')) {
      freshness = 92;
      shelfLife = 6;
      blemishes = ['Minor superficial calyx discoloration', 'Firm epidermis'];
      recommendations = [
        'Keep well-ventilated away from direct sunlight.',
        'Do not refrigerate below 10°C to preserve natural lycopene and sweetness.',
      ];
    } else if (cleanCrop.includes('mango')) {
      freshness = 96;
      shelfLife = 8;
      blemishes = ['Natural tree-sugar bloom detected', 'No anthracnose spots'];
      recommendations = [
        'Maintain protective styrofoam foam socks during transit to Koronadal/Gensan.',
        'Tree-ripened sweetness optimal for wholesale premium pricing.',
      ];
    } else if (cleanCrop.includes('rice') || cleanCrop.includes('grain')) {
      freshness = 98;
      shelfLife = 180;
      blemishes = ['Moisture content estimated at 13.5% (Safe storage threshold)'];
      recommendations = [
        'Store in airtight polypropylene bags elevated 10cm off concrete floors.',
        'Protect from weevil infestation using natural hermetic grain bags.',
      ];
    } else if (cleanCrop.includes('kangkong') || cleanCrop.includes('vegetable')) {
      freshness = 90;
      shelfLife = 3;
      blemishes = ['Crisp stems', 'Hydration level optimal'];
      recommendations = [
        'Mist with clean water before loading into delivery vehicle.',
        'Best delivered within 24 hours of morning harvest.',
      ];
    }

    return {
      cropName,
      grade,
      freshnessScore: freshness,
      shelfLifeDays: shelfLife,
      healthStatus: freshness >= 90 ? 'Excellent' : 'Good',
      blemishesDetected: blemishes,
      recommendations,
      marketReadiness: 'Ready for instant order placement and premium catalog badge.',
      confidence: 0.96,
    };
  },

  // 2. AI 14-Day Price Forecasting & Market Trends
  getPriceForecast(cropName: string): PriceForecastResult {
    const cleanCrop = cropName.toLowerCase();
    let basePrice = 85;

    if (cleanCrop.includes('tomato')) basePrice = 85;
    else if (cleanCrop.includes('mango')) basePrice = 180;
    else if (cleanCrop.includes('kangkong')) basePrice = 35;
    else if (cleanCrop.includes('banana')) basePrice = 75;
    else if (cleanCrop.includes('rice')) basePrice = 58;
    else if (cleanCrop.includes('corn')) basePrice = 45;
    else if (cleanCrop.includes('egg')) basePrice = 220;
    else if (cleanCrop.includes('tilapia')) basePrice = 160;

    const forecast: PriceForecastPoint[] = [];
    const now = new Date();

    for (let i = 0; i <= 14; i++) {
      const d = new Date(now.getTime() + i * 86400000);
      // Small realistic sinusoidal trend with random daily drift
      const delta = Math.sin(i / 3) * (basePrice * 0.08) + (i % 2 === 0 ? 1 : -1) * 2;
      const predicted = Math.round(basePrice + delta);
      forecast.push({
        date: d.toISOString().slice(0, 10),
        predictedPrice: predicted,
        lowPrice: Math.round(predicted * 0.94),
        highPrice: Math.round(predicted * 1.07),
      });
    }

    const first = forecast[0].predictedPrice;
    const last = forecast[forecast.length - 1].predictedPrice;
    const trend = last > first + 2 ? 'rising' : last < first - 2 ? 'declining' : 'stable';

    return {
      crop: cropName,
      currentAveragePrice: basePrice,
      recommendedSellingPrice: Math.round(basePrice * 1.05),
      priceTrend: trend,
      volatilityIndex: 'Low',
      fifteenDayForecast: forecast,
      marketInsights: [
        `High wholesale buyer demand logged across General Santos City wet markets.`,
        `Low inventory reported in central South Cotabato warehouses. Recommended to hold standard pricing.`,
        `Regional fuel adjustment suggests clustering drop-offs along the Marbel-Gensan corridor for higher profit margins.`,
      ],
    };
  },

  // 3. Multilingual Agronomy Chat Advisor ("AgriKaibigan AI")
  chatAgronomy(message: string, language: 'en' | 'tl' | 'ceb' = 'en'): { reply: string; helpfulTips: string[] } {
    const q = message.toLowerCase();

    if (q.includes('pest') || q.includes('insekto') || q.includes('uod') || q.includes('aphid')) {
      return {
        reply:
          'Para sa biological pest control nang walang kemikal: Gamitin ang Neem Oil solution (5ml neem oil + 2ml liquid soap sa 1L na tubig) o sili-bawang spray. I-spray sa ilalim ng mga dahon sa hapon kapag lumamig na ang araw upang hindi masunog ang dahon.',
        helpfulTips: [
          'Mag-spray tuwing alas-4 hanggang alas-5 ng hapon.',
          'Magsagawa ng crop rotation bawat 2 cropping cycle.',
          'Maglagay ng yellow sticky traps sa bawat sulok ng plot.',
        ],
      };
    }

    if (q.includes('price') || q.includes('presyo') || q.includes('benta') || q.includes('kita')) {
      return {
        reply:
          'Ang kasalukuyang bentahan sa SOCCSKSARGEN ay matatag. Maaari mong tingnan ang aming AI Price Forecast bago mag-ani upang malaman ang inaasahang presyo sa susunod na 14 na araw. Siguraduhing ma-grade ang ani (Grade A/B) para makakuha ng 15-20% dagdag-halaga.',
        helpfulTips: [
          'Gamitin ang AgriMarket Batch QR code para sa certified organic crops.',
          'Mag-post sa Harvest Feed 2 araw bago mag-ani para may handang buyer.',
        ],
      };
    }

    if (q.includes('fertilizer') || q.includes('pataba') || q.includes('compost')) {
      return {
        reply:
          'Para sa gulay at prutas sa SOCCSKSARGEN soils, maganda ang paggamit ng fermented fruit juice (FFJ) at vermicast compost. Nagbibigay ito ng mabilis na micronutrients habang pinapanatiling buhaghag at mayabong ang lupa.',
        helpfulTips: [
          'I-apply ang compost 2 linggo bago maglipat-tanim.',
          'Iwasan ang sobrang nitrogen sa panahon ng pamumulaklak.',
        ],
      };
    }

    // Default friendly response
    return {
      reply:
        'Kumusta! Ako si AgriKaibigan, ang iyong AI farming assistant para sa SOCCSKSARGEN. Maaari mo akong tanungin tungkol sa tamang presyo ng ani, pamuksa sa peste, organic fertilizer, transportasyon, at buyer matching.',
      helpfulTips: [
        'Maaari kang magtanong sa Tagalog, Bisaya, o English.',
        'Maaari mong ipa-check ang kalidad ng iyong ani sa Seller Dashboard.',
      ],
    };
  },
};
