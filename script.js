const GAS_URL = "https://script.google.com/macros/s/AKfycbzL61TXaqcDok8wEGdIdV_J1pWgGQlhiIJKr8VtNYcKHH583YPDhTvAIt7lIv8BoLfy/execc";
const GUEST_LIMIT = 10;
let currentUser = null; // null 表示訪客狀態

// 初始化頁面
window.onload = function() {
    checkUserStatus();
};

function switchCard(cardId) {
    document.querySelectorAll('.glass-card').forEach(c => c.style.display = 'none');
    document.getElementById(cardId).style.display = 'block';
}

function checkUserStatus() {
    const savedUser = localStorage.getItem('yt_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('auth-hint').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'block';
    } else {
        currentUser = null;
        document.getElementById('auth-hint').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'none';
    }
    updateQuotaUI();
}

function updateQuotaUI() {
    const qCount = document.getElementById('quota-count');
    const uStatus = document.getElementById('user-status');

    if (!currentUser) {
        let used = parseInt(localStorage.getItem('guest_used') || 0);
        let remain = Math.max(0, GUEST_LIMIT - used);
        uStatus.innerHTML = `身分：訪客 (剩餘 <span id="quota-count">${remain}</span> 次)`;
    } else {
        uStatus.innerHTML = `身分：${currentUser.email} (剩餘 <span id="quota-count">${currentUser.quota}</span> 次)`;
    }
}

// 核心下載功能
async function startDownload() {
    const url = document.getElementById('yt-url').value;
    if (!url) return alert("請貼上網址");

    let payload = { action: "download", url: url };

    if (!currentUser) {
        let used = parseInt(localStorage.getItem('guest_used') || 0);
        if (used >= GUEST_LIMIT) return alert("訪客額度已滿，請登入獲取 20 次機會！");
        payload.isGuest = true;
    } else {
        payload.email = currentUser.email;
        payload.isGuest = false;
    }

    try {
        const res = await fetch(GAS_URL, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.status === "success") {
            if (!currentUser) {
                localStorage.setItem('guest_used', parseInt(localStorage.getItem('guest_used') || 0) + 1);
            } else {
                currentUser.quota = data.remainingQuota;
                localStorage.setItem('yt_user', JSON.stringify(currentUser));
            }
            updateQuotaUI();
            window.open(data.downloadLink, '_blank');
        } else {
            alert(data.message);
        }
    } catch (e) {
        alert("連線失敗，請檢查後端 GAS 部署權限是否設為『任何人』");
    }
}

// 註冊與登入功能
async function sendOTP() {
    const email = document.getElementById('reg-email').value;
    if (!email) return alert("請輸入 Email");
    await fetch(GAS_URL, { method: "POST", body: JSON.stringify({ action: "sendOTP", email }) });
    alert("驗證碼已寄出");
}

async function handleRegister() {
    const email = document.getElementById('reg-email').value;
    const otp = document.getElementById('reg-otp').value;
    const pass = document.getElementById('reg-pass').value;

    const res = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({ action: "register", email, otp, pass }) });
    const data = await res.json();
    if (data.status === "success") {
        currentUser = { email: email, quota: 20 };
        localStorage.setItem('yt_user', JSON.stringify(currentUser));
        checkUserStatus();
        switchCard('download-card');
    }
}

function logout() {
    localStorage.removeItem('yt_user');
    checkUserStatus();
    alert("已登出");
}

// Google 登入回調
async function handleCredentialResponse(response) {
    const res = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({ action: "googleLogin", token: response.credential }) });
    const data = await res.json();
    if (data.status === "success") {
        currentUser = { email: data.email, quota: data.quota };
        localStorage.setItem('yt_user', JSON.stringify(currentUser));
        checkUserStatus();
        switchCard('download-card');
    }
}
