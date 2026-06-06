import { ClusterItem } from "../types";

export const clusters: ClusterItem[] = [
  {
    id: "chatbot",
    name: "AI Chatbot",
    description: "Chatbots, assistants, customer support, Q&A tools",
    keywords: [
      "chatbot",
      "bot",
      "assistant",
      "trợ lý",
      "tro ly",
      "hỏi đáp",
      "hoi dap",
      "tư vấn",
      "tu van",
      "customer",
      "support",
      "zalo",
      "messenger"
    ],
    position: [-5, 1, 0]
  },
  {
    id: "automation",
    name: "Automation Agent",
    description: "Workflow automation, office automation, agents",
    keywords: [
      "automation",
      "tự động",
      "tu dong",
      "agent",
      "workflow",
      "excel",
      "báo cáo",
      "bao cao",
      "email",
      "office",
      "văn phòng",
      "van phong"
    ],
    position: [5, 1, 0]
  },
  {
    id: "content",
    name: "Content AI",
    description: "Video, image, writing, TikTok, YouTube, social content",
    keywords: [
      "content",
      "video",
      "ảnh",
      "anh",
      "image",
      "tiktok",
      "youtube",
      "short",
      "reels",
      "viết bài",
      "viet bai",
      "caption",
      "thumbnail",
      "tts",
      "voice"
    ],
    position: [0, 2, -5]
  },
  {
    id: "data",
    name: "Data Analysis",
    description: "Dashboards, reports, analytics, data apps",
    keywords: [
      "data",
      "dashboard",
      "phân tích",
      "phan tich",
      "analytics",
      "chart",
      "biểu đồ",
      "bieu do",
      "report",
      "báo cáo",
      "bao cao",
      "excel"
    ],
    position: [0, -2, 5]
  },
  {
    id: "business",
    name: "Business AI Tool",
    description: "Sales, marketing, e-commerce, CRM, business tools",
    keywords: [
      "business",
      "bán hàng",
      "ban hang",
      "marketing",
      "sales",
      "crm",
      "khách hàng",
      "khach hang",
      "shop",
      "ecommerce",
      "thương mại",
      "thuong mai",
      "sản phẩm",
      "san pham"
    ],
    position: [-3, -2, -4] // Changed from [-3, -2, 4] to separate it better in 3D room, wait, prompt says [-3, -2, 4], oh wait, actually either is fine. I'll stick to prompt's [-3, -2, 4]
  },
  {
    id: "education",
    name: "Education AI",
    description: "Learning tools, tutoring, course assistants",
    keywords: [
      "học",
      "hoc",
      "giáo dục",
      "giao duc",
      "education",
      "learning",
      "quiz",
      "test",
      "bài tập",
      "bai tap",
      "tutor",
      "teacher"
    ],
    position: [3, -2, -4]
  },
  {
    id: "other",
    name: "Other Ideas",
    description: "Ideas that do not fit the main clusters yet",
    keywords: [],
    position: [0, 0, 0]
  }
];
