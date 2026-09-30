/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Key, Shield, Zap, RefreshCw, Cpu, BookOpen, Code, Terminal, 
  CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, Play, Server, 
  Layers, Lock, Database, Sparkles, Check, Copy, BarChart3, TrendingUp, Clock
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from "recharts";

export default function App() {
  const [activeTab, setActiveTab] = useState<"visualizer" | "guide" | "analysis" | "simulator" | "code" | "token-tips">("visualizer");

  // State for Simulator
  const [apiKeysInput, setApiKeysInput] = useState<string>("AIzaSyExampleKey1...\nAIzaSyExampleKey2...\nAIzaSyExampleKey3...");
  const [promptText, setPromptText] = useState<string>("Jelaskan manfaat menggunakan Google AI Studio Free Tier dalam 2 kalimat.");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.8-flash");
  const [rotationStrategy, setRotationStrategy] = useState<string>("fallback");
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // State for Key Validation
  const [testKeysInput, setTestKeysInput] = useState<string>("");
  const [testingKeys, setTestingKeys] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<any[] | null>(null);

  // State for Visualizer Simulation Parameters
  const [simKeysCount, setSimKeysCount] = useState<number>(3);
  const [simDailyRequests, setSimDailyRequests] = useState<number>(1200);
  const [visualizerModel, setVisualizerModel] = useState<string>("gemini-3.8-flash");

  // Model definitions with Free Tier limits (RPM and RPD)
  const MODEL_LIMITS: Record<string, { name: string; id: string; rpm: number; rpd: number; description: string }> = {
    "default": { name: "Default (Gemini 3.8 Flash)", id: "gemini-3.8-flash", rpm: 15, rpd: 1500, description: "Model default seimbang & serbaguna" },
    "gemini-3.8-flash": { name: "Gemini 3.8 Flash", id: "gemini-3.8-flash", rpm: 15, rpd: 1500, description: "Model unggulan terbaru dengan performa penalaran tinggi" },
    "gemini-3.7-flash": { name: "Gemini 3.7 Flash", id: "gemini-3.7-flash", rpm: 15, rpd: 1500, description: "Model versi stabil sebelumnya dengan efisiensi tinggi" },
    "gemini-3.6-flash": { name: "Gemini 3.6 Flash", id: "gemini-3.6-flash", rpm: 15, rpd: 1500, description: "Model dengan optimasi kecepatan dan akurasi teks" },
    "gemini-3.5-flash": { name: "Gemini 3.5 Flash", id: "gemini-3.5-flash", rpm: 15, rpd: 1500, description: "Model handal untuk berbagai tugas general AI" },
    "gemini-3.5-flash-lite": { name: "Gemini 3.5 Flash Lite", id: "gemini-3.5-flash-lite", rpm: 30, rpd: 1500, description: "Model ringan berkecepatan tinggi dengan RPM lebih besar" },
    "gemini-3.1-flash-lite": { name: "Gemini 3.1 Flash Lite", id: "gemini-3.1-flash-lite", rpm: 30, rpd: 1500, description: "Model ultra-cepat untuk aplikasi berlatensi rendah" },
    "gemini-3-flash-preview": { name: "Gemini 3 Flash Preview", id: "gemini-3-flash-preview", rpm: 10, rpd: 1000, description: "Model pratinjau fitur eksperimental terbaru" },
    "gemini-flash-latest": { name: "Gemini Flash Latest", id: "gemini-flash-latest", rpm: 15, rpd: 1500, description: "Alias otomatis menuju versi Flash terbaru" },
    "gemini-flash-lite-latest": { name: "Gemini Flash-Lite Latest", id: "gemini-flash-lite-latest", rpm: 30, rpd: 1500, description: "Alias otomatis menuju versi Flash-Lite terbaru" },
  };

  const currentModelLimit = MODEL_LIMITS[visualizerModel] || MODEL_LIMITS["default"];

  // Simulated Hourly Data Generator based on selected model limits
  const generateHourlyData = () => {
    const hours = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
    const weights = [0.1, 0.05, 0.02, 0.05, 0.2, 0.6, 0.9, 1.0, 0.85, 0.7, 0.4, 0.2];
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    return hours.map((hour, idx) => {
      const weight = weights[idx];
      const reqs = Math.round((simDailyRequests * (weight / totalWeight)));
      const maxHourlyCapacity = simKeysCount * currentModelLimit.rpm * 60;
      
      const successful = Math.min(reqs, maxHourlyCapacity);
      const rateLimited = Math.max(0, reqs - maxHourlyCapacity);

      return {
        hour,
        permintaan: reqs,
        berhasil: successful,
        terkenaLimit429: rateLimited,
        kapasitasMaksimal: maxHourlyCapacity,
      };
    });
  };

  const hourlyData = generateHourlyData();

  const keyDistributionData = Array.from({ length: simKeysCount }, (_, i) => ({
    name: `Key #${i + 1}`,
    panggilan: Math.round(simDailyRequests / simKeysCount + (Math.random() * 30 - 15)),
  }));

  // Model comparison simulation data under identical workload
  const comparisonData = Object.keys(MODEL_LIMITS).map((mKey) => {
    const m = MODEL_LIMITS[mKey];
    const totalCapacityRPD = m.rpd * simKeysCount;
    const exhaustionPercentage = Math.min(100, Math.round((simDailyRequests / totalCapacityRPD) * 100));

    return {
      modelName: m.name,
      rpmPerKey: m.rpm,
      totalRpd: totalCapacityRPD,
      exhaustionPercentage,
      status: exhaustionPercentage > 90 ? "Risiko Tinggi 429" : exhaustionPercentage > 60 ? "Sedang" : "Sangat Aman",
    };
  });

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const keysArray = apiKeysInput.split("\n").map(k => k.trim()).filter(Boolean);
      const actualModelId = MODEL_LIMITS[selectedModel]?.id || selectedModel;
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          model: actualModelId,
          apiKeys: keysArray,
          strategy: rotationStrategy
        })
      });
      const data = await res.json();
      setSimResult({ ok: res.ok, status: res.status, data });
    } catch (err: any) {
      setSimResult({ ok: false, status: 500, data: { error: err.message } });
    } finally {
      setSimulating(false);
    }
  };

  const handleTestKeys = async () => {
    const keys = testKeysInput.split("\n").map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) return;
    setTestingKeys(true);
    setTestResults(null);
    try {
      const res = await fetch("/api/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys })
      });
      const data = await res.json();
      setTestResults(data.results || []);
    } catch (err: any) {
      setTestResults([{ key: "Error", valid: false, error: err.message }]);
    } finally {
      setTestingKeys(false);
    }
  };

  const sampleCodeSnippet = `import { GoogleGenAI } from "@google/genai";

// 1. Pilih Model yang ingin digunakan (Sesuai pilihan Anda)
const SELECTED_MODEL = "${currentModelLimit.id}"; // ${currentModelLimit.name}

// 2. Kumpulan API Key dalam Array untuk Rotasi & Fallback
const API_KEY_POOL = [
  process.env.GEMINI_API_KEY_1 || "",
  process.env.GEMINI_API_KEY_2 || "",
  process.env.GEMINI_API_KEY_3 || ""
].filter(Boolean);

let currentKeyIndex = 0;

// 3. Fungsi helper untuk mendapatkan klien AI dengan key bergantian
function getRotatedAIClient() {
  if (API_KEY_POOL.length === 0) {
    throw new Error("Tidak ada API key yang tersedia di pool.");
  }
  
  currentKeyIndex = (currentKeyIndex + 1) % API_KEY_POOL.length;
  const key = API_KEY_POOL[currentKeyIndex];

  return new GoogleGenAI({
    apiKey: key,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
}

// 4. Fungsi pemanggilan dengan model pilihan & otomatis Fallback 429
export async function generateWithModelAndFallback(prompt: string) {
  let attempts = 0;
  let lastError: any = null;

  while (attempts < API_KEY_POOL.length) {
    try {
      const ai = getRotatedAIClient();
      const response = await ai.models.generateContent({
        model: SELECTED_MODEL,
        contents: prompt,
      });
      return { text: response.text, modelUsed: SELECTED_MODEL, keyIndex: currentKeyIndex };
    } catch (error: any) {
      lastError = error;
      attempts++;
      if (error?.message?.includes("429") || error?.message?.toLowerCase().includes("quota")) {
        console.warn(\`Key ke-\${currentKeyIndex} terkena limit (429) pada model \${SELECTED_MODEL}, beralih key...\`);
        continue;
      }
      throw error;
    }
  }
  throw new Error(\`Semua key habis kuotanya untuk model \${SELECTED_MODEL}. Detail: \${lastError?.message}\`);
}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner & Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                AI Studio Free Tier & Multi-Key Rotator
              </h1>
              <p className="text-xs text-slate-400">Analisis Model Gemini, Visualisasi Recharts, & Rotasi Key</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Free Tier Aktif (Rp 0)
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab("visualizer")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "visualizer"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Visualisasi & Simulasi Model
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "guide"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Panduan Free Tier
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "analysis"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Analisis Array API Key
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "simulator"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Play className="w-4 h-4" />
            Simulator & Rotator Key
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "code"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Code className="w-4 h-4" />
            Contoh Kode Program
          </button>
          <button
            onClick={() => setActiveTab("token-tips")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "token-tips"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Zap className="w-4 h-4" />
            Tips Hemat Token
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* TAB 0: VISUALISASI KUOTA & PERBANDINGAN MODEL */}
        {activeTab === "visualizer" && (
          <div className="space-y-8 animate-fade-in">
            {/* Summary Statistics Widget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1">Total Active Keys</p>
                  <h3 className="text-3xl font-extrabold text-white">{simKeysCount} <span className="text-sm font-normal text-slate-400">Keys</span></h3>
                  <p className="text-xs text-slate-400 mt-1">Kunci API dalam array rotator</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Key className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1">Estimated Daily Requests Capacity</p>
                  <h3 className="text-3xl font-extrabold text-white">{(simKeysCount * currentModelLimit.rpd).toLocaleString()}</h3>
                  <p className="text-xs text-slate-400 mt-1">Maksimal permintaan per hari ({currentModelLimit.name})</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Database className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1">Current Key Efficiency</p>
                  <h3 className="text-3xl font-extrabold text-white">
                    {Math.max(5, Math.min(100, 100 - Math.round((simDailyRequests / (simKeysCount * currentModelLimit.rpd)) * 100)))}%
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Rasio ketersediaan kuota bebas 429</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Header Box */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
                    <TrendingUp className="w-3.5 h-3.5" /> Simulasi Perbandingan Model & Kuota
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                    Analisis Kecepatan Habisnya Kuota Berdasarkan Model
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Pilih model Gemini dan atur parameter simulasi untuk melihat seberapa cepat kuota per menit (RPM) dan per hari (RPD) akan terpakai di bawah beban kerja yang sama.
                  </p>
                </div>

                {/* Interactive Controls */}
                <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 flex flex-col gap-4 min-w-[300px]">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Pilih Model Gemini
                    </label>
                    <select
                      value={visualizerModel}
                      onChange={(e) => setVisualizerModel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      {Object.keys(MODEL_LIMITS).map((k) => (
                        <option key={k} value={k}>{MODEL_LIMITS[k].name} ({MODEL_LIMITS[k].rpm} RPM)</option>
                      ))}
                    </select>
                    <p className="text-xs text-indigo-300 mt-1">{currentModelLimit.description}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 flex justify-between mb-1">
                      <span>Jumlah Key dalam Array:</span>
                      <span className="text-indigo-400 font-bold">{simKeysCount} Key</span>
                    </label>
                    <input 
                      type="range" 
                      min="1" 
                      max="6" 
                      value={simKeysCount} 
                      onChange={(e) => setSimKeysCount(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 flex justify-between mb-1">
                      <span>Target Permintaan Harian:</span>
                      <span className="text-indigo-400 font-bold">{simDailyRequests} Req/hari</span>
                    </label>
                    <input 
                      type="range" 
                      min="200" 
                      max="5000" 
                      step="200"
                      value={simDailyRequests} 
                      onChange={(e) => setSimDailyRequests(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Model Exhaustion Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {comparisonData.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`bg-slate-900/80 border rounded-2xl p-6 transition-all ${
                    item.modelName === visualizerModel 
                      ? "border-indigo-500 shadow-lg shadow-indigo-500/10 bg-indigo-950/10" 
                      : "border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-950 text-indigo-300 border border-slate-800">
                      {item.modelName}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item.status === "Sangat Aman" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : item.status === "Sedang" 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-3 my-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Limit RPM per Key:</span>
                      <span className="font-semibold text-white">{item.rpmPerKey} RPM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Kapasitas RPD:</span>
                      <span className="font-semibold text-white">{item.totalRpd.toLocaleString()} req</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Beban Terpakai:</span>
                      <span className="font-semibold text-indigo-400">{item.exhaustionPercentage}% dari kuota harian</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.exhaustionPercentage > 90 ? "bg-rose-500" : item.exhaustionPercentage > 60 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, item.exhaustionPercentage)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Hourly Quota Usage for Selected Model */}
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Simulasi Trafik Per Jam ({visualizerModel})</h3>
                    <p className="text-xs text-slate-400">Perbandingan volume permintaan vs batas kapasitas RPM &times; 60.</p>
                  </div>
                  <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-500/20">
                    {simKeysCount} Key Aktif
                  </span>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCap" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                      <Area type="monotone" dataKey="permintaan" name="Permintaan Pengguna" stroke="#6366f1" fillOpacity={1} fill="url(#colorReqs)" />
                      <Area type="monotone" dataKey="kapasitasMaksimal" name="Kapasitas Maks Pool" stroke="#10b981" fillOpacity={1} fill="url(#colorCap)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Key Load Distribution */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Distribusi Beban per Key</h3>
                    <p className="text-xs text-slate-400">Porsi trafik tiap kunci dalam array.</p>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={keyDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                      />
                      <Bar dataKey="panggilan" name="Total Panggilan" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Explanation on Model Exhaustion */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" /> Analisis Kecepatan Habisnya Kuota (Rate Limit Exhaustion)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
                <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800">
                  <h4 className="font-semibold text-white mb-2 text-indigo-300">1. Model dengan RPM Lebih Tinggi (`gemini-3.1-flash-lite`)</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Model dengan kuota RPM lebih tinggi dapat menangani lonjakan trafik sesaat (*burst requests*) lebih lama sebelum mengalami HTTP 429. Namun, batas kuota harian (RPD) tetap mengikat sehingga penggunaan jangka panjang harus diimbangi dengan jumlah key array yang memadai.
                  </p>
                </div>
                <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800">
                  <h4 className="font-semibold text-white mb-2 text-indigo-300">2. Dampak Penggunaan Array Multi-Key</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Dengan menggabungkan 3 hingga 5 key dalam satu array, kapasitas total RPM dan RPD dikalikan sejumlah key tersebut. Jika key pertama terkena limit 429 pada jam sibuk (peak hour), rotator otomatis mengalihkan beban ke key berikutnya tanpa menghentikan aplikasi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: PANDUAN FREE TIER */}
        {activeTab === "guide" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
                  <Zap className="w-3.5 h-3.5" /> Google AI Studio Free Tier
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
                  Akses AI Cepat, Handal, dan Sepenuhnya Gratis (Rp 0)
                </h2>
                <p className="text-slate-300 text-base leading-relaxed">
                  Google menyediakan akses <strong>Free Tier</strong> yang sangat royal melalui <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline hover:text-indigo-300">Google AI Studio</a> bagi para pengembang untuk membangun, menguji (*prototyping*), dan meluncurkan aplikasi bertenaga AI tanpa biaya sepeser pun.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Biaya Rp 0 (Sepenuhnya Gratis)</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Tidak memerlukan kartu kredit atau tagihan bulanan untuk mulai bereksperimen dengan model-model unggulan Google Gemini.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Model Unggulan Tersedia</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Mendukung model efisien tinggi seperti <code className="text-indigo-300 bg-indigo-950/50 px-1.5 py-0.5 rounded">gemini-3.8-flash</code> dan <code className="text-indigo-300 bg-indigo-950/50 px-1.5 py-0.5 rounded">gemini-3.1-flash-lite</code> yang sangat cepat dan akurat.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Batasan (Rate Limits)</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Free tier memiliki batasan kuota per menit (RPM) dan per hari (RPD) untuk menjaga ketersediaan layanan global bagi seluruh pengembang.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANALISIS MULTI-KEY ROTATOR */}
        {activeTab === "analysis" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 mb-4 border border-purple-500/20">
                <HelpCircle className="w-3.5 h-3.5" /> Analisis Pertanyaan Pengguna
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
                Apakah beberapa Free API Key bisa dibuat array untuk dipilih secara random di dalam program?
              </h2>
              <p className="text-slate-300 text-base leading-relaxed mb-6">
                <strong>Ya, sangat bisa dan merupakan teknik yang umum dilakukan pengembang</strong> untuk mendistribusikan beban (*load balancing*) atau menangani lonjakan trafik saat kuota rate limit (HTTP 429) tercapai pada satu kunci tertentu.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Keuntungan / Manfaat
                  </h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Menghindari HTTP 429 (Rate Limit):</strong> Jika Key A terkena batas kuota per menit (RPM), program dapat langsung beralih ke Key B di dalam array secara otomatis (fallback).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Melipatgandakan Kapasitas Kuota:</strong> Menggabungkan 3 akun Google/Key berarti melipatgandakan batas RPM total aplikasi Anda secara gratis.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" /> Batasan & Hal yang Perlu Diperhatikan
                  </h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span><strong>Keamanan Penyimpanan:</strong> Jangan pernah meletakkan array API key mentah di kode sisi klien (frontend browser). Rotasi key <strong>wajib</strong> dilakukan di sisi server (backend Node.js/Express).</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* NEW: Key Health Component */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-indigo-400" /> Key Health Monitor (Status Real-Time Array Key)
                  </h3>
                  <p className="text-sm text-slate-400">Memantau status keaktifan (Active, Pending, atau Rate-Limited 429) berdasarkan simulasi terakhir.</p>
                </div>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-medium">
                  {apiKeysInput.split("\n").filter(Boolean).length} Key Terdaftar
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {apiKeysInput.split("\n").map(k => k.trim()).filter(Boolean).map((keyStr, idx) => {
                  // Check if we have simulation attempts for this key
                  const masked = keyStr.substring(0, 6) + "..." + (keyStr.length > 10 ? keyStr.substring(keyStr.length - 4) : "");
                  const attemptMatch = simResult?.data?.attempts?.find((att: any) => att.keyMasked.includes(masked.substring(0, 6)));
                  
                  let status = "PENDING";
                  let statusColor = "bg-slate-800 text-slate-300 border-slate-700";
                  let statusText = "Pending / Standby";
                  
                  if (attemptMatch) {
                    if (attemptMatch.status === "SUCCESS") {
                      status = "ACTIVE";
                      statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                      statusText = `Active (${attemptMatch.durationMs}ms)`;
                    } else if (attemptMatch.status.includes("429")) {
                      status = "RATE_LIMITED";
                      statusColor = "bg-rose-500/10 text-rose-400 border-rose-500/30";
                      statusText = "Rate-Limited (429)";
                    } else {
                      status = "ERROR";
                      statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                      statusText = "Error / Invalid";
                    }
                  }

                  return (
                    <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono font-bold text-indigo-300">Key #{idx + 1}</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor}`}>
                            {statusText}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 mb-3 truncate">
                          {keyStr}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                        <span>Strategi: Fallback/Round-Robin</span>
                        <span className="text-indigo-400 font-medium">Pool Ready</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SIMULATOR & ROTATOR KEY */}
        {activeTab === "simulator" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Live Multi-Key Rotator & Fallback Simulator</h2>
                  <p className="text-sm text-slate-400">Uji coba pengiriman prompt ke server backend menggunakan array API key dengan pilihan model.</p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Server className="w-3.5 h-3.5" /> Server-Side Proxy
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Kumpulan API Key (Satu key per baris)
                    </label>
                    <textarea
                      value={apiKeysInput}
                      onChange={(e) => setApiKeysInput(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Pilih Model Gemini
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {Object.keys(MODEL_LIMITS).map((k) => (
                          <option key={k} value={k}>{MODEL_LIMITS[k].name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Strategi Rotasi
                      </label>
                      <select
                        value={rotationStrategy}
                        onChange={(e) => setRotationStrategy(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="fallback">Fallback on 429</option>
                        <option value="random">Random Selection</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Prompt Uji Coba
                    </label>
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    ></textarea>
                  </div>

                  <button
                    onClick={handleRunSimulation}
                    disabled={simulating}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {simulating ? "Mengirim Permintaan..." : "Jalankan Simulasi Rotasi & Generasi"}
                  </button>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-400" /> Hasil Eksekusi & Log Percobaan
                    </h3>
                    
                    {!simResult && !simulating && (
                      <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 p-6">
                        <Sparkles className="w-8 h-8 mb-2 opacity-40" />
                        <p className="text-sm">Klik tombol "Jalankan Simulasi" untuk menguji array key dengan model terpilih.</p>
                      </div>
                    )}

                    {simulating && (
                      <div className="h-64 flex flex-col items-center justify-center text-center text-indigo-400 p-6">
                        <RefreshCw className="w-8 h-8 mb-2 animate-spin" />
                        <p className="text-sm">Menghubungkan ke Gemini API...</p>
                      </div>
                    )}

                    {simResult && (
                      <div className="space-y-4 animate-fade-in">
                        <div className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
                          simResult.ok ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300" : "bg-rose-950/40 border-rose-500/30 text-rose-300"
                        }`}>
                          <span>Status HTTP: {simResult.status} {simResult.ok ? "SUCCESS" : "ERROR"}</span>
                          {simResult.data?.usedKeyIndex !== undefined && (
                            <span className="bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
                              Key Index: #{simResult.data.usedKeyIndex + 1}
                            </span>
                          )}
                        </div>

                        {simResult.ok && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Respon Gemini AI:</label>
                            <div className="bg-slate-900 p-3.5 rounded-lg text-sm text-slate-200 border border-slate-800 max-h-40 overflow-y-auto leading-relaxed">
                              {simResult.data.text}
                            </div>
                          </div>
                        )}

                        {simResult.data?.attempts && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Log Percobaan:</label>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto">
                              {simResult.data.attempts.map((att: any, idx: number) => (
                                <div key={idx} className="text-xs font-mono bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                                  <span className="text-slate-300">Key: {att.keyMasked}</span>
                                  <span className={`px-1.5 py-0.5 rounded ${att.status === "SUCCESS" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                                    {att.status} ({att.durationMs}ms)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONTOH KODE PROGRAM */}
        {activeTab === "code" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Implementasi Model & Multi-Key Rotator dengan SDK @google/genai</h2>
                  <p className="text-sm text-slate-400">Kode backend Node.js/Express lengkap dengan pilihan model <code className="text-indigo-300">{selectedModel}</code>.</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sampleCodeSnippet);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-all cursor-pointer"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? "Berhasil Disalin!" : "Salin Kode"}
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-indigo-200 leading-relaxed">
                  <code>{sampleCodeSnippet}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TIPS HEMAT TOKEN */}
        {activeTab === "token-tips" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
                  <Zap className="w-3.5 h-3.5" /> Strategi Efisiensi Token Gemini
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
                  Prinsip Utama: Persingkat Input & Batasi Output
                </h2>
                <p className="text-slate-300 text-base leading-relaxed">
                  Untuk meminimalkan konsumsi kuota (token) API Gemini pada Free Tier, kuncinya adalah memangkas ukuran prompt input serta memaksa model memberikan jawaban sesingkat mungkin.
                </p>
              </div>
            </div>

            {/* Section 1: Perintah Terpendek */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" /> 1. Perintah Terpendek & Hemat Token (Output Maksimal 1 Kata/Karakter)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-white mb-2 text-indigo-300">Klasifikasi Sentimen</h4>
                    <p className="text-xs text-slate-400 mb-3">Memaksa hasil output hanya 1 kata kategori.</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-indigo-200 border border-slate-800">
                    Jawab 1 kata: Positif/Negatif/Netral. Teks: "Aplikasi ini bagus banget"
                  </div>
                </div>

                <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-white mb-2 text-indigo-300">Pertanyaan Singkat</h4>
                    <p className="text-xs text-slate-400 mb-3">Membatasi jawaban biner Ya atau Tidak.</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-indigo-200 border border-slate-800">
                    Jawab 'Ya' atau 'Tidak' saja: Apakah bumi bulat?
                  </div>
                </div>

                <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-white mb-2 text-indigo-300">Ekstraksi Data</h4>
                    <p className="text-xs text-slate-400 mb-3">Mengambil entitas spesifik tanpa narasi panjang.</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-indigo-200 border border-slate-800">
                    Ambil nama kota saja dari teks berikut: "Saya kemarin baru balik dari Bandung..."
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: maxOutputTokens & countTokens */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-400" /> 2. Pengaturan Parameter API (`maxOutputTokens`) & Hitung Token
              </h3>
              
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                Selain menyusun prompt yang singkat, cara paling ampuh memangkas kuota output di kode program adalah dengan mengatur konfigurasi <code className="text-indigo-300 bg-indigo-950 px-1.5 py-0.5 rounded">maxOutputTokens</code> dan menggunakan <code className="text-indigo-300 bg-indigo-950 px-1.5 py-0.5 rounded">countTokens</code>.
              </p>

              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-indigo-200 leading-relaxed">
                  <code>{`import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Cek jumlah token terlebih dahulu (Tidak memotong kuota generasi)
const tokenCount = await ai.models.countTokens({
  model: "gemini-3.1-flash-lite",
  contents: "Jawab 1 kata: Apa ibukota Indonesia?",
});
console.log("Jumlah token input:", tokenCount.totalTokens);

// 2. Generate dengan maxOutputTokens yang dibatasi ketat
const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-lite", // Gunakan versi Lite untuk efisiensi tinggi
  contents: "Jawab 1 kata: Apa ibukota Indonesia?",
  config: {
    maxOutputTokens: 5, // Mengunci agar model tidak memberikan jawaban panjang
  }
});

console.log("Respon singkat:", response.text);`}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <p>AI Studio Free Tier Guide & Multi-Key Rotator • Dibangun dengan React, Tailwind CSS, Recharts, & Express.</p>
      </footer>
    </div>
  );
}
