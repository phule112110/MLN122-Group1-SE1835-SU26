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
let gameState = {
  started: false,
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
        localPlayers[id].strategy = players[id].strategy;
        localPlayers[id].techLevel = players[id].techLevel;
        localPlayers[id].hasExtraSurplus = players[id].hasExtraSurplus;
        localPlayers[id].vx = players[id].vx || 0;
        localPlayers[id].vy = players[id].vy || 0;
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
      </div>
    `;
  }).join('');
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

  // Xóa màn hình với màu xanh navy sẫm
  ctx.fillStyle = '#060a17';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Vẽ lưới kinh tế mờ (Mạng lưới thị trường)
  drawMarketGrid();

  // Tỉ lệ scale giữa tọa độ ảo (1600x1000) và canvas thực tế
  const scaleX = canvas.width / WORLD_WIDTH;
  const scaleY = canvas.height / WORLD_HEIGHT;

  // Vẽ bong bóng nước
  drawBubbles(scaleX, scaleY);

  // Cập nhật vị trí và vẽ cá
  const players = Object.values(localPlayers);

  // Chỉ cho phép di chuyển và thâu tóm khi trận đấu đã bắt đầu và chưa kết thúc
  if (gameState.started && !gameState.gameOver) {
    players.forEach(p => {
      // Dịch chuyển người chơi
      p.x += (p.vx || 0) * 1.5;
      p.y += (p.vy || 0) * 1.5;

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

        const r1 = 15 + Math.sqrt(p1.hp) * 2;
        const r2 = 15 + Math.sqrt(p2.hp) * 2;

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < r1 + r2) {
          if (p1.hp > p2.hp) {
            executeBuyout(p1, p2);
          }
        }
      }
    }
  }

  // 3. Vẽ cá lên màn hình
  players.forEach(p => {
    drawFish(p, scaleX, scaleY);
  });

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
  ctx.shadowBlur = 0; // Hủy bóng mờ cho mắt
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

  ctx.restore();

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
  ctx.fillStyle = p.hasExtraSurplus ? '#ffa502' : p.hp > 150 ? '#2ed573' : p.hp > 60 ? '#1e90ff' : '#ff4757';
  ctx.fillRect(drawX - barW/2, drawY - radius - 8, barW * hpPercent, barH);
}


// ==================== PHẦN 2: MÀN HÌNH PLAYER (ĐIỆN THOẠI) ====================

let myPlayerId = '';
let myPlayerName = '';
let myPlayerColor = '';
let currentHp = 100;
let currentScore = 0;
let currentTechLevel = 0;
let currentStrategy = 'absolute'; // 'absolute' hoặc 'relative'
let hasExtraSurplus = false;
let extraSurplusTimer = null;

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

  // Tự động giải phóng người chơi khi đóng tab điện thoại
  window.addEventListener('beforeunload', () => {
    if (myPlayerId) db.removePlayer(myPlayerId);
  });

  // Lắng nghe dữ liệu người chơi của mình từ DB (để phát hiện bị nuốt)
  db.onPlayersChange((players) => {
    const me = players[myPlayerId];
    if (me) {
      currentHp = me.hp;
      currentScore = me.score;
      currentTechLevel = me.techLevel || 0;
      hasExtraSurplus = me.hasExtraSurplus || false;

      // Cập nhật UI
      document.getElementById('playerHp').innerText = Math.round(currentHp);
      document.getElementById('playerScore').innerText = currentScore;
      
      const techName = TECH_LEVELS[currentTechLevel].name;
      document.getElementById('playerTech').innerText = techName;
      document.getElementById('currentTechMultiplier').innerText = 'x' + TECH_LEVELS[currentTechLevel].multiplier.toFixed(1);

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
    if (myPlayerName) {
      updatePlayerScreens();
    }
  });

  setInterval(() => {
    // Chỉ trừ hao mòn máu khi trận đấu đang diễn ra và cá còn sống
    const isCtrlVisible = !document.getElementById('controllerScreen').classList.contains('hidden');
    if (myPlayerId && currentHp > 0 && isCtrlVisible && gameState.started && !gameState.gameOver) {
      if (currentStrategy === 'absolute') {
        currentHp = Math.max(10, currentHp - 2.5); // Hao mòn 2.5 HP mỗi 2 giây
        db.updatePlayer(myPlayerId, { hp: currentHp });
      } else {
        currentHp = Math.max(10, currentHp - 0.5); // Hao mòn 0.5 HP mỗi 2 giây
        db.updatePlayer(myPlayerId, { hp: currentHp });
      }
    }
  }, 2000);

  // Khởi tạo bộ joystick di chuyển
  setupJoystick();
}

// Điều hướng màn hình phía Player dựa trên trạng thái game
function updatePlayerScreens() {
  const joinScr = document.getElementById('joinScreen');
  const ctrlScr = document.getElementById('controllerScreen');
  const lobbyScr = document.getElementById('lobbyScreen');
  const bankruptScr = document.getElementById('bankruptScreen');
  const overScr = document.getElementById('playerGameOverScreen');

  joinScr.classList.add('hidden');
  ctrlScr.classList.add('hidden');
  lobbyScr.classList.add('hidden');
  bankruptScr.classList.add('hidden');
  overScr.classList.add('hidden');

  if (gameState.gameOver) {
    overScr.classList.remove('hidden');
    document.getElementById('playerFinalScore').innerText = currentScore;
    document.getElementById('playerFinalTech').innerText = TECH_LEVELS[currentTechLevel].name;
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
    hp: 100,
    score: 0,
    strategy: currentStrategy,
    techLevel: 0,
    hasExtraSurplus: false,
    bankrupt: false
  });

  // Điều hướng sang màn hình tương ứng
  updatePlayerScreens();
}

// Chọn chiến lược sản xuất giá trị thặng dư
function selectStrategy(strategy) {
  if (currentStrategy === strategy) return;
  currentStrategy = strategy;

  document.getElementById('stratAbsolute').classList.toggle('active', strategy === 'absolute');
  document.getElementById('stratRelative').classList.toggle('active', strategy === 'relative');

  db.updatePlayer(myPlayerId, { strategy: currentStrategy });
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
      getExtra = true;
      alert(`🎉 BẠN LÀ NGƯỜI ĐẦU TIÊN áp dụng công nghệ "${TECH_LEVELS[nextLevel].name}" trên thị trường! Bạn nhận được Giá trị thặng dư siêu ngạch (x3 HP khi làm Quiz) trong 45 giây.`);
      
      // Hết hạn sau 45 giây
      if (extraSurplusTimer) clearTimeout(extraSurplusTimer);
      extraSurplusTimer = setTimeout(() => {
        db.updatePlayer(myPlayerId, { hasExtraSurplus: false });
        alert("Giá trị thặng dư siêu ngạch của bạn đã biến mất vì công nghệ đã bị xã hội hóa (các đối thủ khác cũng đã bắt kịp).");
      }, 45000);
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
    active = true;
    updateCenter();
    handleMove(clientX, clientY);
  };

  const handleMove = (clientX, clientY) => {
    if (!active) return;
    
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
  currentHp = 100;
  
  db.updatePlayer(myPlayerId, {
    hp: currentHp,
    x: Math.random() * (WORLD_WIDTH - 200) + 100,
    y: Math.random() * (WORLD_HEIGHT - 200) + 100,
    vx: 0,
    vy: 0,
    bankrupt: false
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

  // Hẹn giờ làm bài (Tùy thuộc chiến lược chọn)
  // Chiến lược Tuyệt đối: thời gian làm rất ngắn (15s), Tương đối: dài hơn (25s)
  let timeLeft = currentStrategy === 'absolute' ? 12 : 24;
  const initialTime = timeLeft;
  
  const timerBar = document.getElementById('quizTimerBar');
  timerBar.style.width = '100%';
  timerBar.style.backgroundColor = 'var(--color-cyan)';

  if (quizTimerInterval) clearInterval(quizTimerInterval);
  
  quizTimerInterval = setInterval(() => {
    timeLeft--;
    const percent = (timeLeft / initialTime) * 100;
    timerBar.style.width = percent + '%';

    // Đổi màu thanh hỏa tốc khi sắp hết giờ
    if (timeLeft < 4) {
      timerBar.style.backgroundColor = 'var(--color-red)';
    }

    if (timeLeft <= 0) {
      clearInterval(quizTimerInterval);
      handleQuizTimeout();
    }
  }, 1000);
}

// Báo hết giờ trả lời
function handleQuizTimeout() {
  document.getElementById('quizStatus').innerText = "Hết giờ làm việc";
  
  // Trừ máu do suy nhược / kiệt sức
  const penalty = currentStrategy === 'absolute' ? 15 : 5;
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
    // 1. Tính toán lượng HP phần thưởng theo chiến lược
    let baseHp = 15;
    
    if (currentStrategy === 'absolute') {
      baseHp = 25; // Tuyệt đối: Trả lời đúng nhận nhiều HP hơn
    }

    // Nhân hệ số công nghệ
    rewardHp = baseHp * TECH_LEVELS[currentTechLevel].multiplier;

    // Nhân hệ số thặng dư siêu ngạch nếu có
    if (hasExtraSurplus) {
      rewardHp *= 3;
    }

    currentHp = Math.min(300, currentHp + rewardHp);
    textTitle = `CHÍNH XÁC! (+${Math.round(rewardHp)} HP)`;
    textClass = "correct";
  } else {
    // Trả lời sai: Phạt HP
    const penalty = currentStrategy === 'absolute' ? 15 : 5;
    currentHp = Math.max(10, currentHp - penalty);
    textTitle = `SAI RỒI! (-${penalty} HP)`;
    textClass = "incorrect";
  }

  // Đồng bộ HP mới lên Database
  db.updatePlayer(myPlayerId, { hp: currentHp });

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
    gameOver: false,
    timeLeft: dur,
    duration: dur
  });
}

// Dừng trận đấu sớm
function stopMatch() {
  db.updateStatus({
    started: false,
    gameOver: true
  });
}

// Thiết lập trận đấu mới (Reset)
function resetMatch() {
  if (confirm("Bạn có chắc chắn muốn thiết lập trận mới? Tất cả người chơi và thặng dư tích lũy hiện tại trong phòng sẽ bị xóa.")) {
    db.resetRoom();
  }
}

// Bộ đếm ngược thời gian chạy trên máy chủ spectator
function startTimerTick() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameState.started && gameState.timeLeft > 0) {
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
  const btnStop = document.getElementById('btnStopMatch');
  
  if (!statusBadge || !timerDisplay) return;

  if (status.gameOver) {
    statusBadge.innerHTML = `<i class="fa-solid fa-flag-checkered text-red"></i> Đã kết thúc`;
    timerDisplay.classList.add('hidden');
    if (btnStart) btnStart.classList.remove('hidden');
    if (btnStop) btnStop.classList.add('hidden');
  } else if (status.started) {
    statusBadge.innerHTML = `<i class="fa-solid fa-circle-nodes text-green pulse-icon"></i> Đang diễn ra`;
    
    // Hiển thị đồng hồ dạng Phút:Giây
    timerDisplay.classList.remove('hidden');
    const mins = Math.floor(status.timeLeft / 60).toString().padStart(2, '0');
    const secs = (status.timeLeft % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${mins}:${secs}`;

    if (btnStart) btnStart.classList.add('hidden');
    if (btnStop) btnStop.classList.remove('hidden');
  } else {
    statusBadge.innerHTML = `<i class="fa-solid fa-clock text-blue"></i> Đang chờ...`;
    timerDisplay.classList.add('hidden');
    if (btnStart) btnStart.classList.remove('hidden');
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
