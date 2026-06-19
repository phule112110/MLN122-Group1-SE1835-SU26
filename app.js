// ==================== KHỞI TẠO HỆ THỐNG & ĐỒNG BỘ DỮ LIỆU ====================

// Lấy chế độ chơi từ URL (?role=spectator hoặc mặc định là player)
const urlParams = new URLSearchParams(window.location.search);
const isSpectator = urlParams.get('role') === 'spectator';

// Bộ điều phối cơ sở dữ liệu (Firebase vs LocalStorage)
class GameDatabase {
  constructor() {
    this.isFirebase = false;
    this.playersCallbacks = [];
    this.techCallbacks = [];
    this.fbDb = null;
  }

  init(onReady) {
    // Kiểm tra xem config.js có cấu hình thực tế chưa
    const hasConfig = typeof firebaseConfig !== 'undefined' && 
                      firebaseConfig.apiKey && 
                      firebaseConfig.apiKey !== "YOUR_API_KEY";

    if (hasConfig) {
      try {
        firebase.initializeApp(firebaseConfig);
        this.fbDb = firebase.database();
        this.isFirebase = true;
        console.log("🎮 Đang chạy ở chế độ ONLINE với Firebase Realtime Database.");
      } catch (e) {
        console.error("Firebase lỗi, tự động chuyển về chế độ OFFLINE (LocalStorage):", e);
      }
    } else {
      console.log("🔌 Đang chạy ở chế độ OFFLINE (Đồng bộ qua LocalStorage giữa các tab).");
      // Hiển thị cảnh báo chưa cấu hình lên console/UI
      const toggleBtn = document.getElementById('btnToggleRole');
      if (toggleBtn) {
        toggleBtn.innerHTML += " (Offline Simulation)";
      }
    }

    if (!this.isFirebase) {
      // Khởi tạo LocalStorage nếu chưa có
      if (!localStorage.getItem('calon_players')) {
        localStorage.setItem('calon_players', JSON.stringify({}));
      }
      if (!localStorage.getItem('calon_market_tech')) {
        localStorage.setItem('calon_market_tech', JSON.stringify({}));
      }

      // Lắng nghe sự thay đổi từ các tab khác cùng nguồn (origin)
      window.addEventListener('storage', (e) => {
        if (e.key === 'calon_players') {
          const data = JSON.parse(e.newValue || '{}');
          this.playersCallbacks.forEach(cb => cb(data));
        }
        if (e.key === 'calon_market_tech') {
          const data = JSON.parse(e.newValue || '{}');
          this.techCallbacks.forEach(cb => cb(data));
        }
      });
    }

    onReady();
  }

  // Đăng ký sự kiện thay đổi danh sách người chơi
  onPlayersChange(callback) {
    if (this.isFirebase) {
      this.fbDb.ref('players').on('value', (snapshot) => {
        callback(snapshot.val() || {});
      });
    } else {
      this.playersCallbacks.push(callback);
      // Kích hoạt ngay lập tức lần đầu
      const data = JSON.parse(localStorage.getItem('calon_players') || '{}');
      callback(data);
    }
  }

  // Đăng ký sự kiện thay đổi dữ liệu công nghệ thị trường
  onMarketTechChange(callback) {
    if (this.isFirebase) {
      this.fbDb.ref('market_tech').on('value', (snapshot) => {
        callback(snapshot.val() || {});
      });
    } else {
      this.techCallbacks.push(callback);
      const data = JSON.parse(localStorage.getItem('calon_market_tech') || '{}');
      callback(data);
    }
  }

  // Cập nhật thông tin một người chơi
  updatePlayer(id, updates) {
    if (this.isFirebase) {
      this.fbDb.ref(`players/${id}`).update(updates);
    } else {
      const players = JSON.parse(localStorage.getItem('calon_players') || '{}');
      if (!players[id]) players[id] = {};
      players[id] = { ...players[id], ...updates };
      localStorage.setItem('calon_players', JSON.stringify(players));
      // Tự kích hoạt callbacks cho tab hiện tại (vì sự kiện storage chỉ kích hoạt ở các tab khác)
      this.playersCallbacks.forEach(cb => cb(players));
    }
  }

  // Xóa một người chơi (ví dụ khi thoát)
  removePlayer(id) {
    if (this.isFirebase) {
      this.fbDb.ref(`players/${id}`).remove();
    } else {
      const players = JSON.parse(localStorage.getItem('calon_players') || '{}');
      delete players[id];
      localStorage.setItem('calon_players', JSON.stringify(players));
      this.playersCallbacks.forEach(cb => cb(players));
    }
  }

  // Mua công nghệ đầu tiên (kiểm tra thặng dư siêu ngạch)
  claimFirstTech(techLevel, playerName, callback) {
    const key = `level_${techLevel}`;
    if (this.isFirebase) {
      const ref = this.fbDb.ref(`market_tech/${key}`);
      ref.transaction((currentVal) => {
        if (currentVal === null) {
          return playerName; // Trở thành người đầu tiên tiên phong công nghệ này
        }
        return currentVal; // Giữ nguyên người đầu tiên cũ
      }, (error, committed, snapshot) => {
        callback(committed, snapshot.val());
      });
    } else {
      const techs = JSON.parse(localStorage.getItem('calon_market_tech') || '{}');
      let committed = false;
      if (!techs[key]) {
        techs[key] = playerName;
        localStorage.setItem('calon_market_tech', JSON.stringify(techs));
        committed = true;
        this.techCallbacks.forEach(cb => cb(techs));
      }
      callback(committed, techs[key]);
    }
  }

  // Khởi động lại dữ liệu thị trường (chỉ dành cho spectator khi load lại)
  resetDatabase() {
    if (this.isFirebase) {
      this.fbDb.ref('market_tech').remove();
    } else {
      localStorage.setItem('calon_market_tech', JSON.stringify({}));
      localStorage.setItem('calon_players', JSON.stringify({}));
    }
  }
}

const db = new GameDatabase();

// Tự động chuyển đổi giữa Spectator và Player bằng cách thay đổi query URL
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

  // Bắt đầu vòng lặp game vẽ đại dương
  requestAnimationFrame(spectatorGameLoop);
}

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

function generateJoinQR() {
  // Lấy link hiện tại để chế độ Player quét
  let joinUrl = window.location.href.split('?')[0];
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

  // 1. Cập nhật vị trí cá máy (Bots) & hành động tự động của chúng
  players.forEach(p => {
    if (p.isAI) {
      // Cho bot bơi ngẫu nhiên
      if (Math.random() < 0.02) {
        p.vx = (Math.random() - 0.5) * 4;
        p.vy = (Math.random() - 0.5) * 4;
      }
      // Giả lập bot làm việc trả lời câu hỏi và tăng máu chậm
      if (Math.random() < 0.005) {
        p.hp = Math.min(300, p.hp + 20);
      }
      // Dịch chuyển bot
      p.x += p.vx;
      p.y += p.vy;
    } else {
      // Người chơi thật: di chuyển dựa trên vx, vy nhận từ Firebase/LocalStorage
      p.x += p.vx * 1.5;
      p.y += p.vy * 1.5;
    }

    // Đảm bảo cá không bơi ra ngoài biên thế giới ảo
    p.x = Math.max(20, Math.min(WORLD_WIDTH - 20, p.x));
    p.y = Math.max(20, Math.min(WORLD_HEIGHT - 20, p.y));
  });

  // 2. Tính toán va chạm (Cá lớn nuốt cá bé - Tập trung tư bản)
  for (let i = 0; i < players.length; i++) {
    for (let j = 0; j < players.length; j++) {
      if (i === j) continue;
      const p1 = players[i];
      const p2 = players[j];

      // Bán kính cá phụ thuộc vào máu (HP)
      // Cực kỳ quan trọng: quy mô tư bản đại diện bởi lượng máu
      const r1 = 15 + Math.sqrt(p1.hp) * 2;
      const r2 = 15 + Math.sqrt(p2.hp) * 2;

      // Tính khoảng cách giữa 2 con cá
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Nếu chạm vào nhau
      if (dist < r1 + r2) {
        // Độc quyền/Thâu tóm: Cá lớn nuốt cá bé
        if (p1.hp > p2.hp) {
          executeBuyout(p1, p2);
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
      if (me.bankrupt && !document.getElementById('controllerScreen').classList.contains('hidden')) {
        showBankruptScreen();
      }
    }
  });

  setInterval(() => {
    if (myPlayerId && currentHp > 0 && !document.getElementById('controllerScreen').classList.contains('hidden')) {
      if (currentStrategy === 'absolute') {
        // Tăng cường độ lao động làm hao mòn nhanh sức lực
        currentHp = Math.max(10, currentHp - 2.5); // Hao mòn 2.5 HP mỗi 2 giây
        db.updatePlayer(myPlayerId, { hp: currentHp });
      } else {
        // Chế độ tương đối an toàn hơn, hao mòn rất nhẹ do di chuyển
        currentHp = Math.max(10, currentHp - 0.5);
        db.updatePlayer(myPlayerId, { hp: currentHp });
      }
    }
  }, 2000);

  // Khởi tạo bộ joystick di chuyển
  setupJoystick();
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

  // Chuyển màn hình
  document.getElementById('joinScreen').classList.add('hidden');
  document.getElementById('controllerScreen').classList.remove('hidden');
  document.getElementById('bankruptScreen').classList.add('hidden');
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
