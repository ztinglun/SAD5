// --- 行程編輯模組 (Trip Planner Module) ---

let draggedSpotId = null;

window.drag = function(ev, timestamp) {
    draggedSpotId = timestamp;
    if(ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
    setTimeout(() => ev.target.classList.add('opacity-50'), 0);
};

window.dragEnd = function(ev) {
    ev.target.classList.remove('opacity-50');
};

window.allowDrop = function(ev) {
    ev.preventDefault();
};

window.allowDropSpot = function(ev, targetTimestamp) {
    ev.preventDefault();
    ev.stopPropagation();
};

window.dropSpot = function(ev, targetTimestamp, targetDay) {
    ev.preventDefault();
    ev.stopPropagation();
    if (draggedSpotId && draggedSpotId !== targetTimestamp) {
        const sourceIndex = currentTrip.spots.findIndex(s => s.timestamp === draggedSpotId);
        const targetIndex = currentTrip.spots.findIndex(s => s.timestamp === targetTimestamp);
        if (sourceIndex > -1 && targetIndex > -1) {
            const [spot] = currentTrip.spots.splice(sourceIndex, 1);
            spot.day = targetDay;
            
            const rect = ev.currentTarget.getBoundingClientRect();
            const offset = ev.clientY - rect.top;
            const actualTargetIndex = currentTrip.spots.findIndex(s => s.timestamp === targetTimestamp);
            
            if (offset > rect.height / 2) {
                currentTrip.spots.splice(actualTargetIndex + 1, 0, spot);
            } else {
                currentTrip.spots.splice(actualTargetIndex, 0, spot);
            }
            renderTimeline();
        }
    }
};

window.drop = function(ev, targetDay) {
    ev.preventDefault();
    if (draggedSpotId) {
        const spotIndex = currentTrip.spots.findIndex(s => s.timestamp === draggedSpotId);
        if (spotIndex > -1) {
            const [spot] = currentTrip.spots.splice(spotIndex, 1);
            spot.day = targetDay;
            currentTrip.spots.push(spot);
            renderTimeline();
        }
    }
};

// === 將單筆訂單加入現行行程（供訂房/訂票完成時直接呼叫）===
window.addBookingToCurrentTrip = function(bookingData, type) {
    if (!window.currentTrip) return;
    if (!window.currentTrip.spots) window.currentTrip.spots = [];

    const tripStart = new Date(window.currentTrip.date);
    tripStart.setHours(0, 0, 0, 0);

    const dateToMatch = type === 'accommodation' ? bookingData.checkIn : bookingData.date;
    let targetDay = 1; // 預設放 Day 1

    if (dateToMatch) {
        const targetDate = new Date(dateToMatch);
        targetDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((targetDate - tripStart) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < window.currentTrip.days) {
            targetDay = diffDays + 1;
        }
    }

    // 防重複：若同一訂單已存在就跳過
    const alreadyAdded = window.currentTrip.spots.some(s =>
        s.bookedDetails && s.bookedDetails.id === bookingData.id
    );
    if (alreadyAdded) return;

    let spotName = '';
    if (type === 'accommodation') {
        spotName = `[住宿] ${bookingData.hotelName}`;
    } else {
        const tType = bookingData.trainInfo ? bookingData.trainInfo.type : (bookingData.type || '交通');
        const tNum  = bookingData.trainInfo ? bookingData.trainInfo.trainNumber : '';
        spotName = `[交通] ${tType}${tNum ? ' ' + tNum + '次' : ''}`;
    }

    window.currentTrip.spots.push({
        name: spotName,
        day: targetDay,
        timestamp: Date.now() + Math.random(),
        priority: null,
        bookedType: type === 'accommodation' ? 'accommodation' : 'transport',
        bookedDetails: bookingData
    });

    // 若現在就在行程規劃頁面，立即刷新時間軸
    const stepB = document.getElementById('trip-step-b');
    const timelineContainer = document.getElementById('timeline-scroll-container');
    if (stepB && !stepB.classList.contains('hidden') && timelineContainer) {
        if (typeof renderTimeline === 'function') renderTimeline();
    }

    if (window.AppPersistence) AppPersistence.autoSave();

    // 顯示提示
    const typeLabel = type === 'accommodation' ? '住宿' : '車票';
    if (typeof showToastNotification === 'function') {
        showToastNotification(`✅ 已將${typeLabel}「${spotName.replace(/^\[.*?\] /, '')}」自動加入第 ${targetDay} 天行程！`, 'success');
    }
};

// === 啟動時同步：把所有已付款但尚未加入行程的訂單補入 ===
window.autoSyncBookedItemsToTimeline = function() {
    if (!currentTrip || !currentTrip.spots) return;

    // 住宿訂單
    if (typeof myBookings !== 'undefined') {
        myBookings.forEach(booking => {
            if (!booking.id) return;
            const exists = currentTrip.spots.some(s => s.bookedDetails && s.bookedDetails.id === booking.id);
            if (!exists) {
                addBookingToCurrentTrip(booking, 'accommodation');
            }
        });
    }

    // 車票訂單（只同步已付款狀態）
    if (typeof window.ticketOrders !== 'undefined') {
        const paidStatuses = ['paid_pending_pickup', 'completed', '已付款', 'picked_up'];
        window.ticketOrders.forEach(ticket => {
            if (!ticket.id || !paidStatuses.includes(ticket.status)) return;
            const exists = currentTrip.spots.some(s => s.bookedDetails && s.bookedDetails.id === ticket.id);
            if (!exists) {
                addBookingToCurrentTrip(ticket, 'transport');
            }
        });
    }
};

window.renderTimeline = function() {
    
    const container = document.getElementById('timeline-scroll-container');
    container.innerHTML = "";

    for (let i = 1; i <= currentTrip.days; i++) {
        const dayBlock = document.createElement('div');
        dayBlock.className = "space-y-3";
        
        let spotsHTML = "";
        const daySpots = currentTrip.spots.filter(s => s.day === i);
        
        if (daySpots.length === 0) {
            spotsHTML = `<div class="text-xs text-gray-400 border border-dashed border-gray-300 rounded-xl p-4 text-center bg-white">本日尚無安排行程，請點左下角按鈕新增地點</div>`;
        } else {
            daySpots.forEach((spot, idx) => {
                const isAccom = spot.bookedType === 'accommodation';
                const isTrans = spot.bookedType === 'transport';
                const borderClass = isAccom ? 'border-green-400' : isTrans ? 'border-blue-400' : spot.priority === 'must' ? 'border-red-400' : spot.priority === 'maybe' ? 'border-gray-300' : 'border-gray-100';
                const numBg = isAccom ? 'bg-green-100 text-green-700' : isTrans ? 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-700';

                let bookedInfoHtml = '';
                if (spot.bookedDetails && isAccom) {
                    const d = spot.bookedDetails;
                    bookedInfoHtml = `<div class="bg-green-50 rounded-lg px-2 py-1.5 text-[10px] text-gray-700 space-y-0.5 border border-green-100 mt-1">`
                        + `<div><i class="fa-solid fa-bed text-green-500 mr-1"></i>${d.hotelName}</div>`
                        + `<div><i class="fa-solid fa-calendar-days text-green-500 mr-1"></i>入住：${d.checkIn} → 退房：${d.checkOut}</div>`
                        + `<div><i class="fa-solid fa-door-open text-green-500 mr-1"></i>房型：${d.roomType} | ${d.guests} 位客人</div>`
                        + `</div>`;
                } else if (spot.bookedDetails && isTrans) {
                    const d = spot.bookedDetails;
                    const pCount = d.passengers ? d.passengers.length : 1;
                    const amount = d.totalAmount !== undefined ? d.totalAmount : (d.totalPrice || '');
                    bookedInfoHtml = `<div class="bg-blue-50 rounded-lg px-2 py-1.5 text-[10px] text-gray-700 space-y-0.5 border border-blue-100 mt-1">`
                        + `<div><i class="fa-solid fa-train text-blue-500 mr-1"></i>${d.trainInfo.type} ${d.trainInfo.trainNumber}次</div>`
                        + `<div><i class="fa-solid fa-route text-blue-500 mr-1"></i>${d.trainInfo.fromStation} (${d.trainInfo.departureTime}) → ${d.trainInfo.toStation} (${d.trainInfo.arrivalTime})</div>`
                        + `<div><i class="fa-solid fa-ticket text-blue-500 mr-1"></i>${pCount} 張票 | NT$ ${amount}</div>`
                        + `</div>`;
                }

                const badgeHtml = isAccom
                    ? `<span class="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-bold ml-1"><i class="fa-solid fa-circle-check mr-0.5"></i>已訂房</span>`
                    : isTrans
                    ? `<span class="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-bold ml-1"><i class="fa-solid fa-circle-check mr-0.5"></i>已訂票</span>`
                    : '';

                const priorityBtns = (isAccom || isTrans) ? '' : `
                    <div class="flex gap-1.5">
                        <button onclick="setSpotPriority(${spot.timestamp}, 'must')" class="flex-1 text-[10px] font-bold py-1 rounded-lg border transition cursor-pointer ${spot.priority === 'must' ? 'bg-red-50 border-red-400 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500'}">
                            <i class="fa-solid fa-fire mr-0.5"></i>必去
                        </button>
                        <button onclick="setSpotPriority(${spot.timestamp}, 'maybe')" class="flex-1 text-[10px] font-bold py-1 rounded-lg border transition cursor-pointer ${spot.priority === 'maybe' ? 'bg-gray-100 border-gray-400 text-gray-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-600'}">
                            <i class="fa-regular fa-clock mr-0.5"></i>待考慮
                        </button>
                    </div>`;

                spotsHTML += `
                    <div draggable="true" ondragstart="drag(event, ${spot.timestamp})" ondragend="dragEnd(event)" ondragover="allowDropSpot(event, ${spot.timestamp})" ondrop="dropSpot(event, ${spot.timestamp}, ${spot.day})" id="spot-card-${spot.timestamp}" class="bg-white p-3 rounded-xl shadow-sm border-2 ${borderClass} flex flex-col gap-1.5 group cursor-move hover:shadow-md transition">
                        <div class="flex justify-between items-start">
                            <div class="flex items-center flex-wrap gap-1">
                                <span class="w-5 h-5 ${numBg} rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">${idx+1}</span>
                                <span class="text-xs font-bold text-gray-700">${spot.name}</span>
                                ${badgeHtml}
                            </div>
                            <button onclick="removeSpot(${spot.timestamp})" class="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition text-xs shrink-0 ml-1"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                        ${bookedInfoHtml}
                        ${priorityBtns}
                    </div>
                `;

                // If there's a next spot, render transit info
                if (idx < daySpots.length - 1) {
                    const transits = [
                        { icon: "fa-car", text: "開車約 15 分鐘 (4.8 公里)" },
                        { icon: "fa-person-walking", text: "步行約 8 分鐘 (600 公尺)" },
                        { icon: "fa-car", text: "開車約 20 分鐘 (8.2 公里)" },
                        { icon: "fa-bus", text: "搭大眾運輸約 25 分鐘 (6.0 公里)" }
                    ];
                    // Pick a transit based on name hashing or index
                    const transitIdx = (spot.name.length + idx) % transits.length;
                    const transit = transits[transitIdx];
                    spotsHTML += `
                        <div class="flex items-center space-x-2.5 px-4 my-1 text-[10px] text-gray-400 font-medium select-none">
                            <div class="w-[2px] h-3 bg-gray-200 ml-2"></div>
                            <i class="fa-solid ${transit.icon} text-gray-300"></i>
                            <span>${transit.text}</span>
                        </div>
                    `;
                }
            });
        }

        dayBlock.innerHTML = `
            <div class="flex items-center space-x-2 text-sm font-bold text-blue-900"><i class="fa-solid fa-flag text-xs text-amber-500"></i> <span>第 ${i} 天 (Day ${i})</span></div>
            <div class="pl-3 border-l-2 border-amber-300 ml-1.5 space-y-2 min-h-[50px] pb-4" ondrop="drop(event, ${i})" ondragover="allowDrop(event)">${spotsHTML}</div>
        `;
        container.appendChild(dayBlock);
    }
    
    // 更新行程估算花費
    if (typeof calculateTripCost === 'function') {
        calculateTripCost();
    }
    
    // 更新中間工作區的「已訂購的行程項目」板塊
    if (typeof renderWorkspaceBookedItems === 'function') {
        renderWorkspaceBookedItems();
    }
};

window.renderWorkspaceBookedItems = function() {
    const container = document.getElementById('workspace-booked-items-grid');
    if (!container) return;

    // Date match helper
    const isDateInTrip = (dateStr, trip) => {
        if (!trip || !dateStr || !trip.date) return false;
        const tripStart = new Date(trip.date);
        const targetDate = new Date(dateStr);
        const diffDays = Math.floor((targetDate - tripStart) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays < trip.days;
    };

    container.innerHTML = '';
    let hasItems = false;

    // 1. 處理已訂飯店
    if (typeof myBookings !== 'undefined' && myBookings.length > 0) {
        const matchedBookings = myBookings.filter(b => isDateInTrip(b.checkIn, currentTrip));
        if (matchedBookings.length > 0) {
            hasItems = true;
            matchedBookings.forEach(booking => {
                container.innerHTML += `
                    <div class="border border-green-200 bg-green-50 rounded-xl p-3 flex space-x-3 hover:shadow-md transition">
                        <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0 border border-green-100">
                            <i class="fa-solid fa-bed text-green-500 text-xl"></i>
                        </div>
                        <div class="flex flex-col justify-between flex-1">
                            <div>
                                <h4 class="font-bold text-sm text-gray-800 line-clamp-1">${booking.hotelName}</h4>
                                <p class="text-[10px] text-gray-500 mt-0.5">入住: ${booking.checkIn} / 退房: ${booking.checkOut}</p>
                            </div>
                            <button onclick="addBookedItemToTimeline('${booking.id}', 'hotel')"
                                class="self-end text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg transition cursor-pointer mt-1"><i
                                    class="fa-solid fa-plus mr-0.5"></i>排入行程</button>
                        </div>
                    </div>
                `;
            });
        }
    }

    // 2. 處理已訂車票
    if (typeof window.ticketOrders !== 'undefined') {
        const paidTickets = window.ticketOrders.filter(t => (t.status === 'paid_pending_pickup' || t.status === 'completed' || t.status === '已付款') && isDateInTrip(t.date, currentTrip));
        if (paidTickets.length > 0) {
            hasItems = true;
            paidTickets.forEach(ticket => {
                container.innerHTML += `
                    <div class="border border-blue-200 bg-blue-50 rounded-xl p-3 flex space-x-3 hover:shadow-md transition">
                        <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0 border border-blue-100">
                            <i class="fa-solid fa-train text-blue-500 text-xl"></i>
                        </div>
                        <div class="flex flex-col justify-between flex-1">
                            <div>
                                <h4 class="font-bold text-sm text-gray-800 line-clamp-1">${ticket.trainInfo ? ticket.trainInfo.type : ticket.type} ${ticket.trainInfo ? ticket.trainInfo.fromStation : ticket.from} - ${ticket.trainInfo ? ticket.trainInfo.toStation : ticket.to}</h4>
                                <p class="text-[10px] text-gray-500 mt-0.5">乘車日: ${ticket.date}</p>
                            </div>
                            <button onclick="addBookedItemToTimeline('${ticket.id}', 'ticket')"
                                class="self-end text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg transition cursor-pointer mt-1"><i
                                    class="fa-solid fa-plus mr-0.5"></i>排入行程</button>
                        </div>
                    </div>
                `;
            });
        }
    }

    if (!hasItems) {
        container.innerHTML = `<p class="text-xs text-gray-400 col-span-2 text-center py-4">目前沒有與此行程日期相符的已訂項目</p>`;
    }
};

window.addSpotToTimeline = function(spotName, targetDay = null) {
    if (!currentTrip) {
        alert('請建立或載入行程後再進行加入操作！');
        return;
    }
    
    // 如果為多日行程，提示用戶選擇要加入哪一天
    if (targetDay === null || targetDay === 1) {
        if (currentTrip.days > 1) {
            let optionsStr = "";
            for (let d = 1; d <= currentTrip.days; d++) {
                optionsStr += `${d}: 第 ${d} 天\n`;
            }
            const promptVal = prompt(`請選擇要將「${spotName}」排在第幾天？\n\n${optionsStr}`, "1");
            if (promptVal === null) return; // 使用者按取消
            const chosenDay = parseInt(promptVal);
            if (isNaN(chosenDay) || chosenDay < 1 || chosenDay > currentTrip.days) {
                alert(`請輸入有效的範圍 (1 到 ${currentTrip.days})！`);
                return;
            }
            targetDay = chosenDay;
        } else {
            targetDay = 1;
        }
    }

    currentTrip.spots.push({
        name: spotName,
        day: targetDay,
        timestamp: Date.now() + Math.random(),
        priority: null  // null = 未設定, 'must' = 必去, 'maybe' = 待考慮
    });
    renderTimeline();
    
    // 自動滾動到底部
    setTimeout(() => {
        const scrollBox = document.getElementById('timeline-scroll-container');
        if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;
    }, 50);

    if (window.AppPersistence) {
        AppPersistence.autoSave();
    }
};

window.addBookedItemToTimeline = function(itemId, type, targetDay = null) {
    if (!currentTrip) {
        alert('請建立或載入行程後再進行加入操作！');
        return;
    }

    let itemName = '';
    let bookingData = null;

    if (type === 'hotel' && typeof myBookings !== 'undefined') {
        bookingData = myBookings.find(b => b.id === itemId);
        if (bookingData) {
            itemName = `[住宿] ${bookingData.hotelName}`;
        }
    } else if (type === 'ticket' && typeof window.ticketOrders !== 'undefined') {
        bookingData = window.ticketOrders.find(t => t.id === itemId);
        if (bookingData) {
            itemName = `[交通] ${bookingData.trainInfo.type} ${bookingData.trainInfo.trainNumber}次`;
        }
    }

    if (itemName && bookingData) {
        // 如果為多日行程，提示用戶選擇要加入哪一天
        if (targetDay === null || targetDay === 1) {
            if (currentTrip.days > 1) {
                let optionsStr = "";
                for (let d = 1; d <= currentTrip.days; d++) {
                    optionsStr += `${d}: 第 ${d} 天\n`;
                }
                const promptVal = prompt(`請選擇要將「${itemName}」排在第幾天？\n\n${optionsStr}`, "1");
                if (promptVal === null) return; // 使用者按取消
                const chosenDay = parseInt(promptVal);
                if (isNaN(chosenDay) || chosenDay < 1 || chosenDay > currentTrip.days) {
                    alert(`請輸入有效的範圍 (1 到 ${currentTrip.days})！`);
                    return;
                }
                targetDay = chosenDay;
            } else {
                targetDay = 1;
            }
        }

        const newSpot = {
            name: itemName,
            day: targetDay,
            timestamp: Date.now() + Math.random(),
            priority: null,
            bookedType: type === 'hotel' ? 'accommodation' : 'transport',
            bookedDetails: bookingData
        };

        if (!currentTrip.spots) currentTrip.spots = [];
        currentTrip.spots.push(newSpot);
        
        renderTimeline();
        
        // 自動滾動到底部
        setTimeout(() => {
            const scrollBox = document.getElementById('timeline-scroll-container');
            if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;
        }, 50);

        if (window.AppPersistence) {
            AppPersistence.autoSave();
        }
    }
};

window.setSpotPriority = function(timestamp, priority) {
    const spot = currentTrip.spots.find(s => s.timestamp === timestamp);
    if (!spot) return;
    
    // 若已是同一狀態，點擊則取消設定
    if (spot.priority === priority) {
        spot.priority = null;
    } else {
        spot.priority = priority;
    }
    
    renderTimeline();
    
    if (window.AppPersistence) {
        AppPersistence.autoSave();
    }
};

window.removeSpot = function(timestamp) {
    currentTrip.spots = currentTrip.spots.filter(s => s.timestamp !== timestamp);
    renderTimeline();

    if (window.AppPersistence) {
        AppPersistence.autoSave();
    }
};

// --- Step 2: 搜尋、推薦、交通與匯出功能 ---

const MOCK_SPOTS = [
    { name: "高雄流行音樂中心 (Kaohsiung Music Center)", location: "高雄市鹽埕區" },
    { name: "丹丹漢堡 駁二店 (Dandan Burger)", location: "高雄市鼓山區" },
    { name: "安平古堡 (Anping Fort)", location: "台南市安平區" },
    { name: "駁二藝術特區 (The Pier-2 Art Center)", location: "高雄市鹽埕區" },
    { name: "墾丁大街夜市 (Kenting Night Market)", location: "屏東縣恆春鎮" },
    { name: "奇美博物館 (Chimei Museum)", location: "台南市仁德區" },
    { name: "衛武營國家藝術文化中心 (Weiwuying Center for the Arts)", location: "高雄市鳳山區" },
    { name: "大東文化藝術中心 (Dadong Arts Center)", location: "高雄市鳳山區" }
];

window.handleSpotSearch = function(query) {
    const suggestions = document.getElementById('spot-search-suggestions');
    if (!suggestions) return;
    
    if (!query.trim()) {
        suggestions.classList.add('hidden');
        return;
    }
    
    const matches = MOCK_SPOTS.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    if (matches.length === 0) {
        suggestions.innerHTML = `<div class="p-2 text-xs text-gray-400 text-center">無匹配的南部景點</div>`;
    } else {
        suggestions.innerHTML = matches.map(s => `
            <div onclick="selectSearchSpot('${s.name}')" class="p-2.5 text-xs hover:bg-blue-50 cursor-pointer flex flex-col border-b border-gray-50 last:border-b-0">
                <span class="font-bold text-gray-700">${s.name}</span>
                <span class="text-[10px] text-gray-400">${s.location}</span>
            </div>
        `).join('');
    }
    suggestions.classList.remove('hidden');
};

window.selectSearchSpot = function(name) {
    addSpotToTimeline(name, 1);
    const searchInput = document.getElementById('spot-search-input');
    if (searchInput) searchInput.value = "";
    const suggestions = document.getElementById('spot-search-suggestions');
    if (suggestions) suggestions.classList.add('hidden');
    showToastNotification(`已將 ${name} 加入行程！`, 'success');
};

window.loadMoreRecommendSpots = function() {
    const container = document.querySelector('#middle-view-recommend .grid');
    if (!container) return;
    
    const newSpots = [
        { name: "奇美博物館", location: "台南市仁德區", img: "./奇美博物館_0.jpg" },
        { name: "衛武營藝術中心", location: "高雄市鳳山區", img: "./衛武營藝術中心_0.jpg" },
        { name: "大東文化園區", location: "高雄市鳳山區", img: "./大東文化園區_0.jpg" }
    ];
    
    newSpots.forEach(s => {
        const card = document.createElement('div');
        card.className = "border border-gray-100 rounded-xl p-3 flex space-x-3 hover:shadow-md transition animate-fade-in";
        card.innerHTML = `
            <img src="${s.img}" class="w-20 h-20 object-cover rounded-lg shrink-0">
            <div class="flex flex-col justify-between flex-1">
                <div>
                    <h4 class="font-bold text-sm text-gray-800">${s.name}</h4>
                    <p class="text-xs text-gray-400 mt-0.5">${s.location}</p>
                </div>
                <button onclick="addSpotToTimeline('${s.name}')" class="self-end text-xs bg-amber-400 hover:bg-amber-500 font-bold px-2.5 py-1 rounded-lg transition"><i class="fa-solid fa-plus mr-0.5"></i>加入</button>
            </div>
        `;
        container.appendChild(card);
    });
    
    const loadBtn = document.getElementById('btn-load-more-recommend');
    if (loadBtn) loadBtn.classList.add('hidden');
    showToastNotification("已為您加載更多南部熱門景點！", "success");
};

window.calculateTripCost = function() {
    // 根據使用者要求，還沒輸入時顯示的總花費金額應為 0，因此取消這裡的自動估算與覆蓋
    /*
    let spotCost = currentTrip.spots.length * 150;
    let hotelCost = 0;
    
    if (window.myBookings && Array.isArray(window.myBookings)) {
        window.myBookings.forEach(b => {
            if (b.totalPrice) {
                hotelCost += b.totalPrice;
            }
        });
    }
    
    const total = spotCost + hotelCost;
    const costEl = document.getElementById('trip-total-cost');
    if (costEl) {
        costEl.innerText = `NT$ ${total.toLocaleString()}`;
    }
    */
};

window.openExportModal = function() {
    const modal = document.getElementById('export-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    
    const titleEl = document.getElementById('export-trip-title');
    if (titleEl) {
        titleEl.innerText = `${currentTrip.name} (${currentTrip.date} • ${currentTrip.days} 天)`;
    }
    
    const timelineEl = document.getElementById('export-trip-timeline');
    if (timelineEl) {
        timelineEl.innerHTML = "";
        for (let i = 1; i <= currentTrip.days; i++) {
            const daySpots = currentTrip.spots.filter(s => s.day === i);
            let spotsStr = daySpots.map(s => s.name).join(' → ');
            if (!spotsStr) spotsStr = "尚無安排行程";
            
            timelineEl.innerHTML += `
                <div class="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span class="font-bold text-blue-800">Day ${i}:</span>
                    <p class="mt-0.5 text-gray-500">${spotsStr}</p>
                </div>
            `;
        }
    }
};

window.closeExportModal = function() {
    const modal = document.getElementById('export-modal');
    if (modal) modal.classList.add('hidden');
};

window.copyShareLink = function() {
    const dummyUrl = `${window.location.origin}${window.location.pathname}?trip=${encodeURIComponent(JSON.stringify(currentTrip))}`;
    navigator.clipboard.writeText(dummyUrl).then(() => {
        showToastNotification("分享連結已複製到剪貼簿！", "success");
    }).catch(err => {
        showToastNotification("複製失敗，請手動複製網址", "error");
    });
};

window.downloadTripPDF = function() {
    showToastNotification("正在生成 PDF 檔案...", "info");
    setTimeout(() => {
        showToastNotification("PDF 匯出成功！已開始下載。", "success");
    }, 1500);
};

// --- Step 1: 首頁佔位與核心功能連結邏輯 ---

window.openInspirationDrawer = function() {
    const backdrop = document.getElementById('inspiration-drawer-backdrop');
    const drawer = document.getElementById('inspiration-drawer');
    if (backdrop && drawer) {
        backdrop.classList.remove('hidden');
        setTimeout(() => {
            backdrop.classList.add('drawer-backdrop-active');
            drawer.classList.add('drawer-active');
        }, 10);
    }
};

window.closeInspirationDrawer = function() {
    const backdrop = document.getElementById('inspiration-drawer-backdrop');
    const drawer = document.getElementById('inspiration-drawer');
    if (backdrop && drawer) {
        backdrop.classList.remove('drawer-backdrop-active');
        drawer.classList.remove('drawer-active');
        setTimeout(() => {
            backdrop.classList.add('hidden');
        }, 300);
    }
};

window.selectInspiration = function(theme) {
    let name = "";
    let days = 3;
    let date = "2026-07-15";
    let spots = [];
    
    if (theme === 'tainan') {
        name = "台南古蹟與文青美食漫遊";
        days = 3;
        spots = [
            { name: "赤崁樓", day: 1, timestamp: Date.now() + 1 },
            { name: "國華街美食區", day: 1, timestamp: Date.now() + 2 },
            { name: "十鼓仁糖文創園區", day: 2, timestamp: Date.now() + 3 },
            { name: "安平古堡", day: 3, timestamp: Date.now() + 4 }
        ];
    } else if (theme === 'kenting') {
        name = "墾丁陽光海灘與國家公園探險";
        days = 3;
        spots = [
            { name: "萬里桐浮潛", day: 1, timestamp: Date.now() + 1 },
            { name: "墾丁大街夜市", day: 1, timestamp: Date.now() + 2 },
            { name: "鵝鑾鼻燈塔", day: 2, timestamp: Date.now() + 3 },
            { name: "龍磐公園", day: 3, timestamp: Date.now() + 4 }
        ];
    } else if (theme === 'kaohsiung') {
        name = "高雄港灣夜景與藝文新地標";
        days = 2;
        spots = [
            { name: "駁二藝術特區", day: 1, timestamp: Date.now() + 1 },
            { name: "旗津彩虹教堂", day: 1, timestamp: Date.now() + 2 },
            { name: "高雄流行音樂中心", day: 2, timestamp: Date.now() + 3 }
        ];
    }

    currentTrip.name = name;
    currentTrip.days = days;
    currentTrip.date = date;
    currentTrip.spots = spots;

    const panelName = document.getElementById('panel-trip-name');
    if (panelName) panelName.innerText = currentTrip.name;
    const panelDate = document.getElementById('panel-trip-date');
    if (panelDate) panelDate.innerText = currentTrip.date;
    const panelDays = document.getElementById('panel-trip-days');
    if (panelDays) panelDays.innerText = `${currentTrip.days} 天`;
    
    const coverName = document.getElementById('cover-trip-name');
    if (coverName) coverName.innerText = currentTrip.name;
    const coverDate = document.getElementById('cover-trip-date');
    if (coverDate) coverDate.innerText = currentTrip.date;
    const coverDays = document.getElementById('cover-trip-days');
    if (coverDays) coverDays.innerText = `${currentTrip.days} 天`;

    const stepA = document.getElementById('trip-step-a');
    if (stepA) stepA.classList.add('hidden');
    const stepB = document.getElementById('trip-step-b');
    if (stepB) stepB.classList.remove('hidden');

    renderTimeline();
    closeInspirationDrawer();
    switchPage('create-trip');

    if (window.AppPersistence) {
        AppPersistence.autoSave();
    }
};

window.openTrainModal = function() {
    const modal = document.getElementById('train-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeTrainModal = function() {
    const modal = document.getElementById('train-modal');
    if (modal) modal.classList.add('hidden');
    
    const results = document.getElementById('train-results');
    if (results) results.classList.add('hidden');
};

window.searchTrainSchedule = function() {
    const dep = document.getElementById('train-dep').value;
    const arr = document.getElementById('train-arr').value;
    const results = document.getElementById('train-results');
    const loader = document.getElementById('train-loading');
    const list = document.getElementById('train-list');
    
    if (dep === arr) {
        showToastNotification("出發地與目的地不可相同！", "warning");
        return;
    }
    
    results.classList.remove('hidden');
    loader.classList.remove('hidden');
    list.classList.add('hidden');
    
    setTimeout(() => {
        loader.classList.add('hidden');
        list.classList.remove('hidden');
        
        const type = document.querySelector('input[name="train-type"]:checked').value;
        let trains = [];
        if (type === 'thsr') {
            trains = [
                { number: "區間快 3005 次", depTime: "08:30", arrTime: "10:05", price: 150 },
                { number: "區間車 3121 次", depTime: "11:15", arrTime: "12:50", price: 150 },
                { number: "區間快 3143 次", depTime: "14:00", arrTime: "15:35", price: 150 }
            ];
        } else {
            trains = [
                { number: "自強號 371 次", depTime: "07:10", arrTime: "11:45", price: 250 },
                { number: "普悠瑪 127 次", depTime: "12:30", arrTime: "16:10", price: 250 },
                { number: "自強(3000) 422 次", depTime: "16:45", arrTime: "20:30", price: 250 }
            ];
        }
        
        list.innerHTML = trains.map(t => `
            <div class="bg-gray-50 border border-gray-200 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                    <span class="font-bold text-gray-800">${t.number}</span>
                    <p class="text-gray-400 mt-0.5">${dep} → ${arr} | ${t.depTime} - ${t.arrTime}</p>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="font-bold text-emerald-600">NT$ ${t.price}</span>
                    <button onclick="addTrainToTimeline('${t.number} (${dep} - ${arr})')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg transition"><i class="fa-solid fa-plus"></i> 排入</button>
                </div>
            </div>
        `).join('');
    }, 1000);
};

window.addTrainToTimeline = function(trainName) {
    addSpotToTimeline(trainName, 1);
    closeTrainModal();
    showToastNotification(`成功將 ${trainName} 排入行程時間軸中！`, 'success');
};

window.changeLanguage = function(select) {
    const lang = select.value;
    showToastNotification(`已切換至 ${lang}，翻譯模組載入中...`, 'success');
};

window.viewHotelFromHomepage = function(hotelId) {
    switchPage('accommodation');
    setTimeout(() => {
        if (typeof showHotelDetail === 'function') {
            showHotelDetail(hotelId);
        }
    }, 200);
};

// --- 投票功能 (Voting Features) ---

window.renderVotes = function() {
    if (!window.currentTrip) return;
    
    // 初始化投票資料，如果還沒有的話
    if (!window.currentTrip.votes) {
        window.currentTrip.votes = [
            {
                id: 'vote_1',
                topic: '第一天晚餐要吃文章牛肉湯嗎？',
                agree: 3,
                disagree: 1
            },
            {
                id: 'vote_2',
                topic: '是否要將第二天行程改為墾丁國家公園？',
                agree: 2,
                disagree: 2
            }
        ];
    }

    const container = document.getElementById('vote-list-container');
    if (!container) return;

    if (window.currentTrip.votes.length === 0) {
        container.innerHTML = `<div class="text-xs text-gray-400 border border-dashed border-gray-300 rounded-xl p-6 text-center bg-white">目前尚無決策投票，請於上方輸入主題發起！</div>`;
        // 隱藏全域統計
        const globalStats = document.getElementById('vote-global-stats');
        if (globalStats) globalStats.classList.add('hidden');
        return;
    }

    container.innerHTML = window.currentTrip.votes.map(v => {
        const total = v.agree + v.disagree;
        const agreePercent = total > 0 ? Math.round((v.agree / total) * 100) : 0;
        const disagreePercent = total > 0 ? Math.round((v.disagree / total) * 100) : 0;

        return `
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3 relative group animate-fade-in">
                <div class="flex justify-between items-start">
                    <h5 class="font-bold text-xs text-gray-800 pr-6 leading-relaxed">${v.topic}</h5>
                    <button onclick="deleteVoteTopic('${v.id}')" class="text-gray-300 hover:text-rose-500 absolute top-3 right-3 text-xs transition"><i class="fa-solid fa-trash-can"></i></button>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="castVote('${v.id}', 'agree')" class="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer">
                        <i class="fa-solid fa-thumbs-up"></i> 贊成 (${v.agree})
                    </button>
                    <button onclick="castVote('${v.id}', 'disagree')" class="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer">
                        <i class="fa-solid fa-thumbs-down"></i> 反對 (${v.disagree})
                    </button>
                </div>

                <!-- 個別統計結果 -->
                <div class="bg-gray-50 rounded-lg p-2.5 space-y-2 border border-gray-100">
                    <div class="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>贊成: ${v.agree} 票 (${agreePercent}%)</span>
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500"></span>反對: ${v.disagree} 票 (${disagreePercent}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 flex overflow-hidden">
                        <div class="bg-emerald-500 h-full transition-all duration-500" style="width: ${agreePercent}%"></div>
                        <div class="bg-rose-500 h-full transition-all duration-500" style="width: ${disagreePercent}%"></div>
                    </div>
                    <div class="flex justify-between items-center text-[9px] text-gray-400">
                        <span>決策共識：${agreePercent > disagreePercent ? '👍 贊成居多' : disagreePercent > agreePercent ? '👎 反對居多' : '⚖️ 票數平手'}</span>
                        <span>總票數：${total} 票</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // === 渲染全域投票統計總覽 ===
    renderVoteGlobalStats();
};

window.renderVoteGlobalStats = function() {
    const globalStats = document.getElementById('vote-global-stats');
    if (!globalStats || !window.currentTrip || !window.currentTrip.votes || window.currentTrip.votes.length === 0) {
        if (globalStats) globalStats.classList.add('hidden');
        return;
    }

    globalStats.classList.remove('hidden');

    const votes = window.currentTrip.votes;
    const totalVoteTopics = votes.length;
    const totalAgree = votes.reduce((sum, v) => sum + v.agree, 0);
    const totalDisagree = votes.reduce((sum, v) => sum + v.disagree, 0);
    const grandTotal = totalAgree + totalDisagree;
    const agreeRate = grandTotal > 0 ? Math.round((totalAgree / grandTotal) * 100) : 0;
    const disagreeRate = grandTotal > 0 ? Math.round((totalDisagree / grandTotal) * 100) : 0;

    // 各投票結果摘要
    const passedCount = votes.filter(v => v.agree > v.disagree).length;
    const rejectedCount = votes.filter(v => v.disagree > v.agree).length;
    const tiedCount = votes.filter(v => v.agree === v.disagree).length;

    const summaryRows = votes.map(v => {
        const t = v.agree + v.disagree;
        const ap = t > 0 ? Math.round((v.agree / t) * 100) : 0;
        let statusIcon, statusText, statusColor;
        if (v.agree > v.disagree) {
            statusIcon = '✅'; statusText = '通過'; statusColor = 'text-emerald-600 bg-emerald-50';
        } else if (v.disagree > v.agree) {
            statusIcon = '❌'; statusText = '否決'; statusColor = 'text-rose-600 bg-rose-50';
        } else {
            statusIcon = '⏳'; statusText = '平手'; statusColor = 'text-amber-600 bg-amber-50';
        }
        return `
            <div class="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span class="text-[10px] text-gray-600 truncate flex-1 pr-2">${v.topic}</span>
                <div class="flex items-center gap-1.5 shrink-0">
                    <span class="text-[9px] text-gray-400">${v.agree}👍 ${v.disagree}👎</span>
                    <span class="${statusColor} text-[9px] font-bold px-1.5 py-0.5 rounded">${statusIcon} ${statusText}</span>
                </div>
            </div>
        `;
    }).join('');

    globalStats.innerHTML = `
        <h4 class="font-bold text-xs text-gray-800 flex items-center gap-1.5">
            <i class="fa-solid fa-chart-pie text-cyan-500"></i> 投票統計總覽
        </h4>

        <!-- 數據卡片 -->
        <div class="grid grid-cols-3 gap-2">
            <div class="bg-cyan-50 rounded-lg p-2 text-center border border-cyan-100">
                <span class="block text-lg font-black text-cyan-700">${totalVoteTopics}</span>
                <span class="text-[9px] text-cyan-600 font-medium">投票主題</span>
            </div>
            <div class="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
                <span class="block text-lg font-black text-emerald-700">${totalAgree}</span>
                <span class="text-[9px] text-emerald-600 font-medium">總贊成票</span>
            </div>
            <div class="bg-rose-50 rounded-lg p-2 text-center border border-rose-100">
                <span class="block text-lg font-black text-rose-700">${totalDisagree}</span>
                <span class="text-[9px] text-rose-600 font-medium">總反對票</span>
            </div>
        </div>

        <!-- 整體比例長條 -->
        <div class="space-y-1.5">
            <div class="flex justify-between text-[10px] font-medium text-gray-500">
                <span>整體贊成率：<strong class="text-emerald-600">${agreeRate}%</strong></span>
                <span>整體反對率：<strong class="text-rose-600">${disagreeRate}%</strong></span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
                <div class="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full transition-all duration-700 rounded-l-full" style="width: ${agreeRate}%"></div>
                <div class="bg-gradient-to-r from-rose-400 to-rose-500 h-full transition-all duration-700 rounded-r-full" style="width: ${disagreeRate}%"></div>
            </div>
            <div class="flex justify-center gap-4 text-[9px] text-gray-400">
                <span>全部共 <strong class="text-gray-600">${grandTotal}</strong> 票</span>
                <span>•</span>
                <span>通過 ${passedCount} / 否決 ${rejectedCount} / 平手 ${tiedCount}</span>
            </div>
        </div>

        <!-- 各題決策結果清單 -->
        <div class="space-y-1">
            <span class="text-[10px] font-bold text-gray-500 block">📋 各題決策結果</span>
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-100">
                ${summaryRows}
            </div>
        </div>
    `;
};

window.addNewVoteTopic = function() {
    const input = document.getElementById('new-vote-topic-input');
    if (!input) return;
    const topic = input.value.trim();
    if (!topic) {
        showToastNotification('請輸入投票決策主題！', 'warning');
        return;
    }

    if (!window.currentTrip.votes) {
        window.currentTrip.votes = [];
    }

    window.currentTrip.votes.push({
        id: 'vote_' + Date.now(),
        topic: topic,
        agree: 0,
        disagree: 0
    });

    input.value = '';
    window.renderVotes();
    showToastNotification('已成功發起新投票！', 'success');

    if (window.AppPersistence) {
        AppPersistence.autoSave();
    }
};

window.castVote = function(voteId, option) {
    if (!window.currentTrip || !window.currentTrip.votes) return;
    const vote = window.currentTrip.votes.find(v => v.id === voteId);
    if (vote) {
        if (option === 'agree') {
            vote.agree += 1;
        } else if (option === 'disagree') {
            vote.disagree += 1;
        }
        window.renderVotes();
        if (window.AppPersistence) {
            AppPersistence.autoSave();
        }
    }
};

window.deleteVoteTopic = function(voteId) {
    if (!window.currentTrip || !window.currentTrip.votes) return;
    window.currentTrip.votes = window.currentTrip.votes.filter(v => v.id !== voteId);
    window.renderVotes();
    showToastNotification('已刪除該投票主題。', 'info');
    if (window.AppPersistence) {
        AppPersistence.autoSave();
    }
};
