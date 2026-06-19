const QUESTIONS = [
  {
    id: 1,
    question: "Nguồn gốc thực sự của giá trị thặng dư (m) trong nền kinh tế thị trường tư bản chủ nghĩa là gì?",
    answers: [
      "Do máy móc, thiết bị tự động hóa sinh ra trong quá trình sản xuất.",
      "Do sự tiêu dùng sức lao động của công nhân làm thuê tạo ra ngoài thời gian lao động tất yếu.",
      "Do nhà tư bản mua rẻ bán đắt trên thị trường lưu thông.",
      "Do tài nguyên thiên nhiên và đất đai tự sinh ra."
    ],
    correct: 1,
    explanation: "Giá trị thặng dư là bộ phận giá trị mới dôi ra ngoài giá trị sức lao động, do công nhân làm thuê tạo ra và bị nhà tư bản chiếm đoạt. Sức lao động là hàng hóa đặc biệt, khi sử dụng nó tạo ra giá trị mới lớn hơn giá trị của bản thân nó."
  },
  {
    id: 2,
    question: "Hàng hóa sức lao động có thuộc tính đặc biệt nào mà hàng hóa thông thường không có?",
    answers: [
      "Giá trị của nó tăng lên khi nó bị hao mòn theo thời gian.",
      "Giá trị sử dụng của nó có khả năng tạo ra giá trị mới lớn hơn giá trị của chính nó.",
      "Nó không có giá trị cá biệt, chỉ có giá trị xã hội.",
      "Giá trị của nó do người mua quyết định hoàn toàn."
    ],
    correct: 1,
    explanation: "Thuộc tính đặc biệt của hàng hóa sức lao động là giá trị sử dụng của nó: khi tiêu dùng (lao động), nó tạo ra một lượng giá trị mới lớn hơn giá trị bản thân nó. Phần dôi ra chính là giá trị thặng dư."
  },
  {
    id: 3,
    question: "Phương pháp sản xuất giá trị thặng dư tuyệt đối là phương pháp được thực hiện bằng cách:",
    answers: [
      "Rút ngắn thời gian lao động tất yếu bằng cách tăng năng suất lao động.",
      "Kéo dài ngày lao động vượt quá thời gian lao động tất yếu trong khi độ dài ngày lao động tất yếu không đổi.",
      "Áp dụng công nghệ mới để giảm hao phí lao động cá biệt của doanh nghiệp.",
      "Cắt giảm tiền lương của công nhân xuống dưới mức tối thiểu."
    ],
    correct: 1,
    explanation: "Sản xuất giá trị thặng dư tuyệt đối là phương pháp kéo dài ngày lao động trong điều kiện thời gian lao động tất yếu không thay đổi, từ đó làm tăng thời gian lao động thặng dư."
  },
  {
    id: 4,
    question: "Giới hạn vật chất (tự nhiên) tối đa của việc kéo dài ngày lao động trong sản xuất giá trị thặng dư tuyệt đối là gì?",
    answers: [
      "Quy định của pháp luật về lao động.",
      "Giới hạn sinh lý của người lao động (cần thời gian ăn, ngủ, nghỉ ngơi để phục hồi sức lao động).",
      "Yêu cầu của tổ chức Công đoàn.",
      "Không có giới hạn nào, nhà tư bản có thể bắt làm việc 24/24."
    ],
    correct: 1,
    explanation: "Về mặt tự nhiên, ngày lao động bị giới hạn bởi giới hạn sinh lý của công nhân (họ cần thời gian để tái sản xuất sức lao động như ăn, ngủ, giải trí) và giới hạn về mặt xã hội."
  },
  {
    id: 5,
    question: "Phương pháp sản xuất giá trị thặng dư tương đối dựa trên cơ sở nào?",
    answers: [
      "Kéo dài ngày lao động và tăng cường độ lao động của công nhân.",
      "Tăng năng suất lao động xã hội, làm giảm giá trị tư liệu sinh hoạt để rút ngắn thời gian lao động tất yếu.",
      "Sử dụng các thủ đoạn lừa đảo trong thương mại để nâng giá bán sản phẩm.",
      "Cắt giảm số lượng công nhân và bắt những người còn lại làm thay phần việc."
    ],
    correct: 1,
    explanation: "Sản xuất giá trị thặng dư tương đối là phương pháp rút ngắn thời gian lao động tất yếu bằng cách hạ thấp giá trị sức lao động (thông qua tăng năng suất lao động xã hội ở các ngành sản xuất tư liệu sinh hoạt), từ đó kéo dài thời gian lao động thặng dư tương ứng trong điều kiện độ dài ngày lao động không đổi."
  },
  {
    id: 6,
    question: "Giá trị thặng dư siêu ngạch thu được khi nào?",
    answers: [
      "Tất cả các doanh nghiệp trong ngành đều đồng loạt tăng năng suất lao động.",
      "Doanh nghiệp cá biệt áp dụng công nghệ tiên tiến, làm cho giá trị cá biệt của hàng hóa thấp hơn giá trị xã hội.",
      "Doanh nghiệp xuất khẩu hàng hóa ra thị trường quốc tế với giá cao.",
      "Nhà nước trợ cấp vốn cho doanh nghiệp đầu tư sản xuất."
    ],
    correct: 1,
    explanation: "Giá trị thặng dư siêu ngạch là phần giá trị thặng dư trội hơn giá trị thặng dư xã hội, thu được do doanh nghiệp cá biệt áp dụng công nghệ mới sớm hơn, làm cho giá trị cá biệt thấp hơn giá trị xã hội nhưng vẫn bán theo giá trị xã hội."
  },
  {
    id: 7,
    question: "Vì sao nói giá trị thặng dư siêu ngạch là 'hình thức biến tướng' của giá trị thặng dư tương đối?",
    answers: [
      "Vì nó cũng dựa trên việc kéo dài ngày lao động của công nhân.",
      "Vì cả hai đều dựa trên cơ sở tăng năng suất lao động (siêu ngạch là năng suất cá biệt, tương đối là năng suất xã hội).",
      "Vì nó chỉ xuất hiện trong các doanh nghiệp nhà nước.",
      "Vì nó chỉ tồn tại lâu dài và không bao giờ bị mất đi."
    ],
    correct: 1,
    explanation: "Giá trị thặng dư siêu ngạch và tương đối đều dựa trên tăng năng suất lao động để rút ngắn thời gian lao động tất yếu. Điểm khác là siêu ngạch dựa trên năng suất lao động cá biệt vượt trội, còn tương đối dựa trên năng suất lao động xã hội."
  },
  {
    id: 8,
    question: "Đâu là động lực trực tiếp và mạnh mẽ nhất thúc đẩy các nhà tư bản cải tiến kỹ thuật, tăng năng suất lao động cá biệt?",
    answers: [
      "Lòng thương cảm đối với người lao động để họ đỡ vất vả.",
      "Lòng ham muốn giành được giá trị thặng dư siêu ngạch.",
      "Quy định bắt buộc của chính phủ về đổi mới công nghệ.",
      "Yêu cầu của người tiêu dùng trên thị trường."
    ],
    correct: 1,
    explanation: "Giá trị thặng dư siêu ngạch là động lực mạnh mẽ nhất thúc đẩy các nhà tư bản cải tiến công nghệ, nâng cấp quy mô sản xuất. Tuy nhiên, nó mang tính tạm thời đối với từng doanh nghiệp riêng lẻ."
  },
  {
    id: 9,
    question: "Theo Mác, công thức chung của tư bản là gì?",
    answers: [
      "H - T - H' (Hàng - Tiền - Hàng)",
      "T - H - T' (Tiền - Hàng - Tiền trội hơn)",
      "T - T' (Tiền đẻ ra Tiền trực tiếp không qua sản xuất)",
      "H - H' (Hàng đổi Hàng)"
    ],
    correct: 1,
    explanation: "Công thức chung của tư bản là T - H - T', trong đó T' = T + Δt (Δt là số tiền trội hơn, chính là giá trị thặng dư được tạo ra từ quá trình sản xuất)."
  },
  {
    id: 10,
    question: "Tư bản bất biến (c) là bộ phận tư bản dùng để mua gì và có vai trò như thế nào trong tạo ra m?",
    answers: [
      "Mua sức lao động; là nguồn gốc trực tiếp sinh ra giá trị thặng dư.",
      "Mua tư liệu sản xuất (máy móc, nguyên liệu); là điều kiện vật chất cần thiết chứ không tự sinh ra giá trị thặng dư.",
      "Trả tiền thuê mặt bằng; không đóng vai trò gì.",
      "Mua bảo hiểm cho công nhân; trực tiếp sinh ra giá trị thặng dư."
    ],
    correct: 1,
    explanation: "Tư bản bất biến (c) tồn tại dưới hình thức tư liệu sản xuất, giá trị của nó được bảo tồn và chuyển nguyên vẹn vào sản phẩm mới thông qua lao động cụ thể của công nhân, chứ không tự tăng kích thước giá trị."
  },
  {
    id: 11,
    question: "Tư bản khả biến (v) là bộ phận tư bản dùng để mua gì và có vai trò như thế nào trong tạo ra m?",
    answers: [
      "Mua nhà xưởng; giá trị không thay đổi trong sản xuất.",
      "Mua sức lao động; thông qua lao động sống của công nhân, nó tự tăng lên về giá trị và là nguồn gốc trực tiếp sinh ra m.",
      "Mua nguyên liệu thô; biến đổi về lượng trong quá trình sản xuất.",
      "Trả lãi vay ngân hàng; tạo ra lợi nhuận cho chủ tư bản."
    ],
    correct: 1,
    explanation: "Tư bản khả biến (v) là bộ phận tư bản dùng để mua sức lao động. Nó không chuyển giá trị vào sản phẩm mà thông qua lao động sống, công nhân tạo ra giá trị mới lớn hơn giá trị sức lao động của mình, sinh ra m."
  },
  {
    id: 12,
    question: "Khi tất cả các doanh nghiệp đều áp dụng công nghệ mới và nâng cao năng suất lao động xã hội, giá trị thặng dư siêu ngạch của doanh nghiệp đi đầu sẽ:",
    answers: [
      "Tăng lên gấp đôi do quy mô thị trường mở rộng.",
      "Biến mất và chuyển hóa thành giá trị thặng dư tương đối cho toàn xã hội.",
      "Trở thành tài sản cố định của doanh nghiệp.",
      "Bị nhà nước thu hồi dưới dạng thuế độc quyền."
    ],
    correct: 1,
    explanation: "Khi công nghệ mới được áp dụng rộng rãi, năng suất lao động xã hội tăng lên, giá trị xã hội của hàng hóa giảm xuống bằng giá trị cá biệt, giá trị thặng dư siêu ngạch biến mất, thay thế bằng giá trị thặng dư tương đối."
  },
  {
    id: 13,
    question: "Sự giống nhau giữa sản xuất giá trị thặng dư tuyệt đối và tương đối là gì?",
    answers: [
      "Đều tăng cường độ lao động của công nhân.",
      "Đều rút ngắn thời gian lao động tất yếu.",
      "Đều nhằm mục đích kéo dài thời gian lao động thặng dư để tăng tỷ suất giá trị thặng dư.",
      "Đều sử dụng công nghệ tự động hóa cao."
    ],
    correct: 2,
    explanation: "Cả hai phương pháp đều nhằm tăng thời gian lao động thặng dư (thời gian làm ra giá trị thặng dư cho chủ), qua đó tăng tỷ suất giá trị thặng dư (m'). Phương pháp tuyệt đối kéo dài ngày lao động, còn tương đối rút ngắn thời gian tất yếu."
  },
  {
    id: 14,
    question: "Tích lũy tư bản là gì?",
    answers: [
      "Là việc nhà tư bản cất giấu tiền vào két sắt không đem ra lưu thông.",
      "Là sự chuyển hóa một phần giá trị thặng dư (m) thành tư bản phụ thêm để mở rộng sản xuất.",
      "Là việc sáp nhập nhiều doanh nghiệp nhỏ thành một doanh nghiệp lớn.",
      "Là quá trình vay vốn ngân hàng để bù đắp thua lỗ."
    ],
    correct: 1,
    explanation: "Tích lũy tư bản là quá trình biến một phần giá trị thặng dư thành tư bản phụ thêm (tư bản tích lũy) để tái sản xuất mở rộng. Nguồn gốc duy nhất của tích lũy tư bản là giá trị thặng dư."
  },
  {
    id: 15,
    question: "Trong nền kinh tế thị trường tự bản chủ nghĩa, quy luật 'Cá lớn nuốt cá bé' phản ánh xu hướng nào sau đây?",
    answers: [
      "Xu hướng các doanh nghiệp hợp tác cùng có lợi để chia sẻ thị trường.",
      "Xu hướng Tích tụ và Tập trung tư bản, dẫn đến sự ra đời của các tổ chức độc quyền lớn.",
      "Xu hướng bình đẳng hóa thu nhập giữa các chủ doanh nghiệp.",
      "Xu hướng xóa bỏ cạnh tranh, thiết lập nền kinh tế kế hoạch hóa."
    ],
    correct: 1,
    explanation: "Quy luật cạnh tranh và 'cá lớn nuốt cá bé' đẩy nhanh quá trình tập trung tư bản (liên kết hoặc thôn tính lẫn nhau giữa các tư bản có sẵn), dẫn đến tích tụ tư bản ngày càng lớn và hình thành các liên minh độc quyền thống trị thị trường."
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = QUESTIONS;
}
