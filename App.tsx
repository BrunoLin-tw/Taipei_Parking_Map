import React, { useEffect, useState, useCallback } from 'react';
import { ParkingMap } from './components/ParkingMap';
import { fetchParkingData } from './services/api';
import { ParkingLotData } from './types';

// Refresh interval: 5 minutes (in milliseconds)
const REFRESH_INTERVAL = 5 * 60 * 1000;

function App() {
  const [parkingData, setParkingData] = useState<ParkingLotData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchParkingData();
      setParkingData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError("無法讀取停車場資料，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }
    
    setLocating(true);
    // Relaxed settings to avoid "Timeout expired" error
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        // Improved error logging
        console.error(`Geolocation error (${err.code}): ${err.message}`);
        // If it was a timeout, we can show a non-intrusive log
        if (err.code === 3) {
          console.warn("定位逾時，建議移動至收訊較佳處或改用 WiFi。");
        }
        setLocating(false);
      },
      { 
        enableHighAccuracy: false, // Set to false for faster, more reliable results indoors
        timeout: 15000,            // Increased from 5s to 15s
        maximumAge: 60000          // Use cached location if it's less than 60s old
      }
    );
  }, []);

  // Initial load, periodic refresh, and initial location check
  useEffect(() => {
    loadData();
    handleLocateMe();

    const intervalId = setInterval(() => {
      loadData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [loadData, handleLocateMe]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
      {/* Header / Stats Bar */}
      <header className="flex-none bg-white shadow-md z-10 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-blue-600">🅿️</span> 雙北停車場即時資訊
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            資料來源: 臺北市政府資料開放平台、新北市政府資料開放平台
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm flex-wrap justify-center">
          <div className="hidden lg:block">
            <span className="font-medium text-gray-700">上次更新: </span>
            <span className="text-gray-900">
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Updating...'}
            </span>
          </div>
          
          <div className="hidden sm:block bg-blue-50 px-3 py-1 rounded-full border border-blue-100 text-blue-800">
            已載入 {parkingData.length} 個停車場
          </div>

          <button
            onClick={handleLocateMe}
            disabled={locating}
            className={`px-3 py-2 rounded-lg text-white font-medium transition-all flex items-center gap-1 ${
              locating
                ? 'bg-green-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 shadow-sm hover:shadow'
            }`}
          >
            <span>📍</span>
            {locating ? '定位中...' : '我的位置'}
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow active:scale-95'
            }`}
          >
            {loading ? '更新中...' : '立即更新'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative">
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md text-center">
            <strong className="font-bold">錯誤: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Map - Using absolute inset-0 to guarantee it fills the flex-1 relative parent */}
        <div className="absolute inset-0">
           <ParkingMap data={parkingData} userLocation={userLocation} />
        </div>

        {/* Legend / Info Overlay */}
        <div className="absolute bottom-6 left-4 z-[999] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 text-xs sm:text-sm max-w-[200px]">
          <h4 className="font-bold text-gray-700 mb-2">剩餘車位說明</h4>
          <ul className="space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>-11/足夠: 剩餘格位足夠</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span>-12/普通: 剩餘格位不足半數</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>-13/滿位: 剩餘格數不足</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              <span>-9: 無法提供/資訊不明</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;