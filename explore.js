// --- 探索景點模組 (Explore Module) ---

window.filterExploreCategory = function(category, regionOverride) {
    currentExploreCategory = category;
    const region = regionOverride || document.getElementById('explore-region-select').value || '高雄市';

    // --- 快捷鍵按鈕高亮切換 ---
    document.querySelectorAll('.explore-tab-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700');
        btn.classList.add('bg-white', 'text-gray-700', 'hover:bg-blue-50');
    });
    if (category !== 'default') {
        document.querySelectorAll('.explore-tab-btn').forEach(btn => {
            if (btn.getAttribute('onclick') === `filterExploreCategory('${category}')`) {
                btn.classList.remove('bg-white', 'text-gray-700', 'hover:bg-blue-50');
                btn.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700');
            }
        });
        // 顯示地圖上的分類標記（地圖不移動）
        showExploreMapMarkers(category, region);
    } else {
        // 預設：清除標記
        const mc = document.getElementById('explore-map-markers-container');
        if (mc) mc.innerHTML = '';
    }

    // --- 下方清單動態資料 ---
    const categoryTemplates = {
        station: [
            { name: "台鐵主要樞紐", desc: "該區最重要的門戶交通樞紐", icon: "fa-train-subway", color: "text-blue-600", bg: "bg-blue-50" },
            { name: "地區轉運站", desc: "長途客運與地方公車轉運中心", icon: "fa-bus", color: "text-emerald-600", bg: "bg-emerald-50" },
            { name: "客運總站", desc: "長途客運集散地，往返超便利", icon: "fa-bus", color: "text-sky-500", bg: "bg-sky-50" }
        ],
        spot: [
            { name: "熱門打卡新地標", desc: "最新落成的超美攝影勝地", icon: "fa-camera-retro", color: "text-emerald-600", bg: "bg-emerald-50" },
            { name: "文青必訪藝術區", desc: "充滿文藝氣息的休閒好去處", icon: "fa-mountain-sun", color: "text-emerald-500", bg: "bg-emerald-50" },
            { name: "歷史老街漫遊", desc: "保留百年風華的傳統街廓", icon: "fa-landmark", color: "text-teal-600", bg: "bg-teal-50" }
        ],
        food: [
            { name: "在地老字號排隊美食", desc: "三十年傳承的難忘好味道", icon: "fa-bowl-food", color: "text-amber-500", bg: "bg-amber-50" },
            { name: "超人氣排隊夜市小吃", desc: "晚來就吃不到的吮指美味", icon: "fa-utensils", color: "text-amber-600", bg: "bg-amber-50" },
            { name: "在地人推薦早午餐", desc: "隱藏巷弄裡的療癒好味道", icon: "fa-egg", color: "text-orange-500", bg: "bg-orange-50" }
        ],
        hotel: [
            { name: "市中心奢華星級酒店", desc: "無可挑剔的尊榮旅宿體驗", icon: "fa-bed", color: "text-purple-600", bg: "bg-purple-50" },
            { name: "高CP值質感青旅", desc: "年輕人最愛的設計風住宿", icon: "fa-hotel", color: "text-indigo-600", bg: "bg-indigo-50" },
            { name: "特色海景民宿", desc: "睜開眼睛就是無敵大海景", icon: "fa-house", color: "text-blue-500", bg: "bg-blue-50" }
        ],
        default: [
            { name: "熱門打卡景點", desc: "該區域最受歡迎的必訪勝地", icon: "fa-map-pin", color: "text-rose-500", bg: "bg-rose-50" },
            { name: "在地人私房秘境", desc: "不想人擠人？來這裡就對了", icon: "fa-leaf", color: "text-emerald-500", bg: "bg-emerald-50" },
            { name: "週末放鬆好去處", desc: "適合悠閒漫步的輕旅行點", icon: "fa-sun", color: "text-yellow-500", bg: "bg-yellow-50" }
        ]
    };

    const templateData = categoryTemplates[category] || categoryTemplates['default'];
    const grid = document.getElementById('explore-results-grid');
    grid.innerHTML = '';

    templateData.forEach(item => {
        const fullName = `${region} ${item.name}`;
        grid.innerHTML += `
            <div onclick="openExploreModal('${fullName}')" class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex flex-col justify-between h-36 group">
                <div class="flex items-start justify-between">
                    <div class="${item.bg} w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                        <i class="fa-solid ${item.icon} text-lg ${item.color}"></i>
                    </div>
                    <span class="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded">點擊探索</span>
                </div>
                <div>
                    <h4 class="font-bold text-gray-800 text-sm group-hover:text-blue-700 transition line-clamp-1">${fullName}</h4>
                    <p class="text-xs text-gray-400 mt-1 line-clamp-1">${item.desc}</p>
                </div>
            </div>
        `;
    });
};

window.openExploreModal = function(spotName) {
    selectedModalSpotName = spotName;
    document.getElementById('modal-spot-title').innerText = spotName;
    document.getElementById('explore-modal').classList.remove('hidden');
};

window.handleModalAction = function(actionType) {
    closeExploreModal();
    if (actionType === 'fav') {
        // 防重複
        if (favoriteSpots.some(s => s.name === selectedModalSpotName)) { alert('此景點已經存在於您的收藏名單囉！'); return; }
        favoriteSpots.push({
            id: Date.now(),
            name: selectedModalSpotName,
            location: "探索周邊特選地點"
        });
        renderFavoriteSpots();
        alert(`成功將【${selectedModalSpotName}】儲存至會員口袋清單！`);
    } else if (actionType === 'trip') {
        addSpotToTimeline(selectedModalSpotName, 1);
        alert(`已將【${selectedModalSpotName}】排入您「建立行程」工作區的第 1 天！`);
    }
};
