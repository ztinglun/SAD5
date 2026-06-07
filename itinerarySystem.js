/**
 * 🚀 智慧行程管理系統 (ItinerarySystem) - 核心業務邏輯架構 (已修正台南資料與新增拖拽功能)
 * 涵蓋模組：1.1 行程建立 | 1.2 行程編排 | 1.3 行程管理 | 1.4 協作社交 | 1.5 費用管理 | 1.6 進階擴充
 * 地區設定：台南、高雄、屏東 專屬資料庫
 */

const ItinerarySystem = {
    // ==========================================
    // 0. 核心資料庫 (預設鎖定：台南、高雄、屏東)
    // ==========================================
    db: {
        locations: {
            "台南": {
                stations: ["台南火車站", "保安火車站", "台南轉運站"],
                recommendations: {
                    attractions: [{ id: "tn-1", name: "安平古堡", desc: "充滿歷史與故事的紅磚古城" }, { id: "tn-2", name: "赤崁樓", desc: "荷蘭時期至今的台南經典地標" }],
                    restaurants: [{ id: "tn-3", name: "文章牛肉湯", desc: "在地人與觀光客必吃的清甜溫體牛" }, { id: "tn-4", name: "度小月擔仔麵", desc: "傳承百年的經典台南在地風味" }],
                    activities: [{ id: "tn-5", name: "四草綠色隧道竹筏巡航", desc: "探訪台版亞馬遜的袖珍紅樹林" }, { id: "tn-6", name: "十鼓文創園區極限體驗", desc: "老糖廠改建的刺激高空巨體滑梯" }]
                }
            },
            "高雄": {
                stations: ["台鐵新左營站", "台鐵高雄車站", "高雄捷運美麗島站"],
                recommendations: {
                    attractions: [{ id: "kh-1", name: "駁二藝術特區", desc: "海港旁的文創與藝術倉庫群" }, { id: "kh-2", name: "旗津彩虹教堂", desc: "網美必拍的浪漫海邊裝置藝術" }],
                    restaurants: [{ id: "kh-3", name: "丹丹漢堡(五甲店)", desc: "南台灣限定的速食南霸天" }, { id: "kh-4", name: "六合夜市老牌海產粥", desc: "料多實在的爆棚海鮮美味" }],
                    activities: [{ id: "kh-5", name: "愛河貢多拉船遊河", desc: "浪漫夜遊聆聽船員現場駐唱" }, { id: "kh-6", name: "旗津踩風單車輕旅行", desc: "吹著海風沿著海岸線騎行" }]
                }
            },
            "屏東": {
                stations: ["台鐵屏東車站", "台鐵潮州車站", "恆春轉運站"],
                recommendations: {
                    attractions: [{ id: "pt-1", name: "墾丁白沙灣", desc: "潔白細緻的沙灘與清澈海水" }, { id: "pt-2", name: "鵝鑾鼻燈塔", desc: "台灣最南端的純白巨型燈塔" }],
                    restaurants: [{ id: "pt-3", name: "後壁湖現撈生魚片", desc: "便宜大碗、厚度爆表的極鮮刺身" }, { id: "pt-4", name: "萬巒豬腳創始店", desc: "外皮Q彈、肉質扎實的特製豬腳" }],
                    activities: [{ id: "pt-5", name: "墾丁萬里桐萬花筒浮潛", desc: "探索蔚藍海底與熱帶魚共舞" }, { id: "pt-6", name: "佳樂水衝浪極限體驗", desc: "浪人齊聚的南台灣衝浪天堂" }]
                }
            }
        },
        // 系統動態狀態暫存
        trips: [],          // 行程列表
        wishlist: [],       // 願望清單 (1.6.1)
        currentTrip: null,   // 當前選取/編輯中的行程
        deletedMemberBackup: null, // 成員移除暫存(用於復原機制)
        // 首頁探索 mock 資料
        inspirations: [
            { id: 'insp-1', name: '台南文青二日遊', desc: '巷弄咖啡與老屋探險', image: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=400&q=80' },
            { id: 'insp-2', name: '高雄港都夕陽', desc: '漫步駁二與旗津海岸', image: 'https://images.unsplash.com/photo-1590074062402-23c21a1ebcc5?w=400&q=80' }
        ],
        starTrips: [
            { id: 'star-1', name: '墾丁三天兩夜夏日行', desc: '浮潛與沙灘車極限體驗', image: 'https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?w=400&q=80' }
        ],
        historyTrips: [
            { id: 'hist-1', name: '去年台南美食團', desc: '文章牛肉湯與丹丹漢堡', image: 'https://images.unsplash.com/photo-1626359573887-a2f0bf26a71d?w=400&q=80' }
        ]
    },

    // ==========================================
    // 1.1 & 1.2 行程建立與編排模組
    // ==========================================
    initCreateForm() {
        const root = document.getElementById('itinerary-hub-root');
        root.innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-2xl mx-auto space-y-6">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2"><i class="fa-solid fa-calendar-plus text-indigo-600"></i> 1.1 建立全新行程</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">行程名稱</label>
                        <input type="text" id="trip-name" placeholder="例如：台南美食文青之旅" class="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-indigo-600">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">出發日期</label>
                        <input type="date" id="trip-date" class="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-indigo-600">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">旅遊天數</label>
                        <input type="number" id="trip-days" min="1" max="7" value="1" class="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-indigo-600">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">目的地點</label>
                        <select id="trip-location" onchange="ItinerarySystem.handleLocationChange(this.value)" class="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-indigo-600">
                            <option value="">-- 請選擇地點 --</option>
                            <option value="台南">台南市</option>
                            <option value="高雄">高雄市</option>
                            <option value="屏東">屏東縣</option>
                        </select>
                    </div>
                </div>

                <!-- 動態顯示車站與推薦景點 -->
                <div id="location-recommendation-block" class="hidden space-y-4 border-t border-gray-100 pt-4">
                    <div>
                        <h4 class="text-xs font-extrabold text-indigo-600 flex items-center gap-1"><i class="fa-solid fa-train"></i> 周邊車站參考</h4>
                        <div id="rec-stations" class="flex flex-wrap gap-2 mt-1.5"></div>
                    </div>
                    <div>
                        <h4 class="text-xs font-extrabold text-amber-600 flex items-center gap-1"><i class="fa-solid fa-wand-magic-sparkles"></i> 官方熱門推薦 (點擊可直接加入)</h4>
                        <div id="rec-items" class="grid grid-cols-1 gap-2 mt-1.5"></div>
                    </div>
                    <div class="border-t border-dashed border-gray-200 pt-3">
                        <label class="block text-xs font-bold text-gray-500 mb-1">💡 自訂想去的景點/餐廳/活動</label>
                        <div class="flex gap-2">
                            <input type="text" id="custom-spot-name" placeholder="輸入自訂地點名稱" class="flex-1 border border-gray-200 rounded-xl p-2 text-xs">
                            <select id="custom-spot-type" class="border border-gray-200 rounded-xl p-2 text-xs">
                                <option value="attractions">景點</option>
                                <option value="restaurants">餐廳</option>
                                <option value="activities">活動</option>
                            </select>
                            <button onclick="ItinerarySystem.addCustomSpot()" class="bg-gray-800 text-white text-xs px-4 rounded-xl font-bold hover:bg-gray-900 transition">新增</button>
                        </div>
                    </div>
                </div>

                <!-- 已暫存待排行程清點 -->
                <div class="border-t border-gray-100 pt-4">
                    <h4 class="text-xs font-bold text-gray-700 mb-2">已挑選放入清單的地點：</h4>
                    <div id="selected-spots-pool" class="space-y-2 text-xs text-gray-400 italic">尚未選擇任何地點...</div>
                </div>

                <div class="flex justify-end gap-2 border-t border-gray-100 pt-4">
                    <button onclick="ItinerarySystem.renderList()" class="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-xl transition">取消</button>
                    <button onclick="ItinerarySystem.saveNewTrip()" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-sm transition">進入行程編排總覽 <i class="fa-solid fa-arrow-right ml-1"></i></button>
                </div>
            </div>
        `;
        this.tempSelectedSpots = [];
    },

    handleLocationChange(loc) {
        const block = document.getElementById('location-recommendation-block');
        if (!loc) { block.classList.add('hidden'); return; }
        block.classList.remove('hidden');

        const data = this.db.locations[loc];
        
        // 渲染車站
        document.getElementById('rec-stations').innerHTML = data.stations.map(s => 
            `<span class="bg-slate-100 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200"><i class="fa-solid fa-location-dot text-slate-400 mr-1"></i>${s}</span>`
        ).join('');

        // 渲染官方推薦
        let html = '';
        ['attractions', 'restaurants', 'activities'].forEach(type => {
            const labelMap = { attractions: '景點', restaurants: '餐廳', activities: '活動' };
            data.recommendations[type].forEach(item => {
                html += `
                    <div class="bg-gray-50 border border-gray-200 rounded-xl p-3 flex justify-between items-center hover:bg-gray-100 transition">
                        <div>
                            <span class="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold mr-1.5">${labelMap[type]}</span>
                            <strong class="text-xs text-gray-700">${item.name}</strong>
                            <p class="text-[11px] text-gray-400 mt-0.5">${item.desc}</p>
                        </div>
                        <div class="flex gap-1.5">
                            <button onclick="ItinerarySystem.addRecommendSpot('${item.name}', '${type}', '必去')" class="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold px-2 py-1 rounded-lg border border-amber-200 transition">＋必去</button>
                            <button onclick="ItinerarySystem.addRecommendSpot('${item.name}', '${type}', '待考慮')" class="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-1 rounded-lg border border-blue-200 transition">＋待考慮</button>
                        </div>
                    </div>
                `;
            });
        });
        document.getElementById('rec-items').innerHTML = html;
    },

    addRecommendSpot(name, type, priority) {
        this.tempSelectedSpots.push({ name, type, priority, note: "" });
        this.updateSelectedSpotsPool();
    },

    addCustomSpot() {
        const nameInput = document.getElementById('custom-spot-name');
        const typeSelect = document.getElementById('custom-spot-type');
        if (!nameInput.value.trim()) { alert('請輸入自訂地點名稱！'); return; }
        this.tempSelectedSpots.push({
            name: nameInput.value.trim(),
            type: typeSelect.value,
            priority: "自訂",
            note: ""
        });
        nameInput.value = '';
        this.updateSelectedSpotsPool();
    },

    updateSelectedSpotsPool() {
        const pool = document.getElementById('selected-spots-pool');
        if (this.tempSelectedSpots.length === 0) {
            pool.innerHTML = `尚未選擇任何地點...`;
            return;
        }
        pool.innerHTML = this.tempSelectedSpots.map((s, idx) => `
            <div class="flex items-center justify-between bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 text-xs">
                <span class="text-gray-700 font-medium">
                    <span class="bg-gray-200 text-gray-700 font-bold px-1 rounded text-[10px] mr-1">${s.priority}</span>
                    ${s.name} (${s.type === 'attractions' ? '景點' : s.type === 'restaurants' ? '餐廳' : '活動'})
                </span>
                <button onclick="ItinerarySystem.tempSelectedSpots.splice(${idx}, 1); ItinerarySystem.updateSelectedSpotsPool();" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `).join('');
    },

    saveNewTrip() {
        const name = document.getElementById('trip-name').value.trim();
        const date = document.getElementById('trip-date').value;
        const days = parseInt(document.getElementById('trip-days').value) || 1;
        const location = document.getElementById('trip-location').value;

        if (!name || !date || !location) { alert('請完整填寫行程名稱、日期與目的地地點！'); return; }

        // 初始化天數框架
        const schedule = {};
        for (let i = 1; i <= days; i++) { schedule[`Day ${i}`] = []; }
        
        // 將選取的地點塞入第一天作為預設
        this.tempSelectedSpots.forEach(s => {
            schedule["Day 1"].push(s);
        });

        const newTrip = {
            id: 'trip_' + Date.now(),
            name, date, days, location,
            schedule,
            budgetLimit: 20000, 
            expenses: [],       
            collaborators: ["你 (創立者)", "小明", "大華"],
            onlineEditors: ["你", "小明"],
            comments: [
                { id: "c1", author: "小明", text: "第一天行程感覺有點趕，大家怎麼看？", votes: 0 }
            ]
        };

        this.db.trips.push(newTrip);
        this.db.currentTrip = newTrip;
        this.renderSequenceManager();
    },

    // ==========================================
    // 1.2 行程編排總覽介面 (已升級 HTML5 拖拽支援)
    // ==========================================
    renderSequenceManager() {
        const trip = this.db.currentTrip;
        const root = document.getElementById('itinerary-hub-root');
        
        let daysTabsHtml = '';
        for (let i = 1; i <= trip.days; i++) {
            daysTabsHtml += `
                <button onclick="ItinerarySystem.switchSequenceDay(${i})" id="tab-day-${i}" class="sequence-day-tab px-4 py-2 text-xs font-bold rounded-xl border transition ${i===1?'bg-indigo-600 text-white border-indigo-600':'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}">
                    Day ${i}
                </button>
            `;
        }

        root.innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 gap-2">
                    <div>
                        <span class="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">${trip.location}</span>
                        <h3 class="text-lg font-bold text-gray-800 mt-1"><i class="fa-solid fa-sliders text-indigo-600 mr-1"></i> 1.2 行程順序編排總覽：${trip.name}</h3>
                        <p class="text-xs text-gray-400 mt-0.5">出發日期：${trip.date} (共 ${trip.days} 天) | 💡 提示：可直接「滑鼠拖拽」卡片任意調換順序！</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="ItinerarySystem.saveSequence()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition"><i class="fa-solid fa-cloud-arrow-up mr-1"></i> 保存編排</button>
                    </div>
                </div>

                <!-- 日程切換標籤 -->
                <div class="flex flex-wrap gap-2">
                    ${daysTabsHtml}
                </div>

                <!-- 當日行程項目總覽 -->
                <div class="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 min-h-[300px]">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-xs font-bold text-gray-500" id="current-editing-day-title">正在編排：Day 1</span>
                        <button onclick="ItinerarySystem.quickAddSpotToCurrentDay()" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-lg transition">＋在此天新增景點</button>
                    </div>
                    <div id="sequence-items-list" class="space-y-3"></div>
                </div>
            </div>
        `;
        this.currentEditingDay = 1;
        this.renderSequenceItems();
    },

    switchSequenceDay(dayNum) {
        this.currentEditingDay = dayNum;
        document.querySelectorAll('.sequence-day-tab').forEach(btn => {
            btn.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-600');
            btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
        });
        const activeTab = document.getElementById(`tab-day-${dayNum}`);
        activeTab.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
        activeTab.classList.add('bg-indigo-600', 'text-white', 'border-indigo-600');
        
        document.getElementById('current-editing-day-title').innerText = `正在編排：Day ${dayNum}`;
        this.renderSequenceItems();
    },

    renderSequenceItems() {
        const trip = this.db.currentTrip;
        const dayKey = `Day ${this.currentEditingDay}`;
        const listContainer = document.getElementById('sequence-items-list');
        const items = trip.schedule[dayKey] || [];

        if (items.length === 0) {
            listContainer.innerHTML = `<div class="text-center py-12 text-xs text-gray-400 italic">此日程尚無任何景點，請點選上方按鈕新增！</div>`;
            return;
        }

        listContainer.innerHTML = items.map((item, idx) => `
            <div draggable="true"
                 ondragstart="ItinerarySystem.handleDragStart(event, ${idx})"
                 ondragend="ItinerarySystem.handleDragEnd(event)"
                 ondragover="event.preventDefault()"
                 ondrop="ItinerarySystem.handleDrop(event, ${idx})"
                 class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-move hover:border-indigo-200 transition">
                <div class="flex items-center gap-3 w-full md:w-auto">
                    <!-- 拖拽提示圖標與備用傳統上下排序按鈕 -->
                    <div class="flex items-center gap-1.5 text-gray-400">
                        <i class="fa-solid fa-grip-vertical cursor-grab text-gray-300 hover:text-indigo-500"></i>
                        <div class="flex flex-col gap-0.5">
                            <button onclick="event.stopPropagation(); ItinerarySystem.moveItem(${idx}, -1)" class="text-gray-400 hover:text-indigo-600 text-[10px] p-0.5"><i class="fa-solid fa-chevron-up"></i></button>
                            <button onclick="event.stopPropagation(); ItinerarySystem.moveItem(${idx}, 1)" class="text-gray-400 hover:text-indigo-600 text-[10px] p-0.5"><i class="fa-solid fa-chevron-down"></i></button>
                        </div>
                    </div>
                    <span class="bg-gray-800 text-white font-black rounded-lg w-6 h-6 flex items-center justify-center text-xs">${idx + 1}</span>
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold ${item.bookedDetails ? 'text-blue-700' : 'text-gray-800'} text-sm">${item.name}</h4>
                            ${item.bookedDetails ? `<span class="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold"><i class="fa-solid fa-circle-check"></i> 已預訂</span>` : `
                            <select onchange="ItinerarySystem.updateItemPriority(${idx}, this.value)" class="text-[10px] font-bold border rounded px-1 py-0.5 bg-gray-50 text-gray-600">
                                <option value="必去" ${item.priority==='必去'?'selected':''}>必去</option>
                                <option value="待考慮" ${item.priority==='待考慮'?'selected':''}>待考慮</option>
                                <option value="自訂" ${item.priority==='自訂'?'selected':''}>自訂</option>
                            </select>`}
                        </div>
                        <input type="text" value="${item.note || ''}" placeholder="新增當日行程備註說明..." onchange="ItinerarySystem.updateItemNote(${idx}, this.value)" class="w-full text-xs text-gray-500 mt-1 border-b border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none bg-transparent" ${item.bookedDetails ? 'readonly' : ''}>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); ItinerarySystem.deleteSequenceItem(${idx})" class="text-red-400 hover:text-red-600 text-xs font-medium self-end md:self-center"><i class="fa-solid fa-trash-can mr-1"></i>刪除</button>
            </div>
        `).join('');
    },

    // ==========================================
    // 💡 核心新增：Drag & Drop 拖拽核心算法
    // ==========================================
    handleDragStart(e, index) {
        e.dataTransfer.setData("text/plain", index);
        e.currentTarget.classList.add('opacity-40', 'border-indigo-500', 'border-dashed');
    },

    handleDragEnd(e) {
        e.currentTarget.classList.remove('opacity-40', 'border-indigo-500', 'border-dashed');
    },

    handleDrop(e, targetIndex) {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"));
        if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

        const dayKey = `Day ${this.currentEditingDay}`;
        const items = this.db.currentTrip.schedule[dayKey];
        
        // 陣列項目精確抽換與插入
        const [movedItem] = items.splice(sourceIndex, 1);
        items.splice(targetIndex, 0, movedItem);
        
        // 即時重繪畫面
        this.renderSequenceItems();
    },

    moveItem(index, direction) {
        const dayKey = `Day ${this.currentEditingDay}`;
        const items = this.db.currentTrip.schedule[dayKey];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= items.length) return;
        
        const temp = items[index];
        items[index] = items[targetIndex];
        items[targetIndex] = temp;
        this.renderSequenceItems();
    },

    updateItemPriority(index, val) {
        const dayKey = `Day ${this.currentEditingDay}`;
        this.db.currentTrip.schedule[dayKey][index].priority = val;
    },

    updateItemNote(index, val) {
        const dayKey = `Day ${this.currentEditingDay}`;
        this.db.currentTrip.schedule[dayKey][index].note = val;
    },

    deleteSequenceItem(index) {
        if (!confirm('確認要將此地點自今日行程移除嗎？')) return;
        const dayKey = `Day ${this.currentEditingDay}`;
        this.db.currentTrip.schedule[dayKey].splice(index, 1);
        this.renderSequenceItems();
    },

    quickAddSpotToCurrentDay() {
        const name = prompt("請輸入欲加入的地點名稱：");
        if (!name) return;
        const dayKey = `Day ${this.currentEditingDay}`;
        this.db.currentTrip.schedule[dayKey].push({ name, type: "attractions", priority: "必去", note: "" });
        this.renderSequenceItems();
    },

    saveSequence() {
        alert('🎉 行程順序編排成功，已安全保存至資料庫！');
        this.renderList(); 
    },

    // ==========================================
    // 1.3 行程管理模組 (資料已校正為台南)
    // ==========================================
    renderList() {
        const root = document.getElementById('itinerary-hub-root');
        
        if (this.db.trips.length === 0) {
            this.db.trips = [
                {
                    id: "sample-1",
                    name: "台南古城美食文青三日遊",
                    date: "2026-07-15",
                    days: 3,
                    location: "台南",
                    schedule: {
                        "Day 1": [{ name: "安平古堡", type: "attractions", priority: "必去", note: "記得看夕陽拍紅磚牆" }, { name: "文章牛肉湯", type: "restaurants", priority: "必去", note: "點溫體牛肉大碗" }],
                        "Day 2": [{ name: "赤崁樓", type: "attractions", priority: "必去", note: "周邊吃椪糖冰淇淋" }, { name: "四草綠色隧道竹筏巡航", type: "activities", priority: "待考慮", note: "" }],
                        "Day 3": [{ name: "十鼓文創園區極限體驗", type: "activities", priority: "必去", note: "下午看擊鼓表演" }]
                    },
                    budgetLimit: 15000,
                    expenses: [{ item: "台鐵來回車票", type: "交通", amount: 2600, payer: "你" }, { item: "台南晶英酒店", type: "住宿", amount: 8000, payer: "小明" }],
                    collaborators: ["你 (創立者)", "小明", "大華"],
                    onlineEditors: ["你", "小明"],
                    comments: [{ id: "c1", author: "小明", text: "推溫體牛！超鮮甜", votes: 2 }]
                },
                {
                    id: "sample-2",
                    name: "熱情高雄海港駁二文創大搜查",
                    date: "2026-08-20",
                    days: 1,
                    location: "高雄",
                    schedule: {
                        "Day 1": [{ name: "駁二藝術特區", type: "attractions", priority: "必去", note: "" }, { name: "丹丹漢堡(五甲店)", type: "restaurants", priority: "必去", note: "" }]
                    },
                    budgetLimit: 5000,
                    expenses: [{ item: "駁二展覽門票", type: "娛樂", amount: 600, payer: "大華" }],
                    collaborators: ["你 (創立者)", "大華"],
                    onlineEditors: ["你"],
                    comments: []
                }
            ];
        }

        root.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span class="text-xs font-bold text-gray-600">💡 想要發想新玩法嗎？</span>
                    <button onclick="ItinerarySystem.initCreateForm()" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition">＋ 建立全新行程</button>
                </div>

                <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 class="text-base font-extrabold text-gray-800 mb-4 flex items-center gap-2"><i class="fa-solid fa-folder-open text-amber-500"></i> 1.3 (1) 我的行程清單列表</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${this.db.trips.map(t => `
                            <div class="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white hover:shadow-md transition space-y-3 flex flex-col justify-between">
                                <div>
                                    <div class="flex justify-between items-start">
                                        <span class="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md">${t.location}</span>
                                        <span class="text-[11px] text-gray-400 font-medium"><i class="fa-solid fa-calendar-days mr-1"></i>${t.date}</span>
                                    </div>
                                    <h4 class="font-extrabold text-gray-800 text-sm mt-2">${t.name}</h4>
                                    <p class="text-xs text-gray-400 mt-1">規劃天數：${t.days} 天 | 參與協作者：${t.collaborators.length} 人</p>
                                </div>
                                <div class="grid grid-cols-2 gap-2 border-t border-gray-50 pt-3">
                                    <button onclick="ItinerarySystem.enterTripDashboard('${t.id}')" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl transition text-center w-full"><i class="fa-solid fa-chart-line mr-1"></i> 管理/主控台</button>
                                    <button onclick="ItinerarySystem.editExistingTripSequence('${t.id}')" class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-xl transition text-center w-full"><i class="fa-solid fa-sliders mr-1"></i> 重新編排</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- 1.6.1 願望清單區塊 -->
                <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 class="text-base font-extrabold text-gray-800 mb-2 flex items-center gap-1.5"><i class="fa-solid fa-heart text-red-500"></i> 1.6 (1) 我的口袋願望清單</h3>
                    <p class="text-xs text-gray-400 mb-4">瀏覽各大景點時點擊愛心收藏的地點，可直接規劃導入行程，優先設定為「必去」</p>
                    <div id="wishlist-container" class="grid grid-cols-1 md:grid-cols-3 gap-3"></div>
                </div>
            </div>
        `;
        this.renderWishlistBlock();
    },

    editExistingTripSequence(id) {
        this.db.currentTrip = this.db.trips.find(t => t.id === id);
        this.renderSequenceManager();
    },

    enterTripDashboard(id) {
        this.db.currentTrip = this.db.trips.find(t => t.id === id);
        this.renderTripDashboardView();
    },

    // ==========================================
    // 🎛️ 單一行程核心主控台 (整合 1.3、1.4、1.5 面板)
    // ==========================================
    renderTripDashboardView() {
        const trip = this.db.currentTrip;
        const root = document.getElementById('itinerary-hub-root');
        const totalCost = trip.expenses.reduce((sum, e) => sum + e.amount, 0);

        root.innerHTML = `
            <div class="space-y-6">
                <!-- 頂部資訊看板 -->
                <div class="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="bg-indigo-500 text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-black">${trip.location}</span>
                            <span class="text-xs text-slate-400">目前狀態：系統運行中 ⚡</span>
                        </div>
                        <h2 class="text-xl font-black mt-2">${trip.name}</h2>
                        <p class="text-xs text-slate-400 mt-1"><i class="fa-solid fa-clock mr-1"></i>出發日：${trip.date} | 預估總費用：<span class="text-emerald-400 font-bold text-sm">$${totalCost}</span></p>
                    </div>
                    <button onclick="ItinerarySystem.renderList()" class="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition">返回行程列表</button>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 space-y-6">
                        <!-- 1.3 (2) 分類詳細資訊查看面板 -->
                        <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🛠️ 1.3 (2) 行程詳細資訊分類檢視器</h3>
                            <div class="flex gap-2 mb-4 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                <button onclick="ItinerarySystem.switchDetailType('attractions')" id="btn-type-attractions" class="detail-type-tab flex-1 text-center py-2 text-xs font-bold rounded-lg transition bg-white text-gray-800 shadow-sm">景點</button>
                                <button onclick="ItinerarySystem.switchDetailType('restaurants')" id="btn-type-restaurants" class="detail-type-tab flex-1 text-center py-2 text-xs font-bold rounded-lg transition text-gray-500 hover:text-gray-800">餐廳</button>
                                <button onclick="ItinerarySystem.switchDetailType('activities')" id="btn-type-activities" class="detail-type-tab flex-1 text-center py-2 text-xs font-bold rounded-lg transition text-gray-500 hover:text-gray-800">活動</button>
                            </div>
                            <div id="classified-detail-content" class="space-y-2"></div>
                        </div>

                        <!-- 1.3 (3) 行程明細導引與調整 -->
                        <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-sm font-extrabold text-gray-800 flex items-center gap-1.5"><i class="fa-solid fa-list-check text-indigo-600"></i> 1.3 (3) 行程明細導引大廳</h3>
                                <div class="flex gap-1.5">
                                    <button onclick="ItinerarySystem.promptInjectedAddSpot()" class="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition">＋新增新景點</button>
                                    <button onclick="ItinerarySystem.editExistingTripSequence('${trip.id}')" class="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 transition">調整行程順序</button>
                                </div>
                            </div>
                            <div id="dashboard-full-itinerary-details" class="space-y-4"></div>
                        </div>

                        <!-- 1.4 (3) 社交留言討論 -->
                        <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                            <h3 class="text-sm font-extrabold text-gray-800 flex items-center gap-1.5"><i class="fa-solid fa-comments text-cyan-600"></i> 1.4 (3) 社交互動決策大廳</h3>
                            <div class="flex gap-2">
                                <button onclick="ItinerarySystem.triggerSocialAction('share')" class="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold p-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1"><i class="fa-solid fa-share-nodes text-slate-400"></i> 產生分享連結 (僅供檢視)</button>
                                <button onclick="ItinerarySystem.triggerSocialAction('vote')" class="flex-1 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 font-bold p-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1"><i class="fa-solid fa-square-poll-horizontal text-cyan-500"></i> 發起決策投票</button>
                            </div>
                            <div class="border-t border-gray-100 pt-3 space-y-3">
                                <label class="block text-xs font-bold text-gray-400">留言討論與投票統計：</label>
                                <div id="dashboard-comments-list" class="space-y-2"></div>
                                <div class="flex gap-2">
                                    <input type="text" id="new-comment-input" placeholder="發表公開留言討論..." class="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-indigo-600">
                                    <button onclick="ItinerarySystem.postComment()" class="bg-gray-800 text-white text-xs font-bold px-4 rounded-xl hover:bg-gray-900 transition">送出</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 右欄：1.4 協作者、1.5 預算記帳 -->
                    <div class="space-y-6">
                        <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                            <div class="flex justify-between items-center">
                                <h3 class="text-sm font-extrabold text-gray-800 flex items-center gap-1.5"><i class="fa-solid fa-users text-blue-600"></i> 1.4 協作管理艙</h3>
                                <button onclick="ItinerarySystem.inviteCollaborator()" class="bg-blue-50 text-blue-700 text-[11px] font-bold px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition">邀請</button>
                            </div>
                            <div>
                                <span class="text-[10px] text-gray-400 font-bold uppercase block mb-1">🟢 在線編輯者 (即時同步中)</span>
                                <div class="flex flex-wrap gap-1.5" id="online-editors-box"></div>
                            </div>
                            <div class="border-t border-gray-100 pt-3">
                                <span class="text-[10px] text-gray-400 font-bold uppercase block mb-1">👥 所有成員清單</span>
                                <div class="space-y-1.5" id="all-members-list-box"></div>
                                <div id="member-undo-banner-area" class="mt-2"></div>
                            </div>
                        </div>

                        <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                            <h3 class="text-sm font-extrabold text-gray-800 flex items-center gap-1.5"><i class="fa-solid fa-wallet text-emerald-600"></i> 1.5 費用預算管理看板</h3>
                            <div class="bg-gray-50 rounded-xl p-3 border border-gray-100 grid grid-cols-2 gap-2 text-center">
                                <div>
                                    <span class="text-[10px] text-gray-400 block font-medium">目前總支出</span>
                                    <strong class="text-sm text-gray-800" id="cost-box-total">$0</strong>
                                </div>
                                <div>
                                    <span class="text-[10px] text-gray-400 block font-medium">預算上限</span>
                                    <strong class="text-sm text-amber-600" id="cost-box-limit">$0</strong>
                                </div>
                            </div>

                            <div class="bg-gray-50/50 border border-gray-100 p-3 rounded-xl space-y-2">
                                <span class="text-[11px] font-bold text-gray-500 block">＋ 新增記帳項目</span>
                                <input type="text" id="exp-item" placeholder="項目名稱 (如: 晚餐)" class="w-full text-xs p-2 border border-gray-200 rounded-lg">
                                <div class="grid grid-cols-2 gap-2">
                                    <input type="number" id="exp-amount" placeholder="金額" class="w-full text-xs p-2 border border-gray-200 rounded-lg">
                                    <select id="exp-payer" class="w-full text-xs p-2 border border-gray-200 rounded-lg"></select>
                                </div>
                                <button onclick="ItinerarySystem.addExpenseRecord()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg shadow-sm transition">儲存收支紀錄</button>
                            </div>

                            <div class="border-t border-gray-100 pt-3 space-y-2">
                                <span class="text-[11px] font-bold text-gray-500 block">📊 1.5 (1) 成本結算分攤計算機</span>
                                <div class="flex gap-2">
                                    <button onclick="ItinerarySystem.calculateSplitCost('equal')" class="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-2 rounded-lg text-[11px] transition">全部平分</button>
                                    <button onclick="ItinerarySystem.calculateSplitCost('custom')" class="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-2 rounded-lg text-[11px] transition">自訂分攤</button>
                                </div>
                                <div id="split-result-output-area" class="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg hidden"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.switchDetailType('attractions');
        this.renderDashboardItineraryDetails();
        this.renderCollaboratorsBox();
        this.refreshBudgetUI();
        this.renderCommentsList();
    },

    switchDetailType(type) {
        document.querySelectorAll('.detail-type-tab').forEach(btn => {
            btn.classList.remove('bg-white', 'text-gray-800', 'shadow-sm');
            btn.classList.add('text-gray-500', 'hover:text-gray-800');
        });
        document.getElementById(`btn-type-${type}`).classList.remove('text-gray-500', 'hover:text-gray-800');
        document.getElementById(`btn-type-${type}`).classList.add('bg-white', 'text-gray-800', 'shadow-sm');

        const trip = this.db.currentTrip;
        const container = document.getElementById('classified-detail-content');
        
        let matchItems = [];
        Object.keys(trip.schedule).forEach(day => {
            trip.schedule[day].forEach(spot => {
                if (spot.type === type || (type === 'attractions' && !spot.type)) {
                    matchItems.push({ day, ...spot });
                }
            });
        });

        if (matchItems.length === 0) {
            container.innerHTML = `<p class="text-xs text-gray-400 italic py-4 text-center">此行程中目前無任何 ${type==='attractions'?'景點':type==='restaurants'?'餐廳':'活動'} 項目。</p>`;
            return;
        }

        container.innerHTML = matchItems.map(item => `
            <div class="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs flex justify-between items-center">
                <div>
                    <span class="bg-gray-200 text-gray-700 font-bold text-[9px] px-1 rounded mr-1">${item.day}</span>
                    <strong class="text-gray-700">${item.name}</strong>
                    ${item.note ? `<p class="text-[11px] text-gray-400 mt-0.5">備註：${item.note}</p>` : ''}
                </div>
                <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">${item.priority || '優先度未定'}</span>
            </div>
        `).join('');
    },

    renderDashboardItineraryDetails() {
        const trip = this.db.currentTrip;
        const container = document.getElementById('dashboard-full-itinerary-details');
        
        let html = '';
        Object.keys(trip.schedule).forEach(day => {
            const spots = trip.schedule[day];
            html += `
                <div class="border-l-2 border-indigo-100 pl-4 space-y-2 relative">
                    <div class="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white"></div>
                    <h4 class="text-xs font-black text-gray-800">${day} 行程明細</h4>
                    ${spots.length === 0 ? '<p class="text-[11px] text-gray-400 italic">今日暫無規劃行程...</p>' : spots.map(s => `
                        <div class="bg-gray-50/60 p-2 rounded-lg text-xs flex justify-between items-center ${s.bookedDetails ? 'border border-blue-200 bg-blue-50/30' : ''}">
                            <span><span class="text-[10px] font-bold ${s.bookedDetails ? 'text-blue-600' : 'text-amber-600'} mr-1">[${s.priority}]</span> <span class="${s.bookedDetails ? 'text-blue-700 font-bold' : ''}">${s.name}</span></span>
                            <span class="text-[11px] ${s.bookedDetails ? 'text-blue-600 font-medium' : 'text-gray-400'}">${s.note || ''}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        });
        container.innerHTML = html;
    },

    promptInjectedAddSpot() {
        const ask = confirm("系統導引詢問：是否需要為此行程新增全新景點？");
        if (!ask) return;
        const name = prompt("請輸入新景點/餐廳名稱：");
        if (!name) return;
        this.db.currentTrip.schedule["Day 1"].push({ name, type: "attractions", priority: "必去", note: "大廳快速新增" });
        this.renderDashboardItineraryDetails();
        this.switchDetailType('attractions');
    },

    renderCollaboratorsBox() {
        const trip = this.db.currentTrip;
        document.getElementById('online-editors-box').innerHTML = trip.onlineEditors.map(u => `
            <span class="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">● ${u}</span>
        `).join('');

        document.getElementById('all-members-list-box').innerHTML = trip.collaborators.map(m => `
            <div class="flex justify-between items-center text-xs p-1.5 bg-gray-50 rounded-lg">
                <span class="text-gray-700"><i class="fa-solid fa-user text-gray-400 mr-1.5"></i>${m}</span>
                ${m.includes('創立者') ? '' : `<button onclick="ItinerarySystem.kickMember('${m}')" class="text-gray-400 hover:text-red-500 text-[10px] font-bold">剔除</button>`}
            </div>
        `).join('');

        const payerSelect = document.getElementById('exp-payer');
        if (payerSelect) {
            payerSelect.innerHTML = trip.collaborators.map(m => `<option value="${m}">${m}</option>`).join('');
        }
    },

    inviteCollaborator() {
        const email = prompt("👥 1.4(1) 請輸入欲邀請夥伴的驗證 Email 位址：");
        if (!email) return;
        alert(`【系統自動驗證中】...\n經核對，Email (${email}) 符合本平台會員資格！`);
        alert(`【郵件發送成功】\n已寄送專屬邀請連結至 ${email}，系統目前進入「等待對方回覆」掛起狀態。`);

        setTimeout(() => {
            if (confirm(`📬 模擬受邀者通知：\n使用者 (${email}) 已點擊您的邀請連結並確認加入！是否立刻建立協作編輯權限？`)) {
                this.db.currentTrip.collaborators.push(email);
                this.db.currentTrip.onlineEditors.push(email); 
                this.renderCollaboratorsBox();
                alert(`🎉 權限建立成功！${email} 已加入本行程編輯團隊。`);
            }
        }, 1000);
    },

    kickMember(name) {
        if (!confirm(`⚠️ 警告：您正準備將成員 [${name}] 自此協作行程中移除。是否確認？`)) return;

        const trip = this.db.currentTrip;
        this.db.deletedMemberBackup = name;
        trip.collaborators = trip.collaborators.filter(m => m !== name);
        trip.onlineEditors = trip.onlineEditors.filter(m => m !== name);
        this.renderCollaboratorsBox();

        const bannerArea = document.getElementById('member-undo-banner-area');
        bannerArea.innerHTML = `
            <div class="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs flex justify-between items-center text-amber-800">
                <span>已暫時移除 ${name}。</span>
                <button onclick="ItinerarySystem.undoKickMember()" class="bg-amber-600 text-white font-bold px-2 py-1 rounded text-[11px] hover:bg-amber-700 transition">↩️ 點擊復原</button>
            </div>
        `;

        if (this.kickTimeout) clearTimeout(this.kickTimeout);
        this.kickTimeout = setTimeout(() => {
            if (this.db.deletedMemberBackup) {
                bannerArea.innerHTML = ``;
                this.db.deletedMemberBackup = null;
                alert(`📢 系統通知：已永久取消該成員權限，並已發送離線移除通知郵件。`);
            }
        }, 8000);
    },

    undoKickMember() {
        if (!this.db.deletedMemberBackup) return;
        this.db.currentTrip.collaborators.push(this.db.deletedMemberBackup);
        this.db.deletedMemberBackup = null;
        document.getElementById('member-undo-banner-area').innerHTML = '';
        if (this.kickTimeout) clearTimeout(this.kickTimeout);
        this.renderCollaboratorsBox();
        alert('✅ 成員權限已完美恢復！');
    },

    renderCommentsList() {
        const container = document.getElementById('dashboard-comments-list');
        container.innerHTML = this.db.currentTrip.comments.map(c => `
            <div class="bg-gray-50 p-2.5 rounded-xl text-xs space-y-1">
                <div class="flex justify-between items-center">
                    <strong class="text-gray-700">${c.author}</strong>
                    <button onclick="ItinerarySystem.voteComment('${c.id}')" class="text-cyan-600 hover:text-cyan-800 font-bold text-[11px] bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">👍 贊成票 (${c.votes})</button>
                </div>
                <p class="text-gray-600">${c.text}</p>
            </div>
        `).join('');
    },

    postComment() {
        const input = document.getElementById('new-comment-input');
        if (!input.value.trim()) return;
        this.db.currentTrip.comments.push({
            id: 'c_' + Date.now(),
            author: "你",
            text: input.value.trim(),
            votes: 0
        });
        input.value = '';
        this.renderCommentsList();
    },

    voteComment(commentId) {
        const comm = this.db.currentTrip.comments.find(c => c.id === commentId);
        if (comm) {
            comm.votes += 1;
            this.renderCommentsList();
            
            if (comm.votes >= 3) {
                if (confirm(`🔥 決策警報：留言「${comm.text}」已獲得多數高度共識票 (${comm.votes}票)！\n是否依據此民主決策結果，直接調整或刪除原有相關行程專案？`)) {
                    this.db.currentTrip.schedule["Day 1"] = []; 
                    this.renderDashboardItineraryDetails();
                    alert('已依據最高票決策更新並調整最新行程結果！');
                }
            }
        }
    },

    triggerSocialAction(action) {
        if (action === 'share') {
            const mockUrl = `${window.location.origin}${window.location.pathname}?tripViewOnly=${this.db.currentTrip.id}`;
            alert(`🔗 1.4(3) 唯讀分享連結已產生！\n已成功將連結權限設定為【僅供檢視】。請複製使用：\n\n${mockUrl}`);
        } else if (action === 'vote') {
            const topic = prompt("請輸入欲發起投票的決策主題：", "是否要精簡調整行程規劃？");
            if (!topic) return;
            this.db.currentTrip.comments.push({
                id: 'c_' + Date.now(),
                author: "投票發起人",
                text: `【重大提案投票】:${topic}`,
                votes: 0
            });
            this.renderCommentsList();
        }
    },

    refreshBudgetUI() {
        const trip = this.db.currentTrip;
        const total = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
        document.getElementById('cost-box-total').innerText = `$${total}`;
        document.getElementById('cost-box-limit').innerText = `$${trip.budgetLimit}`;
    },

    addExpenseRecord() {
        const itemInput = document.getElementById('exp-item');
        const amtInput = document.getElementById('exp-amount');
        const payerSelect = document.getElementById('exp-payer');

        const item = itemInput.value.trim();
        const amount = parseFloat(amtInput.value) || 0;
        const payer = payerSelect.value;

        if (!item || amount <= 0) { alert('請填寫正確項目名稱與大於 0 的金額！'); return; }

        const trip = this.db.currentTrip;
        const currentTotal = trip.expenses.reduce((sum, e) => sum + e.amount, 0);

        if (currentTotal + amount > trip.budgetLimit) {
            alert(`⚠️ 🚨 【超支預算上限提醒警告】 🚨 ⚠️\n您目前新增的這筆費用 $${amount} 將導致總支出 ($${currentTotal + amount}) 超越預定總上限預算 ($${trip.budgetLimit})！請撙節開支或調整上限。`);
        }

        trip.expenses.push({ item, type: "一般", amount, payer });
        itemInput.value = '';
        amtInput.value = '';
        
        this.refreshBudgetUI();
        this.enterTripDashboard(trip.id);
        alert('✅ 費用記帳成功並已即時更新至分攤看板！');
    },

    calculateSplitCost(mode) {
        const trip = this.db.currentTrip;
        const total = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
        const membersCount = trip.collaborators.length;
        const outBlock = document.getElementById('split-result-output-area');
        outBlock.classList.remove('hidden');

        if (total === 0) {
            outBlock.innerHTML = `目前總支出為 $0，不需分攤。`;
            return;
        }

        if (mode === 'equal') {
            const avg = (total / membersCount).toFixed(1);
            outBlock.innerHTML = `
                <strong class="text-emerald-700">【結算：全部平分】</strong><br>
                總支出：$${total} | 參與總人數：${membersCount}人<br>
                每人應平均支付：<span class="font-bold text-gray-800">$${avg}</span>
            `;
        } else if (mode === 'custom') {
            alert(`【啟動自訂預算分攤模式】\n目前行程總支出為：$${total}\n請在接下來的引導中逐一輸入各成員應承擔的特定金額。`);
            
            let currentSum = 0;
            const customList = [];
            
            for (let i = 0; i < trip.collaborators.length; i++) {
                const member = trip.collaborators[i];
                const rem = total - currentSum;
                const amt = parseFloat(prompt(`請輸入成員 [${member}] 應負擔金額 (剩餘尚待分攤: $${rem})：`, (total / membersCount).toFixed(0))) || 0;
                currentSum += amt;
                customList.push({ member, amt });
            }

            if (Math.abs(currentSum - total) > 1) {
                alert(`❌ 【分攤金額校驗失敗】\n您輸入的特定成員分攤預算總和 ($${currentSum}) 不等於實際帳目總支出 ($${total})！\n安全機制啟動：請重新點擊按鈕正確輸入金額。`);
                outBlock.innerHTML = `<span class="text-red-500 font-bold">⚠️ 金額校驗不符，請重新結算。</span>`;
            } else {
                outBlock.innerHTML = `
                    <strong class="text-indigo-700">【結算：自訂比例清單】</strong><br>
                    ${customList.map(c => `・${c.member}：應付 <span class="font-bold">$${c.amt}</span><br>`).join('')}
                    <span class="text-[11px] text-gray-400 font-medium">✓ 經系統校驗，分攤總額與支出完全相等。</span>
                `;
            }
        }
    },

    // ==========================================
    // 1.6.1 & 1.6.3 願望口袋清單實作區塊 (資料校正)
    // ==========================================
    renderWishlistBlock() {
        const container = document.getElementById('wishlist-container');
        if (this.db.wishlist.length === 0) {
            this.db.wishlist = [
                { id: "fav-1", name: "台南奇美博物館", location: "台南" },
                { id: "fav-2", name: "高雄西子灣落日夕陽", location: "高雄" },
                { id: "fav-3", name: "屏東國立海洋生物博物館", location: "屏東" }
            ];
        }

        container.innerHTML = this.db.wishlist.map(w => `
            <div class="bg-gray-50 border border-gray-100 rounded-xl p-3 flex justify-between items-center">
                <div>
                    <span class="text-[10px] font-bold bg-rose-50 text-rose-600 px-1 rounded mr-1">${w.location}</span>
                    <strong class="text-xs text-gray-700">${w.name}</strong>
                </div>
                <div class="flex gap-1">
                    <button onclick="ItinerarySystem.planTripFromWishlist('${w.name}')" title="規劃旅遊導入行程" class="bg-white hover:bg-indigo-50 border border-gray-200 text-indigo-600 text-[11px] p-1.5 font-bold rounded-lg transition">👉 排入</button>
                    <button onclick="ItinerarySystem.removeFromWishlist('${w.id}')" title="取消愛心收藏" class="bg-white hover:bg-red-50 border border-gray-200 text-red-500 text-[11px] p-1.5 rounded-lg transition"><i class="fa-solid fa-heart-crack"></i></button>
                </div>
            </div>
        `).join('');
    },

     removeFromWishlist(id) {
         this.db.wishlist = this.db.wishlist.filter(w => w.id !== id);
         this.renderWishlistBlock();
     },
 
     viewHistoryTripDetail(id) {
         const ht = this.db.historyTrips.find(t => t.id === id);
         if (!ht) return;
         
         const mockTrip = {
             id: ht.id,
             name: ht.name,
             days: 2,
             date: '2026-07-15',
             spots: [
                 { name: '[景點] 安平古堡', day: 1, timestamp: Date.now() + 1, priority: '必去' },
                 { name: '[餐廳] 文章牛肉湯', day: 1, timestamp: Date.now() + 2, priority: '推薦' },
                 { name: '[景點] 赤崁樓', day: 2, timestamp: Date.now() + 3, priority: '必去' },
                 { name: '[餐廳] 度小月擔仔麵', day: 2, timestamp: Date.now() + 4, priority: '推薦' }
             ]
         };
         
         if (typeof window.loadHistoryTrip === 'function') {
             window.loadHistoryTrip(mockTrip);
         }
     },

    planTripFromWishlist(name) {
        if (!this.db.currentTrip) {
            alert('請先在上方點擊進入某一趟行程的「管理/主控台」，才能決定將收藏排入哪裡喔！');
            return;
        }
        this.db.currentTrip.schedule["Day 1"].push({
            name: name,
            type: "attractions",
            priority: "必去", 
            note: "由我的願望清單收藏庫匯入"
        });
        alert(`成功將愛心收藏【${name}】規劃加入目前行程！已為您全自動將優先度設為「必去」🌟`);
        this.enterTripDashboard(this.db.currentTrip.id); 
    },

    injectBookingToTrip(bookingData, type) {
        let matchedTrip = null;
        let targetDay = 1;
        const dateToMatch = type === 'accommodation' ? bookingData.checkIn : bookingData.date;
        const locationToMatch = type === 'accommodation' ? bookingData.hotelName : bookingData.trainInfo.toStation;

        // Helper to check if a date falls within a trip's date range
        const isDateInTrip = (dateStr, trip) => {
            if (!dateStr || !trip.date) return false;
            const tripStart = new Date(trip.date);
            const targetDate = new Date(dateStr);
            const diffDays = Math.floor((targetDate - tripStart) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays < trip.days;
        };

        const getDayOffset = (dateStr, trip) => {
            if (!dateStr || !trip.date) return 1;
            const tripStart = new Date(trip.date);
            const targetDate = new Date(dateStr);
            const diffDays = Math.floor((targetDate - tripStart) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays < trip.days ? diffDays + 1 : 1;
        };

        // 1. Check current trip
        if (window.currentTrip && isDateInTrip(dateToMatch, window.currentTrip)) {
            matchedTrip = window.currentTrip;
            targetDay = getDayOffset(dateToMatch, matchedTrip);
        }

        // 2. Check trip history for date match
        if (!matchedTrip && window.tripHistory && window.tripHistory.length > 0) {
            for (let trip of window.tripHistory) {
                if (isDateInTrip(dateToMatch, trip)) {
                    matchedTrip = trip;
                    targetDay = getDayOffset(dateToMatch, matchedTrip);
                    break;
                }
            }
        }

        // 3. If no date match found, DO NOT INJECT.
        if (!matchedTrip) {
            if (typeof showToastNotification === 'function') {
                showToastNotification(`✅ 預訂成功！但日期 (${dateToMatch}) 不在現有行程範圍內，故未自動加入時間軸。`, 'warning');
            }
            return;
        }

        // Automatically switch window.currentTrip to the matched trip
        if (window.currentTrip && window.currentTrip.id !== matchedTrip.id) {
            if (window.tripHistory) {
                const existingIdx = window.tripHistory.findIndex(t => t.id === window.currentTrip.id);
                if (existingIdx === -1) {
                    window.tripHistory.push({...window.currentTrip});
                } else {
                    window.tripHistory[existingIdx] = {...window.currentTrip};
                }
            }
            window.currentTrip = matchedTrip;
            // Update UI title and metadata if on planner page
            const titleEl = document.getElementById('trip-title');
            if (titleEl) titleEl.innerText = window.currentTrip.name;
        }

        let spotName = '';
        if (type === 'accommodation') {
            spotName = `[住宿] ${bookingData.hotelName}`;
        } else {
            spotName = `[交通] ${bookingData.trainInfo.type} ${bookingData.trainInfo.trainNumber}次`;
        }

        const newSpot = {
            name: spotName,
            day: targetDay,
            timestamp: Date.now() + Math.random(),
            priority: null,
            bookedType: type,
            bookedDetails: bookingData
        };

        if (!window.currentTrip.spots) window.currentTrip.spots = [];
        window.currentTrip.spots.push(newSpot);

        // 同步更新 ItinerarySystem db
        let itTrip = this.db.trips.find(t => t.id === window.currentTrip.id);
        if (!itTrip) {
            itTrip = this.db.currentTrip || (this.db.trips.length > 0 ? this.db.trips[0] : null);
        }
        
        if (itTrip) {
            const dayKey = `Day ${targetDay}`;
            if (!itTrip.schedule[dayKey]) itTrip.schedule[dayKey] = [];
            itTrip.schedule[dayKey].push({
                name: spotName,
                priority: '已預訂',
                type: type,
                bookedDetails: bookingData,
                note: type === 'accommodation'
                    ? `入住: ${bookingData.checkIn} ~ 退房: ${bookingData.checkOut}`
                    : `${bookingData.trainInfo.fromStation} → ${bookingData.trainInfo.toStation}`
            });
        }

        if (typeof renderTimeline === 'function') {
            renderTimeline();
        }

        if (typeof AppPersistence !== 'undefined') {
            AppPersistence.autoSave();
        }

        if (typeof showToastNotification === 'function') {
            showToastNotification(
                `✅ 已將${type === 'accommodation' ? '住宿' : '車票'}自動同步至行程「${window.currentTrip.name}」第 ${targetDay} 天！`,
                'success'
            );
        }
    },

    renderActiveManager() {
        this.renderList();
    }
};

// 網頁初始化載入
document.addEventListener("DOMContentLoaded", () => {
    // 預留對外初始化擴充接口
});