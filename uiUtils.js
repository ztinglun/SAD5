// --- 通用 UI 輔助工具 (UI Utilities) ---

// ==========================================
// 1. Toast 浮動通知
// ==========================================
window.showToastNotification = function(message, type) {
    type = type || 'info';
    const colorMap = {
        info:    'bg-gray-900 border-gray-800',
        success: 'bg-emerald-800 border-emerald-700',
        error:   'bg-rose-800 border-rose-700',
        warning: 'bg-amber-800 border-amber-700'
    };
    const iconMap = {
        info:    '<div class="w-2 h-2 bg-amber-400 rounded-full pulse-dot"></div>',
        success: '<i class="fa-solid fa-circle-check text-emerald-400"></i>',
        error:   '<i class="fa-solid fa-circle-xmark text-rose-400"></i>',
        warning: '<i class="fa-solid fa-triangle-exclamation text-amber-400"></i>'
    };
    const toast = document.createElement('div');
    toast.className = `fixed bottom-5 right-5 ${colorMap[type] || colorMap.info} text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-[9999] animate-fade-in border max-w-sm`;
    toast.innerHTML = `${iconMap[type] || iconMap.info}<span class="font-medium leading-relaxed">${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s ease';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};


// ==========================================
// 2. 全域錯誤處理
// ==========================================
window.onerror = function(message, source, lineno, colno, error) {
    console.error('[GlobalError]', message, '@ ', source, ':', lineno);
    // 過濾掉外部資源載入錯誤（如 CDN 圖片失敗），只提示 JS 邏輯錯誤
    if (source && source.includes('.js')) {
        showToastNotification('系統發生異常，請稍後再試', 'error');
    }
    return true; // 防止瀏覽器預設 console 重複輸出
};

window.addEventListener('unhandledrejection', function(event) {
    console.error('[PromiseError]', event.reason);
    showToastNotification('操作處理失敗，請重試', 'error');
    event.preventDefault();
});

// 安全執行包裝器 — 對有風險的操作進行 try-catch 包裝
window.safeExec = function(fn, fallbackMessage) {
    try {
        return fn();
    } catch (e) {
        console.error('[SafeExec]', e);
        showToastNotification(fallbackMessage || '操作執行時發生問題', 'error');
        return null;
    }
};


// ==========================================
// 3. 頁面切換 Loading 遮罩與骨架屏
// ==========================================
window.showPageLoading = function() {
    let overlay = document.getElementById('page-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'page-loading-overlay';
        overlay.className = 'fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[100] transition-opacity duration-200';
        overlay.innerHTML = `
            <div class="flex flex-col items-center gap-3 animate-fade-in">
                <div class="relative w-12 h-12 flex items-center justify-center">
                    <div class="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse"></div>
                    <div class="w-10 h-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                </div>
                <span class="text-xs font-bold text-gray-500 tracking-wider">頁面載入中...</span>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
};

window.hidePageLoading = function() {
    const overlay = document.getElementById('page-loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 200);
    }
};

// 骨架屏生成器 — 用於內容區域載入前顯示
window.renderSkeleton = function(count) {
    count = count || 3;
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="bg-white rounded-2xl p-4 border border-gray-100 space-y-3 animate-pulse">
                <div class="h-32 bg-gray-200 rounded-xl shimmer"></div>
                <div class="h-4 bg-gray-200 rounded w-3/4 shimmer"></div>
                <div class="h-3 bg-gray-100 rounded w-1/2 shimmer"></div>
            </div>
        `;
    }
    return html;
};
