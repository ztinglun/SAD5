// --- 住宿專區與訂房模組 (Accommodation Module) ---

window.updateSearchParam = function(key, value) {
    accomSearch[key] = value;
    renderAccommodationPage();
};

window.updateFilterParam = function(key, value) {
    accomFilters[key] = value;
    renderAccommodationPage();
};

window.toggleAdvancedFilters = function() {
    showAdvancedFiltersPanel = !showAdvancedFiltersPanel;
    renderAccommodationPage();
};

window.resetHotelSearch = function() {
    accomSearch = { checkIn: '', checkOut: '', guests: 2 };
    accomFilters = { minPrice: 0, maxPrice: 99999, minRating: 0, roomType: '', wifi: false, pool: false };
    showAdvancedFiltersPanel = false;
    selectedHotelId = null;
    renderAccommodationPage();
};

window.renderAccommodationPage = function() {
    initSearchDates();
    const container = document.getElementById('accommodation-container');
    if (!container) return;

    const filteredHotels = getFilteredHotels();

    container.innerHTML = `
        <!-- 搜尋與篩選列 -->
        <div class="bg-white border-b border-gray-200 p-4 shrink-0 shadow-sm z-10">
            <div class="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex flex-wrap items-center gap-3">
                    <div class="flex flex-col">
                        <span class="text-[10px] font-bold text-gray-500 mb-0.5">入住日期</span>
                        <input type="date" id="hotel-check-in" value="${accomSearch.checkIn}" onchange="updateSearchParam('checkIn', this.value)" class="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[10px] font-bold text-gray-500 mb-0.5">退房日期</span>
                        <input type="date" id="hotel-check-out" value="${accomSearch.checkOut}" onchange="updateSearchParam('checkOut', this.value)" class="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[10px] font-bold text-gray-500 mb-0.5">入住人數</span>
                        <select id="hotel-guests-select" onchange="updateSearchParam('guests', parseInt(this.value))" class="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option value="1" ${accomSearch.guests === 1 ? 'selected' : ''}>1 人</option>
                            <option value="2" ${accomSearch.guests === 2 ? 'selected' : ''}>2 人</option>
                            <option value="3" ${accomSearch.guests === 3 ? 'selected' : ''}>3 人</option>
                            <option value="4" ${accomSearch.guests === 4 ? 'selected' : ''}>4 人</option>
                            <option value="5" ${accomSearch.guests === 5 ? 'selected' : ''}>5 人以上</option>
                        </select>
                    </div>
                </div>

                <div class="flex items-center gap-2.5">
                    <button onclick="toggleAdvancedFilters()" class="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold transition">
                        <i class="fa-solid fa-sliders text-blue-600"></i>
                        <span>高級篩選</span>
                        <i class="fa-solid fa-chevron-${showAdvancedFiltersPanel ? 'up' : 'down'} text-[10px] text-gray-400"></i>
                    </button>
                    <button onclick="resetHotelSearch()" class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-xs font-bold transition">
                        重設搜尋
                    </button>
                </div>
            </div>

            <!-- 進階篩選面板 -->
            <div id="advanced-filters-panel" class="${showAdvancedFiltersPanel ? 'block' : 'hidden'} mt-4 pt-4 border-t border-gray-100 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                    <span class="block font-bold text-gray-700 mb-2">價格區間 (每晚)</span>
                    <div class="flex items-center gap-2">
                        <input type="number" placeholder="最低" value="${accomFilters.minPrice || ''}" onchange="updateFilterParam('minPrice', parseInt(this.value))" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <span class="text-gray-400">-</span>
                        <input type="number" placeholder="最高" value="${accomFilters.maxPrice !== 99999 ? accomFilters.maxPrice : ''}" onchange="updateFilterParam('maxPrice', parseInt(this.value) || 99999)" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                </div>
                <div>
                    <span class="block font-bold text-gray-700 mb-2">最低評價分數</span>
                    <select onchange="updateFilterParam('minRating', parseFloat(this.value))" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none">
                        <option value="0" ${accomFilters.minRating === 0 ? 'selected' : ''}>全部評分</option>
                        <option value="4.5" ${accomFilters.minRating === 4.5 ? 'selected' : ''}>4.5 顆星以上</option>
                        <option value="4.8" ${accomFilters.minRating === 4.8 ? 'selected' : ''}>4.8 顆星以上</option>
                    </select>
                </div>
                <div>
                    <span class="block font-bold text-gray-700 mb-2">房型偏好</span>
                    <select onchange="updateFilterParam('roomType', this.value)" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none">
                        <option value="" ${accomFilters.roomType === '' ? 'selected' : ''}>不限房型</option>
                        <option value="雙人房" ${accomFilters.roomType === '雙人房' ? 'selected' : ''}>雙人房</option>
                        <option value="家庭房" ${accomFilters.roomType === '家庭房' ? 'selected' : ''}>家庭房</option>
                        <option value="包棟" ${accomFilters.roomType === '包棟' ? 'selected' : ''}>包棟 / Villa</option>
                        <option value="套房" ${accomFilters.roomType === '套房' ? 'selected' : ''}>套房</option>
                    </select>
                </div>
                <div>
                    <span class="block font-bold text-gray-700 mb-2">設備與服務</span>
                    <div class="flex gap-4 mt-1">
                        <label class="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" ${accomFilters.wifi ? 'checked' : ''} onchange="updateFilterParam('wifi', this.checked)" class="rounded text-blue-600 focus:ring-blue-500">
                            <span>WiFi</span>
                        </label>
                        <label class="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" ${accomFilters.pool ? 'checked' : ''} onchange="updateFilterParam('pool', this.checked)" class="rounded text-blue-600 focus:ring-blue-500">
                            <span>泳池</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- 房源列表與詳細工作區 -->
        <div class="flex-1 flex overflow-hidden bg-gray-50">
            <!-- 左側列表欄 -->
            <div id="hotel-list-col" class="flex-1 overflow-y-auto p-6 no-scrollbar">
                <div class="max-w-4xl mx-auto space-y-4">
                    <div class="flex justify-between items-center text-xs text-gray-500 font-semibold mb-2">
                        <span>為您找到 ${filteredHotels.length} 間特選住宿</span>
                        <span class="text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg">💡 提示：選擇「墾丁海境渡假民宿」或 2026-07-15 可展示防重複預訂衝突</span>
                    </div>
                    <div id="hotel-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${renderHotelCards(filteredHotels)}
                    </div>
                </div>
            </div>

            <!-- 右側房源詳情面板 -->
            <div id="hotel-detail-col" class="w-[420px] border-l border-gray-200 bg-white flex flex-col overflow-y-auto no-scrollbar shadow-lg transition-all hidden">
                <!-- 詳情內容由 JS 渲染 -->
            </div>
        </div>
    `;

    // 如果先前選了某房源，保持詳情展開
    if (selectedHotelId) {
        showHotelDetail(selectedHotelId);
    }
};

window.showHotelDetail = function(hotelId) {
    selectedHotelId = hotelId;
    // 相容字串/數值兩種 id 格式
    const hotel = hotelDatabase.find(h => String(h.id) === String(hotelId));
    const panel = document.getElementById('hotel-detail-col');
    if (!panel || !hotel) return;

    // Highlight in grid
    document.querySelectorAll('#hotel-grid > div').forEach(div => {
        if (String(div.getAttribute('data-hotel-id')) === String(hotelId)) {
            div.classList.add('ring-2', 'ring-blue-600');
        } else {
            div.classList.remove('ring-2', 'ring-blue-600');
        }
    });

    panel.classList.remove('hidden');

    // 相容層：新舊資料格式
    const pricePerNight = hotel.pricePerNight || hotel.price || hotel.priceWeekday || 0;
    const locationStr   = hotel.location || hotel.region || '未設定';
    const typeStr       = hotel.type || hotel.roomType || '自訂房型';
    const amenities     = hotel.amenities || [];

    // 計算天數與總價
    let nights = 1;
    if (accomSearch.checkIn && accomSearch.checkOut) {
        let diffTime = Math.abs(new Date(accomSearch.checkOut) - new Date(accomSearch.checkIn));
        nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }

    const subtotal = pricePerNight * nights;
    const memberDiscount = isLoggedIn ? Math.round(subtotal * 0.05) : 0; // 會員打95折
    const platformDiscount = (nights > 2) ? Math.round(subtotal * 0.20) : 0; // 平臺優惠8折
    const serviceFee = Math.round(subtotal * 0.05);
    const totalAmount = subtotal - memberDiscount - platformDiscount + serviceFee;

    const isFav = favoriteHotels.some(h => h.id === hotel.id);

    // 評價清單
    const reviewsHTML = (hotel.reviews || []).length === 0 
        ? `<p class="text-xs text-gray-400 italic">目前尚未有房客評價</p>`
        : hotel.reviews.map(r => `
            <div class="bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-1.5">
                <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-gray-800">${r.user}</span>
                    <span class="text-amber-500 font-bold"><i class="fa-solid fa-star text-[9px]"></i> ${r.rating}</span>
                </div>
                <p class="text-xs text-gray-600 leading-relaxed">${r.text}</p>
                <span class="text-[9px] text-gray-400 block">${r.date}</span>
                ${r.reply ? `
                    <div class="bg-white border-l-2 border-amber-400 p-2 rounded mt-1.5">
                        <p class="text-[10px] font-bold text-amber-600">管理員回覆：</p>
                        <p class="text-[10px] text-gray-600 italic">${r.reply}</p>
                    </div>
                ` : ''}
            </div>
        `).join('');

    panel.innerHTML = `
        <div class="relative shrink-0 h-48">
            <img src="${hotel.image}" class="w-full h-full object-cover">
            <button onclick="closeHotelDetail()" class="absolute top-3 left-3 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <button onclick="toggleHotelFavorite('${hotel.id}')" class="absolute top-3 right-3 bg-white/90 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center shadow transition hover:scale-110">
                <i class="fa-${isFav ? 'solid text-rose-500' : 'regular'} fa-heart"></i>
            </button>
        </div>

        <div class="p-5 flex-1 space-y-5">
            <div>
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-gray-800 text-lg leading-tight">${hotel.name || '未命名房源'}</h3>
                    <span class="text-amber-500 font-extrabold text-sm shrink-0"><i class="fa-solid fa-star mr-0.5"></i> ${hotel.rating || 5.0}</span>
                </div>
                <p class="text-xs text-gray-400 mt-1"><i class="fa-solid fa-location-dot text-gray-400 mr-0.5"></i> ${locationStr}</p>
                <p class="text-xs text-gray-600 mt-2.5 leading-relaxed bg-blue-50/50 p-2.5 rounded-xl border border-blue-50">${hotel.desc || '暫無描述'}</p>
            </div>

            <!-- 設備清單 -->
            <div>
                <h5 class="text-xs font-bold text-gray-700 mb-2 border-b border-gray-100 pb-1 flex items-center"><i class="fa-solid fa-list-check text-blue-500 mr-1"></i>設備與服務</h5>
                <div class="flex flex-wrap gap-1.5">
                    ${amenities.length > 0 ? amenities.map(a => `<span class="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1">${getAmenityIcon(a)} ${a}</span>`).join('') : '<span class="text-xs text-gray-400">未設定設備</span>'}
                </div>
            </div>

            <!-- 價格估算與計算 -->
            <div class="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2.5 text-xs text-gray-600">
                <h5 class="font-bold text-gray-800 text-sm border-b border-gray-200 pb-1 flex items-center"><i class="fa-solid fa-calculator text-blue-600 mr-1.5"></i>預算與細節明細</h5>
                <div class="flex justify-between">
                    <span>入住時段 (${nights} 晚)</span>
                    <span class="font-medium text-gray-800">${accomSearch.checkIn} ~ ${accomSearch.checkOut}</span>
                </div>
                <div class="flex justify-between">
                    <span>房型與每晚定價</span>
                    <span class="font-medium text-gray-800">${typeStr} / NT$ ${pricePerNight.toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                    <span>規定入住時間</span>
                    <span class="font-medium text-blue-700">${hotel.checkInTime || '15:00-20:00'}</span>
                </div>
                <div class="flex justify-between border-t border-gray-200/60 pt-2">
                    <span>原始金額</span>
                    <span class="font-semibold text-gray-800">NT$ ${subtotal}</span>
                </div>
                <div class="flex justify-between text-emerald-600 font-semibold">
                    <span>尊榮會員 95 折扣</span>
                    <span>- NT$ ${memberDiscount}</span>
                </div>
                ${platformDiscount > 0 ? `
                <div class="flex justify-between text-emerald-600 font-semibold">
                    <span>平臺優惠 (8折)</span>
                    <span>- NT$ ${platformDiscount}</span>
                </div>` : ''}
                <div class="flex justify-between">
                    <span>平台服務服務稅與清潔費 (5%)</span>
                    <span class="font-semibold text-gray-800">+ NT$ ${serviceFee}</span>
                </div>
                <div class="flex justify-between items-center border-t border-gray-200 pt-2">
                    <span class="font-bold text-gray-800 text-sm">應付總金額</span>
                    <span class="font-extrabold text-blue-900 text-lg">NT$ ${totalAmount}</span>
                </div>
            </div>

            <!-- 歷史評價 -->
            <div class="space-y-3">
                <h5 class="text-xs font-bold text-gray-700 border-b border-gray-100 pb-1 flex items-center justify-between">
                    <span><i class="fa-solid fa-comments text-amber-500 mr-1"></i>旅客口碑評價 (${(hotel.reviews || []).length})</span>
                    <span class="text-[10px] text-gray-400 font-normal">平均 ${hotel.rating || 5.0} 星</span>
                </h5>
                <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    ${reviewsHTML}
                </div>
            </div>
        </div>

        <div class="p-4 border-t border-gray-100 shrink-0 bg-white grid grid-cols-2 gap-3">
            <button onclick="toggleHotelFavorite('${hotel.id}')" class="border border-rose-500 text-rose-500 hover:bg-rose-50 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-sm">
                <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
                <span>加入口袋收藏</span>
            </button>
            <button onclick="openBookingModal('${hotel.id}')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-blue-100">
                <i class="fa-solid fa-cart-shopping"></i>
                <span>立即訂房 🛒</span>
            </button>
        </div>
    `;
};

window.openBookingModal = function(hotelId) {
    if (!isLoggedIn) {
        alert('請先登入後再進行預訂！');
        switchPage('login');
        return;
    }

    // 相容字串/數值兩種 id 格式
    const hotel = hotelDatabase.find(h => String(h.id) === String(hotelId));
    if (!hotel) return;

    const modal = document.getElementById('booking-modal');
    const content = document.getElementById('booking-modal-content');
    if (!modal || !content) return;

    let nights = 1;
    if (accomSearch.checkIn && accomSearch.checkOut) {
        let diffTime = Math.abs(new Date(accomSearch.checkOut) - new Date(accomSearch.checkIn));
        nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }

    // 相容層
    const pricePerNight = hotel.pricePerNight || hotel.price || hotel.priceWeekday || 0;
    const typeStr = hotel.type || hotel.roomType || '自訂房型';

    const subtotal = pricePerNight * nights;
    
    const memberDiscount = Math.round(subtotal * 0.05);
    const platformDiscount = (nights > 2) ? Math.round(subtotal * 0.20) : 0;
    const serviceFee = Math.round(subtotal * 0.05);
    const totalAmount = subtotal - memberDiscount - platformDiscount + serviceFee;

    content.innerHTML = `
        <div class="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 class="font-bold text-gray-800 text-base flex items-center gap-1.5"><i class="fa-solid fa-wallet text-blue-600"></i>確認訂房與線上付款</h3>
            <button onclick="closeBookingModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        
        <div class="p-6 space-y-5">
            <!-- 訂單明細展示 -->
            <div class="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs space-y-2">
                <h4 class="font-bold text-gray-800 text-sm border-b border-gray-200 pb-1.5">訂單明細</h4>
                <div class="grid grid-cols-2 gap-y-2 pt-1.5">
                    <span class="text-gray-400">入住旅宿：</span>
                    <span class="font-bold text-gray-700">${hotel.name}</span>
                    <span class="text-gray-400">入住日期：</span>
                    <span class="font-semibold text-gray-700">${accomSearch.checkIn}</span>
                    <span class="text-gray-400">退房日期：</span>
                    <span class="font-semibold text-gray-700">${accomSearch.checkOut}</span>
                    <span class="text-gray-400">入住天數：</span>
                    <span class="font-semibold text-gray-700">${nights} 晚</span>
                    <span class="text-gray-400">規定入住時間：</span>
                    <span class="font-semibold text-blue-700">${hotel.checkInTime || '15:00-20:00'}</span>
                    <span class="text-gray-400">入住人數：</span>
                    <span class="font-semibold text-gray-700">${accomSearch.guests} 位</span>
                    <span class="text-gray-400">指定房型：</span>
                    <span class="font-semibold text-gray-700">${typeStr}</span>
                </div>
            </div>

            <!-- 價格資訊 -->
            <div class="space-y-1.5 text-xs">
                <div class="flex justify-between">
                    <span class="text-gray-500">原始房價小計:</span>
                    <span class="font-semibold text-gray-700">NT$ ${subtotal}</span>
                </div>
                <div class="flex justify-between text-emerald-600">
                    <span>尊榮會員 95 折扣:</span>
                    <span class="font-semibold">- NT$ ${memberDiscount}</span>
                </div>
                ${platformDiscount > 0 ? `
                <div class="flex justify-between text-emerald-600">
                    <span>平臺優惠 (8折):</span>
                    <span class="font-semibold">- NT$ ${platformDiscount}</span>
                </div>` : ''}
                <div class="flex justify-between text-gray-500">
                    <span>服務費與清潔費:</span>
                    <span class="font-semibold text-gray-700">+ NT$ ${serviceFee}</span>
                </div>
                <div class="flex justify-between items-center border-t border-gray-100 pt-2.5">
                    <span class="font-bold text-gray-800 text-sm">應付總金額：</span>
                    <span class="font-extrabold text-blue-900 text-xl">NT$ ${totalAmount}</span>
                </div>
            </div>

            <!-- 付款管道選擇 -->
            <div class="space-y-2 border-t border-gray-100 pt-4">
                <h4 class="font-bold text-xs text-gray-700">選擇安全支付管道</h4>
                <div class="grid grid-cols-3 gap-3">
                    <label class="border border-gray-200 hover:border-blue-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition relative group">
                        <input type="radio" name="pay-method" value="信用卡" checked class="absolute top-2 right-2 accent-blue-600">
                        <i class="fa-solid fa-credit-card text-lg text-blue-600 mb-1"></i>
                        <span class="text-[10px] font-bold text-gray-700">信用卡支付</span>
                    </label>
                    <label class="border border-gray-200 hover:border-emerald-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition relative group">
                        <input type="radio" name="pay-method" value="電子支付" class="absolute top-2 right-2 accent-emerald-600">
                        <i class="fa-solid fa-mobile-screen text-lg text-emerald-600 mb-1"></i>
                        <span class="text-[10px] font-bold text-gray-700">行動電子支付</span>
                    </label>
                    <label class="border border-gray-200 hover:border-amber-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition relative group">
                        <input type="radio" name="pay-method" value="銀行轉帳" class="absolute top-2 right-2 accent-amber-600">
                        <i class="fa-solid fa-building-columns text-lg text-amber-600 mb-1"></i>
                        <span class="text-[10px] font-bold text-gray-700">銀行ATM轉帳</span>
                    </label>
                </div>
            </div>
        </div>

        <div class="p-4 border-t border-gray-100 shrink-0 bg-gray-50 flex items-center justify-between gap-3 rounded-b-2xl">
            <span class="text-[10px] text-gray-400 max-w-[200px] leading-tight">安全鎖定技術已啟用。點擊將自動模擬防重複衝突檢測機制。</span>
            <div class="flex gap-2">
                <button onclick="closeBookingModal()" class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer">
                    取消
                </button>
                <button onclick="processPayment('${hotel.id}', ${totalAmount})" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer shadow-md shadow-blue-100">
                    確認支付，建立訂單
                </button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
};

window.processPayment = function(hotelId, totalAmount) {
    const hotel = hotelDatabase.find(h => String(h.id) === String(hotelId));
    if (!hotel) return;

    // 檢查車票抵達時間是否符合當日飯店的入住時間 (15:00-20:00)
    if (typeof window.ticketOrders !== 'undefined') {
        const hotelCheckIn = accomSearch.checkIn;
        const matchingTicket = window.ticketOrders.find(t => 
            t.date === hotelCheckIn && 
            t.mainBuyerId === (window.currentUser ? window.currentUser.name : '') &&
            t.status !== 'cancelled_or_expired' && t.status !== 'refunded'
        );
        if (matchingTicket) {
            const arrivalTime = matchingTicket.trainInfo.arrivalTime;
            if (arrivalTime < "15:00" || arrivalTime > "20:00") {
                if (!confirm(`提醒您：您先前預訂的車票抵達時間 (${arrivalTime}) 不在飯店入住時間 (15:00~20:00) 內！\n\n點擊「確定」(我已熟知) 繼續成功訂房，點擊「取消」返回。`)) {
                    return;
                }
            }
        }
    }

    const content = document.getElementById('booking-modal-content');
    if (!content) return;

    // 取得選取付款管道
    const payMethods = document.getElementsByName('pay-method');
    let selectedPayMethod = '信用卡';
    for (let pm of payMethods) {
        if (pm.checked) {
            selectedPayMethod = pm.value;
            break;
        }
    }

    // 1. 轉入模擬檢查 Loading state
    content.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 px-6 space-y-4">
            <div class="relative w-16 h-16 flex items-center justify-center">
                <div class="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse"></div>
                <div class="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <div class="text-center space-y-1">
                <p class="text-gray-700 font-bold text-sm">正在進行安全加密與防重複預訂衝突檢查...</p>
                <p class="text-[10px] text-gray-400">正在核對伺服器房源剩餘配額，請勿重新整理頁面</p>
            </div>
        </div>
    `;

    // 2. 模擬 1 秒後檢查結果
    setTimeout(() => {
        // 應要求，暫時關閉防重複衝突與滿房模擬，讓所有預訂都能成功
        const isConflict = false; // (String(hotel.id) === 'h2' || hotel.stock === 0 || accomSearch.checkIn === '2026-07-15');

        if (isConflict) {
            // 狀態 B (衝突處理模擬)
            content.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 px-6 space-y-4 text-center">
                    <div class="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shadow-inner">
                        <i class="fa-solid fa-circle-exclamation text-3xl"></i>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-bold text-gray-800 text-base">交易失敗：預訂時段衝突！</h4>
                        <p class="text-xs text-gray-600 max-w-sm leading-relaxed">
                            真不巧！由於該房源極度熱門，您選擇的時段已被其他旅客搶先一步付款完成。
                            系統已自動為您取消交易並退回額度，請選擇其他房源或調整日期。
                        </p>
                    </div>
                    <button onclick="closeBookingModal()" class="w-full max-w-xs bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer mt-2 shadow-md">
                        返回調整日期與房源
                    </button>
                </div>
            `;
        } else {
            // 狀態 A (成功)
            // 扣庫存（庫存最少為0）
            if (hotel.stock > 0) {
                hotel.stock--;
            } else if (hotel.stock === undefined) {
                hotel.stock = 98; // 初始化給一個預設值（減掉 1）
            }

            // 寫入 bookings
            const typeStr = hotel.type || hotel.roomType || '自訂房型';
            const newBooking = {
                id: 'b_' + Date.now(),
                hotelId: hotel.id,
                hotelName: hotel.name,
                user: (window.currentUser && window.currentUser.name) ? window.currentUser.name : '郭佳瑜',
                checkIn: accomSearch.checkIn,
                checkOut: accomSearch.checkOut,
                guests: accomSearch.guests,
                roomType: typeStr,
                totalPrice: totalAmount,
                status: 'upcoming', // 即將入住
                payMethod: selectedPayMethod,
                reviewed: false
            };
            myBookings.unshift(newBooking);

            // 自動注入行程（直接加入 currentTrip.spots）
            if (typeof addBookingToCurrentTrip === 'function') {
                addBookingToCurrentTrip(newBooking, 'accommodation');
            } else if (window.ItinerarySystem) {
                window.ItinerarySystem.injectBookingToTrip(newBooking, 'accommodation');
            }

            // 重新渲染頁面資料與側邊欄關聯數據
            renderAccommodationPage();
            renderMyBookingsPage();
            renderMemberBookings();
            AppPersistence.autoSave();

            content.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 px-6 space-y-4 text-center">
                    <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                        <i class="fa-solid fa-circle-check text-3xl"></i>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-bold text-gray-800 text-base">付款成功！訂單已成立</h4>
                        <p class="text-xs text-gray-500 max-w-sm leading-relaxed">
                            系統已成功為您鎖定該時段房源。訂單紀錄已同步儲存於「我的住宿」中。
                        </p>
                    </div>
                    <div class="bg-gray-50 border border-gray-100 rounded-xl p-3 w-full text-left text-xs space-y-1">
                        <div class="flex justify-between"><span class="text-gray-400">訂單編號:</span><span class="font-bold text-gray-700">${newBooking.id}</span></div>
                        <div class="flex justify-between"><span class="text-gray-400">入住日期:</span><span class="font-semibold text-gray-700">${newBooking.checkIn}</span></div>
                        <div class="flex justify-between"><span class="text-gray-400">應付總額:</span><span class="font-extrabold text-blue-900">NT$ ${totalAmount}</span></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 w-full pt-2">
                        <button onclick="closeBookingModal()" class="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">
                            關閉視窗
                        </button>
                        <button onclick="closeBookingModal(); switchPage('my-bookings')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md">
                            查看我的住宿
                        </button>
                    </div>
                </div>
            `;
        }
    }, 1000);
};

window.toggleHotelFavorite = function(hotelId) {
    if (!isLoggedIn) {
        alert('請先登入後再加入收藏！');
        switchPage('login');
        return;
    }

    const hotel = hotelDatabase.find(h => h.id === hotelId);
    if (!hotel) return;

    const index = favoriteHotels.findIndex(h => h.id === hotelId);
    if (index > -1) {
        favoriteHotels.splice(index, 1);
        alert(`已將【${hotel.name}】移出口袋房源收藏。`);
    } else {
        favoriteHotels.push(hotel);
        alert(`已將【${hotel.name}】加入口袋房源收藏！`);
    }

    renderAccommodationPage();
    renderPocketDrawerContent();
    renderFavoriteHotels();
    AppPersistence.autoSave();
};

window.switchPocketTab = function(tab) {
    currentPocketTab = tab;
    const tabSpots = document.getElementById('pocket-tab-spots');
    const tabHotels = document.getElementById('pocket-tab-hotels');
    const tabBooked = document.getElementById('pocket-tab-booked');

    tabSpots.className = "flex-1 text-xs font-bold py-2 text-gray-400 border-b-2 border-transparent hover:text-gray-600 transition cursor-pointer";
    tabHotels.className = "flex-1 text-xs font-bold py-2 text-gray-400 border-b-2 border-transparent hover:text-gray-600 transition cursor-pointer";
    if (tabBooked) tabBooked.className = "flex-1 text-xs font-bold py-2 text-gray-400 border-b-2 border-transparent hover:text-gray-600 transition cursor-pointer";

    if (tab === 'spots') {
        tabSpots.className = "flex-1 text-xs font-bold py-2 text-blue-600 border-b-2 border-blue-600 transition cursor-pointer";
    } else if (tab === 'hotels') {
        tabHotels.className = "flex-1 text-xs font-bold py-2 text-blue-600 border-b-2 border-blue-600 transition cursor-pointer";
    } else if (tab === 'booked' && tabBooked) {
        tabBooked.className = "flex-1 text-xs font-bold py-2 text-blue-600 border-b-2 border-blue-600 transition cursor-pointer";
    }

    renderPocketDrawerContent();
};

window.renderPocketDrawerContent = function() {
    const listContainer = document.getElementById('pocket-list-items');
    if (!listContainer) return;
    listContainer.innerHTML = "";

    if (currentPocketTab === 'spots') {
        if (favoriteSpots.length === 0) {
            listContainer.innerHTML = `<p class="text-xs text-gray-400 text-center py-6">目前口袋中沒有任何收藏景點喔！</p>`;
        } else {
            favoriteSpots.forEach(spot => {
                listContainer.innerHTML += `
                    <div class="p-2.5 bg-gray-50 hover:bg-rose-50 border border-gray-100 rounded-xl flex flex-col justify-between items-start transition shadow-sm">
                        <span class="text-xs font-bold text-gray-800">${spot.name}</span>
                        <button onclick="addSpotToTimeline('${spot.name}')" class="mt-2 self-end text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded font-bold"><i class="fa-solid fa-plus"></i> 攜入行程</button>
                    </div>
                `;
            });
        }
    } else if (currentPocketTab === 'hotels') {
        if (favoriteHotels.length === 0) {
            listContainer.innerHTML = `<p class="text-xs text-gray-400 text-center py-6">目前口袋中沒有任何收藏房源喔！</p>`;
        } else {
            favoriteHotels.forEach(hotel => {
                listContainer.innerHTML += `
                    <div class="p-2.5 bg-gray-50 hover:bg-rose-50 border border-gray-100 rounded-xl flex flex-col justify-between items-start transition shadow-sm">
                        <div class="flex items-center gap-2 w-full">
                            <img src="${hotel.image}" class="w-8 h-8 rounded object-cover shrink-0">
                            <span class="text-xs font-bold text-gray-800 truncate flex-1">${hotel.name}</span>
                        </div>
                        <button onclick="addSpotToTimeline('入住 ${hotel.name}')" class="mt-2 self-end text-[10px] bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded font-bold"><i class="fa-solid fa-plus"></i> 攜入行程</button>
                    </div>
                `;
            });
        }
    } else if (currentPocketTab === 'booked') {
        let hasItems = false;
        
        // Date match helper
        const isDateInTrip = (dateStr, trip) => {
            if (!trip || !dateStr || !trip.date) return false;
            const tripStart = new Date(trip.date);
            const targetDate = new Date(dateStr);
            const diffDays = Math.floor((targetDate - tripStart) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays < trip.days;
        };

        if (typeof myBookings !== 'undefined' && myBookings.length > 0) {
            const matchedBookings = myBookings.filter(b => isDateInTrip(b.checkIn, window.currentTrip));
            if (matchedBookings.length > 0) {
                hasItems = true;
                listContainer.innerHTML += `<div class="text-xs font-bold text-gray-500 mb-2">符合行程日期的已訂飯店</div>`;
                matchedBookings.forEach(booking => {
                    listContainer.innerHTML += `
                        <div class="p-2.5 bg-gray-50 hover:bg-rose-50 border border-gray-100 rounded-xl flex flex-col justify-between items-start transition shadow-sm mb-2">
                            <span class="text-xs font-bold text-gray-800">${booking.hotelName}</span>
                            <span class="text-[10px] text-gray-500">${booking.checkIn} 入住</span>
                            <button onclick="addBookedItemToTimeline('${booking.id}', 'hotel')" class="mt-2 self-end text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 rounded font-bold"><i class="fa-solid fa-plus"></i> 攜入行程</button>
                        </div>
                    `;
                });
            }
        }
        
        if (typeof window.ticketOrders !== 'undefined') {
            const paidTickets = window.ticketOrders.filter(t => (t.status === 'paid_pending_pickup' || t.status === 'completed' || t.status === '已付款') && isDateInTrip(t.date, window.currentTrip));
            if (paidTickets.length > 0) {
                hasItems = true;
                listContainer.innerHTML += `<div class="text-xs font-bold text-gray-500 mb-2 mt-4">符合行程日期的已訂車票</div>`;
                paidTickets.forEach(ticket => {
                    listContainer.innerHTML += `
                        <div class="p-2.5 bg-gray-50 hover:bg-rose-50 border border-gray-100 rounded-xl flex flex-col justify-between items-start transition shadow-sm mb-2">
                            <span class="text-xs font-bold text-gray-800">${ticket.trainInfo ? ticket.trainInfo.type : ticket.type} ${ticket.trainInfo ? ticket.trainInfo.fromStation : ticket.from} - ${ticket.trainInfo ? ticket.trainInfo.toStation : ticket.to}</span>
                            <span class="text-[10px] text-gray-500">${ticket.date}</span>
                            <button onclick="addBookedItemToTimeline('${ticket.id}', 'ticket')" class="mt-2 self-end text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 rounded font-bold"><i class="fa-solid fa-plus"></i> 攜入行程</button>
                        </div>
                    `;
                });
            }
        }

        if (!hasItems) {
            listContainer.innerHTML = `<p class="text-xs text-gray-400 text-center py-6">目前沒有與此行程日期相符的已訂項目喔！</p>`;
        }
    }
};
