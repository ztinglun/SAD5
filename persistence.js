// --- 資料持久化管理 (Persistence Layer) ---
(function() {
    const STORAGE_KEY = 'agentTT_appState';
    const APP_VERSION = 'v2.1'; // 版本號：若變更此值，將自動清除舊快取

    function debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // 需要持久化的全域狀態 key 清單
    // 注意：ticketOrders 不持久化，每次啟動都使用 state.js 的最新預設值（台鐵 台南→高雄）
    const PERSIST_KEYS = [
        'isLoggedIn', 'currentUser', 'registeredUsers',
        'favoriteSpots', 'favoriteHotels', 'myBookings',
        'hotelDatabase', 'socialPosts', 'tripHistory', 'currentTrip'
    ];

    window.AppPersistence = {
        save() {
            try {
                const snapshot = { _version: APP_VERSION };
                PERSIST_KEYS.forEach(key => {
                    if (window[key] !== undefined) {
                        snapshot[key] = window[key];
                    }
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
            } catch (e) {
                console.warn('[Persistence] 儲存失敗:', e.message);
            }
        },

        load() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return false;
                const snapshot = JSON.parse(raw);

                // 版本不符：清除舊快取，使用 state.js 的最新預設值
                if (snapshot._version !== APP_VERSION) {
                    localStorage.removeItem(STORAGE_KEY);
                    console.info('[Persistence] 版本更新，已清除舊快取，使用預設資料。');
                    return false;
                }

                PERSIST_KEYS.forEach(key => {
                    if (snapshot[key] !== undefined) {
                        window[key] = snapshot[key];
                    }
                });
                return true;
            } catch (e) {
                console.warn('[Persistence] 讀取失敗:', e.message);
                return false;
            }
        },

        clear() {
            try {
                localStorage.removeItem(STORAGE_KEY);
                showToastNotification('所有本地儲存資料已清除');
            } catch (e) {
                console.warn('[Persistence] 清除失敗:', e.message);
            }
        },

        // 防抖自動儲存 — 在任何狀態變更後呼叫
        autoSave: debounce(function() {
            AppPersistence.save();
        }, 300)
    };

    // 頁面關閉前自動儲存
    window.addEventListener('beforeunload', function() {
        AppPersistence.save();
    });
})();
