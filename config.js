// CẤU HÌNH KẾT NỐI FIREBASE CỦA BẠN
const firebaseConfig = {
  apiKey: "AIzaSyB1tUVhA-JET6OSBAIZuRMy-FYsd0Q5vw4",
  authDomain: "calonnuotcabe-mln122.firebaseapp.com",
  databaseURL: "https://calonnuotcabe-mln122-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "calonnuotcabe-mln122",
  storageBucket: "calonnuotcabe-mln122.firebasestorage.app",
  messagingSenderId: "536020521654",
  appId: "1:536020521654:web:f447a3a939553b06b20c17",
  measurementId: "G-GNG1CSHBY5"
};

// Xuất cấu hình để sử dụng trong app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
}
