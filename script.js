const GAS_URL = "https://script.google.com/macros/s/AKfycbzcWO4LBMANyPg3r5iZkUYu0ZZPKlgIo4Q4aJWHTSDg_b8Kdak7tdxouXQkahPCmyM_/exec";
const GUEST_LIMIT = 10;
let currentUser = JSON.parse(localStorage.getItem('yt_user')) || null;

window.onload = () => updateUI();

function switchCard(id) {
    document.querySelectorAll('.glass-card').forEach(c => c.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

function showError(msg) {
    document.getElementById('error-msg').innerText = msg;
    switchCard('error-card');
}

function updateUI() {
    const qCount = document.getElementById('quota-count');
    const uStatus = document.getElementById('user-status');
    if (!currentUser) {
        let used = parseInt(localStorage.getItem('guest_used') || 0);
        qCount.innerText = GUEST_LIMIT - used;
        uStatus.innerText = `身分：訪客 (剩餘 ${GUEST_LIMIT - used} 次)`;
        document.getElementById('logout-btn').style.display = 'none';
        document.getElementById('auth-hint').style.display = 'block';
    } else {
        uStatus.innerText = `身分：${currentUser.email} (剩餘 ${currentUser.quota} 次)`;
        document.getElementById('logout-btn').style.display = 'block';
        document.getElementById('auth-hint').style.display = 'none';
    }
}

async function startDownload() {
    const url = document.getElementById('yt-url').value;
    if (!url) return showError("請輸入網址");

    let payload = { action: "download", url: url, isGuest: !currentUser };
    if (currentUser) payload.email = currentUser.email;

    try {
        const res = await fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.status === "success") {
            if (!currentUser) localStorage.setItem('guest_used', parseInt(localStorage.getItem('guest_used') || 0) + 1);
            else { currentUser.quota = data.remainingQuota; localStorage.setItem('yt_user', JSON.stringify(currentUser)); }
            updateUI();
            window.open(data.downloadLink, '_blank');
        } else showError(data.message);
    } catch (e) {
        showError("無法連線至伺服器，請檢查 CORS 設定或網路連線。");
    }
}

async function handleCredentialResponse(response) {
    try {
        const res = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({ action: "googleLogin", token: response.credential }) });
        const data = await res.json();
        if (data.status === "success") {
            currentUser = { email: data.email, quota: data.quota };
            localStorage.setItem('yt_user', JSON.stringify(currentUser));
            switchCard('download-card');
            updateUI();
        } else showError("Google 驗證失敗");
    } catch (e) {
        showError("Google 登入連線錯誤");
    }
}

function logout() { localStorage.removeItem('yt_user'); currentUser = null; updateUI(); }
