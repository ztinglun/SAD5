// --- 基礎路由與驗證控制 (Auth & Router) ---

// ==========================================
// 側邊欄收折控制
// ==========================================
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('sidebar-toggle-icon');
    const texts = document.querySelectorAll('.sidebar-text');
    sidebarExpanded = !sidebarExpanded;

    if (sidebarExpanded) {
        sidebar.classList.remove('w-20');
        sidebar.classList.add('w-64');
        toggleIcon.className = "fa-solid fa-angle-left text-lg";
        texts.forEach(t => t.style.display = 'inline');
    } else {
        sidebar.classList.remove('w-64');
        sidebar.classList.add('w-20');
        toggleIcon.className = "fa-solid fa-angle-right text-lg";
        texts.forEach(t => t.style.display = 'none');
    }
};

// ==========================================
// 行動裝置漢堡選單控制
// ==========================================
window.toggleMobileSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isOpen = sidebar.classList.contains('mobile-open');

    if (isOpen) {
        sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
    } else {
        sidebar.classList.add('mobile-open');
        if (overlay) overlay.classList.add('active');
    }
};

window.closeMobileSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
};

// ==========================================
// 頁面路由切換（含 Loading 過場 + 權限守衛）
// ==========================================
window.switchPage = function(pageId) {
    // 權限守衛：未登入時重導向至登入頁
    if (!isLoggedIn && ['create-trip','social-wall','member-center','my-bookings'].includes(pageId)) {
        showToastNotification('請先登入後再使用此功能', 'warning');
        pageId = 'login';
    }

    // 關閉行動裝置側邊欄
    closeMobileSidebar();

    // 顯示 Loading 過場
    showPageLoading();

    // 使用 requestAnimationFrame 確保 loading 畫面先渲染
    requestAnimationFrame(() => {
        setTimeout(() => {
            // 隱藏所有頁面
            document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));

            // 重設側邊欄按鈕高亮
            document.querySelectorAll('#sidebar nav button').forEach(btn => {
                btn.classList.remove('bg-brand-blue', 'text-white', 'hover:bg-brand-blue-hover');
                btn.classList.add('text-gray-600', 'hover:bg-gray-50');
            });

            // 顯示目標頁面
            const targetPage = document.getElementById(`page-${pageId}`);
            if (targetPage) targetPage.classList.remove('hidden');

            // 高亮對應側邊欄按鈕
            const activeNav = document.getElementById(`nav-${pageId}`);
            if (activeNav) {
                activeNav.classList.remove('text-gray-600', 'hover:bg-gray-50');
                activeNav.classList.add('bg-brand-blue', 'text-white', 'hover:bg-brand-blue-hover');
            }

            // 觸發對應頁面的渲染邏輯
            if (pageId === 'accommodation') renderAccommodationPage();
            if (pageId === 'my-bookings') renderMyBookingsPage();
            if (pageId === 'member-center') { renderMemberBookings(); }

            // 關閉 Loading
            hidePageLoading();
        }, 150); // 短暫延遲以展示過場效果
    });
};

// ==========================================
// 登入 / 註冊視圖切換
// ==========================================
window.toggleAuthView = function(view) {
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');
    const loginView = document.getElementById('view-login');
    const registerView = document.getElementById('view-register');

    if (view === 'login') {
        loginTab.className = "flex-1 pb-2 text-center font-bold text-blue-600 border-b-2 border-blue-600 transition cursor-pointer";
        registerTab.className = "flex-1 pb-2 text-center font-bold text-gray-400 hover:text-gray-600 border-b-2 border-transparent transition cursor-pointer";
        loginView.classList.remove('hidden');
        registerView.classList.add('hidden');
    } else {
        registerTab.className = "flex-1 pb-2 text-center font-bold text-blue-600 border-b-2 border-blue-600 transition cursor-pointer";
        loginTab.className = "flex-1 pb-2 text-center font-bold text-gray-400 hover:text-gray-600 border-b-2 border-transparent transition cursor-pointer";
        registerView.classList.remove('hidden');
        loginView.classList.add('hidden');
    }
};
