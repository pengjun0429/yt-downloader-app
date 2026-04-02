const GAS_URL = "https://script.google.com/macros/s/AKfycbz2-K7oLmGh5RMfaBS-7wokxbnLnmymqEaDrUuXEwYjhi1Lzm5PzitlVpGjCsBsYc0c/exec";

function switchCard(cardId) {
    document.querySelectorAll('.glass-card').forEach(card => card.style.display = 'none');
    document.getElementById(cardId).style.display = 'block';
}

// 1. 發送 Email 驗證碼
async function sendOTP() {
    const email = document.getElementById('reg-email').value;
    if(!email) return alert("請輸入 Email");
    
    const res = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "sendOTP", email: email })
    });
    const result = await res.json();
    if(result.status === "sent") alert("驗證碼已寄出！");
}

// 2. 註冊邏輯
async function handleRegister() {
    const email = document.getElementById('reg-email').value;
    const otp = document.getElementById('reg-otp').value;
    const pass = document.getElementById('reg-pass').value;

    const res = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "register", email, otp, pass })
    });
    const result = await res.json();
    if(result.status === "success") {
        alert("註冊成功！");
        switchCard('login-card');
    } else {
        alert("註冊失敗：" + result.message);
    }
}

// 3. Google 登入回傳處理
function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    // 將 token 傳給 GAS 驗證並建立使用者
    fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "googleLogin", token: response.credential })
    }).then(res => res.json()).then(data => {
        if(data.status === "success") {
            loginSuccess(data.quota);
        }
    });
}

function loginSuccess(quota) {
    document.getElementById('quota-count').innerText = quota;
    switchCard('download-card');
}

// 4. 下載功能
async function startDownload() {
    const url = document.getElementById('yt-url').value;
    if(!url) return alert("請輸入網址");

    const res = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "download", url: url })
    });
    const result = await res.json();
    
    if(result.status === "success") {
        window.open(result.downloadLink, '_blank');
        document.getElementById('quota-count').innerText = result.remainingQuota;
    } else {
        alert("下載次數不足或發生錯誤");
    }
}
