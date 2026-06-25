// ==================== KHỞI TẠO HỆ THỐNG & ĐỒNG BỘ DỮ LIỆU BẢNG ====================

const urlParams = new URLSearchParams(window.location.search);
let currentRoomId = urlParams.get('room') || 'room_default';

// Cập nhật text hiển thị mã phòng và nút quay lại game
document.getElementById('roomIdText').innerText = currentRoomId;
document.getElementById('btnBackToGame').href = `index.html?room=${currentRoomId}&role=spectator`;

// Trạng thái cục bộ lưu trữ danh sách câu hỏi đang quản lý
let currentQuestions = [];
let isFirebase = false;
let fbDb = null;

// Khởi tạo cơ sở dữ liệu
function initAdminDatabase() {
  const hasConfig = typeof firebaseConfig !== 'undefined' && 
                    firebaseConfig.apiKey && 
                    firebaseConfig.apiKey !== "YOUR_API_KEY";

  const connDot = document.getElementById('connDot');
  const connText = document.getElementById('connText');

  if (hasConfig) {
    try {
      firebase.initializeApp(firebaseConfig);
      fbDb = firebase.database();
      isFirebase = true;
      console.log(`🔌 Kết nối ONLINE (Firebase) - Quản lý phòng: ${currentRoomId}`);
      connDot.className = "indicator-dot online";
      connText.innerText = "Trực tuyến (Firebase)";
    } catch (e) {
      console.error("Firebase lỗi:", e);
      setupLocalStorageFallback();
    }
  } else {
    setupLocalStorageFallback();
  }

  // Bắt đầu lắng nghe dữ liệu
  listenToQuestions();
}

function setupLocalStorageFallback() {
  isFirebase = false;
  console.log(`🔌 Kết nối OFFLINE (LocalStorage) - Quản lý phòng: ${currentRoomId}`);
  const connDot = document.getElementById('connDot');
  const connText = document.getElementById('connText');
  connDot.className = "indicator-dot offline";
  connText.innerText = "Cục bộ (LocalStorage)";

  // Lắng nghe thay đổi Storage từ tab khác
  window.addEventListener('storage', (e) => {
    if (e.key === `calon_status_${currentRoomId}`) {
      const data = JSON.parse(e.newValue || '{}');
      updateLocalQuestionsList(data.customQuestions || []);
    }
  });
}

// Đọc dữ liệu từ DB
function listenToQuestions() {
  if (isFirebase) {
    fbDb.ref(`rooms/${currentRoomId}/status/customQuestions`).on('value', (snapshot) => {
      const data = snapshot.val() || [];
      // Nếu phòng mới hoàn toàn chưa có câu hỏi, tải mặc định từ questions.js
      if (data.length === 0) {
        currentQuestions = JSON.parse(JSON.stringify(QUESTIONS));
        saveQuestionsToDb(currentQuestions);
      } else {
        updateLocalQuestionsList(data);
      }
    });
  } else {
    const statusData = JSON.parse(localStorage.getItem(`calon_status_${currentRoomId}`) || '{}');
    const data = statusData.customQuestions || [];
    if (data.length === 0) {
      currentQuestions = JSON.parse(JSON.stringify(QUESTIONS));
      saveQuestionsToDb(currentQuestions);
    } else {
      updateLocalQuestionsList(data);
    }
  }
}

// Lưu danh sách câu hỏi vào DB
function saveQuestionsToDb(questionsList) {
  if (isFirebase) {
    fbDb.ref(`rooms/${currentRoomId}/status/customQuestions`).set(questionsList);
  } else {
    const statusData = JSON.parse(localStorage.getItem(`calon_status_${currentRoomId}`) || '{}');
    statusData.customQuestions = questionsList;
    localStorage.setItem(`calon_status_${currentRoomId}`, JSON.stringify(statusData));
    updateLocalQuestionsList(questionsList);
    // Kích hoạt sự kiện storage thủ công cho cùng tab
    window.dispatchEvent(new Event('storage'));
  }
}

// Cập nhật biến cục bộ và vẽ lại UI
function updateLocalQuestionsList(data) {
  currentQuestions = data;
  renderQuestionsTable();
}

// Vẽ lại bảng danh sách câu hỏi
function renderQuestionsTable() {
  const listEl = document.getElementById('questionsList');
  const noDataEl = document.getElementById('noDataView');
  
  listEl.innerHTML = '';
  
  if (currentQuestions.length === 0) {
    noDataEl.classList.remove('hidden');
    return;
  }
  noDataEl.classList.add('hidden');

  currentQuestions.forEach((q, index) => {
    const tr = document.createElement('tr');
    
    // Tạo danh sách phương án lựa chọn, làm nổi bật đáp án đúng
    let optionsHtml = '<ul class="opt-list">';
    q.answers.forEach((ans, aIdx) => {
      const isCorrect = aIdx === q.correct;
      optionsHtml += `<li class="${isCorrect ? 'is-correct' : ''}">${ans} ${isCorrect ? '<i class="fa-solid fa-circle-check"></i>' : ''}</li>`;
    });
    optionsHtml += '</ul>';

    tr.innerHTML = `
      <td style="text-align: center; font-weight: 600; color: #a4b0be;">${index + 1}</td>
      <td style="font-weight: 500;">${q.question}</td>
      <td>${optionsHtml}</td>
      <td style="color: #a4b0be; font-size: 13px;">${q.explanation || 'Không có giải thích.'}</td>
      <td>
        <div class="action-btn-group">
          <button onclick="openEditModal(${index})" class="btn-mini btn-edit">
            <i class="fa-solid fa-pen-to-square"></i> Sửa
          </button>
          <button onclick="deleteQuestion(${index})" class="btn-mini btn-delete">
            <i class="fa-solid fa-trash"></i> Xóa
          </button>
        </div>
      </td>
    `;
    listEl.appendChild(tr);
  });
}


// ==================== BIỂU MẪU THÊM & SỬA CÂU HỎI (MODAL) ====================

function openAddModal() {
  document.getElementById('modalTitle').innerText = "Thêm Câu Hỏi Mới";
  document.getElementById('editIndex').value = "-1";
  document.getElementById('questionForm').reset();
  document.getElementById('questionModal').classList.remove('hidden');
}

function openEditModal(index) {
  const q = currentQuestions[index];
  document.getElementById('modalTitle').innerText = `Chỉnh Sửa Câu Hỏi #${index + 1}`;
  document.getElementById('editIndex').value = index;
  
  document.getElementById('formQuestion').value = q.question;
  document.getElementById('opt0').value = q.answers[0] || '';
  document.getElementById('opt1').value = q.answers[1] || '';
  document.getElementById('opt2').value = q.answers[2] || '';
  document.getElementById('opt3').value = q.answers[3] || '';
  
  // Thiết lập đáp án đúng
  const radios = document.getElementsByName('correctAnswer');
  for (let r of radios) {
    if (parseInt(r.value) === q.correct) {
      r.checked = true;
      break;
    }
  }
  
  document.getElementById('formExplanation').value = q.explanation || '';
  document.getElementById('questionModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('questionModal').classList.add('hidden');
}

function saveQuestion(e) {
  e.preventDefault();
  
  const index = parseInt(document.getElementById('editIndex').value);
  const questionText = document.getElementById('formQuestion').value.trim();
  const a0 = document.getElementById('opt0').value.trim();
  const a1 = document.getElementById('opt1').value.trim();
  const a2 = document.getElementById('opt2').value.trim();
  const a3 = document.getElementById('opt3').value.trim();
  
  let correctIndex = 0;
  const radios = document.getElementsByName('correctAnswer');
  for (let r of radios) {
    if (r.checked) {
      correctIndex = parseInt(r.value);
      break;
    }
  }
  
  const explanationText = document.getElementById('formExplanation').value.trim();

  const newQuestion = {
    id: index >= 0 ? currentQuestions[index].id : (currentQuestions.length > 0 ? Math.max(...currentQuestions.map(q => q.id)) + 1 : 1),
    question: questionText,
    answers: [a0, a1, a2, a3],
    correct: correctIndex,
    explanation: explanationText || "Không có lời giải thích cụ thể cho câu hỏi này."
  };

  if (index >= 0) {
    // Sửa câu hỏi
    currentQuestions[index] = newQuestion;
  } else {
    // Thêm mới
    currentQuestions.push(newQuestion);
  }

  saveQuestionsToDb(currentQuestions);
  closeModal();
  alert("Lưu câu hỏi thành công!");
}

function deleteQuestion(index) {
  if (confirm(`Bạn có chắc chắn muốn xóa câu hỏi số ${index + 1}?`)) {
    currentQuestions.splice(index, 1);
    // Đánh lại ID cho đồng bộ
    currentQuestions.forEach((q, i) => q.id = i + 1);
    saveQuestionsToDb(currentQuestions);
    alert("Đã xóa câu hỏi thành công!");
  }
}

// Khôi phục bộ câu hỏi hệ thống mặc định
function resetToSystemDefault() {
  if (confirm("Bạn có chắc chắn muốn xóa toàn bộ câu hỏi tùy chỉnh và khôi phục về 29 câu hỏi mặc định của hệ thống?")) {
    const defaults = JSON.parse(JSON.stringify(QUESTIONS));
    saveQuestionsToDb(defaults);
    alert("Đã khôi phục bộ câu hỏi mặc định thành công!");
  }
}


// ==================== XỬ LÝ NHẬP (IMPORT) VÀ XUẤT (EXPORT) FILE ====================

function handleAdminImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'docx') {
    const reader = new FileReader();
    reader.onload = function(loadEvent) {
      const arrayBuffer = loadEvent.target.result;
      mammoth.extractRawText({ arrayBuffer: arrayBuffer })
        .then(function(result) {
          parseQuizImportText(result.value);
        })
        .catch(function(err) {
          alert("Lỗi khi đọc file Word: " + err.message);
        });
    };
    reader.readAsArrayBuffer(file);
  } else if (extension === 'txt') {
    const reader = new FileReader();
    reader.onload = function(loadEvent) {
      parseQuizImportText(loadEvent.target.result);
    };
    reader.readAsText(file);
  } else if (extension === 'json') {
    const reader = new FileReader();
    reader.onload = function(loadEvent) {
      try {
        const data = JSON.parse(loadEvent.target.result);
        if (!Array.isArray(data)) {
          alert("Lỗi: Dữ liệu JSON phải là một danh sách câu hỏi (Array)!");
          return;
        }
        const isValid = data.every(q => q.question && Array.isArray(q.answers) && q.answers.length >= 2);
        if (!isValid) {
          alert("Một số câu hỏi thiếu trường bắt buộc (question, answers).");
          return;
        }
        // Đánh lại ID
        data.forEach((q, i) => q.id = i + 1);
        saveQuestionsToDb(data);
        alert(`Nhập thành công ${data.length} câu hỏi từ file JSON!`);
      } catch (err) {
        alert("Lỗi cú pháp file JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  } else {
    alert("Định dạng file không hỗ trợ! Vui lòng chọn file .docx, .txt hoặc .json");
  }
}

// Phân tích cú pháp văn bản từ .docx / .txt
function parseQuizImportText(text) {
  try {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed = [];
    let current = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Nhận diện câu hỏi: "Câu 1:" hoặc "Question 1:"
      const qMatch = line.match(/^(?:Câu|Question)\s*(\d+)[\s.:]+(.*)$/i);
      if (qMatch) {
        if (current && validateQuestion(current)) {
          parsed.push(current);
        }
        current = {
          id: parsed.length + 1,
          question: qMatch[2].trim(),
          answers: [],
          correct: 0,
          explanation: ""
        };
        continue;
      }

      if (!current) continue;

      // Nhận diện đáp án: "A. ...", "B: ..."
      const optMatch = line.match(/^([A-D])[\s.:)]+(.*)$/i);
      if (optMatch) {
        current.answers.push(optMatch[2].trim());
        continue;
      }

      // Nhận diện đáp án đúng: "Đáp án đúng: A" hoặc "Đáp án: B"
      const correctMatch = line.match(/^(?:Đáp án đúng|Đáp án|Correct|Correct Answer)[\s.:]+([A-D])/i);
      if (correctMatch) {
        const letter = correctMatch[1].toUpperCase();
        current.correct = letter.charCodeAt(0) - 65; // A->0, B->1...
        continue;
      }

      // Nhận diện giải thích
      const expMatch = line.match(/^(?:Giải thích|Explanation)[\s.:]+(.*)$/i);
      if (expMatch) {
        current.explanation = expMatch[1].trim();
        continue;
      }

      // Nối tiếp vào phần giải thích nếu không khớp lệnh nào
      if (current.explanation) {
        current.explanation += " " + line;
      }
    }

    if (current && validateQuestion(current)) {
      parsed.push(current);
    }

    if (parsed.length === 0) {
      alert("Không trích xuất được câu hỏi nào từ file! Hãy kiểm tra lại định dạng.");
      return;
    }

    saveQuestionsToDb(parsed);
    alert(`Nhập hàng loạt thành công ${parsed.length} câu hỏi từ file!`);
  } catch (err) {
    alert("Lỗi khi phân tích câu hỏi: " + err.message);
  }
}

function validateQuestion(q) {
  if (!q.question) return false;
  if (q.answers.length < 2) return false;
  if (!q.explanation) q.explanation = "Không có lời giải thích cụ thể cho câu hỏi này.";
  return true;
}

// Xuất câu hỏi ra định dạng Word (.txt copy) và tự động tải xuống
function exportQuestionsText() {
  if (currentQuestions.length === 0) {
    alert("Không có câu hỏi nào để xuất!");
    return;
  }

  let output = "";
  currentQuestions.forEach((q, index) => {
    output += `Câu ${index + 1}: ${q.question}\n`;
    const letters = ['A', 'B', 'C', 'D'];
    q.answers.forEach((ans, aIdx) => {
      output += `${letters[aIdx]}. ${ans}\n`;
    });
    output += `Đáp án đúng: ${letters[q.correct]}\n`;
    output += `Giải thích: ${q.explanation || 'Không có giải thích.'}\n\n`;
  });

  // Tải file xuống máy
  const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cau_hoi_room_${currentRoomId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// Khởi chạy khi tải trang
window.onload = function() {
  initAdminDatabase();
};
