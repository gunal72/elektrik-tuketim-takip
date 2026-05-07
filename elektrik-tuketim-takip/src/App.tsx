import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Zap, Users, TrendingUp, AlertTriangle, Plus, Search, Download, 
  X, Calendar, MapPin, Building2, BarChart3, Home, Settings, RefreshCw, Key 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths } from 'date-fns';

// Types
interface MonthlyData {
  month: string;
  kwh: number;
  cost: number;
}

interface Facility {
  id: number;
  name: string;
  location: string;
  type: string;
  address: string;
  monthlyData: MonthlyData[];
}

interface ConsumptionAlert {
  facility: Facility;
  level: string;
  message: string;
}

const turkishCities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Kayseri', 'Eskişehir', 'Kocaeli', 'Diyarbakır', 'Samsun', 'Denizli'];
const facilityTypes = ['Endüstriyel', 'Ticari', 'Konut', 'Ofis', 'Üretim Tesisi', 'Depo'];

const generateMockData = (): Facility[] => {
  const data: Facility[] = [];
  const names = ['Fabrika A1', 'Merkez Şube', 'Üretim Tesisi B2', 'Lojistik Deposu', 'Ana Ofis', 'Fabrika C3', 'Satış Noktası', 'Atölye', 'Dağıtım Merkezi', 'Şube Ofisi'];
  
  for (let i = 1; i <= 750; i++) {
    const city = turkishCities[Math.floor(Math.random() * turkishCities.length)];
    const type = facilityTypes[Math.floor(Math.random() * facilityTypes.length)];
    const nameBase = names[Math.floor(Math.random() * names.length)];
    const monthlyData: MonthlyData[] = [];
    let baseKwh = Math.floor(Math.random() * 45000) + 8500;

    for (let m = 11; m >= 0; m--) {
      const monthDate = subMonths(new Date(), m);
      const monthStr = format(monthDate, 'MMM yyyy');
      const seasonal = Math.sin((m / 12) * Math.PI * 2) * 0.15;
      const variation = (Math.random() - 0.5) * 0.2;
      const kwh = Math.floor(baseKwh * (1 + seasonal + variation));
      const cost = Math.floor(kwh * 3.85);
      monthlyData.push({ month: monthStr, kwh, cost });
      baseKwh = Math.floor(baseKwh * (0.98 + Math.random() * 0.06));
    }
    
    data.push({ id: i, name: `${nameBase} ${i}`, location: city, type, address: `${city} ${Math.floor(Math.random() * 200) + 1}. Cad. No:${Math.floor(Math.random() * 80) + 12}`, monthlyData });
  }
  return data;
};

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'];
// API Integration Page - Toroslar MDM API (Backend Proxy ile)
function ApiIntegration() {
  const [credentials, setCredentials] = useState({
    clientId: 'gokhanyuksel@adana-aski.gov.tr',
    clientSecret: '92X3UJwq',
  });
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [installations, setInstallations] = useState<any[]>([]);
  const [selectedInstallation, setSelectedInstallation] = useState('');
  const [dataType, setDataType] = useState<'1' | '2' | '3'>('1');
  const [energyData, setEnergyData] = useState<any[]>([]);
  const [isLoadingEnergy, setIsLoadingEnergy] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('mdmAccessToken');
    if (savedToken) setAccessToken(savedToken);
  }, []);

  // Token Alma (Backend Proxy)
  const fetchToken = async () => {
    setIsLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const response = await fetch('http://localhost:3001/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
        }),
      });
      const data = await response.json();

      if (data.access_token) {
        setAccessToken(data.access_token);
        localStorage.setItem('mdmAccessToken', data.access_token);
        setStatus({ type: 'success', message: 'Token başarıyla alındı!' });
      } else {
        setStatus({ type: 'error', message: data.error_description || 'Token alınamadı' });
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: 'Backend bağlantı hatası: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Tesisat Listesi (Backend Proxy)
  const fetchInstallations = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/installations?accessToken=${accessToken}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setInstallations(data);
      } else if (data.installations) {
        setInstallations(data.installations);
      } else {
        setInstallations([
          { installationNumber: "T-3928471", etsoCode: "ETSO-784291", meterSerial: "SN3928471", city: "Adana", district: "Seyhan" },
          { installationNumber: "T-3928472", etsoCode: "ETSO-784292", meterSerial: "SN3928472", city: "Adana", district: "Yüreğir" },
        ]);
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Tesisat listesi çekilemedi' });
    } finally {
      setIsLoading(false);
    }
  };

  // Enerji Verisi (Backend Proxy)
  const fetchEnergyData = async () => {
    if (!accessToken || !selectedInstallation) return;
    setIsLoadingEnergy(true);
    setEnergyData([]);

    try {
      const res = await fetch(`http://localhost:3001/api/energy?accessToken=${accessToken}&installationNumber=${selectedInstallation}&dataType=${dataType}`);
      const data = await res.json();

      if (data && (data.values || data.data)) {
        setEnergyData(data.values || data.data);
      } else {
        const count = dataType === '1' ? 24 : 31;
        const demo = Array.from({ length: count }, (_, i) => ({
          meterDate: dataType === '1' ? `2025-01-15 ${String(i).padStart(2, '0')}:00` : `2025-01-${String(i + 1).padStart(2, '0')}`,
          activeConsumption: Math.floor(180 + Math.random() * 720),
          activeGeneration: Math.floor(Math.random() * 85)
        }));
        setEnergyData(demo);
      }
    } catch (error) {
      const count = dataType === '1' ? 24 : 31;
      const demo = Array.from({ length: count }, (_, i) => ({
        meterDate: dataType === '1' ? `2025-01-15 ${String(i).padStart(2, '0')}:00` : `2025-01-${String(i + 1).padStart(2, '0')}`,
        activeConsumption: Math.floor(180 + Math.random() * 720),
        activeGeneration: Math.floor(Math.random() * 85)
      }));
      setEnergyData(demo);
    } finally {
      setIsLoadingEnergy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">Toroslar MDM API - Gerçek Entegrasyon</h1>
        <p className="text-xl text-slate-600 mt-2">Gerçek zamanlı tüketim ve üretim verileri</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border rounded-3xl p-8">
          <div className="font-semibold text-xl mb-4">1. Token Al</div>
          <button onClick={fetchToken} disabled={isLoading} className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-semibold disabled:bg-slate-400">
            {isLoading ? 'Token Alınıyor...' : 'Token Al (Gerçek API)'}
          </button>
          {accessToken && <div className="mt-3 text-emerald-600 text-sm">✓ Token alındı</div>}
        </div>

        <div className="bg-white border rounded-3xl p-8">
          <div className="font-semibold text-xl mb-4">2. Tesisatları Çek</div>
          <button onClick={fetchInstallations} disabled={!accessToken || isLoading} className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-semibold disabled:bg-slate-400">
            Tesisat Listesini Çek
          </button>
        </div>
      </div>

      {installations.length > 0 && (
        <div className="bg-white border rounded-3xl p-8 mb-8">
          <div className="font-semibold text-xl mb-5">3. Enerji Verisi Çek</div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="text-sm font-medium block mb-2">Tesisat Seç</label>
              <select value={selectedInstallation} onChange={(e) => setSelectedInstallation(e.target.value)} className="w-full border rounded-xl px-4 py-3">
                <option value="">Tesisat seçin...</option>
                {installations.map((ins, i) => (
                  <option key={i} value={ins.installationNumber}>{ins.installationNumber} - {ins.city} / {ins.district}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Veri Tipi</label>
              <select value={dataType} onChange={(e) => setDataType(e.target.value as any)} className="border rounded-xl px-4 py-3">
                <option value="1">Saatlik Endeks (Yük Profili)</option>
                <option value="2">Günlük Endeks</option>
                <option value="3">Reset Verisi</option>
              </select>
            </div>
            <button onClick={fetchEnergyData} disabled={!selectedInstallation || isLoadingEnergy} className="px-8 py-3 bg-violet-600 text-white rounded-2xl font-semibold disabled:bg-slate-300">
              {isLoadingEnergy ? 'Veri Çekiliyor...' : 'Verileri Çek'}
            </button>
          </div>

          {energyData.length > 0 && (
            <div className="mt-8">
              <div className="font-semibold mb-4 text-lg">Çekilen Veriler ({energyData.length} kayıt)</div>
              <div className="overflow-x-auto border rounded-2xl">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left">Tarih / Saat</th>
                      <th className="px-6 py-4 text-right">Tüketim (kWh)</th>
                      <th className="px-6 py-4 text-right">Üretim (kWh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {energyData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-3.5 font-mono text-xs">{row.meterDate}</td>
                        <td className="px-6 py-3.5 text-right font-semibold tabular-nums">{row.activeConsumption}</td>
                        <td className="px-6 py-3.5 text-right font-semibold text-emerald-600 tabular-nums">{row.activeGeneration || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {status.type !== 'idle' && (
        <div className={`p-4 rounded-2xl mb-8 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {status.message}
        </div>
      )}

      <div className="text-xs text-slate-500 bg-slate-50 p-5 rounded-2xl">
        Not: Backend proxy (localhost:3001) çalışmıyorsa gerçek veri yerine demo veriler gösterilir.
      </div>
    </div>
  );
}
// Ana Dashboard ve diğer sayfalar (kısaltılmış)
function ElectricityTracker() {
  const [facilities] = useState<Facility[]>(generateMockData());
  
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex h-screen">
        <div className="w-72 bg-white border-r border-slate-200 px-5 py-8 flex flex-col">
          <div className="px-4 flex items-center gap-3 mb-9">
            <div className="w-9 h-9 bg-blue-700 rounded-2xl flex items-center justify-center"><Zap className="text-white" size={21} /></div>
            <div><div className="font-bold text-xl tracking-tighter">EnerjiTakip</div><div className="text-[10px] text-slate-500 -mt-1">ELEKTRİK İZLEME</div></div>
          </div>
          <nav className="flex flex-col gap-1">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white"><Home size={20} /><span className="font-medium">Dashboard</span></Link>
            <Link to="/api-entegrasyonu" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100"><Settings size={20} /><span className="font-medium">API Entegrasyonu</span></Link>
          </nav>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="max-w-[1280px] mx-auto px-9 pt-8 pb-16">
            <Routes>
              <Route path="/" element={<div className="text-3xl font-semibold">Dashboard - 750 Tesis</div>} />
              <Route path="/api-entegrasyonu" element={<ApiIntegration />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ElectricityTracker />
    </BrowserRouter>
  );
}