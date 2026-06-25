const QUESTIONS = [
  {
    id: 1,
    question: "Theo C. Mác, mục đích cốt lõi và tối cao của nhà tư bản trong quá trình sản xuất là gì?",
    answers: [
      "Tạo ra nhiều hàng hóa chất lượng cao cho xã hội.",
      "Giải quyết việc làm cho giai cấp công nhân.",
      "Thu được giá trị thặng dư (m) ở mức tối đa.",
      "Phát triển khoa học công nghệ và lực lượng sản xuất."
    ],
    correct: 2,
    explanation: "Trong nền kinh tế tư bản chủ nghĩa, sản xuất không nhằm mục đích thỏa mãn nhu cầu tiêu dùng của xã hội mà mục đích trực tiếp, động cơ thúc đẩy là thu được giá trị thặng dư (m) tối đa dựa trên việc chiếm đoạt lao động không công của công nhân."
  },
  {
    id: 2,
    question: "Để đạt được mục đích tăng giá trị thặng dư, biện pháp xuyên suốt và căn bản của nhà tư bản là gì?",
    answers: [
      "Tăng cường quảng cáo và xúc tiến thương mại.",
      "Khai thác sức lao động của công nhân một cách hiệu quả hơn.",
      "Giảm giá bán sản phẩm để chiếm lĩnh thị trường.",
      "Đi vay vốn ngân hàng để mở rộng quy mô."
    ],
    correct: 1,
    explanation: "Giá trị thặng dư do hao phí lao động của công nhân làm thuê tạo ra ngoài thời gian bù đắp giá trị sức lao động. Do đó, để tăng m, nhà tư bản bắt buộc phải tăng cường bóc lột, tức là khai thác sức lao động của công nhân hiệu quả hơn."
  },
  {
    id: 3,
    question: "Có bao nhiêu phương pháp cơ bản để sản xuất giá trị thặng dư đã được C. Mác chỉ ra?",
    answers: [
      "1 phương pháp.",
      "2 phương pháp.",
      "3 phương pháp.",
      "4 phương pháp."
    ],
    correct: 1,
    explanation: "C. Mác chỉ ra hai phương pháp cơ bản mang tính bản chất và phổ biến nhất để sản xuất giá trị thặng dư là: sản xuất giá trị thặng dư tuyệt đối và sản xuất giá trị thặng dư tương đối."
  },
  {
    id: 4,
    question: "Hai phương pháp cơ bản để sản xuất giá trị thặng dư trong nền kinh tế tư bản là gì?",
    answers: [
      "Tuyệt đối và tương đối.",
      "Tương đối và siêu ngạch.",
      "Tuyệt đối và siêu ngạch.",
      "Nội thương và ngoại thương."
    ],
    correct: 0,
    explanation: "Hai phương pháp cơ bản là phương pháp sản xuất giá trị thặng dư tuyệt đối (kéo dài ngày lao động) và phương pháp sản xuất giá trị thặng dư tương đối (rút ngắn thời gian lao động tất yếu)."
  },
  {
    id: 5,
    question: "Ngoài hai phương pháp cơ bản, nhà tư bản còn hướng tới hình thức giá trị thặng dư nào để tạo động lực cạnh tranh mạnh mẽ giữa các doanh nghiệp riêng lẻ?",
    answers: [
      "Giá trị thặng dư tuyệt đối tăng cường.",
      "Giá trị thặng dư siêu ngạch.",
      "Giá trị thặng dư định mức.",
      "Giá trị thặng dư công nghệ."
    ],
    correct: 1,
    explanation: "Giá trị thặng dư siêu ngạch thu được khi nhà tư bản cá biệt áp dụng công nghệ mới giúp năng suất lao động cá biệt cao hơn năng suất lao động xã hội, giảm chi phí cá biệt xuống dưới mức chi phí xã hội. Đây là động lực trực tiếp, mạnh mẽ nhất thúc đẩy các nhà tư bản cải tiến kỹ thuật."
  },
  {
    id: 6,
    question: "Bản chất của phương pháp sản xuất giá trị thặng dư tuyệt đối là gì?",
    answers: [
      "Áp dụng máy móc hiện đại để tăng nhanh năng suất lao động.",
      "Kéo dài thời gian lao động trong ngày vượt quá thời gian lao động tất yếu.",
      "Giảm lương của công nhân xuống dưới mức tối thiểu.",
      "Cải tiến phương pháp quản lý để công nhân tự giác làm việc."
    ],
    correct: 1,
    explanation: "Phương pháp tuyệt đối dựa trên việc kéo dài độ dài ngày lao động của công nhân vượt quá mốc thời gian lao động tất yếu (thời gian tái tạo sức lao động) trong điều kiện năng suất lao động không đổi, từ đó làm tăng thời gian lao động thặng dư."
  },
  {
    id: 7,
    question: "Trong phương pháp sản xuất giá trị thặng dư tuyệt đối, các yếu tố nào sau đây được giả định là KHÔNG thay đổi?",
    answers: [
      "Độ dài ngày lao động và năng suất lao động.",
      "Năng suất lao động và thời gian lao động tất yếu.",
      "Thời gian lao động thặng dư và tiền lương.",
      "Cường độ lao động và độ dài ngày lao động."
    ],
    correct: 1,
    explanation: "Định nghĩa của phương pháp tuyệt đối nêu rõ: kéo dài ngày lao động trong khi năng suất lao động, kỹ thuật sản xuất và thời gian lao động tất yếu (giá trị sức lao động) không thay đổi."
  },
  {
    id: 8,
    question: "Khi áp dụng phương pháp sản xuất giá trị thặng dư tuyệt đối, mối quan hệ giữa thời gian lao động tất yếu và thời gian lao động thặng dư thay đổi như thế nào?",
    answers: [
      "Cả hai khoảng thời gian đều tăng lên tương ứng.",
      "Thời gian tất yếu giảm xuống, thời gian thặng dư tăng lên.",
      "Thời gian tất yếu giữ nguyên, thời gian thặng dư tăng lên.",
      "Thời gian tất yếu tăng lên, thời gian thặng dư giảm xuống."
    ],
    correct: 2,
    explanation: "Vì năng suất lao động xã hội và mức lương không đổi, thời gian lao động tất yếu để tạo ra lượng giá trị bằng giá trị sức lao động giữ nguyên. Khi ngày lao động kéo dài ra, toàn bộ phần kéo dài đó thuộc về thời gian lao động thặng dư."
  },
  {
    id: 9,
    question: "Giả sử một ngày lao động là 8 giờ, trong đó thời gian lao động tất yếu là 4 giờ. Nếu nhà tư bản kéo dài ngày lao động lên 10 giờ (áp dụng phương pháp tuyệt đối), thì thời gian lao động thặng dư mới là bao nhiêu?",
    answers: [
      "4 giờ.",
      "5 giờ.",
      "6 giờ.",
      "10 giờ."
    ],
    correct: 2,
    explanation: "Ngày lao động mới = 10 giờ. Thời gian lao động tất yếu giữ nguyên = 4 giờ. Do đó, thời gian lao động thặng dư = Ngày lao động mới - Thời gian tất yếu = 10 - 4 = 6 giờ."
  },
  {
    id: 10,
    question: "Sự khác biệt về 'đặc trưng giai đoạn' giữa hai phương pháp (Tuyệt đối và Tương đối) cho thấy quy luật phát triển nào của chủ nghĩa tư bản?",
    answers: [
      "Sự thụt lùi về mặt nhân đạo của xã hội tư bản.",
      "Sự tiến hóa tất yếu từ bóc lột thô sơ dựa vào thể lực cơ bắp sang bóc lột tinh vi dựa trên tiến bộ khoa học kỹ thuật.",
      "Sự chuyển hóa từ sản xuất hàng hóa sang nền kinh tế tự cung tự cấp.",
      "Quy luật bần cùng hóa tuyệt đối không thể thay đổi của công nhân."
    ],
    correct: 1,
    explanation: "Lịch sử CNTB cho thấy giai đoạn đầu gắn liền với bóc lột thô bạo (tuyệt đối), giai đoạn sau đi kèm với sự phát triển của máy móc, tự động hóa gắn liền với bóc lột trí tuệ và hiệu suất (tương đối)."
  },
  {
    id: 11,
    question: "Phương pháp sản xuất giá trị thặng dư tuyệt đối thường được áp dụng phổ biến trong giai đoạn nào của chủ nghĩa tư bản?",
    answers: [
      "Giai đoạn đầu của chủ nghĩa tư bản (hiệp tác giản đơn và công trường thủ công).",
      "Giai đoạn chủ nghĩa tư bản độc quyền.",
      "Giai đoạn chủ nghĩa tư bản độc quyền nhà nước.",
      "Giai đoạn kinh tế tri thức hiện nay."
    ],
    correct: 0,
    explanation: "Ở giai đoạn đầu, trình độ kỹ thuật và công nghệ còn thô sơ, năng suất lao động thấp. Nhà tư bản chưa thể tăng năng suất lao động bằng máy móc nên phải dùng cách bóc lột thô sơ nhất là kéo dài thời gian làm việc của công nhân."
  },
  {
    id: 12,
    question: "Biểu hiện thực tế nào sau đây mô tả rõ nhất việc áp dụng phương pháp sản xuất giá trị thặng dư tuyệt đối trong lịch sử?",
    answers: [
      "Các nhà máy dệt ở Anh đầu thế kỷ XIX tự động hóa toàn bộ quy trình.",
      "Công nhân làm việc 12-16 giờ/ngày, sử dụng rộng rãi lao động phụ nữ và trẻ em giá rẻ.",
      "Doanh nghiệp cử nhân viên đi đào tạo thạc sĩ quản trị kinh doanh.",
      "Các công ty tăng lương gấp đôi để giữ chân nhân tài."
    ],
    correct: 1,
    explanation: "Trong thời kỳ tích lũy nguyên thủy và giai đoạn đầu của CNTB, các chủ xưởng ép buộc công nhân lao động cực nhọc từ 12 đến 16 tiếng mỗi ngày, sử dụng cả phụ nữ và trẻ em để tối đa hóa thời gian lao động thặng dư."
  },
  {
    id: 14,
    question: "Ưu điểm lớn nhất của phương pháp sản xuất giá trị thặng dư tuyệt đối đối với nhà tư bản là gì?",
    answers: [
      "Giúp nâng cao trình độ tay nghề của người lao động.",
      "Tạo ra sự đồng thuận, đoàn kết cao trong nhà xưởng.",
      "Dễ thực hiện và không đòi hỏi đầu tư lớn vào máy móc, công nghệ mới.",
      "Giúp giảm giá thành sản phẩm một cách bền vững trên thị trường."
    ],
    correct: 2,
    explanation: "Phương pháp này cực kỳ đơn giản về mặt kỹ thuật: nhà tư bản chỉ cần ép buộc công nhân làm việc lâu hơn mà không cần tốn chi phí mua sắm trang thiết bị tiên tiến hay nghiên cứu quy trình sản xuất mới."
  },
  {
    id: 15,
    question: "Một trong những giới hạn, hạn chế vật lý cơ bản của phương pháp sản xuất giá trị thặng dư tuyệt đối là:",
    answers: [
      "Giới hạn bởi thể chất con người và thời gian tự nhiên (24 giờ/ngày).",
      "Giới hạn bởi luật sở hữu trí tuệ của quốc gia.",
      "Giới hạn bởi giá nhiên liệu thô đầu vào.",
      "Giới hạn bởi khả năng tiêu thụ của thị trường nội địa."
    ],
    correct: 0,
    explanation: "Ngày tự nhiên chỉ có 24 giờ. Nhà tư bản không thể kéo dài ngày lao động vượt quá giới hạn này. Đồng thời, công nhân cần thời gian nghỉ ngơi, ăn uống, tái tạo sức lao động; nếu vượt quá giới hạn sinh lý, họ sẽ kiệt quệ và tử vong."
  },
  {
    id: 16,
    question: "Khi một công nghệ mới ban đầu mang lại 'giá trị thặng dư siêu ngạch' được phổ biến rộng rãi cho toàn xã hội (các đối thủ đều áp dụng được), thì giá trị thặng dư siêu ngạch đó sẽ biến thành:",
    answers: [
      "Giá trị thặng dư tuyệt đối của xã hội.",
      "Giá trị thặng dư tương đối của toàn bộ tư bản xã hội.",
      "Sự thua lỗ hàng loạt của các doanh nghiệp.",
      "Địa tô tuyệt đối của đất đai."
    ],
    correct: 1,
    explanation: "Khi công nghệ mới phổ biến rộng rãi, năng suất lao động cá biệt của doanh nghiệp tiên phong trở thành năng suất lao động xã hội nói chung. Giá trị tư liệu sinh hoạt giảm xuống trên quy mô lớn, làm thời gian lao động tất yếu của toàn xã hội giảm, chuyển hóa thành giá trị thặng dư tương đối."
  },
  {
    id: 17,
    question: "Bản chất của phương pháp sản xuất giá trị thặng dư tương đối là gì?",
    answers: [
      "Kéo dài ngày lao động bằng cách làm việc cả ban đêm.",
      "Rút ngắn thời gian lao động tất yếu để tăng tương ứng thời gian lao động thặng dư trong khi độ dài ngày lao động không đổi.",
      "Cắt giảm phúc lợi và các khoản bảo hiểm xã hội của công nhân.",
      "Tăng tiền lương của công nhân lên gấp đôi để họ làm việc hăng hái hơn."
    ],
    correct: 1,
    explanation: "Phương pháp tương đối không thay đổi độ dài ngày lao động, mà tìm cách rút ngắn thời gian lao động tất yếu (ví dụ từ 4h xuống 3h), nhờ đó thời gian lao động thặng dư tự động tăng lên (từ 4h lên 5h)."
  },
  {
    id: 18,
    question: "Trong phương pháp sản xuất giá trị thặng dư tương đối, yếu tố nào được giả định giữ nguyên?",
    answers: [
      "Thời gian lao động tất yếu.",
      "Độ dài ngày lao động.",
      "Trình độ công nghệ của nhà xưởng.",
      "Năng suất lao động xã hội."
    ],
    correct: 1,
    explanation: "Điểm cốt lõi của phương pháp tương đối là độ dài ngày lao động không thay đổi (giữ cố định, ví dụ 8 giờ), sự thay đổi nằm ở cơ cấu bên trong của ngày lao động đó."
  },
  {
    id: 19,
    question: "Để rút ngắn thời gian lao động tất yếu nhằm sản xuất giá trị thặng dư tương đối, nhà tư bản phải làm gì?",
    answers: [
      "Ép công nhân nhịn ăn trưa để làm việc liên tục.",
      "Giảm giá trị tư liệu sinh hoạt của công nhân thông qua việc tăng năng suất lao động xã hội ở các ngành sản xuất tư liệu sinh hoạt.",
      "Nhập khẩu lao động giá rẻ từ các nước kém phát triển.",
      "Chỉ thuê lao động bán thời gian để đỡ phải trả bảo hiểm."
    ],
    correct: 1,
    explanation: "Thời gian lao động tất yếu phụ thuộc vào giá trị sức lao động (tức giá trị các tư liệu sinh hoạt cần thiết để nuôi sống công nhân). Để giảm thời gian này, phải hạ giá các tư liệu sinh hoạt bằng cách tăng năng suất lao động xã hội trong các ngành sản xuất ra chúng (hoặc các ngành chế tạo máy móc phục vụ sản xuất tư liệu sinh hoạt)."
  },
  {
    id: 20,
    question: "Giả sử ngày lao động là 8 giờ. Ban đầu thời gian cần thiết là 4 giờ, thời gian thặng dư là 4 giờ. Sau khi cải tiến kỹ thuật, công nhân chỉ cần 3 giờ để tạo ra giá trị tương đương tiền lương. Lúc này thời gian lao động thặng dư là bao nhiêu?",
    answers: [
      "3 giờ.",
      "4 giờ.",
      "5 giờ.",
      "8 giờ."
    ],
    correct: 2,
    explanation: "Độ dài ngày lao động không đổi = 8 giờ. Thời gian tất yếu mới = 3 giờ. Thời gian lao động thặng dư mới = 8 - 3 = 5 giờ."
  },
  {
    id: 21,
    question: "Trong ví dụ trên (ngày lao động 8 giờ, thời gian cần thiết giảm từ 4 giờ xuống 3 giờ), phương pháp bóc lột nào đã được áp dụng?",
    answers: [
      "Phương pháp sản xuất giá trị thặng dư tuyệt đối.",
      "Phương pháp sản xuất giá trị thặng dư tương đối.",
      "Phương pháp bóc lột địa tô.",
      "Phương pháp thương mại tự do."
    ],
    correct: 1,
    explanation: "Do độ dài ngày lao động giữ nguyên (8 giờ) và thời gian lao động tất yếu bị co hẹp lại làm tăng thời gian thặng dư, đây là định nghĩa chuẩn của phương pháp tương đối."
  },
  {
    id: 22,
    question: "Điều kiện tiên quyết để thực hiện thành công phương pháp sản xuất giá trị thặng dư tương đối trên quy mô toàn bộ nền kinh tế là gì?",
    answers: [
      "Đóng cửa giao thương với nước ngoài.",
      "Tăng năng suất lao động xã hội.",
      "Kéo dài ngày lao động lên tối thiểu 12 giờ.",
      "Giảm thuế thu nhập doanh nghiệp."
    ],
    correct: 1,
    explanation: "Rút ngắn thời gian lao động tất yếu đòi hỏi phải hạ giá thành tư liệu sinh hoạt, điều này chỉ thực hiện được khi năng suất lao động xã hội tăng lên một cách đồng bộ ở tất cả các ngành liên quan."
  },
  {
    id: 23,
    question: "Để tăng năng suất lao động nhằm thu giá trị thặng dư tương đối, biện pháp thiết yếu nhất của nhà tư bản là gì?",
    answers: [
      "Áp dụng kỷ luật quân đội trong quản lý lao động.",
      "Đổi mới công nghệ, cải tiến máy móc, áp dụng tiến bộ kỹ thuật.",
      "Thuê thêm nhiều lao động chân tay thô sơ.",
      "Cắt bớt thời gian nghỉ phép của công nhân."
    ],
    correct: 1,
    explanation: "Đổi mới công nghệ và hiện đại hóa tư liệu sản xuất là con đường ngắn nhất, bền vững nhất để nâng cao năng suất lao động, giảm lượng hao phí lao động xã hội cần thiết trên một đơn vị sản phẩm."
  },
  {
    id: 24,
    question: "Việc sử dụng robot tự động hóa và ứng dụng trí tuệ nhân tạo (AI) trong các nhà máy hiện đại ngày nay là biểu hiện sinh động của phương pháp nào?",
    answers: [
      "Sản xuất giá trị thặng dư tuyệt đối.",
      "Sản xuất giá trị thặng dư tương đối.",
      "Tích lũy tư bản tự nhiên.",
      "Thuế quan ưu đãi."
    ],
    correct: 1,
    explanation: "Robot và AI là những đột phá công nghệ giúp tăng năng suất lao động lên gấp nhiều lần, rút ngắn thời gian hao phí cần thiết để hoàn thành sản phẩm, tăng thời gian thặng dư của doanh nghiệp mà không cần bắt công nhân làm thêm giờ vật lý."
  },
  {
    id: 25,
    question: "Trong nền kinh tế tư bản chủ nghĩa hiện đại ngày nay, phương pháp sản xuất giá trị thặng dư nào đóng vai trò chủ yếu?",
    answers: [
      "Phương pháp tuyệt đối.",
      "Phương pháp tương đối.",
      "Phương pháp bán thủ công.",
      "Phương pháp tô thuế nông nghiệp."
    ],
    correct: 1,
    explanation: "Ngày nay, luật pháp các nước bảo vệ quyền lợi người lao động rất chặt chẽ (giới hạn giờ làm việc, tăng ca phải trả lương rất cao). Do đó, nhà tư bản không thể bóc lột bằng cách kéo dài ngày làm việc một cách thô bạo mà phải tập trung bóc lột tinh vi bằng công nghệ và tăng năng suất (phương pháp tương đối)."
  },
  {
    id: 26,
    question: "Xét về cách thức thực hiện, điểm khác biệt lớn nhất giữa bóc lột tuyệt đối và bóc lột tương đối là gì?",
    answers: [
      "Một bên dựa vào tăng giá bán, một bên dựa vào hạ giá bán.",
      "Một bên thay đổi độ dài ngày lao động, một bên thay đổi năng suất lao động để rút ngắn thời gian lao động tất yếu.",
      "Một bên sử dụng lao động trong nước, một bên thuê lao động nước ngoài.",
      "Một bên do nhà nước quản lý, một bên do tư nhân tự phát."
    ],
    correct: 1,
    explanation: "Phương pháp tuyệt đối can thiệp vào tổng số lượng thời gian làm việc (kéo dài ngày lao động), còn phương pháp tương đối can thiệp vào cơ cấu tỷ lệ bên trong của ngày lao động bằng cách tăng năng suất."
  },
  {
    id: 27,
    question: "Điểm chung lớn nhất về mặt kết quả của cả hai phương pháp sản xuất giá trị thặng dư (tuyệt đối và tương đối) là gì?",
    answers: [
      "Đều làm tăng tiền lương thực tế cho người lao động.",
      "Đều làm thời gian lao động thặng dư tăng lên, gia tăng mức độ bóc lột.",
      "Đều làm giảm thời gian làm việc của công nhân.",
      "Đều hướng tới mục tiêu phi lợi nhuận."
    ],
    correct: 1,
    explanation: "Cả hai phương pháp suy cho cùng đều hướng tới mục đích duy nhất là kéo dài thời gian lao động thặng dư (thời gian công nhân làm không công cho nhà tư bản), từ đó gia tăng khối lượng giá trị thặng dư bóc lột được."
  },
  {
    id: 28,
    question: "Đứng từ góc độ tiến bộ xã hội và lịch sử, phương pháp sản xuất giá trị thặng dư nào mang lại những hệ quả khách quan tích cực hơn?",
    answers: [
      "Phương pháp tuyệt đối.",
      "Phương pháp tương đối.",
      "Cả hai phương pháp tiến bộ ngang nhau.",
      "Cả hai phương pháp đều kéo lùi sự phát triển của xã hội."
    ],
    correct: 1,
    explanation: "Phương pháp tương đối gắn liền với việc cải tiến công nghệ, phát triển lực lượng sản xuất, tăng năng suất lao động xã hội, thúc đẩy khoa học kỹ thuật tiến lên vũ bão. Trái lại, phương pháp tuyệt đối chỉ bòn rút sức lao động cơ bắp thô sơ của con người."
  },
  {
    id: 29,
    question: "Nếu một doanh nghiệp may mặc tìm cách tăng số lượng sản phẩm bằng cách áp đặt định mức sản phẩm khắt khe hơn, tăng tốc độ băng chuyền sản xuất ép công nhân làm nhanh hơn mà không đầu tư bất kỳ máy móc mới nào, đó là biểu hiện của:",
    answers: [
      "Sản xuất giá trị thặng dư tương đối.",
      "Sản xuất giá trị thặng dư tuyệt đối (thông qua tăng cường độ lao động).",
      "Sản xuất giá trị thặng dư siêu ngạch.",
      "Sự tiến bộ của khoa học quản lý."
    ],
    correct: 1,
    explanation: "Tăng cường độ lao động (ép làm nhanh hơn, khẩn trương hơn trong cùng một thời gian) thực chất tương đương với việc kéo dài ngày lao động (vì hao phí sức lực tăng lên trong một đơn vị thời gian). Do đó, nó thuộc phạm trù sản xuất giá trị thặng dư tuyệt đối."
  },
  {
    id: 30,
    question: "Sự chuyển biến lịch sử từ việc bóc lột giá trị thặng dư tuyệt đối sang bóc lột giá trị thặng dư tương đối làm chủ đạo phản ánh quy luật phát triển nào?",
    answers: [
      "Sự đi xuống của ý thức đấu tranh của giai cấp công nhân.",
      "Sự phát triển vượt bậc của lực lượng sản xuất và trình độ xã hội hóa ngày càng cao của nền sản xuất tư bản.",
      "Sự suy yếu dần của lòng tham tư bản chủ nghĩa.",
      "Sự biến mất hoàn toàn của quan hệ bóc lột."
    ],
    correct: 1,
    explanation: "Khi lực lượng sản xuất phát triển, máy móc ra đời thay thế lao động thủ công, trình độ xã hội hóa cao hơn, việc bóc lột không thể mãi dựa vào cơ bắp thô sơ mà bắt buộc phải tiến hóa sang bóc lột tinh vi hơn thông qua công nghệ và năng suất."
  }
];
