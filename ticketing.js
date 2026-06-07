// ==========================================
// === 交通訂票系統核心邏輯引擎 (Ticketing Engine) ===
// ==========================================

window.TicketingSystem = {

    // ==========================================
    // 1. 停權防護與檢查機制
    // ==========================================
    checkSuspension: function() {
        if (!currentUser) return false;
        // 若沒有這兩個欄位則初始化
        if (currentUser.unpaidCount === undefined) currentUser.unpaidCount = 0;
        if (currentUser.suspensionUntil === undefined) currentUser.suspensionUntil = null;

        if (currentUser.suspensionUntil && new Date() < new Date(currentUser.suspensionUntil)) {
            showToastNotification(`您因一個月內逾期未付款達 6 次，目前停權中，解鎖時間：${new Date(currentUser.suspensionUntil).toLocaleDateString()}`, 'error');
            return true; // 代表被停權
        }
        return false;
    },

    // ==========================================
    // 2. 車次搜尋與進階篩選
    // ==========================================
    searchTrains: function(fromStationName, toStationName, date, timeStr, filters = {}) {
        const fromStation = stationsDB.find(s => s.name === fromStationName);
        const toStation = stationsDB.find(s => s.name === toStationName);
        if (!fromStation || !toStation) return [];

        // 判斷是否有特殊車站
        const hasSpecialStation = fromStation.isSpecial || toStation.isSpecial;
        if (hasSpecialStation) {
            showToastNotification('提醒：您的起訖站包含無人或簡易車站，取票與乘車請留意站內規定。', 'warning');
        }

        let results = trainSchedulesDB.filter(train => {
            // 基本條件：必須停靠起訖站，且起站要在訖站之前
            const fromIdx = train.stations.indexOf(fromStationName);
            const toIdx = train.stations.indexOf(toStationName);
            if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return false;

            // 時間條件篩選 (簡單字串比對)
            if (train.departureTime < timeStr) return false;

            // 進階條件：直達/轉乘
            if (filters.onlyDirect && !train.isDirect) return false;

            // 進階條件：車廂與剩餘座位
            if (filters.requiredCabin) {
                const cabin = train.cabins.find(c => c.type === filters.requiredCabin);
                if (!cabin || cabin.remainingSeats < (filters.seatsNeeded || 1)) return false;
            }
            return true;
        });

        // 將試算票價等資訊封裝進結果中
        return results.map(train => {
            return {
                ...train,
                fromStation: fromStationName,
                toStation: toStationName,
                distance: Math.abs(toStation.mileage - fromStation.mileage),
                hasSpecialStation: hasSpecialStation
            };
        });
    },

    // ==========================================
    // 3. 票價計算與折扣引擎
    // ==========================================
    calculatePrice: function(trainType, distance, cabinType, ticketType) {
        const baseRate = ticketRules.baseRate[trainType] || 1.46;
        const cabinMul = ticketRules.cabinMultiplier[cabinType] || 1.0;
        const discountRate = ticketRules.discounts[ticketType] || 1.0;

        // 一般票價 = 基本費率 * 里程 * 車廂加成 (四捨五入)
        const regularPrice = Math.round(baseRate * distance * cabinMul);
        
        // 最終票價 = 一般票價 * 最優折扣
        const finalPrice = Math.round(regularPrice * discountRate);

        return { regularPrice, finalPrice, discountApplied: (discountRate < 1.0) };
    },

    // ==========================================
    // 4. 動態付款期限與建立訂單
    // ==========================================
    calculatePaymentDeadline: function(depDateStr, depTimeStr) {
        const now = new Date();
        const depDate = new Date(`${depDateStr}T${depTimeStr}`);
        const diffHours = (depDate - now) / (1000 * 60 * 60);

        let deadline = new Date();
        if (diffHours < 24 && now.getDate() === depDate.getDate()) {
            // 乘車當日：開車前 20 分鐘
            deadline = new Date(depDate.getTime() - 20 * 60000);
        } else if (diffHours < 48 && depDate.getDate() - now.getDate() === 1) {
            // 乘車前一日：當日 23:59:59
            deadline.setHours(23, 59, 59, 999);
        } else {
            // 一般：次日 23:59:59
            deadline.setDate(deadline.getDate() + 1);
            deadline.setHours(23, 59, 59, 999);
        }
        return deadline;
    },

    createOrder: function(trainInfo, passengers, date, pickupMethod, totalAmount) {
        if (this.checkSuspension()) return null; // 停權阻擋

        const deadline = this.calculatePaymentDeadline(date, trainInfo.departureTime);

        if (deadline < new Date()) {
            showToastNotification('此班次已超過訂票或付款期限（發車前20分鐘截止），請選擇未來的班次！', 'error');
            return null;
        }

        const cabinType = (window.ticketingState && window.ticketingState.searchParams && window.ticketingState.searchParams.cabin) || '標準';

        const order = {
            id: 'ORD' + Date.now(),
            mainBuyerId: currentUser.name,
            trainInfo, passengers, date, pickupMethod, totalAmount,
            cabinType,
            status: 'pending_payment', // 狀態: 待付款
            deadline: deadline.toISOString(),
            createdAt: new Date().toISOString(),
            isModified: false,
            paymentMethod: null
        };

        // 扣除該車種/車廂的剩餘座位
        const train = trainSchedulesDB.find(t => t.trainNumber === trainInfo.trainNumber);
        if (train) {
            const cabin = train.cabins.find(c => c.type === cabinType);
            if (cabin && cabin.remainingSeats !== 999) {
                cabin.remainingSeats = Math.max(0, cabin.remainingSeats - passengers.length);
            }
        }

        ticketOrders.push(order);
        AppPersistence.autoSave();
        return order;
    },

    // ==========================================
    // 5. 金流支付與超商/ATM 非同步入帳模擬
    // ==========================================
    processPayment: function(orderId, paymentMethod, usePoints = 0) {
        const order = ticketOrders.find(o => o.id === orderId);
        if (!order) return;

        // 點數折抵
        if (usePoints > 0 && currentUser.points >= usePoints) {
            currentUser.points -= usePoints;
            order.totalAmount -= usePoints;
            order.pointsUsed = usePoints;
        }

        order.paymentMethod = paymentMethod;

        if (paymentMethod === '信用卡' || paymentMethod === '行動支付') {
            // 即時扣款成功
            order.status = 'paid_pending_pickup';
            showToastNotification('線上扣款成功！訂單已成立。', 'success');
            if (typeof addBookingToCurrentTrip === 'function') {
                addBookingToCurrentTrip(order, 'transport');
            } else if (window.ItinerarySystem) {
                window.ItinerarySystem.injectBookingToTrip(order, 'transport');
            }
        } else {
            // 非同步付款 (產出代碼)
            order.virtualAccount = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
            showToastNotification(`請記下您的繳費代碼：${order.virtualAccount}，並於期限內繳納`, 'info');
            
            // 模擬金流 5 秒後自動入帳 Callback
            setTimeout(() => {
                const checkOrder = ticketOrders.find(o => o.id === orderId);
                if (checkOrder && checkOrder.status === 'pending_payment') {
                    checkOrder.status = 'paid_pending_pickup';
                    AppPersistence.autoSave();
                    showToastNotification(`系統通知：您的訂單 ${orderId} 外部繳費已入帳！`, 'success');
                    if (typeof addBookingToCurrentTrip === 'function') {
                        addBookingToCurrentTrip(checkOrder, 'transport');
                    } else if (window.ItinerarySystem) {
                        window.ItinerarySystem.injectBookingToTrip(checkOrder, 'transport');
                    }
                }
            }, 5000);
        }
        AppPersistence.autoSave();
    },

    // 定期檢查逾期未付訂單 (惡意棄單停權機制)
    checkOverdueOrders: function() {
        const now = new Date();
        ticketOrders.forEach(order => {
            if (order.status === 'pending_payment' && now > new Date(order.deadline)) {
                order.status = 'cancelled_or_expired'; // 逾期作廢
                if (order.mainBuyerId === currentUser.name) {
                    currentUser.unpaidCount = (currentUser.unpaidCount || 0) + 1;
                    if (currentUser.unpaidCount >= 6) {
                        const unlockDate = new Date();
                        unlockDate.setDate(unlockDate.getDate() + 30); // 停權 30 天
                        currentUser.suspensionUntil = unlockDate.toISOString();
                        showToastNotification('警告：您已累積 6 次未付款紀錄，即日起停權訂票 1 個月！', 'error');
                    }
                }
            }
        });
        AppPersistence.autoSave();
    },

    // ==========================================
    // 6. 取票與分票邏輯
    // ==========================================
    pickupTicket: function(orderId) {
        const order = ticketOrders.find(o => o.id === orderId);
        if (!order || order.status !== 'paid_pending_pickup') return;

        const now = new Date();
        const depTime = new Date(`${order.date}T${order.trainInfo.departureTime}`);
        if ((depTime - now) < 20 * 60000) {
            showToastNotification('發車前 20 分鐘已停止取票！', 'error');
            return;
        }

        order.status = 'picked_up';
        if (order.pickupMethod === '線上取票') {
            order.qrCode = `QR_${order.id}_${Date.now()}`;
            showToastNotification('電子票券產生成功！請至詳情查看 QR Code。', 'success');
        } else {
            order.pickupCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            showToastNotification(`實體取票代碼：${order.pickupCode}，請至車站或超商列印。`, 'info');
        }
        AppPersistence.autoSave();
    },

    splitTicket: function(orderId, receiverName) {
        const order = ticketOrders.find(o => o.id === orderId);
        if (!order || order.status !== 'paid_pending_pickup' || order.pickupMethod !== '線上取票') return;
        
        // 驗證受讓人
        const receiver = registeredUsers.find(u => u.name === receiverName);
        if (!receiver) {
            showToastNotification('找不到該受讓人帳號，請確認名稱是否正確！', 'error');
            return;
        }

        // 執行分票 (拆分乘客)
        const transferredPassenger = order.passengers.pop(); // 簡單模擬：移出最後一名乘客
        
        const newOrder = JSON.parse(JSON.stringify(order));
        newOrder.id = 'SPLIT_' + Date.now();
        newOrder.mainBuyerId = receiver.name;
        newOrder.passengers = [transferredPassenger];
        newOrder.note = `由 ${currentUser.name} 轉贈`;
        
        ticketOrders.push(newOrder);
        AppPersistence.autoSave();
        showToastNotification(`已成功分票給 ${receiverName}！`, 'success');
    },

    // ==========================================
    // 7. 改票與退款 (含手續費與溯源)
    // ==========================================
    refundTicket: function(orderId) {
        const order = ticketOrders.find(o => o.id === orderId);
        if (!order) return;

        if (order.pickupMethod !== '線上取票' && order.status === 'picked_up') {
            showToastNotification('您已領取實體車票，請親自至火車站窗口辦理退票！', 'error');
            return;
        }

        // 計算手續費
        const now = new Date();
        const depDate = new Date(order.date);
        const diffDays = Math.floor((depDate - now) / (1000 * 60 * 60 * 24));
        
        let feePercent = 0.10; // 預設當日 10%
        for (let rule of ticketRules.refundFees) {
            if (diffDays >= rule.minDays) {
                feePercent = rule.feePercent;
                break;
            }
        }
        
        const fee = Math.round(order.totalAmount * feePercent);
        const refundAmount = order.totalAmount - fee;

        // 溯源退款判斷
        if (order.paymentMethod === '信用卡') {
            showToastNotification(`退票成功！手續費 $${fee}。剩餘 $${refundAmount} 將自動刷退至原信用卡。`, 'success');
        } else {
            showToastNotification(`退票成功！手續費 $${fee}。系統已發送通知給主訂購人補登退款帳戶以領取 $${refundAmount}。`, 'warning');
        }

        order.status = 'refunded';
        // 還原該車種/車廂的剩餘座位
        const train = trainSchedulesDB.find(t => t.trainNumber === order.trainInfo.trainNumber);
        if (train) {
            const cabinType = order.cabinType || '標準';
            const cabin = train.cabins.find(c => c.type === cabinType);
            if (cabin && cabin.remainingSeats !== 999) {
                cabin.remainingSeats += order.passengers.length;
            }
        }
        AppPersistence.autoSave();
    },

    // ==========================================
    // 8. 異常通報與補償機制 (管理者觸發)
    // ==========================================
    simulateTrainAnomaly: function(trainNumber, statusType) {
        // statusType: '延誤' 或 '停駛'
        const train = trainSchedulesDB.find(t => t.trainNumber === trainNumber);
        if (!train) return;
        train.status = statusType;

        // 撈取受影響訂單
        ticketOrders.forEach(order => {
            // 🌟 條件新增：排除已作廢、已退票，【且必須是還沒領過補償的訂單】
            if (order.trainInfo.trainNumber === trainNumber && 
                !['cancelled_or_expired', 'refunded'].includes(order.status) && 
                !order.isCompensated) {
                
                // 🌟 立刻給這筆訂單蓋上「已補償」的印章，防重複領取！
                order.isCompensated = true;

                // 1. 發放點數 50 點
                const userIndex = registeredUsers.findIndex(u => u.name === order.mainBuyerId);
                if (userIndex !== -1) {
                    registeredUsers[userIndex].points = (registeredUsers[userIndex].points || 0) + 50;
                    
                    if (currentUser && currentUser.name === order.mainBuyerId) {
                        currentUser.points = registeredUsers[userIndex].points;
                    }
                }

                // 2. 停駛專屬換票資格
                if (statusType === '停駛') {
                    order.compensationEligible = true;
                    showToastNotification(`系統異常通知：您訂購的 ${trainNumber} 車次已停駛。已補償 50 點，並提供一次免費換票機會！`, 'error');
                } else {
                    showToastNotification(`系統通知：您訂購的 ${trainNumber} 車次發生延誤。已發放 50 點補償金至您的帳戶！`, 'warning');
                }
            }
        });
        AppPersistence.autoSave();
    }
};

// 為了讓全域一載入就能定時檢查逾期訂單，我們設定一個 setInterval
setInterval(() => {
    if (window.TicketingSystem) window.TicketingSystem.checkOverdueOrders();
}, 30000); // 每 30 秒檢查一次