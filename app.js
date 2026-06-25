// ==================== KHỞI TẠO HỆ THỐNG & ĐỒNG BỘ DỮ LIỆU ====================

// Lấy chế độ chơi và mã phòng từ URL
const urlParams = new URLSearchParams(window.location.search);
const isSpectator = urlParams.get('role') === 'spectator';
let currentRoomId = urlParams.get('room');

// Tự sinh mã phòng ngẫu nhiên cho Spectator để tránh trùng lặp khi thuyết trình
if (!currentRoomId && isSpectator) {
  currentRoomId = 'room_' + Math.floor(1000 + Math.random() * 9000);
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('room', currentRoomId);
  window.location.href = currentUrl.toString();
} else if (!currentRoomId) {
  currentRoomId = 'room_default';
}

// Bộ điều phối cơ sở dữ liệu (Firebase vs LocalStorage)
class GameDatabase {
  constructor() {
    this.isFirebase = false;
    this.playersCallbacks = [];
    this.techCallbacks = [];
    this.statusCallbacks = [];
    this.fbDb = null;
  }

  init(onReady) {
    const hasConfig = typeof firebaseConfig !== 'undefined' && 
                      firebaseConfig.apiKey && 
                      firebaseConfig.apiKey !== "YOUR_API_KEY";

    if (hasConfig) {
      try {
        firebase.initializeApp(firebaseConfig);
        this.fbDb = firebase.database();
        this.isFirebase = true;
        console.log(`🎮 Đang chạy ONLINE (Firebase) - Phòng: ${currentRoomId}`);
      } catch (e) {
        console.error("Firebase lỗi, tự động chuyển về LocalStorage:", e);
      }
    } else {
      console.log(`🔌 Đang chạy OFFLINE (LocalStorage) - Phòng: ${currentRoomId}`);
      const toggleBtn = document.getElementById('btnToggleRole');
      if (toggleBtn) {
        toggleBtn.innerHTML += " (Offline)";
      }
    }

    if (!this.isFirebase) {
      // Khởi tạo LocalStorage cho phòng hiện tại
      if (!localStorage.getItem(`calon_players_${currentRoomId}`)) {
        localStorage.setItem(`calon_players_${currentRoomId}`, JSON.stringify({}));
      }
      if (!localStorage.getItem(`calon_market_tech_${currentRoomId}`)) {
        localStorage.setItem(`calon_market_tech_${currentRoomId}`, JSON.stringify({}));
      }
      if (!localStorage.getItem(`calon_status_${currentRoomId}`)) {
        localStorage.setItem(`calon_status_${currentRoomId}`, JSON.stringify({
          started: false,
          paused: false,
          gameOver: false,
          timeLeft: 300,
          duration: 300
        }));
      }

      // Lắng nghe sự thay đổi từ các tab khác
      window.addEventListener('storage', (e) => {
        if (e.key === `calon_players_${currentRoomId}`) {
          const data = JSON.parse(e.newValue || '{}');
          this.playersCallbacks.forEach(cb => cb(data));
        }
        if (e.key === `calon_market_tech_${currentRoomId}`) {
          const data = JSON.parse(e.newValue || '{}');
          this.techCallbacks.forEach(cb => cb(data));
        }
        if (e.key === `calon_status_${currentRoomId}`) {
          const data = JSON.parse(e.newValue || '{}');
          this.statusCallbacks.forEach(cb => cb(data));
        }
      });
    }

    onReady();
  }

  // Đăng ký sự kiện thay đổi danh sách người chơi
  onPlayersChange(callback) {
    if (this.isFirebase) {
      this.fbDb.ref(`rooms/${currentRoomId}/players`).on('value', (snapshot) => {
        callback(snapshot.val() || {});
      });
    } else {
      this.playersCallbacks.push(callback);
      const data = JSON.parse(localStorage.getItem(`calon_players_${currentRoomId}`) || '{}');
      callback(data);
    }
  }

  // Đăng ký sự kiện thay đổi dữ liệu công nghệ thị trường
  onMarketTechChange(callback) {
    if (this.isFirebase) {
      this.fbDb.ref(`rooms/${currentRoomId}/market_tech`).on('value', (snapshot) => {
        callback(snapshot.val() || {});
      });
    } else {
      this.techCallbacks.push(callback);
      const data = JSON.parse(localStorage.getItem(`calon_market_tech_${currentRoomId}`) || '{}');
      callback(data);
    }
  }

  // Đăng ký sự kiện thay đổi trạng thái trận đấu
  onStatusChange(callback) {
    if (this.isFirebase) {
      this.fbDb.ref(`rooms/${currentRoomId}/status`).on('value', (snapshot) => {
        callback(snapshot.val() || { started: false, gameOver: false, timeLeft: 300, duration: 300 });
      });
    } else {
      this.statusCallbacks.push(callback);
      const data = JSON.parse(localStorage.getItem(`calon_status_${currentRoomId}`) || '{"started":false,"gameOver":false,"timeLeft":300,"duration":300}');
      callback(data);
    }
  }

  // Cập nhật thông tin một người chơi
  updatePlayer(id, updates) {
    if (this.isFirebase) {
      this.fbDb.ref(`rooms/${currentRoomId}/players/${id}`).update(updates);
    } else {
      const players = JSON.parse(localStorage.getItem(`calon_players_${currentRoomId}`) || '{}');
      if (!players[id]) players[id] = {};
      players[id] = { ...players[id], ...updates };
      localStorage.setItem(`calon_players_${currentRoomId}`, JSON.stringify(players));
      this.playersCallbacks.forEach(cb => cb(players));
    }
  }

  // Cập nhật trạng thái trận đấu
  updateStatus(updates) {
    if (this.isFirebase) {
      this.fbDb.ref(`rooms/${currentRoomId}/status`).update(updates);
    } else {
      const status = JSON.parse(localStorage.getItem(`calon_status_${currentRoomId}`) || '{}');
      const newStatus = { ...status, ...updates };
      localStorage.setItem(`calon_status_${currentRoomId}`, JSON.stringify(newStatus));
      this.statusCallbacks.forEach(cb => cb(newStatus));
    }
  }

  // Xóa một người chơi (ví dụ khi thoát)
  removePlayer(id) {
    if (this.isFirebase) {
      this.fbDb.ref(`rooms/${currentRoomId}/players/${id}`).remove();
    } else {
      const players = JSON.parse(localStorage.getItem(`calon_players_${currentRoomId}`) || '{}');
      delete players[id];
      localStorage.setItem(`calon_players_${currentRoomId}`, JSON.stringify(players));
      this.playersCallbacks.forEach(cb => cb(players));
    }
  }

  // Mua công nghệ đầu tiên (kiểm tra thặng dư siêu ngạch)
  claimFirstTech(techLevel, playerName, callback) {
    const key = `level_${techLevel}`;
    if (this.isFirebase) {
      const ref = this.fbDb.ref(`rooms/${currentRoomId}/market_tech/${key}`);
      ref.transaction((currentVal) => {
        if (currentVal === null) {
          return playerName; // Trở thành người đầu tiên tiên phong công nghệ này
        }
        return currentVal; // Giữ nguyên người đầu tiên cũ
      }, (error, committed, snapshot) => {
        callback(committed, snapshot.val());
      });
    } else {
      const techs = JSON.parse(localStorage.getItem(`calon_market_tech_${currentRoomId}`) || '{}');
      let committed = false;
      if (!techs[key]) {
        techs[key] = playerName;
        localStorage.setItem(`calon_market_tech_${currentRoomId}`, JSON.stringify(techs));
        committed = true;
        this.techCallbacks.forEach(cb => cb(techs));
      }
      callback(committed, techs[key]);
    }
  }

  // Reset dữ liệu phòng
  resetRoom() {
    if (this.isFirebase) {
      this.fbDb.ref(`rooms/${currentRoomId}/market_tech`).remove();
      this.fbDb.ref(`rooms/${currentRoomId}/players`).remove();
      this.fbDb.ref(`rooms/${currentRoomId}/status`).set({
        started: false,
        gameOver: false,
        timeLeft: 300,
        duration: 300
      });
    } else {
      localStorage.setItem(`calon_market_tech_${currentRoomId}`, JSON.stringify({}));
      localStorage.setItem(`calon_players_${currentRoomId}`, JSON.stringify({}));
      localStorage.setItem(`calon_status_${currentRoomId}`, JSON.stringify({
        started: false,
        gameOver: false,
        timeLeft: 300,
        duration: 300
      }));
      this.playersCallbacks.forEach(cb => cb({}));
      this.techCallbacks.forEach(cb => cb({}));
      this.statusCallbacks.forEach(cb => cb({ started: false, gameOver: false, timeLeft: 300, duration: 300 }));
    }
  }

  resetDatabase() {
    // Chỉ reset dữ liệu phòng hiện tại để không ảnh hưởng tới phòng khác
    this.resetRoom();
  }
}

const db = new GameDatabase();

// Tự động chuyển đổi giữa Spectator và Player
function toggleRole() {
  const currentUrl = new URL(window.location.href);
  if (isSpectator) {
    currentUrl.searchParams.delete('role');
  } else {
    currentUrl.searchParams.set('role', 'spectator');
  }
  window.location.href = currentUrl.toString();
}


// ==================== CẤU HÌNH THÔNG SỐ VÀ CÔNG NGHỆ ====================

// Chiều rộng & chiều cao thế giới ảo (Độc lập với độ phân giải màn hình canvas)
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1000;

// Các tham số cấu hình mặc định (có thể đồng bộ qua database)
let gameConfig = {
  initHp: 100,
  bonusAbs: 20, // Điểm cộng máu cơ bản
  extraTimer: 5  // Thời gian duy trì combo thặng dư siêu ngạch (mặc định 5s)
};

// Các cấp độ công nghệ (Sản xuất thặng dư tương đối)
const TECH_LEVELS = [
  { level: 0, name: "Thủ công (Gia công)", multiplier: 1.0, cost: 0 },
  { level: 1, name: "Cơ khí hóa", multiplier: 1.5, cost: 30 },
  { level: 2, name: "Tự động hóa", multiplier: 2.2, cost: 60 },
  { level: 3, name: "AI & Robot hóa", multiplier: 3.2, cost: 100 }
];


// ==================== PHẦN 1: MÀN HÌNH SPECTATOR (MÁY CHIẾU) ====================

let canvas, ctx;
let localPlayers = {};
let marketTechData = {};
let bubbles = [];
const bgImage = new Image();
bgImage.src = 'picture/backgroud.jpg';

// Tải trước danh sách ảnh cá từ thư mục picture
const fishImages = {};
const fishIndices = [1, 3, 4, 5, 6, 7, 8, 9, 10];
fishIndices.forEach(idx => {
  const img = new Image();
  img.src = `picture/${idx}.png`;
  fishImages[idx] = img;
});

// Hàm lấy ảnh cá ngẫu nhiên nhưng nhất quán theo ID người chơi
function getFishImageForPlayer(p) {
  let hash = 0;
  const idStr = p.id || '';
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const imgIndex = fishIndices[Math.abs(hash) % fishIndices.length];
  return fishImages[imgIndex];
}
let gameState = {
  started: false,
  paused: false,
  gameOver: false,
  timeLeft: 300,
  duration: 300
};
let timerInterval = null;

function initSpectator() {
  document.getElementById('spectatorView').classList.remove('hidden');
  document.getElementById('playerView').classList.add('hidden');

  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  
  // Tự động điều chỉnh kích thước Canvas
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Xóa sạch cơ sở dữ liệu cũ để tránh cá rác từ phiên trước
  db.resetDatabase();

  // Khởi tạo các bong bóng dưới nước trang trí
  for (let i = 0; i < 40; i++) {
    bubbles.push({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT + WORLD_HEIGHT,
      r: Math.random() * 6 + 2,
      speed: Math.random() * 1.5 + 0.5,
      wobble: Math.random() * 2,
      wobbleSpeed: Math.random() * 0.02
    });
  }

  // Sinh mã QR động cho người chơi tham gia
  generateJoinQR();

  // Đăng ký nhận dữ liệu thời gian thực từ cơ sở dữ liệu
  db.onPlayersChange((players) => {
    // Chỉ cập nhật các thuộc tính mà người chơi điều khiển gửi lên để giữ mượt mà
    for (let id in players) {
      if (!localPlayers[id]) {
        // Tạo cá mới trên màn hình spectator tại vị trí ngẫu nhiên
        localPlayers[id] = {
          ...players[id],
          x: Math.random() * (WORLD_WIDTH - 200) + 100,
          y: Math.random() * (WORLD_HEIGHT - 200) + 100,
          currentSize: 15,
          angle: 0
        };
      } else {
        // Cập nhật các thông số động
        localPlayers[id].name = players[id].name;
        localPlayers[id].color = players[id].color;
        localPlayers[id].hp = players[id].hp;
        localPlayers[id].score = players[id].score;
        localPlayers[id].techLevel = players[id].techLevel;
        localPlayers[id].hasExtraSurplus = players[id].hasExtraSurplus;
        localPlayers[id].vx = players[id].vx || 0;
        localPlayers[id].vy = players[id].vy || 0;
        localPlayers[id].invulnUntil = players[id].invulnUntil || 0;
        localPlayers[id].stunnedUntil = players[id].stunnedUntil || 0;
        localPlayers[id].comboUntil = players[id].comboUntil || 0;
        localPlayers[id].combo = players[id].combo || 0;
      }
    }

    // Xóa những người chơi đã thoát game
    for (let id in localPlayers) {
      if (!players[id]) {
        delete localPlayers[id];
      }
    }

    updateLeaderboard();
  });

  db.onMarketTechChange((techs) => {
    marketTechData = techs;
  });

  // Đăng ký trạng thái phòng chơi (started, gameOver, timer)
  db.onStatusChange((status) => {
    gameState = status;
    updateStatusUi(status);
    
    // Đồng bộ các thông số cấu hình từ Host
    if (status.config) {
      gameConfig = { ...gameConfig, ...status.config };
    }
    
    // Đồng bộ danh sách câu hỏi tùy chọn được import
    if (status.customQuestions && status.customQuestions.length > 0) {
      QUESTIONS.length = 0;
      QUESTIONS.push(...status.customQuestions);
      const impStatusEl = document.getElementById('importStatus');
      if (impStatusEl) {
        impStatusEl.innerText = `Đã nhập: ${status.customQuestions.length} câu`;
      }
    }
    
    // Khởi chạy đồng hồ đếm ngược trên máy chiếu (Chỉ chạy trên máy spectator/host)
    if (status.started && !timerInterval) {
      startTimerTick();
    } else if (!status.started && timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Hiển thị bục vinh danh khi kết thúc
    if (status.gameOver) {
      showVictoryPodium();
    } else {
      const podium = document.getElementById('podiumOverlay');
      if (podium) podium.classList.add('hidden');
    }
  });

  // Bắt đầu vòng lặp game vẽ đại dương
  requestAnimationFrame(spectatorGameLoop);
}

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

function generateJoinQR() {
  // Lấy link hiện tại để chế độ Player quét, tự động đính kèm mã phòng
  let joinUrl = window.location.href.split('?')[0] + `?room=${currentRoomId}`;
  document.getElementById('joinUrl').href = joinUrl;
  document.getElementById('joinUrl').innerText = joinUrl;

  const qrPlaceholder = document.getElementById('qrPlaceholder');
  if (qrPlaceholder) qrPlaceholder.remove();

  // Tạo mã QR bằng QRCode.js
  new QRCode(document.getElementById("qrcodeContainer"), {
    text: joinUrl,
    width: 170,
    height: 170,
    colorDark : "#070913",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}

// Bảng xếp hạng cập nhật
function updateLeaderboard() {
  const list = document.getElementById('leaderboardList');
  if (!list) return;

  const sorted = Object.values(localPlayers).sort((a, b) => b.score - a.score);
  
  if (sorted.length === 0) {
    list.innerHTML = `<div class="no-player-msg">Đang chờ các chủ tư bản gia nhập...</div>`;
    document.getElementById('statTotalPlayers').innerText = "0";
    document.getElementById('statTotalSurplus').innerText = "0";
    return;
  }

  document.getElementById('statTotalPlayers').innerText = sorted.length;
  const totalSurplus = sorted.reduce((sum, p) => sum + (p.score || 0), 0);
  document.getElementById('statTotalSurplus').innerText = totalSurplus;

  list.innerHTML = sorted.map((p, index) => {
    const rankClass = index === 0 ? "rank-1" : index === 1 ? "rank-2" : index === 2 ? "rank-3" : "";
    const techName = TECH_LEVELS[p.techLevel || 0].name;
    const stratName = p.strategy === 'absolute' ? 'Tuyệt đối ⚡' : 'Tương đối 🔬';
    
    // Kick button shows for human players or AI bots
    const isAI = p.isAI || p.id.startsWith('bot_');
    const kickAction = isAI 
      ? `removeAIPlayer('${p.id}')` 
      : `kickPlayer('${p.id}')`;

    return `
      <div class="leaderboard-item">
        <div class="rank-badge ${rankClass}">${index + 1}</div>
        <div class="player-info">
          <div class="player-name" style="color: ${p.color}">${p.name}</div>
          <div class="player-sub-stats">
            <span>HP: ${Math.round(p.hp)}</span> | 
            <span>${techName}</span> |
            <span>${stratName}</span>
          </div>
        </div>
        <div class="player-score">
          <span class="score-val">${p.score}</span>
          <span class="score-unit">thặng dư (m)</span>
        </div>
        <button class="kick-btn" onclick="${kickAction}" title="Đuổi người chơi này"><i class="fa-solid fa-user-xmark"></i></button>
      </div>
    `;
  }).join('');
}

// Hàm kick người chơi
function kickPlayer(playerId) {
  if (confirm(`Bạn có chắc chắn muốn kick người chơi ${localPlayers[playerId] ? localPlayers[playerId].name : playerId} khỏi phòng?`)) {
    db.updatePlayer(playerId, { kicked: true });
  }
}

// Hàm xóa robot AI
function removeAIPlayer(botId) {
  if (confirm(`Bạn có muốn xóa bot ${localPlayers[botId] ? localPlayers[botId].name : botId}?`)) {
    delete localPlayers[botId];
    db.removePlayer(botId);
    updateLeaderboard();
  }
}

// AI Bots (Cá máy)
let aiCount = 0;
function manageAICompetitors() {
  const activePlayers = Object.values(localPlayers);
  const humanCount = activePlayers.filter(p => !p.isAI).length;
  const currentAiCount = activePlayers.filter(p => p.isAI).length;

  // Nếu trong lớp ít người chơi, tự động thêm bot để mô phỏng thị trường
  if (humanCount > 0 && currentAiCount < 3) {
    aiCount++;
    const botId = `bot_${aiCount}`;
    const botColors = ['#eccc68', '#ff7f50', '#ff6b81', '#70a1ff', '#7bed9f'];
    const botNames = ["Tập đoàn X", "Quỹ Tư Bản Y", "Cá Mập Phố Wall", "Tư Bản Thực Dân", "Công ty Săn Mồi"];
    const botName = botNames[Math.floor(Math.random() * botNames.length)] + " " + aiCount;
    const botColor = botColors[Math.floor(Math.random() * botColors.length)];

    localPlayers[botId] = {
      id: botId,
      name: botName,
      color: botColor,
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      hp: 80 + Math.random() * 50,
      score: Math.floor(Math.random() * 20),
      strategy: Math.random() > 0.5 ? 'absolute' : 'relative',
      techLevel: Math.floor(Math.random() * 2),
      isAI: true,
      currentSize: 15,
      angle: 0
    };
  }
}

// Vòng lặp vật lý & vẽ Canvas của Spectator
function spectatorGameLoop() {
  if (!isSpectator) return;

  // Vẽ hình nền Đại dương nếu đã tải xong, ngược lại xóa bằng màu sẫm
  if (bgImage.complete && bgImage.naturalWidth !== 0) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#060a17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Vẽ lưới kinh tế mờ (Mạng lưới thị trường)
  drawMarketGrid();

  // Tỉ lệ scale giữa tọa độ ảo (1600x1000) và canvas thực tế
  const scaleX = canvas.width / WORLD_WIDTH;
  const scaleY = canvas.height / WORLD_HEIGHT;

  // Vẽ bong bóng nước
  drawBubbles(scaleX, scaleY);

  // Cập nhật vị trí và vẽ cá
  const players = Object.values(localPlayers);

  // Chỉ cho phép di chuyển và thâu tóm khi trận đấu đã bắt đầu và KHÔNG bị tạm dừng
  if (gameState.started && !gameState.paused && !gameState.gameOver) {
    const now = Date.now();
    players.forEach(p => {
      // Dịch chuyển người chơi (nếu bị choáng thì đứng yên)
      const isStun = p.stunnedUntil && p.stunnedUntil > now;
      if (!isStun) {
        // Tăng tốc 15% cho cá có combo từ x4 trở lên
        const hasComboSpeed = p.comboUntil && p.comboUntil > now && (p.combo || 0) >= 4;
        const speedMult = hasComboSpeed ? 1.15 : 1.0;

        p.x += (p.vx || 0) * 1.5 * speedMult;
        p.y += (p.vy || 0) * 1.5 * speedMult;
      }

      // Đảm bảo cá không bơi ra ngoài biên thế giới ảo
      p.x = Math.max(20, Math.min(WORLD_WIDTH - 20, p.x));
      p.y = Math.max(20, Math.min(WORLD_HEIGHT - 20, p.y));
    });

    // 2. Tính toán va chạm (Cá lớn nuốt cá bé)
    for (let i = 0; i < players.length; i++) {
      for (let j = 0; j < players.length; j++) {
        if (i === j) continue;
        const p1 = players[i];
        const p2 = players[j];

        if (p1.hp <= 0 || p2.hp <= 0) continue;

        // Bỏ qua va chạm nếu một trong hai cá đang bất tử
        const p1Invuln = p1.invulnUntil && p1.invulnUntil > now;
        const p2Invuln = p2.invulnUntil && p2.invulnUntil > now;
        if (p1Invuln || p2Invuln) continue;

        const r1 = 15 + Math.sqrt(p1.hp) * 2;
        const r2 = 15 + Math.sqrt(p2.hp) * 2;

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < r1 + r2) {
          const hp1 = Math.round(p1.hp);
          const hp2 = Math.round(p2.hp);

          if (hp1 === hp2) {
            // Hòa: Đẩy lùi (knockback) và choáng 2s
            const overlap = (r1 + r2) - dist;
            const nx = dist > 0 ? dx / dist : (Math.random() - 0.5);
            const ny = dist > 0 ? dy / dist : (Math.random() - 0.5);

            p1.x += nx * (overlap / 2 + 10);
            p1.y += ny * (overlap / 2 + 10);
            p2.x -= nx * (overlap / 2 + 10);
            p2.y -= ny * (overlap / 2 + 10);

            // Cập nhật choáng lên DB
            db.updatePlayer(p1.id, { stunnedUntil: now + 2000, vx: 0, vy: 0 });
            db.updatePlayer(p2.id, { stunnedUntil: now + 2000, vx: 0, vy: 0 });
          } else if (hp1 > hp2) {
            executeBuyout(p1, p2);
          }
        }
      }
    }
  }

  // Nếu tạm dừng, hiển thị chữ thông báo trên Máy Chiếu
  if (gameState.started && gameState.paused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffa502';
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⏸️ TRẬN ĐẤU ĐẠI DƯƠNG TẠM DỪNG', canvas.width / 2, canvas.height / 2);
    
    ctx.fillStyle = '#a4b0be';
    ctx.font = '16px "Outfit", sans-serif';
    ctx.fillText('Vui lòng tập trung lắng nghe phân tích từ người thuyết trình!', canvas.width / 2, canvas.height / 2 + 40);
  }

  // 3. Vẽ cá lên màn hình
  players.forEach(p => {
    drawFish(p, scaleX, scaleY);
  });

  // Hiển thị countdown đếm ngược đầu trận ngay trên bể cá
  if (gameState.started && !gameState.paused && !gameState.gameOver) {
    const prepTimeLeft = gameState.timeLeft - (gameState.duration - 10);
    if (prepTimeLeft > 0 && prepTimeLeft <= 10) {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 10, 23, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00d2d3';
      ctx.font = 'bold 24px "Outfit", sans-serif';
      ctx.fillText('⚡ THỜI GIAN BẢO VỆ (BẤT TỬ) ⚡', canvas.width / 2, canvas.height / 2 - 60);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 80px "Outfit", sans-serif';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00d2d3';
      ctx.fillText(prepTimeLeft, canvas.width / 2, canvas.height / 2 + 20);
      
      ctx.fillStyle = '#a4b0be';
      ctx.font = '16px "Outfit", sans-serif';
      ctx.shadowBlur = 0;
      ctx.fillText('Hãy làm Quiz tích lũy HP trước khi cuộc đi săn bắt đầu!', canvas.width / 2, canvas.height / 2 + 70);
      ctx.restore();
    }
  }

  requestAnimationFrame(spectatorGameLoop);
}

function drawMarketGrid() {
  ctx.strokeStyle = 'rgba(0, 210, 211, 0.04)';
  ctx.lineWidth = 1;
  const gridSpacing = 80;
  
  // Vẽ các đường dọc
  for (let x = 0; x < canvas.width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  // Vẽ các đường ngang
  for (let y = 0; y < canvas.height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawBubbles(scaleX, scaleY) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  bubbles.forEach(b => {
    b.y -= b.speed;
    b.wobble += b.wobbleSpeed;
    const currentX = b.x + Math.sin(b.wobble) * 8;
    
    // Reset bong bóng lên trên nếu đi lên đỉnh màn hình
    if (b.y < -20) {
      b.y = WORLD_HEIGHT + 20;
      b.x = Math.random() * WORLD_WIDTH;
    }

    ctx.beginPath();
    ctx.arc(currentX * scaleX, b.y * scaleY, b.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Thao tác thôn tính đối thủ (Cá lớn nuốt cá bé)
function executeBuyout(winner, loser) {
  // Chỉ thực thi logic nuốt nếu kẻ thua chưa phá sản
  if (loser.hp <= 0) return;

  console.log(`💥 ${winner.name} thâu tóm ${loser.name}`);

  // Tính điểm thưởng (Giá trị thặng dư chiếm đoạt) và chi phí thôn tính
  const surplusCaptured = Math.floor(loser.hp); // Nhận thặng dư bằng lượng máu đối phương bị nuốt
  const costOfCompetition = Math.floor(loser.hp); // Tiêu hao máu bằng đúng lượng máu của cá thua

  // Cập nhật kẻ thắng
  winner.score += surplusCaptured;
  winner.hp = Math.max(20, winner.hp - costOfCompetition); // Trừ máu phí thôn tính

  // Reset kẻ thua (Hồi sinh về điểm xuất phát)
  loser.hp = 0; // Đánh dấu phá sản
  loser.vx = 0;
  loser.vy = 0;

  // Đẩy cập nhật lên DB
  if (!winner.isAI) {
    db.updatePlayer(winner.id, {
      score: winner.score,
      hp: winner.hp
    });
  }

  if (!loser.isAI) {
    db.updatePlayer(loser.id, {
      hp: 0,
      vx: 0,
      vy: 0,
      bankrupt: true // Thông báo phá sản lên màn hình điện thoại
    });
  } else {
    // Bot hồi sinh lập tức tại vị trí mới
    loser.hp = 80 + Math.random() * 50;
    loser.x = Math.random() * WORLD_WIDTH;
    loser.y = Math.random() * WORLD_HEIGHT;
  }
}

// Vẽ con cá và trang trí
function drawFish(p, scaleX, scaleY) {
  const drawX = p.x * scaleX;
  const drawY = p.y * scaleY;
  
  // Tính mục tiêu kích thước dựa trên HP thực tế (Tạo hiệu ứng phình ra/co lại mượt mà)
  const targetSize = 15 + Math.sqrt(p.hp) * 2;
  p.currentSize += (targetSize - p.currentSize) * 0.1;
  const radius = p.currentSize;

  // Tính góc xoay dựa trên vector vận tốc
  if (p.vx !== 0 || p.vy !== 0) {
    p.angle = Math.atan2(p.vy, p.vx);
  }

  ctx.save();
  ctx.translate(drawX, drawY);
  ctx.rotate(p.angle);

  // Hiệu ứng phát sáng Neon cho Cá
  ctx.shadowBlur = p.hasExtraSurplus ? 25 : 12;
  ctx.shadowColor = p.color;

  // Thử vẽ hình ảnh cá từ thư mục picture, nếu chưa tải xong thì vẽ fallback vector
  const fishImg = getFishImageForPlayer(p);
  if (fishImg && fishImg.complete && fishImg.naturalWidth !== 0) {
    ctx.save();
    // Bỏ bóng mờ cho ảnh cá để tối ưu hiệu năng và hiển thị sắc nét
    ctx.shadowBlur = 0;
    // Vẽ ảnh cá (giữ tỉ lệ ngang dài hơn dọc một chút)
    ctx.drawImage(fishImg, -radius, -radius * 0.8, radius * 2, radius * 1.6);
    ctx.restore();
  } else {
    // Vẽ đuôi cá (Wiggle chuyển động theo thời gian)
    const wiggle = Math.sin(Date.now() * 0.01 + p.x * 0.05) * 0.25;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.8, 0);
    ctx.lineTo(-radius * 1.5, -radius * (0.4 + wiggle));
    ctx.lineTo(-radius * 1.3, 0);
    ctx.lineTo(-radius * 1.5, radius * (0.4 - wiggle));
    ctx.closePath();
    ctx.fill();

    // Vẽ vây ngực cá
    ctx.beginPath();
    ctx.ellipse(-radius * 0.2, -radius * 0.5, radius * 0.2, radius * 0.4, -Math.PI/6, 0, Math.PI*2);
    ctx.ellipse(-radius * 0.2, radius * 0.5, radius * 0.2, radius * 0.4, Math.PI/6, 0, Math.PI*2);
    ctx.fill();

    // Vẽ thân cá (Hình Elip)
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vẽ mắt cá
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(radius * 0.45, -radius * 0.25, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Vẽ vòng tròn trang trí đại diện cho quy mô doanh nghiệp
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  const now = Date.now();
  const isInvuln = p.invulnUntil && p.invulnUntil > now;
  const isStun = p.stunnedUntil && p.stunnedUntil > now;
  const hasCombo = p.comboUntil && p.comboUntil > now && (p.combo || 0) > 0;

  // Vẽ ngọn lửa neon rực cháy nếu có combo
  if (hasCombo) {
    ctx.save();
    ctx.strokeStyle = '#ffa502';
    ctx.lineWidth = 2 + Math.sin(Date.now() * 0.01) * 1.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff4757';
    ctx.beginPath();
    ctx.arc(drawX, drawY, radius * 1.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Vẽ lá chắn bất tử
  if (isInvuln) {
    ctx.save();
    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00d2d3';
    ctx.beginPath();
    ctx.arc(drawX, drawY, radius * 1.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Hiển thị đếm ngược bất tử
    const secsLeft = Math.ceil((p.invulnUntil - now) / 1000);
    ctx.font = 'bold 10px "Outfit", sans-serif';
    ctx.fillStyle = '#00d2d3';
    ctx.textAlign = 'center';
    ctx.fillText(`${secsLeft}s Bất tử`, drawX, drawY - radius - 26);
  }

  // Vẽ hoạt ảnh choáng (Stun)
  if (isStun) {
    ctx.save();
    ctx.translate(drawX, drawY - radius - 26);
    const spin = (Date.now() * 0.005) % (Math.PI * 2);
    ctx.rotate(spin);
    ctx.fillStyle = '#ffa502';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💫', 0, 4);
    ctx.restore();
  }

  // Hiển thị tên người chơi và HP phía trên
  ctx.shadowBlur = 0;
  ctx.font = 'bold 12px "Outfit", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  
  // Tên doanh nghiệp
  let displayName = p.name;
  if (p.isAI) displayName += " (Machine)";
  ctx.fillText(displayName, drawX, drawY - radius - 15);

  // Thanh máu (HP) thu nhỏ trực quan
  const barW = Math.max(40, radius * 1.5);
  const barH = 5;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(drawX - barW/2, drawY - radius - 8, barW, barH);
  
  // Tỉ lệ máu
  const hpPercent = Math.min(1.0, p.hp / 300);
  ctx.fillStyle = hasCombo ? '#ffa502' : p.hp > 150 ? '#2ed573' : p.hp > 60 ? '#1e90ff' : '#ff4757';
  ctx.fillRect(drawX - barW/2, drawY - radius - 8, barW * hpPercent, barH);
}


// ==================== PHẦN 2: MÀN HÌNH PLAYER (ĐIỆN THOẠI) ====================

let myPlayerId = '';
let myPlayerName = '';
let myPlayerColor = '';
let currentHp = 100;
let currentScore = 0;
let currentTechLevel = 0;

// Combo & Trạng thái hiệu ứng mới
let myCombo = 0;
let comboTimer = null;
let isStunned = false;
let isInvulnerable = false;
let invulnerableTimer = null;
let myPlayerData = null;
let playerTimerInterval = null;

// Quản lý câu hỏi trắc nghiệm
let activeQuestion = null;
let quizTimerInterval = null;

function initPlayer() {
  document.getElementById('spectatorView').classList.add('hidden');
  document.getElementById('playerView').classList.remove('hidden');

  // Khởi tạo ID ngẫu nhiên cho người chơi hiện tại bằng cách lưu vào SessionStorage
  if (!sessionStorage.getItem('calon_my_id')) {
    myPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('calon_my_id', myPlayerId);
  } else {
    myPlayerId = sessionStorage.getItem('calon_my_id');
  }

  // Pre-fill roomCode input if present in URL
  const roomInput = document.getElementById('roomCode');
  if (roomInput) {
    if (urlParams.get('room')) {
      roomInput.value = urlParams.get('room');
    } else {
      roomInput.value = currentRoomId;
    }
  }

  // Tự động giải phóng người chơi khi đóng tab điện thoại
  window.addEventListener('beforeunload', () => {
    if (myPlayerId) db.removePlayer(myPlayerId);
  });

  // Lắng nghe dữ liệu người chơi của mình từ DB (để phát hiện bị nuốt hoặc bị kick)
  db.onPlayersChange((players) => {
    const me = players[myPlayerId];
    if (me) {
      myPlayerData = me;
      // Check if kicked
      if (me.kicked) {
        alert("Bạn đã bị Host mời ra khỏi phòng thi đấu!");
        db.removePlayer(myPlayerId);
        sessionStorage.removeItem('calon_my_id');
        // Reload page to reset everything
        window.location.reload();
        return;
      }

      currentHp = me.hp;
      currentScore = me.score;
      currentTechLevel = me.techLevel || 0;
      hasExtraSurplus = me.hasExtraSurplus || false;
      myCombo = me.combo || 0;

      // Cập nhật UI
      document.getElementById('playerHp').innerText = Math.round(currentHp);
      document.getElementById('playerScore').innerText = currentScore;
      
      const techName = TECH_LEVELS[currentTechLevel].name;
      const ptEl = document.getElementById('playerTech');
      if (ptEl) ptEl.innerText = techName;
      const ctmEl = document.getElementById('currentTechMultiplier');
      if (ctmEl) ctmEl.innerText = 'x' + TECH_LEVELS[currentTechLevel].multiplier.toFixed(1);

      // Cập nhật nút nâng cấp công nghệ tiếp theo
      const nextLevel = currentTechLevel + 1;
      if (nextLevel < TECH_LEVELS.length) {
        document.getElementById('btnUpgradeTech').disabled = false;
        document.getElementById('nextTechName').innerText = TECH_LEVELS[nextLevel].name;
        document.getElementById('upgradeCost').innerText = TECH_LEVELS[nextLevel].cost;
      } else {
        document.getElementById('btnUpgradeTech').disabled = true;
        document.getElementById('nextTechName').innerText = "Tối Đa (AI)";
        document.getElementById('upgradeCost').innerText = "-";
      }

      // Hiển thị Thẻ siêu ngạch
      const tag = document.getElementById('superValueIndicator');
      if (hasExtraSurplus) {
        tag.classList.remove('hidden');
      } else {
        tag.classList.add('hidden');
      }

      // Kiểm tra xem có bị PHÁ SẢN (Bị nuốt mất HP = 0)
      if (me.bankrupt && !document.getElementById('controllerScreen').classList.contains('hidden') && gameState.started && !gameState.gameOver) {
        showBankruptScreen();
      }
    }
  });

  // Lắng nghe trạng thái trận đấu từ Host
  db.onStatusChange((status) => {
    gameState = status;
    document.getElementById('playerRoomId').innerText = currentRoomId;
    
    // Đồng bộ các thông số cấu hình từ Host
    if (status.config) {
      gameConfig = { ...gameConfig, ...status.config };
    }
    
    // Đồng bộ danh sách câu hỏi tùy chọn được import từ Host
    if (status.customQuestions && status.customQuestions.length > 0) {
      QUESTIONS.length = 0; // Xóa câu hỏi mặc định
      QUESTIONS.push(...status.customQuestions); // Điền câu hỏi mới từ DB
    }
    
    if (myPlayerName) {
      updatePlayerScreens();
    }
  });

  // Khởi tạo bộ joystick di chuyển
  setupJoystick();

  // Khởi động vòng lặp đếm ngược local của người chơi để giảm tải DB
  if (playerTimerInterval) clearInterval(playerTimerInterval);
  playerTimerInterval = setInterval(() => {
    if (!myPlayerData) return;
    const now = Date.now();

    // 1. Kiểm tra trạng thái Choáng (Stun)
    const stunnedUntil = myPlayerData.stunnedUntil || 0;
    const stunEl = document.getElementById('quizStunView');
    const quizStartEl = document.getElementById('quizStartView');
    const quizActiveEl = document.getElementById('quizActiveView');
    const quizFeedbackEl = document.getElementById('quizFeedbackView');

    if (stunnedUntil > now) {
      isStunned = true;
      const secsLeft = Math.ceil((stunnedUntil - now) / 1000);
      const countdownEl = document.getElementById('stunCountdown');
      if (countdownEl) countdownEl.innerText = secsLeft;

      // Ẩn tất cả các view quiz khác để hiện màn hình choáng
      if (quizStartEl) quizStartEl.classList.add('hidden');
      if (quizActiveEl) quizActiveEl.classList.add('hidden');
      if (quizFeedbackEl) quizFeedbackEl.classList.add('hidden');
      if (stunEl) stunEl.classList.remove('hidden');
    } else {
      if (isStunned) {
        isStunned = false;
        if (stunEl) stunEl.classList.add('hidden');
        // Quay trở lại màn hình bắt đầu Quiz khi hết choáng
        if (quizStartEl) quizStartEl.classList.remove('hidden');
      }
    }

    // 2. Kiểm tra trạng thái Combo
    const comboUntil = myPlayerData.comboUntil || 0;
    const comboVal = myPlayerData.combo || 0;
    const comboIndicator = document.getElementById('playerComboIndicator');
    if (comboIndicator) {
      if (comboUntil > now && comboVal > 0) {
        comboIndicator.innerText = `Combo x${comboVal} 🔥`;
        comboIndicator.classList.remove('hidden');
      } else {
        comboIndicator.classList.add('hidden');
        // Reset combo cục bộ và đồng bộ lên DB nếu đã hết hạn
        if (myCombo > 0) {
          myCombo = 0;
          db.updatePlayer(myPlayerId, { combo: 0, comboUntil: 0 });
        }
      }
    }

    // 3. Cập nhật nút bấm Tiếp tục ở màn hình giải thích (nếu có combo)
    if (quizFeedbackEl && !quizFeedbackEl.classList.contains('hidden') && myCombo > 0 && comboUntil > now) {
      const secsComboLeft = Math.ceil((comboUntil - now) / 1000);
      const nextBtn = quizFeedbackEl.querySelector('button');
      if (nextBtn) {
        nextBtn.innerHTML = `<i class="fa-solid fa-chevron-right"></i> Tiếp tục làm việc (Giữ combo: ${secsComboLeft}s)`;
      }
    } else if (quizFeedbackEl && !quizFeedbackEl.classList.contains('hidden')) {
      const nextBtn = quizFeedbackEl.querySelector('button');
      if (nextBtn) {
        nextBtn.innerHTML = `<i class="fa-solid fa-chevron-right"></i> Tiếp tục làm việc`;
      }
    }
  }, 100);
}

// Điều hướng màn hình phía Player dựa trên trạng thái game
function updatePlayerScreens() {
  const joinScr = document.getElementById('joinScreen');
  const ctrlScr = document.getElementById('controllerScreen');
  const lobbyScr = document.getElementById('lobbyScreen');
  const bankruptScr = document.getElementById('bankruptScreen');
  const overScr = document.getElementById('playerGameOverScreen');
  const pauseScr = document.getElementById('playerPausedScreen');

  joinScr.classList.add('hidden');
  ctrlScr.classList.add('hidden');
  lobbyScr.classList.add('hidden');
  bankruptScr.classList.add('hidden');
  overScr.classList.add('hidden');
  pauseScr.classList.add('hidden');

  if (gameState.gameOver) {
    overScr.classList.remove('hidden');
    document.getElementById('playerFinalScore').innerText = currentScore;
    document.getElementById('playerFinalTech').innerText = TECH_LEVELS[currentTechLevel].name;
    if (quizTimerInterval) clearInterval(quizTimerInterval);
  } else if (gameState.paused) {
    pauseScr.classList.remove('hidden');
    if (quizTimerInterval) clearInterval(quizTimerInterval);
  } else if (!gameState.started) {
    lobbyScr.classList.remove('hidden');
  } else {
    if (currentHp <= 0) {
      bankruptScr.classList.remove('hidden');
    } else {
      ctrlScr.classList.remove('hidden');
    }
  }
}

// Bắt đầu khởi nghiệp (Đăng ký)
function handleJoin(e) {
  e.preventDefault();
  myPlayerName = document.getElementById('playerName').value.trim();
  const colors = document.getElementsByName('playerColor');
  for (let c of colors) {
    if (c.checked) {
      myPlayerColor = c.value;
      break;
    }
  }

  const roomInput = document.getElementById('roomCode');
  if (roomInput && roomInput.value.trim()) {
    const inputRoom = roomInput.value.trim();
    if (inputRoom !== currentRoomId) {
      currentRoomId = inputRoom;
      
      // Update URL parameters without reloading
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('room', currentRoomId);
      window.history.pushState({}, '', currentUrl.toString());

      // If Firebase, we need to setup listeners again
      if (db.isFirebase) {
        // Remove old listeners
        db.fbDb.ref(`rooms/${currentRoomId}/players`).off();
        db.fbDb.ref(`rooms/${currentRoomId}/status`).off();
        
        // Re-setup players listener
        db.fbDb.ref(`rooms/${currentRoomId}/players`).on('value', (snapshot) => {
          const players = snapshot.val() || {};
          // trigger the callbacks manually or just let it update
          db.playersCallbacks.forEach(cb => cb(players));
        });

        // Re-setup status listener
        db.fbDb.ref(`rooms/${currentRoomId}/status`).on('value', (snapshot) => {
          const status = snapshot.val() || { started: false, gameOver: false, timeLeft: 300, duration: 300 };
          gameState = status;
          db.statusCallbacks.forEach(cb => cb(status));
        });
      }
    }
  }

  if (!myPlayerName) return;

  // Đăng ký người chơi lên Database
  db.updatePlayer(myPlayerId, {
    id: myPlayerId,
    name: myPlayerName,
    color: myPlayerColor,
    x: Math.random() * (WORLD_WIDTH - 200) + 100,
    y: Math.random() * (WORLD_HEIGHT - 200) + 100,
    vx: 0,
    vy: 0,
    hp: gameConfig.initHp || 100,
    score: 0,
    techLevel: 0,
    hasExtraSurplus: false,
    bankrupt: false,
    combo: 0,
    comboUntil: 0,
    invulnUntil: Date.now() + 10000,
    stunnedUntil: 0
  });

  // Điều hướng sang màn hình tương ứng
  updatePlayerScreens();
}



// Cải tiến công nghệ (Mua nâng cấp)
function buyUpgrade() {
  const nextLevel = currentTechLevel + 1;
  if (nextLevel >= TECH_LEVELS.length) return;

  const cost = TECH_LEVELS[nextLevel].cost;
  if (currentScore < cost) {
    alert("Bạn chưa tích lũy đủ Giá trị thặng dư (Score - m) để cải tiến công nghệ!");
    return;
  }

  // Trừ điểm đầu tư công nghệ mới
  currentScore -= cost;
  currentTechLevel = nextLevel;

  // Thực hiện giao dịch kiểm tra Tiên phong công nghệ (Thặng dư siêu ngạch)
  db.claimFirstTech(nextLevel, myPlayerName, (isFirst, pioneerName) => {
    let getExtra = false;
    if (isFirst) {
      // Nhận giá trị thặng dư siêu ngạch!
      const extraTimeSecs = gameConfig.extraTimer || 45;
      alert(`🎉 BẠN LÀ NGƯỜI ĐẦU TIÊN áp dụng công nghệ "${TECH_LEVELS[nextLevel].name}" trên thị trường! Bạn nhận được Giá trị thặng dư siêu ngạch (x3 HP khi làm Quiz) trong ${extraTimeSecs} giây.`);
      
      // Hết hạn sau thời gian cấu hình
      if (extraSurplusTimer) clearTimeout(extraSurplusTimer);
      extraSurplusTimer = setTimeout(() => {
        db.updatePlayer(myPlayerId, { hasExtraSurplus: false });
        alert("Giá trị thặng dư siêu ngạch của bạn đã biến mất vì công nghệ đã bị xã hội hóa (các đối thủ khác cũng đã bắt kịp).");
      }, extraTimeSecs * 1000);
    } else {
      alert(`Bạn đã nâng cấp thành công lên "${TECH_LEVELS[nextLevel].name}". Công nghệ này đã được phát minh bởi ${pioneerName}, bạn nhận được giá trị thặng dư tương đối tiêu chuẩn.`);
    }

    db.updatePlayer(myPlayerId, {
      score: currentScore,
      techLevel: currentTechLevel,
      hasExtraSurplus: getExtra
    });
  });
}

// Thiết lập bộ điều khiển Joystick ảo thay thế D-pad
function setupJoystick() {
  const zone = document.getElementById('joystickZone');
  const stick = document.getElementById('joystickStick');
  if (!zone || !stick) return;

  const maxRadius = 44; // Bán kính kéo tối đa (140/2 - 52/2 = 44px)
  const maxSpeed = 2.5; // Tốc độ di chuyển tối đa của cá
  const centerPos = 44; // Vị trí chính giữa mặc định của stick (left: 44px, top: 44px)

  let startX = 0, startY = 0;
  let active = false;

  // Lấy tọa độ tâm của Joystick
  const updateCenter = () => {
    const rect = zone.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  };

  const handleStart = (clientX, clientY) => {
    if (isStunned) return;
    active = true;
    updateCenter();
    handleMove(clientX, clientY);
  };

  const handleMove = (clientX, clientY) => {
    if (!active) return;
    if (isStunned) {
      handleEnd();
      return;
    }
    
    let dx = clientX - startX;
    let dy = clientY - startY;
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Giới hạn di chuyển của núm stick trong vòng tròn lớn
    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
      distance = maxRadius;
    }

    // Cập nhật tọa độ hiển thị của Stick (tuyệt đối so với Zone)
    stick.style.left = `${centerPos + dx}px`;
    stick.style.top = `${centerPos + dy}px`;
    stick.style.transform = 'none';

    // Tính toán vector vận tốc (tỷ lệ với khoảng cách kéo)
    const vx = (dx / maxRadius) * maxSpeed;
    const vy = (dy / maxRadius) * maxSpeed;

    // Gửi vận tốc lên Database
    db.updatePlayer(myPlayerId, { vx, vy });
  };

  const handleEnd = () => {
    if (!active) return;
    active = false;

    // Trả núm xoay về tâm với hiệu ứng mượt
    stick.style.left = `${centerPos}px`;
    stick.style.top = `${centerPos}px`;
    stick.style.transform = 'translate(0, 0)';

    // Dừng chuyển động cá
    db.updatePlayer(myPlayerId, { vx: 0, vy: 0 });
  };

  // Các sự kiện Cảm ứng (Điện thoại)
  zone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  });
  window.addEventListener('touchmove', (e) => {
    if (active) {
      e.preventDefault(); // Ngăn cuộn trang web khi đang chơi game
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });
  window.addEventListener('touchend', handleEnd);

  // Các sự kiện Chuột (Máy tính thử nghiệm)
  zone.addEventListener('mousedown', (e) => {
    handleStart(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', (e) => {
    if (active) {
      handleMove(e.clientX, e.clientY);
    }
  });
  window.addEventListener('mouseup', handleEnd);
}

// Phá sản màn hình hiển thị
function showBankruptScreen() {
  document.getElementById('controllerScreen').classList.add('hidden');
  document.getElementById('bankruptScreen').classList.remove('hidden');
  document.getElementById('bankruptSavedScore').innerText = currentScore;
  
  if (quizTimerInterval) clearInterval(quizTimerInterval);
}

// Hồi sinh người chơi (Tái cấu trúc)
function respawnPlayer() {
  currentHp = gameConfig.initHp || 100;
  
  db.updatePlayer(myPlayerId, {
    hp: currentHp,
    x: Math.random() * (WORLD_WIDTH - 200) + 100,
    y: Math.random() * (WORLD_HEIGHT - 200) + 100,
    vx: 0,
    vy: 0,
    bankrupt: false,
    combo: 0,
    comboUntil: 0,
    invulnUntil: Date.now() + 10000,
    stunnedUntil: 0
  });

  document.getElementById('bankruptScreen').classList.add('hidden');
  document.getElementById('controllerScreen').classList.remove('hidden');
  
  // Trở về giao diện bắt đầu ca lao động mới
  document.getElementById('quizStartView').classList.remove('hidden');
  document.getElementById('quizActiveView').classList.add('hidden');
  document.getElementById('quizFeedbackView').classList.add('hidden');
}


// ==================== HỆ THỐNG CÂU HỎI QUIZ (LAO ĐỘNG) ====================

function loadNewQuiz() {
  // Reset trạng thái hiển thị
  document.getElementById('quizStartView').classList.add('hidden');
  document.getElementById('quizFeedbackView').classList.add('hidden');
  document.getElementById('quizActiveView').classList.remove('hidden');
  document.getElementById('quizStatus').innerText = "Đang làm việc...";

  // Lấy câu hỏi ngẫu nhiên từ QUESTIONS (được load từ questions.js)
  const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
  activeQuestion = QUESTIONS[randomIndex];

  // Hiển thị câu hỏi
  document.getElementById('questionText').innerText = activeQuestion.question;

  // Hiển thị 4 đáp án
  const optionsContainer = document.getElementById('answerOptions');
  optionsContainer.innerHTML = '';
  
  activeQuestion.answers.forEach((ans, idx) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.innerHTML = `<i class="fa-solid fa-angle-right"></i> ${ans}`;
    btn.onclick = () => submitAnswer(idx);
    optionsContainer.appendChild(btn);
  });

  // Hẹn giờ làm bài đã bị loại bỏ (không có giới hạn thời gian trả lời câu hỏi)
  const timerBarContainer = document.querySelector('.quiz-timer-bar-container');
  if (timerBarContainer) {
    timerBarContainer.style.display = 'none'; // Ẩn thanh thời gian
  }
}

// Báo hết giờ trả lời
function handleQuizTimeout() {
  document.getElementById('quizStatus').innerText = "Hết giờ làm việc";
  
  // Trừ máu do suy nhược / kiệt sức
  const penalty = 10;
  currentHp = Math.max(10, currentHp - penalty);
  db.updatePlayer(myPlayerId, { hp: currentHp });

  // Show Feedback
  showFeedback(false, "BẠN ĐÃ BỊ HẾT GIỜ!", "Lao động quá độ không phản hồi kịp dẫn đến thất thoát thời gian lao động thặng dư. " + activeQuestion.explanation);
}

// Gửi câu trả lời
function submitAnswer(selectedIdx) {
  if (quizTimerInterval) clearInterval(quizTimerInterval);

  const isCorrect = selectedIdx === activeQuestion.correct;
  let rewardHp = 0;
  let textTitle = "";
  let textClass = "";

  if (isCorrect) {
    // 1. Tính toán lượng HP phần thưởng theo combo
    myCombo++;
    const now = Date.now();
    const comboUntil = now + 5000; // Combo kéo dài 5 giây
    
    // HP cơ bản
    const baseHp = gameConfig.bonusAbs || 20;
    // Nhân hệ số công nghệ
    const techMultiplier = TECH_LEVELS[currentTechLevel].multiplier;
    const initHp = gameConfig.initHp || 100;
    
    // Tăng phúc: combo x2 tăng 25% máu gốc, x3 tăng 50%, x4 trở lên tăng 75%
    const comboBonus = myCombo >= 2 ? (initHp * (myCombo - 1) / 4) : 0;
    rewardHp = (baseHp * techMultiplier) + comboBonus;

    // Nhân hệ số thặng dư siêu ngạch nếu có
    if (hasExtraSurplus) {
      rewardHp *= 3;
    }

    currentHp = Math.min(300, currentHp + rewardHp);
    textTitle = `CHÍNH XÁC! (+${Math.round(rewardHp)} HP)${myCombo >= 2 ? ' Combo x' + myCombo + '! 🔥' : ''}`;
    textClass = "correct";

    // Đồng bộ HP, combo và comboUntil lên DB
    db.updatePlayer(myPlayerId, { 
      hp: currentHp,
      combo: myCombo,
      comboUntil: comboUntil
    });
  } else {
    // Trả lời sai: Không trừ máu mà bị choáng 3 giây
    myCombo = 0;
    const stunnedUntil = Date.now() + 3000;
    textTitle = `SAI RỒI! BỊ CHOÁNG 3 GIÂY`;
    textClass = "incorrect";

    // Đồng bộ choáng lên DB và reset vận tốc
    db.updatePlayer(myPlayerId, { 
      stunnedUntil: stunnedUntil,
      combo: 0,
      comboUntil: 0,
      vx: 0, 
      vy: 0 
    });
  }

  // Hiển thị màn hình giải thích
  showFeedback(isCorrect, textTitle, activeQuestion.explanation, textClass);
}

function showFeedback(isCorrect, titleText, explanationText, cssClass) {
  document.getElementById('quizActiveView').classList.add('hidden');
  document.getElementById('quizFeedbackView').classList.remove('hidden');
  document.getElementById('quizStatus').innerText = isCorrect ? "Lao động hiệu quả!" : "Đình trệ sản xuất";

  const titleEl = document.getElementById('feedbackTitle');
  titleEl.innerText = titleText;
  titleEl.className = 'feedback-title ' + (cssClass || (isCorrect ? 'correct' : 'incorrect'));

  document.getElementById('feedbackExplanation').innerHTML = `
    <strong>Góc Lý Thuyết:</strong><br>
    ${explanationText}
  `;
}


// ==================== CẤU HÌNH ĐIỀU KHIỂN ĐẤU (HOST & PODIUM) ====================

// Bắt đầu trận đấu
function startMatch() {
  const durationSelect = document.getElementById('matchDuration');
  const dur = parseInt(durationSelect.value) || 300;

  db.updateStatus({
    started: true,
    paused: false,
    gameOver: false,
    timeLeft: dur,
    duration: dur
  });
}

// Tạm dừng trận đấu
function pauseMatch() {
  db.updateStatus({
    paused: true
  });
}

// Tiếp tục trận đấu
function resumeMatch() {
  db.updateStatus({
    paused: false
  });
}

// Bắt đầu lại trận đấu (Reset điểm/máu của tất cả cá về mặc định nhưng giữ danh sách tham gia)
function restartMatch() {
  if (confirm("Bạn có chắc chắn muốn bắt đầu lại trận đấu không? Máu, điểm và công nghệ của tất cả cá sẽ được reset nhưng người chơi vẫn ở trong phòng chờ.")) {
    const dur = gameState.duration || 300;
    
    // Reset status
    db.updateStatus({
      started: true,
      paused: false,
      gameOver: false,
      timeLeft: dur
    });

    // Reset thông số của tất cả cá hiện tại
    for (let id in localPlayers) {
      db.updatePlayer(id, {
        hp: 100,
        score: 0,
        techLevel: 0,
        vx: 0,
        vy: 0,
        hasExtraSurplus: false,
        bankrupt: false,
        combo: 0,
        comboUntil: 0,
        invulnUntil: Date.now() + 10000,
        stunnedUntil: 0
      });
    }

    // Xóa dữ liệu công nghệ độc quyền trên thị trường phòng hiện tại
    if (db.isFirebase) {
      db.fbDb.ref(`rooms/${currentRoomId}/market_tech`).remove();
    } else {
      localStorage.setItem(`calon_market_tech_${currentRoomId}`, JSON.stringify({}));
    }
  }
}

// Dừng trận đấu sớm
function stopMatch() {
  db.updateStatus({
    started: false,
    paused: false,
    gameOver: true
  });
}

// Thiết lập trận đấu mới (Reset hoàn toàn cả danh sách cá)
function resetMatch() {
  if (confirm("Bạn có chắc chắn muốn thiết lập trận mới? Tất cả người chơi và thặng dư tích lũy hiện tại trong phòng sẽ bị xóa.")) {
    db.resetRoom();
  }
}

// Bộ đếm ngược thời gian chạy trên máy chủ spectator
function startTimerTick() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    // Chỉ đếm ngược khi trận đấu đang diễn ra và KHÔNG bị tạm dừng
    if (gameState.started && !gameState.paused && gameState.timeLeft > 0) {
      const newTime = gameState.timeLeft - 1;
      db.updateStatus({ timeLeft: newTime });
      if (newTime <= 0) {
        clearInterval(timerInterval);
        db.updateStatus({ started: false, gameOver: true });
      }
    }
  }, 1000);
}

// Cập nhật giao diện Trạng thái / Đồng hồ trên máy chiếu
function updateStatusUi(status) {
  const statusBadge = document.getElementById('marketStatus');
  const timerDisplay = document.getElementById('countdownDisplay');
  
  const btnStart = document.getElementById('btnStartMatch');
  const btnPause = document.getElementById('btnPauseMatch');
  const btnResume = document.getElementById('btnResumeMatch');
  const btnRestart = document.getElementById('btnRestartMatch');
  const btnStop = document.getElementById('btnStopMatch');
  
  if (!statusBadge || !timerDisplay) return;

  if (status.gameOver) {
    statusBadge.innerHTML = `<i class="fa-solid fa-flag-checkered text-red"></i> Đã kết thúc`;
    timerDisplay.classList.add('hidden');
    if (btnStart) btnStart.classList.remove('hidden');
    if (btnPause) btnPause.classList.add('hidden');
    if (btnResume) btnResume.classList.add('hidden');
    if (btnRestart) btnRestart.classList.add('hidden');
    if (btnStop) btnStop.classList.add('hidden');
  } else if (status.started) {
    // Hiển thị đồng hồ dạng Phút:Giây
    timerDisplay.classList.remove('hidden');
    const mins = Math.floor(status.timeLeft / 60).toString().padStart(2, '0');
    const secs = (status.timeLeft % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${mins}:${secs}`;

    if (btnStart) btnStart.classList.add('hidden');
    if (btnStop) btnStop.classList.remove('hidden');
    if (btnRestart) btnRestart.classList.remove('hidden');

    if (status.paused) {
      statusBadge.innerHTML = `<i class="fa-solid fa-pause text-gold pulse-icon"></i> Đang tạm dừng`;
      if (btnPause) btnPause.classList.add('hidden');
      if (btnResume) btnResume.classList.remove('hidden');
    } else {
      statusBadge.innerHTML = `<i class="fa-solid fa-circle-nodes text-green pulse-icon"></i> Đang diễn ra`;
      if (btnPause) btnPause.classList.remove('hidden');
      if (btnResume) btnResume.classList.add('hidden');
    }
  } else {
    statusBadge.innerHTML = `<i class="fa-solid fa-clock text-blue"></i> Đang chờ...`;
    timerDisplay.classList.add('hidden');
    if (btnStart) btnStart.classList.remove('hidden');
    if (btnPause) btnPause.classList.add('hidden');
    if (btnResume) btnResume.classList.add('hidden');
    if (btnRestart) btnRestart.classList.add('hidden');
    if (btnStop) btnStop.classList.add('hidden');
  }
}

// Tính toán và hiển thị Victory Podium
function showVictoryPodium() {
  const sorted = Object.values(localPlayers).sort((a, b) => b.score - a.score);
  
  const p1 = sorted[0] || { name: "Trống", score: 0, color: "#a4b0be" };
  const p2 = sorted[1] || { name: "Trống", score: 0, color: "#a4b0be" };
  const p3 = sorted[2] || { name: "Trống", score: 0, color: "#a4b0be" };

  // Hạng 1
  document.getElementById('nameRank1').innerText = p1.name;
  document.getElementById('nameRank1').style.color = p1.color;
  document.getElementById('scoreRank1').innerText = `${p1.score} m`;
  document.getElementById('avatarRank1').style.background = p1.color;

  // Hạng 2
  document.getElementById('nameRank2').innerText = p2.name;
  document.getElementById('nameRank2').style.color = p2.color;
  document.getElementById('scoreRank2').innerText = `${p2.score} m`;
  document.getElementById('avatarRank2').style.background = p2.color;

  // Hạng 3
  document.getElementById('nameRank3').innerText = p3.name;
  document.getElementById('nameRank3').style.color = p3.color;
  document.getElementById('scoreRank3').innerText = `${p3.score} m`;
  document.getElementById('avatarRank3').style.background = p3.color;

  // Hiển thị Overlay bục vinh danh
  const overlay = document.getElementById('podiumOverlay');
  if (overlay) overlay.classList.remove('hidden');
}


// ==================== CẤU HÌNH THÔNG SỐ MODAL HANDLERS ====================

function openSettingsModal() {
  document.getElementById('cfgInitHp').value = gameConfig.initHp || 100;
  document.getElementById('cfgBonusAbs').value = gameConfig.bonusAbs || 20;
  document.getElementById('cfgExtraTimer').value = gameConfig.extraTimer || 5;

  document.getElementById('settingsOverlay').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settingsOverlay').classList.add('hidden');
}

function saveSettings(e) {
  e.preventDefault();
  
  const updatedConfig = {
    initHp: parseInt(document.getElementById('cfgInitHp').value) || 100,
    bonusAbs: parseInt(document.getElementById('cfgBonusAbs').value) || 20,
    extraTimer: parseInt(document.getElementById('cfgExtraTimer').value) || 5
  };

  const statusUpdates = {
    config: updatedConfig
  };

  // Nếu có file câu hỏi được import, đồng bộ lên Database
  if (customQuizData) {
    statusUpdates.customQuestions = customQuizData;
  }

  // Sync to database under status
  db.updateStatus(statusUpdates);

  alert("Cấu hình thông số đã được lưu và đồng bộ tới toàn bộ người chơi!");
  closeSettingsModal();
}

// Xử lý import file câu hỏi trắc nghiệm (JSON)
let customQuizData = null;

function handleQuizImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'docx') {
    const reader = new FileReader();
    reader.onload = function(loadEvent) {
      const arrayBuffer = loadEvent.target.result;
      mammoth.extractRawText({ arrayBuffer: arrayBuffer })
        .then(function(result) {
          const text = result.value;
          parseQuizText(text);
        })
        .catch(function(err) {
          alert("Lỗi khi đọc file Word: " + err.message);
        });
    };
    reader.readAsArrayBuffer(file);
  } else if (extension === 'txt') {
    const reader = new FileReader();
    reader.onload = function(loadEvent) {
      parseQuizText(loadEvent.target.result);
    };
    reader.readAsText(file);
  } else if (extension === 'json') {
    const reader = new FileReader();
    reader.onload = function(loadEvent) {
      try {
        const data = JSON.parse(loadEvent.target.result);
        if (!Array.isArray(data)) {
          alert("Định dạng file không hợp lệ! File phải là một mảng JSON các câu hỏi.");
          return;
        }
        const valid = data.every(q => 
          q.question && 
          Array.isArray(q.answers) && 
          q.answers.length >= 2 && 
          typeof q.correct === 'number'
        );
        if (!valid) {
          alert("Một số câu hỏi bị thiếu trường bắt buộc (question, answers, correct).");
          return;
        }
        customQuizData = data;
        document.getElementById('importStatus').innerText = `Đã chọn: ${data.length} câu`;
        document.getElementById('importStatus').style.color = '#2ed573';
      } catch (err) {
        alert("Lỗi cú pháp file JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  } else {
    alert("Hệ thống chỉ hỗ trợ định dạng file .json, .txt hoặc .docx!");
  }
}

// Bộ phân tích cú pháp câu hỏi từ văn bản thuần (.docx trích xuất hoặc .txt)
function parseQuizText(text) {
  try {
    // Tách dòng văn bản và chuẩn hóa
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedQuestions = [];
    let currentQuestion = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Nhận diện câu hỏi: "Câu 1:", "Câu 12:", "Câu 1." hoặc "Question 1:"
      const questionMatch = line.match(/^(?:Câu|Question)\s*(\d+)[\s.:]+(.*)$/i);
      if (questionMatch) {
        if (currentQuestion) {
          // Lưu câu hỏi trước đó nếu hợp lệ
          if (validateParsedQuestion(currentQuestion)) {
            parsedQuestions.push(currentQuestion);
          }
        }
        currentQuestion = {
          id: parseInt(questionMatch[1]),
          question: questionMatch[2].trim(),
          answers: [],
          correct: -1,
          explanation: ""
        };
        continue;
      }

      if (!currentQuestion) continue;

      // Nhận diện đáp án lựa chọn: "A. ...", "B: ...", "C) ..."
      const optionMatch = line.match(/^([A-D])[\s.:)]+(.*)$/i);
      if (optionMatch) {
        const optionLetter = optionMatch[1].toUpperCase();
        const optionText = optionMatch[2].trim();
        currentQuestion.answers.push(optionText);
        continue;
      }

      // Nhận diện đáp án đúng: "Đáp án đúng: A", "Đáp án: B", "Correct: C"
      const correctMatch = line.match(/^(?:Đáp án đúng|Đáp án|Correct|Correct Answer)[\s.:]+([A-D])/i);
      if (correctMatch) {
        const correctLetter = correctMatch[1].toUpperCase();
        // A -> 0, B -> 1, C -> 2, D -> 3
        currentQuestion.correct = correctLetter.charCodeAt(0) - 65;
        continue;
      }

      // Nhận diện giải thích: "Giải thích:", "Explanation:"
      const explanationMatch = line.match(/^(?:Giải thích|Explanation)[\s.:]+(.*)$/i);
      if (explanationMatch) {
        currentQuestion.explanation = explanationMatch[1].trim();
        continue;
      }

      // Nếu dòng tiếp theo không khớp từ khóa nào, và ta đã có giải thích thì nối tiếp vào giải thích
      if (currentQuestion.explanation) {
        currentQuestion.explanation += " " + line;
      }
    }

    // Push câu hỏi cuối cùng
    if (currentQuestion && validateParsedQuestion(currentQuestion)) {
      parsedQuestions.push(currentQuestion);
    }

    if (parsedQuestions.length === 0) {
      alert("Không trích xuất được câu hỏi nào từ file! Vui lòng kiểm tra lại cấu trúc soạn thảo.");
      return;
    }

    customQuizData = parsedQuestions;
    document.getElementById('importStatus').innerText = `Đã trích xuất: ${parsedQuestions.length} câu`;
    document.getElementById('importStatus').style.color = '#2ed573';
  } catch (err) {
    alert("Lỗi khi phân tích cú pháp câu hỏi: " + err.message);
  }
}

// Hàm xác thực câu hỏi trích xuất từ text
function validateParsedQuestion(q) {
  if (!q.question) return false;
  if (q.answers.length < 2) return false;
  if (q.correct < 0 || q.correct >= q.answers.length) {
    // Nếu chưa nhận diện được đáp án đúng, đặt mặc định là 0 (A) để không lỗi runtime
    q.correct = 0;
  }
  if (!q.explanation) {
    q.explanation = "Không có lời giải thích cụ thể cho câu hỏi này.";
  }
  return true;
}


// ==================== KHỞI CHẠY KHỞI TẠO HỆ THỐNG ====================

window.onload = function() {
  db.init(() => {
    if (isSpectator) {
      initSpectator();
    } else {
      initPlayer();
    }
  });
};
