// ==========================================
// === 交通訂票系統 UI 渲染引擎 (Ticketing UI) ===
// ==========================================

window.ticketingState = {
    currentTab: 'search', // 'search' | 'orders'
    filterStatus: 'all',  // 訂單篩選標籤
    searchParams: { from: '台南', to: '高雄', date: new Date().toISOString().split('T')[0], time: '08:00', cabin: '標準', ticketType: '全票', onlyDirect: false },
    searchResults: [],
    selectedTrain: null,
    passengers: [{ name: '', type: '全票', idCard: '', idVerified: 'none' }], // none | verifying | pass | fail
    activeOrder: null // 目前正在查看詳情的訂單
};

// 全域主渲染入口
window.renderTicketingPage = function() {
    const container = document.getElementById('ticketing-main-container');
    if (!container) return;

    if (!isLoggedIn) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-sm p-12 text-center max-w-md mx-auto my-12">
                <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-lock text-2xl"></i>
                </div>
                <h3 class="text-base font-bold text-gray-800 mb-2">請先登入會員</h3>
                <p class="text-xs text-gray-400 mb-6">交通智慧訂票系統僅開放給平台註冊會員使用。</p>
                <button onclick="switchPage('login')" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-sm">前往登入</button>
            </div>
        `;
        return;
    }

    // 定期更新狀態檢查
    if (window.TicketingSystem) window.TicketingSystem.checkOverdueOrders();

    container.innerHTML = `
        <div class="flex items-center justify-between border-b border-gray-200 pb-2 mb-6">
            <div class="flex space-x-6">
                <button onclick="window.switchTicketingTab('search')" class="pb-2 text-sm font-bold ${ticketingState.currentTab === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'} transition">
                    <i class="fa-solid fa-magnifying-glass mr-1"></i> 車次查詢與訂票
                </button>
                <button onclick="window.switchTicketingTab('orders')" class="pb-2 text-sm font-bold ${ticketingState.currentTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'} transition">
                    <i class="fa-solid fa-list-check mr-1"></i> 我的訂單管理
                    ${ticketOrders.filter(o => o.mainBuyerId === currentUser.name && o.status === 'pending_payment').length ? `<span class="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1 animate-pulse">待付</span>` : ''}
                </button>
            </div>
            <div class="text-xs text-gray-500">
                <i class="fa-solid fa-coins text-amber-500 mr-1"></i> 我的點數：<span class="font-bold text-gray-800">${currentUser.points || 0}</span> 點
            </div>
        </div>

        ${ticketingState.currentTab === 'search' ? renderSearchBlock() : renderOrdersBlock()}

        <div class="mt-12 bg-gray-900 text-gray-300 p-4 rounded-2xl border border-gray-800 shadow-xl">
            <div class="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                <span class="text-xs font-bold tracking-wider text-amber-400"><i class="fa-solid fa-flask mr-1"></i> 智慧車票全功能動態測試沙盒</span>
                <span class="text-[10px] text-gray-500">此區塊模擬後台通報，方便即時驗證需求機制</span>
            </div>
            <div class="flex flex-wrap gap-2 text-[11px]">
                <button onclick="window.sandboxTriggerAnomaly('3121','延誤')" class="bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30 px-2.5 py-1 rounded-lg transition">模擬 3121次 延誤 (發放50點)</button>
                <button onclick="window.sandboxTriggerAnomaly('371','停駛')" class="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-600/30 px-2.5 py-1 rounded-lg transition">模擬 371次 停駛 (免費換票機制)</button>
                <button onclick="window.sandboxExceedUnpaid()" class="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 px-2.5 py-1 rounded-lg transition">強注 6次未付 (測試惡意停權)</button>
                <button onclick="currentUser.unpaidCount=0; currentUser.suspensionUntil=null; window.renderTicketingPage(); showToastNotification('已解除所有停權限制！','success')" class="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-600/30 px-2.5 py-1 rounded-lg transition">一鍵解鎖/還原會員狀態</button>
            </div>
        </div>
    `;
};

window.switchTicketingTab = function(tab) {
    ticketingState.currentTab = tab;
    window.renderTicketingPage();
};

// ==========================================
// 區塊：車次查詢與訂票面板
// ==========================================
function renderSearchBlock() {
    const p = ticketingState.searchParams;
    return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-4 h-fit">
                <h4 class="text-xs font-bold text-gray-700 tracking-wider uppercase mb-2"><i class="fa-solid fa-sliders text-blue-500 mr-1"></i> 條件與篩選</h4>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 block mb-1">出發站</label>
                        <select id="tk-from" onchange="ticketingState.searchParams.from=this.value" class="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500">
                            ${stationsDB.map(s => `<option value="${s.name}" ${p.from===s.name?'selected':''}>${s.name}${s.isSpecial?' (無人站)':''}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 block mb-1">抵達站</label>
                        <select id="tk-to" onchange="ticketingState.searchParams.to=this.value" class="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500">
                            ${stationsDB.map(s => `<option value="${s.name}" ${p.to===s.name?'selected':''}>${s.name}${s.isSpecial?' (無人站)':''}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 block mb-1">乘車日期</label>
                        <input type="date" value="${p.date}" onchange="ticketingState.searchParams.date=this.value" class="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2 focus:outline-none p-2.5">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 block mb-1">出發時間起</label>
                        <input type="time" value="${p.time}" onchange="ticketingState.searchParams.time=this.value" class="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2 focus:outline-none p-2.5">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-gray-400 block mb-1">偏好車廂</label>
                        <select onchange="ticketingState.searchParams.cabin=this.value" class="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5">
                            <option value="標準" ${p.cabin==='標準'?'selected':''}>標準車廂</option>
                            <option value="商務" ${p.cabin==='商務'?'selected':''}>商務車廂 (+50%)</option>
                            <option value="自由座" ${p.cabin==='自由座'?'selected':''}>自由座 (95折)</option>
                            <option value="無障礙" ${p.cabin==='無障礙'?'selected':''}>無障礙車廂</option>
                        </select>
                    </div>
                    <div class="flex items-center pt-5">
                        <label class="inline-flex items-center cursor-pointer text-xs font-bold text-gray-600">
                            <input type="checkbox" ${p.onlyDirect?'checked':''} onchange="ticketingState.searchParams.onlyDirect=this.checked" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2">
                            只看直達車次
                        </label>
                    </div>
                </div>
                <button onclick="window.executeTrainSearch()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm mt-2"><i class="fa-solid fa-magnifying-glass mr-1"></i> 開始試算車次</button>
            </div>

            <div class="lg:col-span-2 space-y-4">
                ${ticketingState.selectedTrain ? renderBookingForm() : renderSearchResults()}
            </div>
        </div>
    `;
}

// 渲染結果列表
function renderSearchResults() {
    if (ticketingState.searchResults.length === 0) {
        if (ticketingState.hasSearched) {
            return `
                <div class="bg-white rounded-2xl border border-gray-200/80 p-12 text-center text-gray-400 text-xs shadow-sm">
                    <i class="fa-solid fa-train-subway text-4xl text-gray-200 mb-3 block"></i>
                    查無符合條件的車次<br>重新調整出發站、到達站、車種或座位數再查一次。
                </div>
            `;
        } else {
            return `
                <div class="bg-white rounded-2xl border border-gray-200/80 p-12 text-center text-gray-400 text-xs shadow-sm">
                    <i class="fa-solid fa-train-subway text-4xl text-gray-200 mb-3 block"></i>
                    請輸入左側條件並點選開始試算，系統將即時計算里程與最優折扣。
                </div>
            `;
        }
    }

    return `
        <h4 class="text-xs font-bold text-gray-500 tracking-wider px-1"><i class="fa-solid fa-square-poll-horizontal text-gray-400 mr-1"></i> 找到的可用班次 (${ticketingState.searchResults.length} 班)</h4>
        <div class="space-y-3">
            ${ticketingState.searchResults.map(train => {
                // 試算價格
                const cabin = ticketingState.searchParams.cabin;
                const type = ticketingState.searchParams.ticketType;
                const calc = TicketingSystem.calculatePrice(train.type, train.distance, cabin, type);
                
                // 狀態標籤顏色
                let statusColor = "bg-emerald-50 text-emerald-600";
                if (train.status === '延誤') statusColor = "bg-amber-50 text-amber-600 animate-pulse";
                if (train.status === '停駛') statusColor = "bg-rose-50 text-rose-600 font-bold";

                // 剩餘座位渲染
                const cabinsHTML = train.cabins.map(c => {
                    const isSearched = c.type === cabin;
                    const isFull = c.remainingSeats <= 0;
                    
                    let bgClass = "bg-gray-50 text-gray-500 border border-gray-100";
                    if (isSearched) {
                        bgClass = isFull ? "bg-rose-50 text-rose-600 border border-rose-200 animate-pulse" : "bg-blue-50 text-blue-700 border border-blue-200 font-bold";
                    } else if (isFull) {
                        bgClass = "bg-gray-100 text-gray-400 border border-gray-200 line-through opacity-60";
                    }
                    
                    const seatText = c.remainingSeats === 999 ? '開放自由座' : `${c.remainingSeats} 席`;
                    return `<span class="text-[10px] px-2 py-0.5 rounded-md ${bgClass}">${c.type}: ${seatText}</span>`;
                }).join(' ');

                return `
                    <div class="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="space-y-1.5 flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-lg">${train.type} ${train.trainNumber}次</span>
                                <span class="text-[10px] px-2 py-0.5 rounded-md font-bold ${statusColor}">${train.status} ${train.delayMinutes > 0 ? `(${train.delayMinutes}分)` : ''}</span>
                                ${train.isDirect ? `<span class="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">直達</span>` : ''}
                            </div>
                            <div class="flex items-center space-x-4 text-xs font-bold text-gray-700 pt-1">
                                <div><span class="text-gray-400 text-[10px] block font-normal">出發</span>${train.fromStation} <span class="text-blue-600">${train.departureTime}</span></div>
                                <div class="text-gray-300 text-sm font-light">→</div>
                                <div><span class="text-gray-400 text-[10px] block font-normal">抵達</span>${train.toStation} <span class="text-gray-800">${train.arrivalTime}</span></div>
                                <div class="text-gray-400 text-[10px] font-normal pl-2">里程: ${train.distance.toFixed(1)} km</div>
                            </div>
                            <div class="text-[10px] text-gray-400 line-clamp-1"><i class="fa-solid fa-map-pin mr-1 text-gray-300"></i>沿途停靠：${train.stations.join(' > ')}</div>
                            <div class="flex flex-wrap items-center gap-1.5 pt-1.5">
                                <span class="text-[10px] text-gray-400 font-bold"><i class="fa-solid fa-chair mr-1"></i>剩餘座位：</span>
                                ${cabinsHTML}
                            </div>
                        </div>
                        <div class="flex items-center justify-between md:flex-col md:items-end justify-center border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 gap-2 shrink-0">
                            <div class="text-right">
                                <span class="text-[10px] text-gray-400 block line-through">原價 $${calc.regularPrice}</span>
                                <span class="text-base font-extrabold text-emerald-600">NT$ ${calc.finalPrice}</span>
                                <span class="text-[9px] bg-emerald-50 text-emerald-700 px-1 rounded block mt-0.5 font-bold">試算最優折扣價</span>
                            </div>
                            <button ${train.status==='停駛'?'disabled':''} onclick="window.selectTrainForBooking('${train.trainNumber}')" class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm">
                                ${train.status==='停駛'?'無法訂購':'立即訂位'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

window.executeTrainSearch = function() {
    if (TicketingSystem.checkSuspension()) return;
    const p = ticketingState.searchParams;
    ticketingState.hasSearched = true;
    ticketingState.searchResults = TicketingSystem.searchTrains(p.from, p.to, p.date, p.time, { onlyDirect: p.onlyDirect, requiredCabin: p.cabin });
    window.renderTicketingPage();
};

window.selectTrainForBooking = function(trainNumber) {
    const t = ticketingState.searchResults.find(x => x.trainNumber === trainNumber);
    if (!t) return;
    ticketingState.selectedTrain = t;
    // 重設預設一個乘客
    ticketingState.passengers = [{ name: currentUser.name, type: '全票', idCard: '', idVerified: 'none' }];
    window.renderTicketingPage();
};

// ==========================================
// 區塊：填寫乘客資料表單
// ==========================================
function renderBookingForm() {
    const train = ticketingState.selectedTrain;
    const cabin = ticketingState.searchParams.cabin;
    
    // 計算總額
    let total = 0;
    ticketingState.passengers.forEach(p => {
        const calc = TicketingSystem.calculatePrice(train.type, train.distance, cabin, p.type);
        total += calc.finalPrice;
    });

    return `
        <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                    <button onclick="ticketingState.selectedTrain=null; window.renderTicketingPage()" class="text-xs text-blue-600 hover:underline"><i class="fa-solid fa-chevron-left mr-1"></i> 返回重新選車次</button>
                    <h3 class="text-sm font-bold text-gray-800 mt-1">確認行程並輸入乘客資料</h3>
                </div>
                <span class="text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-xl">${train.type} ${train.trainNumber}次 (${cabin})</span>
            </div>

            <div class="space-y-3">
                ${ticketingState.passengers.map((p, idx) => `
                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 relative">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-gray-700"><i class="fa-solid fa-user text-gray-400 mr-1"></i> 乘客 ${idx + 1}</span>
                            ${idx > 0 ? `<button onclick="window.removePassenger(${idx})" class="text-[10px] text-rose-500 hover:underline font-bold">刪除此位</button>` : ''}
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <label class="text-[10px] font-bold text-gray-400 block mb-1">真實姓名</label>
                                <input type="text" value="${p.name}" onchange="window.updatePassengerData(${idx}, 'name', this.value)" class="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 focus:outline-none">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-gray-400 block mb-1">身分證/護照號碼</label>
                                <input type="text" value="${p.idCard}" onchange="window.updatePassengerData(${idx}, 'idCard', this.value)" class="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 focus:outline-none">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-gray-400 block mb-1">票種分流</label>
                                <select onchange="window.updatePassengerData(${idx}, 'type', this.value)" class="w-full text-xs bg-white border border-gray-200 rounded-lg p-2">
                                    <option value="全票" ${p.type==='全票'?'selected':''}>全票 (100%)</option>
                                    <option value="學生票" ${p.type==='學生票'?'selected':''}>學生票 (80%) 需審查</option>
                                    <option value="愛心票" ${p.type==='愛心票'?'selected':''}>愛心票 (50%) 需審查</option>
                                    <option value="敬老票" ${p.type==='敬老票'?'selected':''}>敬老票 (50%)</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-gray-400 block mb-1">挑選座位</label>
                                <div class="flex space-x-1">
                                    <input type="text" readonly value="${p.seatInfo || (cabin === '自由座' ? '自由座無須劃位' : '尚未選位')}" class="w-full text-xs bg-gray-100 border border-gray-200 rounded-lg p-2 font-bold text-gray-700 text-center focus:outline-none">
                                    ${cabin !== '自由座' ? `
                                        <button type="button" onclick="window.openSeatPicker(${idx})" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-3.5 py-2 rounded-lg transition shrink-0"><i class="fa-solid fa-chair mr-0.5"></i>選位</button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        ${['學生票', '愛心票'].includes(p.type) ? `
                            <div class="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 flex items-center justify-between text-[11px]">
                                <span class="text-blue-700 font-medium"><i class="fa-solid fa-id-card mr-1"></i> 此票種需要上傳相關證明證件審查</span>
                                <div>
                                    ${p.idVerified === 'pass' ? `<span class="text-emerald-600 font-bold"><i class="fa-solid fa-circle-check"></i> 審查通過</span>` : 
                                      p.idVerified === 'verifying' ? `<span class="text-amber-600 animate-pulse"><i class="fa-solid fa-spinner animate-spin"></i> 證件光學影像識別中...</span>` :
                                      `<button onclick="window.triggerIdVerify(${idx})" class="bg-blue-600 text-white text-[10px] px-2.5 py-1 rounded font-bold">模擬上傳證件</button>`}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>

            <button onclick="window.addPassengerSlot()" class="text-xs text-blue-600 hover:text-blue-700 font-bold"><i class="fa-solid fa-plus mr-1"></i> 新增同行乘客 (最多 4 人)</button>

            <div class="border-t border-gray-100 pt-4">
                <label class="text-[10px] font-bold text-gray-400 block mb-1">預計取票方式</label>
                <div class="flex space-x-4">
                    <label class="text-xs font-bold text-gray-700 inline-flex items-center cursor-pointer">
                        <input type="radio" name="pickup-method" value="線上取票" checked id="pk-online" class="text-blue-600 mr-1.5"> 電子票券 (線上分票/退票/QR Code)
                    </label>
                    <label class="text-xs font-bold text-gray-700 inline-flex items-center cursor-pointer">
                        <input type="radio" name="pickup-method" value="實體取票" id="pk-offline" class="text-blue-600 mr-1.5"> 車站/超商實體印票 (領取後不可線上退票)
                    </label>
                </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-xl flex items-center justify-between border border-gray-100">
                <div>
                    <span class="text-xs text-gray-400 block">應付總額 (${ticketingState.passengers.length} 張票)</span>
                    <span class="text-xl font-extrabold text-blue-600">NT$ ${total}</span>
                </div>
                <button onclick="window.submitTicketingOrder(${total})" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-sm"><i class="fa-solid fa-check mr-1"></i> 確認無誤，成立訂單</button>
            </div>
        </div>
    `;
}

window.addPassengerSlot = function() {
    if (ticketingState.passengers.length >= 4) { alert('單筆訂單最多僅可訂購 4 張車票喔！'); return; }
    ticketingState.passengers.push({ name: '', type: '全票', idCard: '', idVerified: 'none' });
    window.renderTicketingPage();
};
window.removePassenger = function(idx) {
    ticketingState.passengers.splice(idx, 1);
    window.renderTicketingPage();
};
window.updatePassengerData = function(idx, key, val) {
    ticketingState.passengers[idx][key] = val;
    // 如果票種改了，重設審查狀態
    if (key === 'type') ticketingState.passengers[idx].idVerified = 'none';
    window.renderTicketingPage();
};
window.triggerIdVerify = function(idx) {
    ticketingState.passengers[idx].idVerified = 'verifying';
    window.renderTicketingPage();
    // 模擬 AI OCR 2秒識別完成
    setTimeout(() => {
        if (ticketingState.passengers[idx]) {
            ticketingState.passengers[idx].idVerified = 'pass';
            window.renderTicketingPage();
            showToastNotification('乘客特殊票種身分自動識別審查通過！', 'success');
        }
    }, 1500);
};

window.submitTicketingOrder = function(total) {
    const cabin = ticketingState.searchParams.cabin;
    
    // 防呆驗證
    for (let p of ticketingState.passengers) {
        if (!p.name || !p.idCard) { alert('請完整填寫所有乘客的真實姓名與身分證號！'); return; }
        if (['學生票', '愛心票'].includes(p.type) && p.idVerified !== 'pass') { alert('含有需審核之特定票種，請先點擊模擬上傳證件完成審查！'); return; }
        if (cabin !== '自由座' && !p.seatInfo) { alert('請為所有對號座乘客點擊選位，完成座位挑選！'); return; }
    }

    // 檢查車票抵達時間是否符合當日飯店的入住時間 (15:00-20:00)
    if (typeof window.myBookings !== 'undefined') {
        const ticketDate = ticketingState.searchParams.date;
        const arrivalTime = ticketingState.selectedTrain.arrivalTime;
        const matchingHotel = window.myBookings.find(b => b.checkIn === ticketDate && b.status !== 'cancelled' && b.user === (window.currentUser ? window.currentUser.name : ''));
        
        if (matchingHotel) {
            if (arrivalTime < "15:00" || arrivalTime > "20:00") {
                if (!confirm(`提醒您：您訂購的車票抵達時間 (${arrivalTime}) 不在已預訂飯店「${matchingHotel.hotelName}」的入住時間 (15:00~20:00) 內！\n\n點擊「確定」(我已熟知) 繼續成功訂票，點擊「取消」返回。`)) {
                    return;
                }
            }
        }
    }

    const pickupMethod = document.getElementById('pk-online').checked ? '線上取票' : '實體取票';
    const order = TicketingSystem.createOrder(ticketingState.selectedTrain, ticketingState.passengers, ticketingState.searchParams.date, pickupMethod, total);
    
    if (order) {
        showToastNotification('訂單建立成功！請於期限內完成支付以免停權。', 'success');
        ticketingState.selectedTrain = null;
        ticketingState.currentTab = 'orders'; // 直接跳去我的訂單頁準備付款
        ticketingState.activeOrder = order;   // 直接開著它
        window.renderTicketingPage();
    }
};

// ==========================================
// 區塊：我的訂單管理中心
// ==========================================
function renderOrdersBlock() {
    const myOrders = ticketOrders.filter(o => o.mainBuyerId === currentUser.name);

    // 依據標籤狀態篩選
    const filtered = myOrders.filter(o => {
        if (ticketingState.filterStatus === 'all') return true;
        return o.status === ticketingState.filterStatus;
    });

    return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-1 space-y-3">
                <div class="bg-white p-2.5 rounded-xl border border-gray-200 flex flex-wrap gap-1 text-[11px] font-bold">
                    <button onclick="window.setOrderFilter('all')" class="px-2.5 py-1 rounded-lg transition ${ticketingState.filterStatus==='all'?'bg-blue-600 text-white':'text-gray-500 hover:bg-gray-100'}">全部</button>
                    <button onclick="window.setOrderFilter('pending_payment')" class="px-2.5 py-1 rounded-lg transition ${ticketingState.filterStatus==='pending_payment'?'bg-blue-600 text-white':'text-gray-500 hover:bg-gray-100'}">待付款</button>
                    <button onclick="window.setOrderFilter('paid_pending_pickup')" class="px-2.5 py-1 rounded-lg transition ${ticketingState.filterStatus==='paid_pending_pickup'?'bg-blue-600 text-white':'text-gray-500 hover:bg-gray-100'}">待取票</button>
                    <button onclick="window.setOrderFilter('picked_up')" class="px-2.5 py-1 rounded-lg transition ${ticketingState.filterStatus==='picked_up'?'bg-blue-600 text-white':'text-gray-500 hover:bg-gray-100'}">已取票</button>
                    <button onclick="window.setOrderFilter('refunded')" class="px-2.5 py-1 rounded-lg transition ${ticketingState.filterStatus==='refunded'?'bg-blue-600 text-white':'text-gray-500 hover:bg-gray-100'}">已退票</button>
                    <button onclick="window.setOrderFilter('cancelled_or_expired')" class="px-2.5 py-1 rounded-lg transition ${ticketingState.filterStatus==='cancelled_or_expired'?'bg-blue-600 text-white':'text-gray-500 hover:bg-gray-100'}">取消/逾期</button>
                </div>

                <div class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    ${filtered.length === 0 ? `<p class="text-center py-12 text-xs text-gray-400 bg-white rounded-2xl border border-gray-100">無對應狀態的訂單紀錄</p>` : 
                      filtered.map(o => {
                          const isSelected = ticketingState.activeOrder && ticketingState.activeOrder.id === o.id;
                          
                          // 狀態中文字
                          const statusMap = {
                              'pending_payment': '<span class="text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">待付款</span>',
                              'paid_pending_pickup': '<span class="text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">已付待取</span>',
                              'picked_up': '<span class="text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">已取票</span>',
                              'cancelled_or_expired': '<span class="text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">已失效</span>',
                              'refunded': '<span class="text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">已退票</span>'
                          };

                          return `
                              <div onclick="window.viewOrderDetail('${o.id}')" class="bg-white p-3.5 rounded-xl border ${isSelected?'border-blue-500 shadow-sm bg-blue-50/10':'border-gray-200/70'} hover:border-gray-300 transition cursor-pointer space-y-2">
                                  <div class="flex justify-between items-center text-[10px]">
                                      <span class="font-bold text-gray-400">${o.id}</span>
                                      <span class="font-bold">${statusMap[o.status] || o.status}</span>
                                  </div>
                                  <div class="text-xs font-bold text-gray-700 flex justify-between items-center">
                                      <span>${o.trainInfo.fromStation} → ${o.trainInfo.toStation}</span>
                                      <span class="text-emerald-600 text-sm">NT$ ${o.totalAmount}</span>
                                  </div>
                                  <div class="text-[10px] text-gray-400 flex justify-between items-center">
                                      <span>班次時間: ${o.date} ${o.trainInfo.departureTime}</span>
                                      <span>${o.passengers.length} 張票 (${o.pickupMethod})</span>
                                  </div>
                                  ${o.note ? `<div class="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded w-fit font-bold">${o.note}</div>` : ''}
                                  ${o.compensationEligible ? `<div class="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded w-fit font-bold animate-pulse">補償：符合列車停駛免費換票資格</div>` : ''}
                              </div>
                          `;
                      }).join('')}
                </div>
            </div>

            <div class="lg:col-span-2">
                ${ticketingState.activeOrder ? renderOrderDetailBlock(ticketingState.activeOrder) : `
                    <div class="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-xs shadow-sm h-full flex flex-col items-center justify-center">
                        <i class="fa-solid fa-receipt text-3xl text-gray-200 mb-2"></i>
                        請點擊左側任一筆訂單，即可檢視完整付款細節、取票碼與線上分票/退票操作。
                    </div>
                `}
            </div>
        </div>
    `;
}

window.setOrderFilter = function(status) {
    ticketingState.filterStatus = status;
    window.renderTicketingPage();
};
window.viewOrderDetail = function(id) {
    ticketingState.activeOrder = ticketOrders.find(o => o.id === id);
    window.renderTicketingPage();
};

// 渲染右側訂單完整詳細資料
function renderOrderDetailBlock(order) {
    const dl = new Date(order.deadline);
    const hasPaid = order.status !== 'pending_payment';

    return `
        <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                    <span class="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded">訂單編號: ${order.id}</span>
                    <h3 class="text-sm font-bold text-gray-800 mt-1">${order.trainInfo.type} ${order.trainInfo.trainNumber}次 乘車詳情</h3>
                </div>
                <div class="text-right text-xs">
                    <span class="text-gray-400 block text-[10px]">建立時間</span>
                    <span class="font-bold text-gray-600">${new Date(order.createdAt).toLocaleString()}</span>
                </div>
            </div>

            <div class="bg-gray-50 p-3 rounded-xl text-xs font-bold text-gray-700 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><span class="text-gray-400 text-[10px] block font-normal">日期</span>${order.date}</div>
                <div><span class="text-gray-400 text-[10px] block font-normal">區間時間</span>${order.trainInfo.fromStation} (${order.trainInfo.departureTime}) → ${order.trainInfo.toStation}</div>
                <div><span class="text-gray-400 text-[10px] block font-normal">取票型態</span>${order.pickupMethod}</div>
                <div><span class="text-gray-400 text-[10px] block font-normal">實付總金額</span><span class="text-emerald-600 font-extrabold text-sm">NT$ ${order.totalAmount}</span></div>
            </div>

            <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-gray-400 block">乘客乘車憑證與劃位狀態</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    ${order.passengers.map((p, idx) => `
                        <div class="border border-gray-100 rounded-xl p-3 flex justify-between items-center bg-white text-xs shadow-2xs">
                            <div>
                                <div class="font-bold text-gray-800">${p.name} <span class="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">${p.type}</span></div>
                                <div class="text-[10px] text-gray-400 mt-0.5">身分證: ${p.idCard.substring(0,3)}****${p.idCard.substring(7)}</div>
                            </div>
                            <div class="text-right">
                                <span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-lg block">${p.seatInfo || (order.cabinType === '自由座' ? '自由座無須對號' : `3車 ${12 + idx}A號`)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${order.status === 'picked_up' ? `
                <div class="border-2 border-dashed border-emerald-100 rounded-xl p-4 bg-emerald-50/20 text-center space-y-2">
                    <span class="text-xs font-extrabold text-emerald-700 block"><i class="fa-solid fa-circle-check"></i> 車票已成功領取</span>
                    ${order.qrCode ? `
                        <div class="w-24 h-24 bg-white border border-gray-200 mx-auto flex items-center justify-center shadow-xs rounded-lg">
                            <i class="fa-solid fa-qrcode text-6xl text-gray-800 animate-pulse"></i>
                        </div>
                        <p class="text-[10px] text-gray-400">進出閘門請將此動態加密 QR Code 貼近驗票機感應區</p>
                    ` : `
                        <div class="bg-white px-4 py-2 border border-emerald-200 rounded-lg inline-block font-mono text-base font-extrabold text-emerald-800 tracking-widest">${order.pickupCode}</div>
                        <p class="text-[10px] text-gray-400">請持此8碼實體代碼，至超商多媒體機台(IBON等)或車站自動售票機列印車票</p>
                    `}
                </div>
            ` : ''}

            ${order.status === 'pending_payment' ? `
                <div class="bg-rose-50/50 p-3 rounded-xl border border-rose-100 flex flex-col md:flex-row md:items-center justify-between text-xs gap-3">
                    <div>
                        <span class="text-rose-600 font-bold block"><i class="fa-solid fa-clock animate-pulse"></i> 尚未完成金流付款</span>
                        <span class="text-[10px] text-gray-400">請於期限內支付：<span class="text-gray-700 font-bold">${dl.toLocaleString()}</span> (逾期未付達6次將啟動懲罰停權)</span>
                    </div>
                    ${order.virtualAccount ? `
                        <div class="bg-white p-2 border border-rose-200 rounded-lg text-right">
                            <span class="text-[9px] text-gray-400 block font-normal">模擬超商/ATM代碼</span>
                            <span class="font-mono font-bold text-gray-800 text-[13px] tracking-wider">${order.virtualAccount}</span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            <div class="border-t border-gray-100 pt-4 flex flex-wrap gap-2 justify-end">
                ${order.compensationEligible ? `
                    <button onclick="window.processFreeCompensationExchange('${order.id}')" class="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"><i class="fa-solid fa-rotate mr-1"></i> 免費換票變更車次</button>
                    <button onclick="window.processGiveUpCompensation('${order.id}')" class="bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold text-xs px-4 py-2 rounded-xl transition">放棄換票(直接刷退取消)</button>
                ` : ''}

                ${order.status === 'pending_payment' ? `
                    <button onclick="window.openPaymentInterface('${order.id}', '信用卡')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm">信用卡/行動支付 ($${order.totalAmount})</button>
                    <button onclick="window.openPaymentInterface('${order.id}', 'ATM')" class="bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm">取得超商/ATM代碼</button>
                    <button onclick="window.cancelUnpaidOrder('${order.id}')" class="bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold text-xs px-4 py-2 rounded-xl transition">取消訂單</button>
                ` : ''}

                ${order.status === 'paid_pending_pickup' ? `
                    <button onclick="TicketingSystem.pickupTicket('${order.id}'); window.viewOrderDetail('${order.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"><i class="fa-solid fa-ticket mr-1"></i> 立即執行取票</button>
                    ${order.pickupMethod === '線上取票' && order.passengers.length > 1 ? `
                        <button onclick="window.promptSplitTicket('${order.id}')" class="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-xs px-4 py-2 rounded-xl transition">執行線上分票</button>
                    ` : ''}
                    ${order.paymentMethod === '信用卡' ? `
                        <button onclick="window.promptModifyTicket('${order.id}')" class="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-bold text-xs px-4 py-2 rounded-xl transition">變更車次/改票</button>
                    ` : ''}
                    <button onclick="TicketingSystem.refundTicket('${order.id}'); window.viewOrderDetail('${order.id}')" class="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs px-4 py-2 rounded-xl transition">申請線上退票</button>
                ` : ''}

                ${order.status === 'picked_up' && order.pickupMethod === '線上取票' ? `
                    <button onclick="TicketingSystem.refundTicket('${order.id}'); window.viewOrderDetail('${order.id}')" class="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs px-4 py-2 rounded-xl transition">申請退票 (電子券)</button>
                ` : ''}
            </div>
        </div>
    `;
}

// ==========================================
// 按鈕衍生之即時操作事件
// ==========================================
window.openPaymentInterface = function(orderId, method) {
    let usePoints = 0;
    if (currentUser.points >= 50 && confirm(`偵測到您目前擁有點數，是否要在本次付款中折抵 50 點（可省 $50 元）？`)) {
        usePoints = 50;
    }
    TicketingSystem.processPayment(orderId, method, usePoints);
    window.viewOrderDetail(orderId);
};

window.cancelUnpaidOrder = function(orderId) {
    const o = ticketOrders.find(x => x.id === orderId);
    if(o) {
        o.status = 'cancelled_or_expired';
        o.note = "用戶手動取消";
        AppPersistence.autoSave();
        showToastNotification('訂單已手動取消作廢。', 'info');
        window.viewOrderDetail(orderId);
    }
};

window.promptSplitTicket = function(orderId) {
    const name = prompt("【線上安全分票】請輸入受讓人的完整平台帳號/姓名（系統將隨即檢核帳號有效性）：");
    if (!name) return;
    TicketingSystem.splitTicket(orderId, name);
    window.viewOrderDetail(orderId);
};

window.promptModifyTicket = function(orderId) {
    const order = ticketOrders.find(x => x.id === orderId);
    if (!order) return;
    if (order.paymentMethod !== '信用卡') {
        alert('系統限制：僅限以「信用卡」付款之車票方可線上變更車次/改票！');
        return;
    }
    alert(`【變更改票須知】\n1. 改票不保證能劃到相同座位。\n2. 系統限制：起訖站 [${order.trainInfo.fromStation} → ${order.trainInfo.toStation}] 與方向不可變更。\n\n按確定後，系統將引導您進入搜尋新班次。`);
    
    // 引導去搜尋分流
    ticketingState.currentTab = 'search';
    ticketingState.searchParams.from = order.trainInfo.fromStation;
    ticketingState.searchParams.to = order.trainInfo.toStation;
    // 特殊備註，等成立新單時扣抵
    alert('請挑選欲更改的新日期或新時間車次，送出時會自動與原票價進行差額多退少補分流！');
    
    // 簡單模擬將原單直接作廢並退全額到新單
    order.status = 'cancelled_or_expired';
    order.note = `已改票變更至新車次`;
    ticketingState.selectedTrain = null;
    window.renderTicketingPage();
};

window.processFreeCompensationExchange = function(orderId) {
    const order = ticketOrders.find(x => x.id === orderId);
    alert('【異常換票通道開啟】\n因列車停駛，本次重新選取班次的應付總額將全部由系統吸收（0元免費換車次）。');
    
    ticketingState.currentTab = 'search';
    ticketingState.searchParams.from = order.trainInfo.fromStation;
    ticketingState.searchParams.to = order.trainInfo.toStation;
    
    // 覆寫計價公式變為 0 元
    const originalPriceCalc = TicketingSystem.calculatePrice;
    TicketingSystem.calculatePrice = function() {
        return { regularPrice: 0, finalPrice: 0, discountApplied: true };
    };

    // 原單作廢
    order.status = 'cancelled_or_expired';
    order.note = "列車停駛作廢，用戶已執行免費換票補償";
    order.compensationEligible = false;
    
    // 當下一次成立訂單後還原公式
    const originalCreate = TicketingSystem.createOrder;
    TicketingSystem.createOrder = function(...args) {
        TicketingSystem.calculatePrice = originalPriceCalc; // 還原
        TicketingSystem.createOrder = originalCreate;      // 還原
        const newOrder = originalCreate.apply(this, args);
        newOrder.status = 'paid_pending_pickup'; // 直接免付入帳
        newOrder.note = "停駛異常免費換票新單";
        return newOrder;
    };
    
    window.renderTicketingPage();
};

window.processGiveUpCompensation = function(orderId) {
    const order = ticketOrders.find(x => x.id === orderId);
    if(order) {
        order.status = 'cancelled_or_expired';
        order.note = "列車停駛，用戶放棄換票，原金流已全額退回";
        order.compensationEligible = false;
        AppPersistence.autoSave();
        showToastNotification('已放棄換票，系統已通知銀行退還全額。', 'success');
        window.viewOrderDetail(orderId);
    }
};

// ==========================================
// 沙盒模擬專用測試函數
// ==========================================
window.sandboxTriggerAnomaly = function(trainNumber, type) {
    if(!TicketingSystem) return;
    TicketingSystem.simulateTrainAnomaly(trainNumber, type);
    window.renderTicketingPage();
};

window.sandboxExceedUnpaid = function() {
    currentUser.unpaidCount = 6;
    currentUser.suspensionUntil = null;
    window.renderTicketingPage();
    showToastNotification('已手動將您的未付款次數調整為 6 次！請再次點擊「開始試算車次」測試停權攔截機制。', 'warning');
};

// ==========================================
// 劃位挑選座位互動元件邏輯
// ==========================================
function getOccupiedSeats(trainNumber, carNum) {
    // 依車次與車廂號碼產生固定的模擬佔用座位，避免每次點開隨機跳動
    const occupied = new Set();
    const seed = (parseInt(trainNumber.replace(/\D/g, '')) || 100) + carNum;
    for (let row = 1; row <= 8; row++) {
        for (let col of ['A', 'B', 'C', 'D']) {
            const val = (seed * row * col.charCodeAt(0)) % 10;
            if (val < 4) { // 40% 的機率被佔用
                occupied.add(`${carNum}車 ${row}${col}`);
            }
        }
    }
    return occupied;
}

window.openSeatPicker = function(passengerIdx) {
    ticketingState.activePassengerIndex = passengerIdx;
    
    let modal = document.getElementById('seat-picker-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'seat-picker-modal';
        modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] animate-fade-in';
        document.body.appendChild(modal);
    }
    
    modal.classList.remove('hidden');
    window.renderSeatPicker();
};

window.renderSeatPicker = function() {
    const modal = document.getElementById('seat-picker-modal');
    if (!modal) return;
    
    const passengerIdx = ticketingState.activePassengerIndex;
    const passenger = ticketingState.passengers[passengerIdx];
    const train = ticketingState.selectedTrain;
    const cabin = ticketingState.searchParams.cabin;
    
    let availableCars = [];
    if (cabin === '標準') availableCars = [1, 2, 3];
    else if (cabin === '商務') availableCars = [4];
    else if (cabin === '無障礙') availableCars = [5];
    else availableCars = [1];
    
    if (!ticketingState.selectedCar || !availableCars.includes(ticketingState.selectedCar)) {
        ticketingState.selectedCar = availableCars[0];
    }
    
    const currentCar = ticketingState.selectedCar;
    const occupiedSeats = getOccupiedSeats(train.trainNumber, currentCar);
    
    // 同伴已選取的座位集合
    const siblingSeats = new Set();
    ticketingState.passengers.forEach((p, idx) => {
        if (idx !== passengerIdx && p.seatInfo) {
            siblingSeats.add(p.seatInfo);
        }
    });
    
    let seatsHTML = '';
    for (let row = 1; row <= 8; row++) {
        seatsHTML += `<div class="flex items-center justify-between mb-2">
            <div class="w-6 text-xs text-gray-400 font-bold text-center">${row}</div>
            <div class="flex space-x-2">`;
            
        // 左側：A, B 靠窗與走道
        ['A', 'B'].forEach(col => {
            const seatId = `${currentCar}車 ${row}${col}`;
            const isOccupied = occupiedSeats.has(seatId);
            const isSibling = siblingSeats.has(seatId);
            const isCurrent = passenger.seatInfo === seatId;
            
            let btnClass = "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition duration-150";
            let clickHandler = '';
            
            if (isOccupied) {
                btnClass += " bg-gray-200 text-gray-400 cursor-not-allowed";
            } else if (isSibling) {
                btnClass += " bg-amber-500 text-white shadow-xs cursor-not-allowed";
            } else if (isCurrent) {
                btnClass += " bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300";
                clickHandler = `onclick="window.selectSeat('${seatId}')"`;
            } else {
                btnClass += " bg-white hover:bg-blue-50 border border-gray-300 text-gray-700 hover:border-blue-400 cursor-pointer";
                clickHandler = `onclick="window.selectSeat('${seatId}')"`;
            }
            
            seatsHTML += `<button type="button" ${clickHandler} class="${btnClass}">${col}</button>`;
        });
        
        // 走道標記
        seatsHTML += `<div class="w-8 flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase tracking-wider mx-1 select-none">走道</div>`;
        
        // 右側：C, D 走道與靠窗
        ['C', 'D'].forEach(col => {
            const seatId = `${currentCar}車 ${row}${col}`;
            const isOccupied = occupiedSeats.has(seatId);
            const isSibling = siblingSeats.has(seatId);
            const isCurrent = passenger.seatInfo === seatId;
            
            let btnClass = "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition duration-150";
            let clickHandler = '';
            
            if (isOccupied) {
                btnClass += " bg-gray-200 text-gray-400 cursor-not-allowed";
            } else if (isSibling) {
                btnClass += " bg-amber-500 text-white shadow-xs cursor-not-allowed";
            } else if (isCurrent) {
                btnClass += " bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300";
                clickHandler = `onclick="window.selectSeat('${seatId}')"`;
            } else {
                btnClass += " bg-white hover:bg-blue-50 border border-gray-300 text-gray-700 hover:border-blue-400 cursor-pointer";
                clickHandler = `onclick="window.selectSeat('${seatId}')"`;
            }
            
            seatsHTML += `<button type="button" ${clickHandler} class="${btnClass}">${col}</button>`;
        });
        
        seatsHTML += `</div>
            <div class="w-6"></div>
        </div>`;
    }

    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 max-w-sm w-full mx-4 modal-enter">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div>
                    <h3 class="text-sm font-extrabold text-gray-800"><i class="fa-solid fa-chair text-blue-600 mr-1.5"></i>挑選座位</h3>
                    <p class="text-[10px] text-gray-400 mt-0.5">請為乘客 ${passengerIdx + 1} (${passenger.name || '未輸入姓名'}) 劃位</p>
                </div>
                <button onclick="window.closeSeatPicker()" class="text-gray-400 hover:text-gray-600 transition cursor-pointer p-1"><i class="fa-solid fa-xmark text-lg"></i></button>
            </div>
            
            <div class="flex items-center justify-between gap-2 mb-4 bg-gray-50 p-2 rounded-xl">
                <span class="text-xs font-bold text-gray-600">選擇車廂：</span>
                <div class="flex gap-1.5">
                    ${availableCars.map(c => `
                        <button type="button" onclick="window.changeSeatPickerCar(${c})" class="px-2.5 py-1 text-xs font-bold rounded-lg transition ${currentCar === c ? 'bg-blue-600 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}">${c}車</button>
                    `).join('')}
                </div>
            </div>
            
            <!-- 圖例說明 -->
            <div class="grid grid-cols-4 gap-2 mb-6 text-[10px] font-bold text-center border-b border-gray-100 pb-3">
                <div class="flex flex-col items-center"><span class="w-4 h-4 rounded border border-gray-300 bg-white mb-1"></span><span class="text-gray-500">可選</span></div>
                <div class="flex flex-col items-center"><span class="w-4 h-4 rounded bg-gray-200 mb-1"></span><span class="text-gray-500">已佔用</span></div>
                <div class="flex flex-col items-center"><span class="w-4 h-4 rounded bg-amber-500 mb-1"></span><span class="text-gray-500">同行已選</span></div>
                <div class="flex flex-col items-center"><span class="w-4 h-4 rounded bg-emerald-600 mb-1"></span><span class="text-gray-500">已選中</span></div>
            </div>
            
            <!-- 車廂走道圖圖 -->
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 select-none relative">
                <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-500 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">車頭方向</div>
                <div class="pt-2">
                    ${seatsHTML}
                </div>
            </div>
            
            <div class="flex justify-end gap-2">
                <button type="button" onclick="window.closeSeatPicker()" class="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-2.5 rounded-xl transition">關閉</button>
            </div>
        </div>
    `;
};

window.changeSeatPickerCar = function(carNum) {
    ticketingState.selectedCar = carNum;
    window.renderSeatPicker();
};

window.selectSeat = function(seatId) {
    const passengerIdx = ticketingState.activePassengerIndex;
    ticketingState.passengers[passengerIdx].seatInfo = seatId;
    window.closeSeatPicker();
    window.renderTicketingPage();
    showToastNotification(`已選擇座位：${seatId}`, 'success');
};

window.closeSeatPicker = function() {
    const modal = document.getElementById('seat-picker-modal');
    if (modal) modal.classList.add('hidden');
};