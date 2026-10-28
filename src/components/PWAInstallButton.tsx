import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 bg-[#FFB300] hover:bg-[#FFA000] text-[#0D47A1] font-extrabold text-xs px-3 py-1.5 rounded-xl shadow transition"
        title="تثبيت التطبيق على جهازك كـ PWA"
      >
        <Download className="w-3.5 h-3.5" />
        <span>تثبيت التطبيق 📲</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 bg-[#FFB300] hover:bg-[#FFA000] text-[#0D47A1] font-extrabold text-xs px-3 py-1.5 rounded-xl shadow transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>تثبيت على آيفون 📱</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-gray-200 text-right">
              <div className="flex items-center justify-between mb-3 border-b pb-2">
                <h3 className="text-sm font-extrabold text-[#0D47A1] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#FFB300]" />
                  <span>تثبيت تدبيرة على آيفون / آيباد</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-gray-700 leading-relaxed">
                <p className="font-bold text-gray-800">لتثبيت التطبيق على شاشة هاتف الآيفون بسهولة:</p>
                <ol className="list-decimal list-inside space-y-1.5 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                  <li>اضغط على زر <strong className="text-[#0D47A1]">مشاركة (Share)</strong> 📤 في أسفل شريط متصفح Safari.</li>
                  <li>انزل لأسفل واختر <strong className="text-[#0D47A1]">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong> 📲.</li>
                  <li>اضغط <strong className="text-[#0D47A1]">إضافة (Add)</strong> أعلى الشاشة.</li>
                </ol>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-[#0D47A1] py-2 text-xs font-bold text-white hover:bg-[#002171] transition"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
