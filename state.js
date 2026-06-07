// --- 核心資料狀態管理 (State) ---
// 所有全域狀態統一在此宣告，方便持久化與模組間共享

// === 登入與使用者 ===
window.isLoggedIn = false;
window.currentUser = null;
window.registeredUsers = [
{ name: "最高管理員", password: "admin", role: "admin" },
    { name: "郭佳瑜", password: "123", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" }
];

// === 行程規劃 ===
window.currentTrip = { name: "我的夢幻海島之旅", days: 3, date: "2026-07-15", spots: [] };
window.activeTrip = window.currentTrip;
window.tripHistory = [];

// === 收藏清單 ===
window.favoriteSpots = [
    { id: 1, name: "西子灣日落觀景台", location: "高雄市鼓山區" },
    { id: 2, name: "恆春古城魅力南門", location: "屏東縣恆春鎮" },
    { id: 3, name: "旗津彩虹教堂", location: "高雄市旗津區" }
];
window.favoriteHotels = [];

// === 住宿搜尋與篩選 ===
window.accomSearch = { checkIn: '', checkOut: '', guests: 2 };
window.accomFilters = { minPrice: 0, maxPrice: 99999, minRating: 0, roomType: '', wifi: false, pool: false };
window.selectedHotelId = null;
window.showAdvancedFiltersPanel = false;

// === 住宿模擬資料庫 ===
window.hotelDatabase = [
    {
        id: 'h1', name: '台南晶英酒店', location: '台南市中西區', type: '豪華雙人房', roomTypes: ['雙人房','家庭房'],
        pricePerNight: 4800, rating: 4.8, totalReviews: 156, stock: 3, checkInTime: '15:00-20:00',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80',
        amenities: ['WiFi','泳池','健身房','早餐','停車場','24H櫃台'],
        desc: '坐落於台南市中心，鄰近赤崁樓與國華街美食區，融合古都文化與現代奢華的頂級旅宿體驗。',
        reviews: [
            { user: '旅人小安', rating: 5, text: '服務超棒，房間乾淨又舒適，下次還會再來！', date: '2026-04-12', reply: '感謝您的好評！期待再次為您服務。' },
            { user: '背包客阿明', rating: 4, text: '地點非常方便，走路就能到各大景點，CP值高。', date: '2026-03-28', reply: '' }
        ]
    },
    {
        id: 'h2', name: '墾丁海境渡假民宿', location: '屏東縣恆春鎮', type: '海景包棟Villa', roomTypes: ['包棟Villa','海景雙人房'],
        pricePerNight: 6200, rating: 4.9, totalReviews: 89, stock: 0, checkInTime: '15:00-20:00',
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=500&q=80',
        amenities: ['WiFi','泳池','海景陽台','BBQ區','免費接駁'],
        desc: '被譽為台版聖托里尼，純白建築搭配無敵海景，是墾丁最夢幻的度假天堂。',
        reviews: [
            { user: '度假女王Mia', rating: 5, text: '海景美到不行！泳池拍照超美，完美的度假體驗。', date: '2026-05-01', reply: '謝謝Mia的分享！歡迎下次帶朋友一起來玩～' }
        ]
    },
    {
        id: 'h3', name: '高雄洲際酒店', location: '高雄市前鎮區', type: '商務豪華客房', roomTypes: ['商務客房','行政套房','雙人房'],
        pricePerNight: 5500, rating: 4.7, totalReviews: 203, stock: 5, checkInTime: '15:00-20:00',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=500&q=80',
        amenities: ['WiFi','健身房','商務中心','高樓景觀','Spa','早餐'],
        desc: '矗立於高雄港灣旁的國際級酒店，擁有絕佳的城市天際線景觀與頂級商務設施。',
        reviews: [
            { user: '商務旅人James', rating: 5, text: '商務中心設備齊全，網路快速穩定，出差首選！', date: '2026-04-20', reply: '' },
            { user: '閨蜜旅行團', rating: 4, text: '房間很大很舒服，早餐種類豐富，就是價格稍高。', date: '2026-03-15', reply: '感謝您的蒞臨！我們會繼續提升服務品質。' }
        ]
    }
];

const todayObj = new Date();
const tomorrowObj = new Date(todayObj);
tomorrowObj.setDate(tomorrowObj.getDate() + 1);
const dayAfterTomorrowObj = new Date(todayObj);
dayAfterTomorrowObj.setDate(dayAfterTomorrowObj.getDate() + 2);

const tomorrowStr = tomorrowObj.toISOString().split('T')[0];
const dayAfterTomorrowStr = dayAfterTomorrowObj.toISOString().split('T')[0];

window.myBookings = [
    { id: 'b0', hotelId: 'h1', hotelName: '台南晶英酒店', checkIn: tomorrowStr, checkOut: dayAfterTomorrowStr, guests: 2, roomType: '豪華雙人房', totalPrice: 9600, status: 'completed', payMethod: '信用卡', reviewed: false }
];

window.ticketOrders = [
    {
        id: 'ORD_DEFAULT_1',
        mainBuyerId: 'd',
        date: tomorrowStr,
        status: '已付款',
        type: '自強號',
        from: '台南',
        to: '高雄',
        totalAmount: 1357,
        trainInfo: {
            type: '自強號',
            trainNumber: '371',
            fromStation: '台南',
            toStation: '高雄',
            departureTime: '08:00',
            arrivalTime: '09:30'
        },
        passengers: [{ name: '測試會員', type: '全票', idCard: 'A123456789', seatInfo: '3車 12A號' }],
        pickupMethod: 'online',
        createdAt: new Date().toISOString()
    }
];

// === 社群動態牆 ===
window.socialPosts = [
    {
        id: 1,
        author: "阿杰學長",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
        time: "2 小時前 • 屏東恆春",
        text: "夏天的墾丁真的太美了！萬里桐海域乾淨到不行，浮潛可以看到滿滿的#珊瑚礁 跟熱帶魚，大推！",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
        likes: 24,
        comments: []
    }
];

// === UI 暫態 (不需持久化) ===
window.currentExploreCategory = 'station';
window.sidebarExpanded = true;
window.currentSearchRegion = "";
window.selectedModalSpotName = "";
window.currentPocketTab = 'spots';
window.currentPostImage = "";

// === 靜態設定資料 ===
window.exploreMockData = {
    station: [
        { name: "台鐵新左營站", desc: "南部最重要的門戶交通樞紐樞紐", icon: "fa-train-subway", color: "text-blue-600" },
        { name: "高雄火車站", desc: "全新綠意鐵路地下化景觀新車站", icon: "fa-train", color: "text-blue-500" },
        { name: "新左營台鐵站", desc: "三鐵共構，周邊百貨購物極度便利", icon: "fa-train", color: "text-indigo-500" }
    ],
    spot: [
        { name: "高雄流行音樂中心", desc: "前衛太空感蜂巢建築，夜間點燈極美", icon: "fa-camera-retro", color: "text-emerald-600" },
        { name: "大東文化藝術中心", desc: "熱氣球造型薄膜屋頂，文青攝影聖地", icon: "fa-mountain-sun", color: "text-emerald-500" }
    ],
    food: [
        { name: "丹丹漢堡 (七賢店)", desc: "南台灣限定！麵線焿配炸雞傳奇速食", icon: "fa-bowl-food", color: "text-amber-500" },
        { name: "瑞豐夜市精選酥炸大魷魚", desc: "在地人瘋狂排隊的超人氣吮指美味", icon: "fa-utensils", color: "text-amber-600" }
    ],
    hotel: [
        { name: "高雄洲際酒店", desc: "前鎮區奢華智慧科技尊榮旅宿體驗", icon: "fa-bed", color: "text-purple-600" },
        { name: "墾丁海境渡假民宿", desc: "坐擁台版聖托里尼無敵海景與牧場", icon: "fa-hotel", color: "text-indigo-600" }
    ],
    default: [
        { name: "預設推薦熱門景點", desc: "該區域最受歡迎的必訪勝地", icon: "fa-map-pin", color: "text-rose-500" },
        { name: "在地人私房秘境", desc: "不想人擠人？來這裡就對了", icon: "fa-leaf", color: "text-emerald-500" }
    ]
};

window.regionData = {
    '高雄市': ['鹽埕區', '鼓山區', '左營區', '旗津區', '前鎮區', '三民區', '苓雅區'],
    '屏東縣': ['恆春鎮', '屏東市', '東港鎮', '滿州鄉', '車城鄉', '琉球鄉', '潮州鎮'],
    '台南市': ['安平區', '中西區', '東區', '北區', '南區', '安南區', '仁德區']
};

// === 預設狀態快照（用於 persistence 重置） ===
window._defaultHotelDatabase = JSON.parse(JSON.stringify(window.hotelDatabase));

// ==========================================
// === 交通訂票系統擴充 (Ticketing System) ===
// ==========================================

// 1. 車站資料庫 (包含無人站標記、特色標籤與里程數供計價使用)
window.stationsDB = [
    { id: 'TNN_01', name: '後壁', isSpecial: false, features: [], mileage: 260.0 },
    { id: 'TNN_02', name: '新營', isSpecial: false, features: ['北台南樞紐'], mileage: 267.0 },
    { id: 'TNN_03', name: '柳營', isSpecial: false, features: [], mileage: 271.0 },
    { id: 'TNN_04', name: '林鳳營', isSpecial: false, features: [], mileage: 274.0 },
    { id: 'TNN_05', name: '隆田', isSpecial: false, features: [], mileage: 279.0 },
    { id: 'TNN_06', name: '拔林', isSpecial: true, features: ['無人站'], mileage: 281.0 },
    { id: 'TNN_07', name: '善化', isSpecial: false, features: [], mileage: 284.0 },
    { id: 'TNN_08', name: '南科', isSpecial: false, features: ['科學園區'], mileage: 287.0 },
    { id: 'TNN_09', name: '新市', isSpecial: false, features: [], mileage: 290.0 },
    { id: 'TNN_10', name: '永康', isSpecial: false, features: [], mileage: 294.0 },
    { id: 'TNN_11', name: '大橋', isSpecial: false, features: [], mileage: 296.0 },
    { id: 'S08', name: '台南', isSpecial: false, features: ['文化古都', '美食天堂'], mileage: 298.4 },
    { id: 'TNN_13', name: '保安', isSpecial: false, features: ['永保安康'], mileage: 305.0 },
    { id: 'TNN_14', name: '仁德', isSpecial: false, features: [], mileage: 306.0 },
    { id: 'TNN_15', name: '中洲', isSpecial: false, features: ['轉乘沙崙線'], mileage: 308.0 },
    { id: 'KHH_01', name: '大湖', isSpecial: false, features: [], mileage: 310.0 },
    { id: 'KHH_02', name: '路竹', isSpecial: false, features: [], mileage: 313.0 },
    { id: 'KHH_03', name: '岡山', isSpecial: false, features: [], mileage: 320.0 },
    { id: 'KHH_04', name: '橋頭', isSpecial: false, features: ['捷運轉乘'], mileage: 324.0 },
    { id: 'KHH_05', name: '楠梓', isSpecial: false, features: [], mileage: 328.0 },
    { id: 'S09', name: '新左營', isSpecial: false, features: ['三鐵共構', '高鐵轉乘'], mileage: 339.3 },
    { id: 'KHH_07', name: '左營(舊城)', isSpecial: false, features: [], mileage: 340.0 },
    { id: 'KHH_08', name: '內惟', isSpecial: false, features: [], mileage: 341.0 },
    { id: 'KHH_09', name: '美術館', isSpecial: false, features: ['輕軌轉乘'], mileage: 342.0 },
    { id: 'KHH_10', name: '鼓山', isSpecial: false, features: ['輕軌轉乘'], mileage: 343.0 },
    { id: 'KHH_11', name: '三塊厝', isSpecial: false, features: [], mileage: 344.0 },
    { id: 'S10', name: '高雄', isSpecial: false, features: ['車站新地標', '市區樞紐'], mileage: 345.3 },
    { id: 'KHH_13', name: '民族', isSpecial: false, features: [], mileage: 346.0 },
    { id: 'KHH_14', name: '科工館', isSpecial: false, features: ['輕軌轉乘'], mileage: 347.0 },
    { id: 'KHH_15', name: '正義', isSpecial: false, features: [], mileage: 348.0 },
    { id: 'S11', name: '鳳山', isSpecial: false, features: ['鳳儀書院', '大東'], mileage: 352.0 },
    { id: 'KHH_17', name: '後庄', isSpecial: false, features: [], mileage: 355.0 },
    { id: 'KHH_18', name: '九曲堂', isSpecial: false, features: [], mileage: 359.0 },
    { id: 'PTG_01', name: '六塊厝', isSpecial: false, features: [], mileage: 366.0 },
    { id: 'S12', name: '屏東', isSpecial: false, features: ['南國風情', '勝利星村'], mileage: 368.5 },
    { id: 'PTG_03', name: '歸來', isSpecial: false, features: [], mileage: 371.0 },
    { id: 'PTG_04', name: '麟洛', isSpecial: false, features: [], mileage: 373.0 },
    { id: 'PTG_05', name: '西勢', isSpecial: false, features: [], mileage: 375.0 },
    { id: 'PTG_06', name: '竹田', isSpecial: false, features: [], mileage: 379.0 },
    { id: 'S13', name: '潮州', isSpecial: false, features: ['燒冷冰', '潮州鐵道園區'], mileage: 385.0 },
    { id: 'PTG_08', name: '崁頂', isSpecial: false, features: [], mileage: 389.0 },
    { id: 'PTG_09', name: '南州', isSpecial: false, features: [], mileage: 391.0 },
    { id: 'PTG_10', name: '鎮安', isSpecial: true, features: ['無人站'], mileage: 394.0 },
    { id: 'PTG_11', name: '林邊', isSpecial: false, features: [], mileage: 397.0 },
    { id: 'PTG_12', name: '佳冬', isSpecial: false, features: [], mileage: 401.0 },
    { id: 'PTG_13', name: '東海', isSpecial: true, features: ['無人站'], mileage: 404.0 },
    { id: 'PTG_14', name: '枋寮', isSpecial: false, features: ['藍皮解憂號起點'], mileage: 408.0 },
    { id: 'PTG_15', name: '加祿', isSpecial: false, features: [], mileage: 413.0 },
    { id: 'PTG_16', name: '內獅', isSpecial: true, features: ['無人站'], mileage: 416.0 },
    { id: 'S14', name: '枋山', isSpecial: true, features: ['無人車站', '最南端車站', '無敵海景'], mileage: 420.0 },
    { id: 'S15', name: '多良', isSpecial: true, features: ['無人車站', '全台最美車站', '僅停區間'], mileage: 430.0 }
];

// 2. 票價與折扣規則庫
window.ticketRules = {
    baseRate: { '自強號': 2.27, '莒光號': 1.75, '區間快': 1.55, '區間車': 1.46 }, // 每公里基本費率（台鐵）
    cabinMultiplier: { '標準': 1.0, '商務': 1.5, '自由座': 0.95, '無障礙': 1.0 }, // 車廂加成率
    discounts: {
        '全票': 1.0,
        '學生票': 0.8,   // 需上傳證件審查
        '愛心票': 0.5,   // 需上傳證件審查
        '敬老票': 0.5
    },
    refundFees: [ // 退票手續費階梯規則 (天數, 扣除比例)
        { minDays: 25, feePercent: 0.01 },
        { minDays: 3, feePercent: 0.03 },
        { minDays: 1, feePercent: 0.05 },
        { minDays: 0, feePercent: 0.10 }
    ]
};

// 3. 車次資料庫 (包含沿途停靠、車次狀態、延誤時間、座位)
window.trainSchedulesDB = [
    {
        id: 'T0125', trainNumber: '3121', type: '區間車', isDirect: true,
        departureTime: '08:00', arrivalTime: '09:30',
        stations: ['台南', '新左營', '高雄', '屏東'],
        delayMinutes: 0, status: '準時',
        cabins: [
            { type: '標準', remainingSeats: 45 },
            { type: '商務', remainingSeats: 12 },
            { type: '自由座', remainingSeats: 999 },
            { type: '無障礙', remainingSeats: 2 }
        ],
        allowBooking: true
    },
    {
        id: 'T0814', trainNumber: '3005', type: '區間快', isDirect: false,
        departureTime: '08:30', arrivalTime: '10:45',
        stations: ['台南', '新左營', '高雄', '鳳山', '屏東', '潮州'],
        delayMinutes: 15, status: '延誤', // 測試用：模擬列車延誤
        cabins: [
            { type: '標準', remainingSeats: 5 },
            { type: '商務', remainingSeats: 0 }, // 測試用：座位額滿
            { type: '自由座', remainingSeats: 999 }
        ],
        allowBooking: true
    },
    {
        id: 'R3021', trainNumber: '3143', type: '區間快', isDirect: false,
        departureTime: '10:00', arrivalTime: '12:00',
        stations: ['新左營', '枋山', '多良'], // 涵蓋無人站
        delayMinutes: 0, status: '準時',
        cabins: [
            { type: '標準', remainingSeats: 999 } // 區間車不對號
        ],
        allowBooking: true
    },
    {
        id: 'T0666', trainNumber: '371', type: '自強號', isDirect: false,
        departureTime: '14:00', arrivalTime: '16:30',
        stations: ['台南', '新左營', '高雄', '屏東'],
        delayMinutes: 0, status: '停駛', // 測試用：停駛補償換票機制
        cabins: [
            { type: '標準', remainingSeats: 20 }
        ],
        allowBooking: false
    }
];

// 自動產生 08:00 到 20:00 的台鐵預設班次
for (let i = 8; i <= 20; i++) {
    const hourStr = i.toString().padStart(2, '0');
    const arrHour = i + 1;
    const arrHourStr = arrHour.toString().padStart(2, '0');
    
    // 避免與現有的測試班次時間衝突
    if (window.trainSchedulesDB.some(t => t.departureTime === `${hourStr}:00`)) continue;

    window.trainSchedulesDB.push({
        id: `T${hourStr}00`,
        trainNumber: `${100 + i}`,
        type: '自強號',
        isDirect: i % 2 === 0,
        departureTime: `${hourStr}:00`,
        arrivalTime: `${arrHourStr}:30`,
        stations: ['台南', '新左營', '高雄', '鳳山', '屏東', '潮州'],
        delayMinutes: 0,
        status: '準時',
        cabins: [
            { type: '標準', remainingSeats: 50 },
            { type: '商務', remainingSeats: 10 },
            { type: '無障礙', remainingSeats: 2 }
        ],
        allowBooking: true
    });
}

// 4. 訂單狀態與全域變數
window.currentTicketingSearch = {}; // 暫存目前的查詢條件
