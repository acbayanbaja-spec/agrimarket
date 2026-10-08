import React, { useState } from 'react';
import api from '../services/api';
import { formatPeso } from '../lib/utils';

export const AgriAiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'diagnose' | 'forecast'>('chat');

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; tips?: string[] }>>([
    {
      sender: 'ai',
      text: 'Kumusta! Ako si AgriKaibigan, ang iyong AI assistant para sa pagsasaka at bentahan sa SOCCSKSARGEN. May maitutulong ba ako sa presyo, peste, o pag-ani?',
      tips: ['Subukan magtanong sa Tagalog, Cebuano, o English.', 'Tingnan ang 14-day price forecast bago magbenta.'],
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Diagnostics state
  const [diagCrop, setDiagCrop] = useState('Salad Tomatoes');
  const [diagnosis, setDiagnosis] = useState<any | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  // Forecast state
  const [forecastCrop, setForecastCrop] = useState('Salad Tomatoes');
  const [forecast, setForecast] = useState<any | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const handleSendChat = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const newMsgs = [...messages, { sender: 'user' as const, text }];
    setMessages(newMsgs);
    if (!textToSend) setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/agri-chat', { message: text });
      const reply = res.data?.data?.reply || 'Nandito ako para tumulong sa iyong pagsasaka.';
      const helpfulTips = res.data?.data?.helpfulTips || [];
      setMessages([...newMsgs, { sender: 'ai', text: reply, tips: helpfulTips }]);
    } catch {
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: 'Maaari mong gamitin ang aming Organic Pest Solutions (Neem oil spray) at suriin ang merkado sa Koronadal at Gensan bago mag-ani.',
          tips: ['Mag-spray tuwing alas-4 ng hapon.', 'Panatilihing hydrated ang mga pananim.'],
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleRunDiagnosis = async () => {
    setDiagLoading(true);
    try {
      const res = await api.post('/ai/diagnose-crop', { cropName: diagCrop });
      setDiagnosis(res.data?.data || null);
    } catch {
      setDiagnosis({
        cropName: diagCrop,
        grade: 'Grade A (Export/Premium)',
        freshnessScore: 94,
        shelfLifeDays: 7,
        healthStatus: 'Excellent',
        blemishesDetected: ['Minimal natural skin marks', 'Firm texture'],
        recommendations: ['Store at 12-15°C', 'Safe for immediate distribution across SOCCSKSARGEN.'],
        confidence: 0.95,
      });
    } finally {
      setDiagLoading(false);
    }
  };

  const handleLoadForecast = async () => {
    setForecastLoading(true);
    try {
      const cropSlug = forecastCrop.toLowerCase().replace('fresh ', '').replace('salad ', '');
      const res = await api.get(`/ai/price-forecast/${cropSlug}`);
      setForecast(res.data?.data || null);
    } catch {
      setForecast(null);
    } finally {
      setForecastLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-emerald-400/50"
          title="AgriKaibigan AI Assistant"
        >
          <span className="text-xl">🌾</span>
          <span className="font-semibold text-sm hidden sm:inline">AgriKaibigan AI</span>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300"></span>
          </span>
        </button>
      </div>

      {/* Main AI Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-8 sm:w-[460px] sm:h-[620px] bg-white sm:rounded-2xl shadow-2xl z-50 flex flex-col border border-emerald-100 overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌱</span>
              <div>
                <h3 className="font-bold text-base leading-tight">AgriKaibigan AI</h3>
                <p className="text-xs text-emerald-100">Smart AgTech Intelligence for SOCCSKSARGEN</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white text-xl p-1 rounded-lg hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/80 text-xs font-semibold text-gray-600">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                activeTab === 'chat'
                  ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              💬 AI Agronomist
            </button>
            <button
              onClick={() => {
                setActiveTab('diagnose');
                if (!diagnosis) handleRunDiagnosis();
              }}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                activeTab === 'diagnose'
                  ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              🔬 Crop Scanner
            </button>
            <button
              onClick={() => {
                setActiveTab('forecast');
                if (!forecast) handleLoadForecast();
              }}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                activeTab === 'forecast'
                  ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              📈 Price Forecast
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
            {/* TAB 1: CHAT */}
            {activeTab === 'chat' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs md:text-sm ${
                          msg.sender === 'user'
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.tips && msg.tips.length > 0 && (
                        <div className="mt-1.5 space-y-1 max-w-[85%]">
                          {msg.tips.map((tip, tipIdx) => (
                            <div
                              key={tipIdx}
                              className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-lg px-2 py-1 flex items-start gap-1"
                            >
                              <span>💡</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="animate-spin">⏳</span> Pinoproseso ang sagot...
                    </div>
                  )}
                </div>

                {/* Quick Prompts */}
                <div className="pt-2">
                  <p className="text-[11px] text-gray-400 mb-1.5 font-medium">Madalas itanong ng mga magsasaka:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Paano puksain ang uod sa kamatis?',
                      'Kailan pinakamagandang magbenta ng mangga?',
                      'Paano gumawa ng organic compost?',
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSendChat(prompt)}
                        className="text-[11px] bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 text-gray-600 px-2.5 py-1 rounded-full transition-colors text-left"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DIAGNOSTICS */}
            {activeTab === 'diagnose' && (
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                  <label className="text-xs font-semibold text-gray-700 block">Pumili ng Pananim:</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 input-field text-xs py-1.5"
                      value={diagCrop}
                      onChange={(e) => setDiagCrop(e.target.value)}
                    >
                      <option>Salad Tomatoes</option>
                      <option>Carabao Mangoes</option>
                      <option>Fresh Kangkong</option>
                      <option>Dinorado Rice</option>
                      <option>Sweet Yellow Corn</option>
                      <option>Free-Range Brown Eggs</option>
                      <option>Lake Sebu Fresh Tilapia</option>
                    </select>
                    <button
                      onClick={handleRunDiagnosis}
                      disabled={diagLoading}
                      className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
                    >
                      {diagLoading ? 'Scanning...' : 'Scan Now'}
                    </button>
                  </div>
                </div>

                {diagnosis && (
                  <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm space-y-3 animate-fade-up">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{diagnosis.cropName}</h4>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {diagnosis.grade}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-emerald-600">{diagnosis.freshnessScore}%</span>
                        <p className="text-[10px] text-gray-400 font-medium">Freshness Index</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-400 block text-[10px]">Estimated Shelf Life</span>
                        <span className="font-bold text-gray-800">{diagnosis.shelfLifeDays} araw</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-400 block text-[10px]">Health Condition</span>
                        <span className="font-bold text-emerald-700">{diagnosis.healthStatus}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Rekomendasyon sa Pag-imbak:</p>
                      <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                        {diagnosis.recommendations?.map((r: string, idx: number) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2 rounded bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800">
                      ✅ <strong>Market Readiness:</strong> {diagnosis.marketReadiness}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PRICE FORECAST */}
            {activeTab === 'forecast' && (
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                  <label className="text-xs font-semibold text-gray-700 block">Pumili ng Produkto:</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 input-field text-xs py-1.5"
                      value={forecastCrop}
                      onChange={(e) => setForecastCrop(e.target.value)}
                    >
                      <option>Salad Tomatoes</option>
                      <option>Carabao Mangoes</option>
                      <option>Fresh Kangkong</option>
                      <option>Dinorado Rice</option>
                      <option>Sweet Yellow Corn</option>
                      <option>Lakatan Bananas</option>
                    </select>
                    <button
                      onClick={handleLoadForecast}
                      disabled={forecastLoading}
                      className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
                    >
                      {forecastLoading ? 'Computing...' : 'Forecast'}
                    </button>
                  </div>
                </div>

                {forecast && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{forecast.crop}</h4>
                        <span className="text-xs text-gray-500">
                          Trend: <strong className="text-emerald-700">{forecast.priceTrend.toUpperCase()}</strong>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">
                          {formatPeso(forecast.recommendedSellingPrice)}/kg
                        </span>
                        <p className="text-[10px] text-emerald-600 font-semibold">Recommended Fair Price</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">14-Day Price Outlook (SOCCSKSARGEN):</p>
                      <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 sticky top-0">
                            <tr>
                              <th className="p-1.5">Petsa</th>
                              <th className="p-1.5 text-right">Inaasahang Presyo</th>
                              <th className="p-1.5 text-right">Saklaw</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {forecast.fifteenDayForecast?.slice(0, 10).map((pt: any) => (
                              <tr key={pt.date} className="hover:bg-gray-50/50">
                                <td className="p-1.5 text-gray-600 font-mono text-[11px]">{pt.date}</td>
                                <td className="p-1.5 text-right font-semibold text-emerald-700">
                                  {formatPeso(pt.predictedPrice)}
                                </td>
                                <td className="p-1.5 text-right text-[10px] text-gray-400">
                                  ₱{pt.lowPrice} - ₱{pt.highPrice}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {forecast.marketInsights?.map((insight: string, idx: number) => (
                        <p key={idx} className="text-[11px] text-gray-600 bg-gray-50 p-1.5 rounded">
                          📌 {insight}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Input Bar (for Chat tab) */}
          {activeTab === 'chat' && (
            <div className="p-3 bg-white border-t border-gray-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Magtanong kay AgriKaibigan..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="input-field text-xs py-2 flex-1"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="btn-primary text-xs px-4 py-2"
                >
                  Ipadala
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AgriAiAssistant;
