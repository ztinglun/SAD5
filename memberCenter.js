// --- 會員專區與評價模組 (Member Center & Review Module) ---

window.activeReviewBookingId = null;
window.selectedStars = 5;

window.switchMemberTab = function(tabId) {
    document.querySelectorAll('.member-subtab').forEach(el => el.classList.add('hidden'));
    document.getElementById(`member-subtab-${tabId}`).classList.remove('hidden');

    document.querySelectorAll('#page-member-center button[id^="tab-btn-"]').forEach(btn => {
        btn.classList.remove('border-blue-600', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-400', 'hover:text-gray-600');
    });
    document.getElementById(`tab-btn-${tabId}`).className = "pb-3 border-b-2 border-blue-600 text-blue-600 px-1 cursor-pointer";
};

window.renderFavoriteSpots = function() {
    const container = document.getElementById('favorite-spots-render-container');
    if (!container) return;
    container.innerHTML = "";

    if (favoriteSpots.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-gray-400 text-sm">目前無任何口袋名單，趕快去探索周圍點擊愛心吧！</div>`;
        return;
    }

    favoriteSpots.forEach(spot => {
        container.innerHTML += `
            <div class="bg-white p-3.5 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                <div class="flex items-center space-x-3">
                    <i class="fa-solid fa-heart text-rose-500"></i>
                    <div>
                        <h4 class="font-bold text-gray-800 text-xs">${spot.name}</h4>
                        <p class="text-[10px] text-gray-400 mt-0.5">${spot.location}</p>
                    </div>
                </div>
                <button onclick="cancelFavorite(${spot.id})" class="text-xs text-gray-400 hover:text-rose-500 font-medium px-3 py-1 rounded-lg border border-gray-200 hover:border-rose-100 transition cursor-pointer">
                    取消收藏
                </button>
            </div>
        `;
    });
};

window.renderFavoriteHotels = function() {
    const container = document.getElementById('favorite-hotels-render-container');
    if (!container) return;
    container.innerHTML = "";

    if (favoriteHotels.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-gray-400 text-sm">目前無任何口袋房源，趕快去住宿專區探索點選愛心吧！</div>`;
        return;
    }

    favoriteHotels.forEach(hotel => {
        container.innerHTML += `
            <div class="bg-white p-3.5 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                <div class="flex items-center space-x-3">
                    <img src="${hotel.image}" class="w-10 h-10 rounded object-cover shrink-0">
                    <div>
                        <h4 class="font-bold text-gray-800 text-xs">${hotel.name}</h4>
                        <p class="text-[10px] text-gray-400 mt-0.5">${hotel.location} • NT$ ${hotel.pricePerNight}起</p>
                    </div>
                </div>
                <button onclick="toggleHotelFavorite('${hotel.id}')" class="text-xs text-gray-400 hover:text-rose-500 font-medium px-3 py-1 rounded-lg border border-gray-200 hover:border-rose-100 transition cursor-pointer">
                    取消收藏
                </button>
            </div>
        `;
    });
};

window.cancelFavorite = function(id) {
    favoriteSpots = favoriteSpots.filter(s => s.id !== id);
    renderFavoriteSpots();
    AppPersistence.autoSave();
};

window.addNewFavoriteSpotPrompt = function() {
    const name = prompt("請輸入欲自訂新增的景點/餐廳名稱：");
    if (!name) return;
    favoriteSpots.push({
        id: Date.now(),
        name: name,
        location: "手動自訂收藏項目"
    });
    renderFavoriteSpots();
    AppPersistence.autoSave();
};

window.renderMyBookingsPage = function() {
    const container = document.getElementById('my-bookings-container');
    if (!container) return;

    if (myBookings.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl p-12 text-center border border-gray-100 max-w-lg mx-auto flex flex-col items-center justify-center space-y-4 shadow-sm">
                <div class="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center">
                    <i class="fa-solid fa-bed text-3xl"></i>
                </div>
                <div>
                    <h4 class="font-bold text-gray-800 text-base">目前尚無住宿訂單紀錄</h4>
                    <p class="text-xs text-gray-400 mt-1">規劃下一趟精彩旅行，立刻去探索優質住宿吧！</p>
                </div>
                <button onclick="switchPage('accommodation')" class="bg-brand-blue hover:bg-brand-blue-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-blue-100">
                    瀏覽精選房源
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="flex items-center gap-2 mb-6">
            <i class="fa-solid fa-book-bookmark text-2xl text-blue-600"></i>
            <h2 class="text-2xl font-bold text-gray-800">我的住宿紀錄</h2>
        </div>
        <div class="space-y-4">
            ${myBookings.map(booking => {
                const hotel = hotelDatabase.find(h => h.id === booking.hotelId);
                const hotelImg = hotel ? hotel.image : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80';
                const isCompleted = booking.status === 'completed';
                const badgeColor = isCompleted ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600 font-bold';
                const badgeText = isCompleted ? '已完成離房' : '已付款/待入住';

                return `
                    <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row items-stretch gap-4 hover:shadow-md transition">
                        <img src="${hotelImg}" class="w-full md:w-36 h-28 object-cover rounded-xl shrink-0">
                        <div class="flex-1 flex flex-col justify-between py-1 space-y-3">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-bold text-gray-800 text-base">${booking.hotelName}</h4>
                                    <p class="text-xs text-gray-400 mt-1">${booking.roomType} • ${booking.guests} 人</p>
                                </div>
                                <span class="text-xs ${badgeColor} px-2.5 py-1 rounded-lg">${badgeText}</span>
                            </div>
                            <div class="flex flex-wrap items-center justify-between border-t border-gray-50 pt-2.5 gap-2 text-xs">
                                <div class="flex items-center gap-4 text-gray-500">
                                    <span>入住: <span class="font-semibold text-gray-700">${booking.checkIn}</span></span>
                                    <span>退房: <span class="font-semibold text-gray-700">${booking.checkOut}</span></span>
                                    <span>管道: <span class="font-semibold text-gray-700">${booking.payMethod}</span></span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <span class="font-extrabold text-blue-900 text-base">NT$ ${booking.totalPrice}</span>
                                    ${!booking.reviewed ? `
                                        <button onclick="openReviewModal('${booking.id}')" class="bg-amber-400 hover:bg-amber-500 text-gray-800 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-md shadow-amber-100">
                                            <i class="fa-solid fa-pen-to-square"></i> 撰寫住宿評價
                                        </button>
                                    ` : `
                                        <span class="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                            <i class="fa-solid fa-check text-emerald-500"></i> 已送出評價
                                        </span>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
};

window.renderMemberBookings = function() {
    const container = document.getElementById('member-bookings-render');
    if (!container) return;

    if (myBookings.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-gray-400 text-sm">目前無任何訂房紀錄</div>`;
        return;
    }

    container.innerHTML = myBookings.map(booking => {
        const hotel = hotelDatabase.find(h => h.id === booking.hotelId);
        const hotelImg = hotel ? hotel.image : '';
        const isCompleted = booking.status === 'completed';
        const statusBadge = isCompleted 
            ? `<span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">已完成</span>` 
            : `<span class="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded">即將入住</span>`;

        return `
            <div class="bg-white p-3.5 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-lg bg-cover bg-center shrink-0" style="background-image: url('${hotelImg}')"></div>
                    <div>
                        <h4 class="font-bold text-gray-800 text-xs">${booking.hotelName}</h4>
                        <p class="text-[10px] text-gray-400 mt-0.5">${booking.checkIn} ~ ${booking.checkOut} • ${booking.roomType}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${statusBadge}
                    <span class="text-xs font-bold text-blue-900">NT$ ${booking.totalPrice}</span>
                </div>
            </div>
        `;
    }).join('');
};

window.openReviewModal = function(bookingId) {
    const booking = myBookings.find(b => b.id === bookingId);
    if (!booking) return;

    activeReviewBookingId = bookingId;
    selectedStars = 5; // 預設 5 星

    const modal = document.getElementById('review-modal');
    const content = document.getElementById('review-modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
        <div class="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 class="font-bold text-gray-800 text-base flex items-center gap-1.5"><i class="fa-solid fa-star text-amber-500"></i>撰寫住宿評價</h3>
            <button onclick="closeReviewModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>

        <div class="p-6 space-y-4">
            <div class="bg-gray-50 rounded-xl p-3 text-xs space-y-1 border border-gray-100">
                <p class="font-bold text-gray-800">${booking.hotelName}</p>
                <p class="text-gray-400">入住時間：${booking.checkIn} ~ ${booking.checkOut}</p>
            </div>

            <!-- 評分星等選擇 -->
            <div class="space-y-1.5">
                <label class="block text-xs font-bold text-gray-700">評分星等</label>
                <div class="flex items-center gap-1 text-lg text-amber-400" id="review-stars-container">
                    <i onclick="selectReviewStars(1)" class="fa-solid fa-star cursor-pointer"></i>
                    <i onclick="selectReviewStars(2)" class="fa-solid fa-star cursor-pointer"></i>
                    <i onclick="selectReviewStars(3)" class="fa-solid fa-star cursor-pointer"></i>
                    <i onclick="selectReviewStars(4)" class="fa-solid fa-star cursor-pointer"></i>
                    <i onclick="selectReviewStars(5)" class="fa-solid fa-star cursor-pointer"></i>
                </div>
            </div>

            <!-- 評價內容輸入 -->
            <div class="space-y-1.5">
                <label class="block text-xs font-bold text-gray-700">您的回饋</label>
                <textarea id="review-text-input" rows="4" placeholder="分享您的住宿體驗與評價給其他旅人..." class="w-full border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
            </div>
        </div>

        <div class="p-4 border-t border-gray-100 shrink-0 bg-gray-50 flex justify-end gap-2 rounded-b-2xl">
            <button onclick="closeReviewModal()" class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer">
                取消
            </button>
            <button onclick="submitReview()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer shadow-md">
                送出評價
            </button>
        </div>
    `;

    modal.classList.remove('hidden');
};

window.closeReviewModal = function() {
    const modal = document.getElementById('review-modal');
    if (modal) modal.classList.add('hidden');
};

window.selectReviewStars = function(stars) {
    selectedStars = stars;
    const container = document.getElementById('review-stars-container');
    if (!container) return;
    const starIcons = container.querySelectorAll('i');
    starIcons.forEach((icon, idx) => {
        if (idx < stars) {
            icon.className = "fa-solid fa-star cursor-pointer";
        } else {
            icon.className = "fa-regular fa-star cursor-pointer";
        }
    });
};

window.submitReview = function() {
    const text = document.getElementById('review-text-input').value.trim();
    if (!text) {
        alert('請填寫評價回饋文字！');
        return;
    }

    const booking = myBookings.find(b => b.id === activeReviewBookingId);
    if (!booking) return;

    const hotel = hotelDatabase.find(h => h.id === booking.hotelId);
    if (!hotel) return;

    // 1. 寫入酒店評論庫
    const newReview = {
        user: currentUser ? currentUser.name : '趣趣客',
        rating: selectedStars,
        text: text,
        date: new Date().toISOString().split('T')[0],
        reply: '' // 預設尚未回覆
    };
    hotel.reviews.unshift(newReview);

    // 更新酒店整體星等 (模擬平均星等重算)
    const sum = hotel.reviews.reduce((acc, r) => acc + r.rating, 0);
    hotel.rating = parseFloat((sum / hotel.reviews.length).toFixed(1));
    hotel.totalReviews = hotel.reviews.length;

    // 2. 標記訂單為已評價
    booking.reviewed = true;

    // 3. 關閉彈窗並更新畫面
    closeReviewModal();
    renderAccommodationPage();
    renderMyBookingsPage();
    renderMemberBookings();
    alert('感謝您的評價！');
    AppPersistence.autoSave();

    // 4. 觸發 2 秒後「管理員回覆」模擬機制
    setTimeout(() => {
        const replies = [
            '感謝您的蒞臨與支持！我們會持續精進服務品質，期待下次再度為您提供完美的旅宿服務！',
            '很高興您滿意我們的住宿環境與地理位置！隨時歡迎您再次光臨！',
            '您的肯定給予我們很大的動力！全體服務同仁在此向您致謝，祝您旅行愉快！'
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        newReview.reply = randomReply;

        // 重新渲染，使最新評價與管理員回覆即時呈現中
        renderAccommodationPage();
        renderMyBookingsPage();
        
        // 提示通知
        showToastNotification(`您對「${hotel.name}」的評價已收到來自管理員的最新回覆！`);
    }, 2000);
};
