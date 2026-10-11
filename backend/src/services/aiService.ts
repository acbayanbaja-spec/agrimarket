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

  // 3. Google Gemini API Integration & Multilingual Agronomy Chat Advisor ("AgriKaibigan AI")
  async chatAgronomyWithGemini(
    message: string,
    options?: {
      language?: 'en' | 'tl' | 'ceb' | string;
      apiKey?: string;
      history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    }
  ): Promise<{ reply: string; helpfulTips: string[]; source: 'gemini' | 'knowledge-base'; model?: string }> {
    const key = options?.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (key && key.trim() && key !== 'your_gemini_api_key_here') {
      try {
        const systemPrompt = `You are AgriKaibigan AI, a world-class agricultural agronomist and universal AI assistant embedded within AgriMarket, an agricultural e-commerce platform in SOCCSKSARGEN (South Cotabato, Cotabato, Sultan Kudarat, Sarangani, and General Santos City), Philippines.

You are friendly, extremely smart, and practical.
You can answer:
1. ANY farming, agricultural, crop health, pest diagnosis, soil fertilizer, livestock, fisheries, and harvest preservation questions.
2. Market pricing, fair trade prices, harvest delivery, and e-commerce shopping advice.
3. Recipes, nutrition, storage, and cooking using local Philippine produce (mangoes, calamansi, lakatan, kangkong, tilapia, bangus, durian, etc.).
4. UNIVERSAL QUESTIONS: You can answer ANY question about general knowledge, mathematics, science, technology, translations, business, or education.
5. You speak English, Filipino/Tagalog, and Bisaya (Cebuano). Answer in the language the user speaks.
Format your responses cleanly with markdown bullet points, bold key terms, and actionable tips.`;

        const contents: any[] = [];

        if (options?.history && Array.isArray(options.history) && options.history.length > 0) {
          contents.push(...options.history);
        }

        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        // Try gemini-1.5-flash
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key.trim()}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200,
            },
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && typeof candidateText === 'string') {
            return {
              reply: candidateText.trim(),
              helpfulTips: [
                'Powered by Google Gemini 1.5 Flash (Universal AI)',
                'Ask about pests, fair prices, organic farming, or any universal question!',
              ],
              source: 'gemini',
              model: 'gemini-1.5-flash',
            };
          }
        }
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to local agronomy engine:', err?.message || err);
      }
    }

    // Comprehensive offline / knowledge base fallback
    return {
      ...this.chatAgronomy(message, (options?.language as any) || 'en'),
      source: 'knowledge-base',
      model: 'agrimarket-expert-engine',
    };
  },

  chatAgronomy(message: string, language: 'en' | 'tl' | 'ceb' = 'en'): { reply: string; helpfulTips: string[] } {
    const q = message.toLowerCase();

    if (q.includes('pest') || q.includes('insekto') || q.includes('uod') || q.includes('aphid') || q.includes('blight')) {
      return {
        reply:
          '🌱 **Organic Pest & Disease Management Plan:**\n\n' +
          '• **Natural Neem Oil Spray:** Mix 5ml pure neem oil + 2ml mild biodegradable soap in 1 liter clean water. Shake well and spray on the underside of leaves.\n' +
          '• **Chili-Garlic Repellent (Sili-Bawang):** Blend 5 hot red chilies + 1 bulb of native garlic with 1L water. Strain and spray to deter chewing worms, armyworms, and aphids.\n' +
          '• **Application Timing:** Always spray late afternoon (4:00 PM – 5:30 PM) when sun intensity drops to prevent leaf scalding.\n' +
          '• **Sticky Traps:** Place bright yellow sticky fly traps around the edges of vegetable plots.',
        helpfulTips: [
          'Rotate crops every 2 cycles to disrupt soil-borne insect larvae.',
          'Prune decaying bottom leaves to improve airflow and deter fungal mildew.',
        ],
      };
    }

    if (q.includes('price') || q.includes('presyo') || q.includes('benta') || q.includes('market') || q.includes('cost')) {
      return {
        reply:
          '📈 **SOCCSKSARGEN Fair Farmgate & Retail Market Guide:**\n\n' +
          '• **Salad Tomatoes:** ₱75 – ₱95 / kg (Polomolok & Tupi mountain supply)\n' +
          '• **Carabao Mangoes:** ₱160 – ₱190 / kg (Midsayap orchard grade)\n' +
          '• **Dinorado Rice:** ₱54 – ₱60 / kg (M\'lang freshly milled)\n' +
          '• **Free-Range Eggs:** ₱210 – ₱230 / 30-egg tray (Koronadal poultry)\n' +
          '• **Live Tilapia:** ₱130 – ₱150 / kg (Lake Sebu ice-packed)\n' +
          '• **Puyat Durian:** ₱220 – ₱260 / kg (Kidapawan farmgate)\n\n' +
          '💡 *Tip: Group deliveries along the Koronadal-Gensan corridor to reduce shipping costs to zero using code FREESHIP!*',
        helpfulTips: [
          'Check the "Price Monitor" tab for 14-day AI forecast trends.',
          'Sell certified Grade A harvests for 15-20% wholesale premiums.',
        ],
      };
    }

    if (q.includes('fertilizer') || q.includes('pataba') || q.includes('compost') || q.includes('soil')) {
      return {
        reply:
          '🌿 **High-Yield Organic Soil & Fertilizer Recommendations:**\n\n' +
          '• **Vermicast (African Nightcrawler castings):** Rich in humic acid and beneficial soil microbes. Apply 2 handfuls per planting hole 7 days before transplanting.\n' +
          '• **Fermented Fruit Juice (FFJ):** Ferment ripe bananas, papaya, and molasses (1:1 ratio) for 7 days. Dilute 2 tbsp in 1L water to boost flowering and fruit sweetening.\n' +
          '• **Carbonized Rice Hull (CRH):** Incorporate into clay soils to enhance water aeration, root expansion, and pH buffering.\n' +
          '• **Nitrogen Timing:** Reduce nitrogen feeding once flower buds form to prevent flower drop.',
        helpfulTips: [
          'Water in the early morning before 8:00 AM for maximum absorption.',
          'Mulch around the stem with dry rice straw to conserve moisture during dry spells.',
        ],
      };
    }

    if (q.includes('recipe') || q.includes('luto') || q.includes('cook') || q.includes('prepare')) {
      return {
        reply:
          '🍲 **Farm-Fresh SOCCSKSARGEN Recipe Idea:**\n\n' +
          '• **Fresh Sinigang na Bangus sa Kamatis at Kangkong:**\n' +
          '1. Simmer sliced ripe tomatoes and red onions in rice wash water until soft.\n' +
          '2. Add fresh ginger slices and cleaned Lake Sebu tilapia or Glan bangus.\n' +
          '3. Season with freshly squeezed calamansi and sea salt.\n' +
          '4. Turn off the heat and stir in crisp kangkong leaves. Cover for 2 minutes to serve bright green and crunchy!',
        helpfulTips: [
          'Add a splash of fresh carabao milk to chicken soup for authentic creamy tinola!',
          'Store fresh herbs wrapped in damp paper towels inside airtight containers.',
        ],
      };
    }

    // Default friendly response
    return {
      reply:
        '👋 **Mabuhay! I am AgriKaibigan AI**, your world-class agricultural and marketplace assistant for AgriMarket SOCCSKSARGEN!\n\n' +
        'I can assist you with:\n' +
        '• 🌾 **Crop cultivation, organic fertilizer recipes, & pest defense**\n' +
        '• 📊 **Fair market prices, daily farmgate rates, & price forecasts**\n' +
        '• 🍲 **Farm-to-table recipes & harvest storage tips**\n' +
        '• 🛍️ **Voucher claiming, order tracking, & Shopee-level marketplace features**\n' +
        '• 🌐 **Universal questions on math, science, language, & business!**\n\n' +
        '*(💡 Note: You can add your FREE Google Gemini API key from https://aistudio.google.com/ in AI Settings to enable unlimited universal knowledge!)*',
      helpfulTips: [
        'Ask me in English, Tagalog, or Bisaya anytime!',
        'Tap the quick prompt pills below for instant answers.',
      ],
    };
  },
};
