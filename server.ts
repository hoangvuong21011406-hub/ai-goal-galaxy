import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { classifyGoal } from "./src/utils/classifyGoal";
import { GoalItem, CourseGoals, ClusterItem } from "./src/types";
import { analyzeGoalWithGemini } from "./server/geminiService";
import { sendGoalNotification } from "./server/notificationService";

const PORT = 3000;
const DB_DIR = path.join(process.cwd(), "server", "data");
const DB_FILE = path.join(DB_DIR, "goals.json");

const DEFAULT_CLUSTERS: ClusterItem[] = [
  {
    id: "chatbot",
    name: "AI Chatbot",
    description: "Các chatbot tự động, trợ lý ảo thông minh, hệ thống tương tác khách hàng và hỏi đáp Q&A.",
    keywords: ["chatbot", "bot", "assistant", "trợ lý", "tro ly", "hỏi đáp", "hoi dap", "tư vấn", "tu van", "customer", "support", "zalo", "messenger"],
    position: [-16.5, 1.0, 1.5]
  },
  {
    id: "automation",
    name: "Automation Agent",
    description: "Hệ thống tự động hóa văn phòng, tự động hóa quy trình làm việc và các tác nhân AI (AI Agents).",
    keywords: ["automation", "tự động", "tu dong", "agent", "workflow", "excel", "báo cáo", "bao cao", "email", "office", "văn phòng", "van phong"],
    position: [16.5, 1.0, -1.5]
  },
  {
    id: "content",
    name: "Content AI",
    description: "Ứng dụng sáng tạo nội dung đa phương tiện: viết bài, tạo hình ảnh, video (TikTok, YouTube Shorts, Reels).",
    keywords: ["content", "video", "ảnh", "anh", "image", "tiktok", "youtube", "short", "reels", "viết bài", "viet bai", "caption", "thumbnail", "tts", "voice"],
    position: [-4.0, 2.0, -12.5]
  },
  {
    id: "data",
    name: "Data Analysis",
    description: "Phân tích số liệu, tổng hợp báo cáo chi tiết, trực quan hóa biểu đồ và xây dựng dashboard thông tin.",
    keywords: ["data", "dashboard", "phân tích", "phan tich", "analytics", "chart", "biểu đồ", "bieu do", "report", "báo cáo", "bao cao", "excel"],
    position: [4.0, -2.0, 12.5]
  },
  {
    id: "business",
    name: "Business AI Tool",
    description: "Nhóm công cụ phát triển doanh nghiệp, tối ưu hóa bán hàng, marketing, thương mại điện tử, CRM.",
    keywords: ["business", "bán hàng", "ban hang", "marketing", "sales", "crm", "khách hàng", "khach hang", "shop", "ecommerce", "thương mại", "thuong mai", "sản phẩm", "san pham"],
    position: [-11.0, -1.0, 8.0]
  },
  {
    id: "education",
    name: "Education AI",
    description: "Mô hình dạy học thông minh, hỗ trợ giảng bài, trắc nghiệm nhanh, quiz và gia sư AI cá nhân hóa.",
    keywords: ["học", "hoc", "giáo dục", "giao duc", "education", "learning", "quiz", "test", "bài tập", "bai tap", "tutor", "teacher"],
    position: [11.0, -1.0, -8.0]
  },
  {
    id: "other",
    name: "Other Ideas",
    description: "Các ý tưởng sáng tạo đột phá chưa thuộc nhóm chòm sao định hình nào.",
    keywords: [],
    position: [0, 0, 0]
  }
];

const SEED_DATA: { name: string; goal: string }[] = [];

function generateNodePosition(clusterId: string, clustersList: ClusterItem[]) {
  const cluster = clustersList.find(c => c.id === clusterId) || clustersList.find(c => c.id === "other") || { position: [0, 0, 0] };
  const [cx, cy, cz] = cluster.position;

  // Spherical coordinate distribution around cluster coordinates
  const radius = 1.1 + Math.random() * 1.3;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  return {
    x: Number((cx + radius * Math.sin(phi) * Math.cos(theta)).toFixed(3)),
    y: Number((cy + radius * Math.sin(phi) * Math.sin(theta)).toFixed(3)),
    z: Number((cz + radius * Math.cos(phi)).toFixed(3))
  };
}

function initializeDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    let needsSeed = false;
    let dataObj: CourseGoals = { courseName: "AI Builder Course", items: [], clusters: DEFAULT_CLUSTERS };

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        dataObj = JSON.parse(raw);
        if (!dataObj.items || dataObj.items.length === 0) {
          needsSeed = true;
        }
        
        let fileUpdated = false;
        if (!dataObj.clusters || dataObj.clusters.length === 0) {
          dataObj.clusters = DEFAULT_CLUSTERS;
          fileUpdated = true;
        } else {
          // Align dynamic-loaded default clusters with the new spread-out positions
          dataObj.clusters = dataObj.clusters.map(c => {
            const defClust = DEFAULT_CLUSTERS.find(dc => dc.id === c.id);
            if (defClust) {
              if (c.position[0] !== defClust.position[0] || c.position[1] !== defClust.position[1] || c.position[2] !== defClust.position[2]) {
                fileUpdated = true;
                return { ...c, position: defClust.position };
              }
            }
            return c;
          });
        }

        // Align any old items that were calculated on old central coordinates
        if (dataObj.items && dataObj.items.length > 0) {
          dataObj.items = dataObj.items.map(item => {
            const clusterObj = dataObj.clusters.find(c => c.id === item.cluster);
            if (clusterObj) {
              const [cx, cy, cz] = clusterObj.position;
              const dist = Math.sqrt(Math.pow(item.x - cx, 2) + Math.pow(item.y - cy, 2) + Math.pow(item.z - cz, 2));
              // If distance deviates too much (showing it's clustered on obsolete coordinates), recalculating position
              if (dist > 3.5) {
                const coords = generateNodePosition(item.cluster, dataObj.clusters);
                fileUpdated = true;
                return { ...item, x: coords.x, y: coords.y, z: coords.z };
              }
            }
            return item;
          });
        }

        if (fileUpdated) {
          fs.writeFileSync(DB_FILE, JSON.stringify(dataObj, null, 2), "utf-8");
          console.log("Database file upgraded and realigned automatically with newer spread-out coordinates!");
        }
      } catch (err) {
        console.warn("goals.json corrupt, overwriting...");
        needsSeed = true;
      }
    } else {
      needsSeed = true;
    }

    if (needsSeed) {
      const items: GoalItem[] = [];
      const clustersList = dataObj.clusters || DEFAULT_CLUSTERS;
      // Generate sample goals from script
      SEED_DATA.forEach((seed, index) => {
        const meta = classifyGoal(seed.goal);
        const coords = generateNodePosition(meta.cluster, clustersList);
        const item: GoalItem = {
          id: `goal_seed_${Date.now()}_${index}`,
          name: seed.name,
          goal: seed.goal,
          cluster: meta.cluster,
          clusterLabel: meta.clusterLabel,
          tags: meta.tags,
          x: coords.x,
          y: coords.y,
          z: coords.z,
          createdAt: new Date(Date.now() - index * 3600000).toISOString(),
          analysis: "Đây là mục tiêu mẫu cốt lõi của khóa học, đóng vai trò hạt nhân xây dựng nền tảng và đã được hệ thống phân bổ khoa học vào chòm sao thích hợp."
        };
        items.push(item);
      });
      dataObj.items = items;
      dataObj.clusters = clustersList;
      fs.writeFileSync(DB_FILE, JSON.stringify(dataObj, null, 2), "utf-8");
      console.log(`Successfully seeded ${items.length} initial learner goals and default clusters!`);
    }
  } catch (err) {
    console.error("Failed to initialize database", err);
  }
}

async function startServer() {
  initializeDatabase();

  const app = express();
  app.use(express.json());

  // API 1: GET All Goals & Clusters
  app.get("/api/goals", (req, res) => {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return res.json({ courseName: "AI Builder Course", items: [], clusters: DEFAULT_CLUSTERS });
      }
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const dataObj = JSON.parse(raw);
      if (!dataObj.clusters || dataObj.clusters.length === 0) {
        dataObj.clusters = DEFAULT_CLUSTERS;
      }
      res.json(dataObj);
    } catch (err) {
      res.status(500).json({ error: "Failed to read goal database" });
    }
  });

  // In-memory rate limiting to prevent submission spam
  const ipCooldowns = new Map<string, number>();
  const COOLDOWN_MS = 20000; // 20 seconds cooldown per client IP to prevent flooding

  // API 2: CREATE A Goal (LLM Integrated with Fallback)
  app.post("/api/goals", async (req, res) => {
    try {
      // Direct client IP identification for anti-spam filter
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.ip || req.socket.remoteAddress || "anonymous";
      const now = Date.now();
      if (ipCooldowns.has(ip)) {
        const lastTime = ipCooldowns.get(ip) || 0;
        if (now - lastTime < COOLDOWN_MS) {
          const timeLeft = Math.ceil((COOLDOWN_MS - (now - lastTime)) / 1000);
          return res.status(429).json({ 
            error: `Hành động quá nhanh! Hệ thống bảo vệ chống spam đang hoạt động, vui lòng chờ ${timeLeft} giây trước khi gửi tiếp.` 
          });
        }
      }

      let { name, goal, email } = req.body;

      if (!email || typeof email !== "string" || !email.trim() || !email.includes("@")) {
        return res.status(401).json({ 
          error: "Hệ thống yêu cầu xác thực Google. Vui lòng đăng nhập bằng tài khoản Gmail của bạn trước khi tiếp tục." 
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "Tên không thể để trống" });
      }
      if (!goal || typeof goal !== "string") {
        return res.status(400).json({ error: "Mục tiêu không thể để trống" });
      }

      name = name.trim();
      goal = goal.trim();

      if (name.length === 0) {
        return res.status(400).json({ error: "Tên không thể chứa toàn dấu cách" });
      }
      if (goal.length === 0) {
        return res.status(400).json({ error: "Mục tiêu không thể chứa toàn dấu cách" });
      }

      if (name.length > 80) {
        return res.status(400).json({ error: "Tên không được vượt quá 80 ký tự" });
      }
      if (goal.length > 500) {
        return res.status(400).json({ error: "Mục tiêu không được vượt quá 500 ký tự" });
      }

      // Load DB
      let db: CourseGoals = { courseName: "AI Builder Course", items: [], clusters: DEFAULT_CLUSTERS };
      if (fs.existsSync(DB_FILE)) {
        try {
          db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        } catch (e) {
          // Fallback
        }
      }
      if (!db.clusters || db.clusters.length === 0) {
        db.clusters = DEFAULT_CLUSTERS;
      }

      let selectedClusterId = "other";
      let selectedClusterLabel = "Other Ideas";
      let tagsList: string[] = ["idea"];
      let aiAnalysisText = "";

      // Attempt AI Analysis
      const hasApiKey = !!process.env.GEMINI_API_KEY;
      if (hasApiKey) {
        try {
          console.log(`Analyzing goal for "${name}" with Gemini LLM...`);
          const aiResult = await analyzeGoalWithGemini(name, goal, db.items, db.clusters);
          
          if (aiResult.newClusterCreated && aiResult.newClusterData) {
            // Push proposed cluster to the dynamic DB!
            db.clusters.push(aiResult.newClusterData);
            console.log(`New galaxy cluster created: "${aiResult.newClusterData.name}" (${aiResult.newClusterData.id})`);
          }

          selectedClusterId = aiResult.clusterId;
          selectedClusterLabel = aiResult.clusterLabel;
          tagsList = aiResult.tags;
          aiAnalysisText = aiResult.analysis;
        } catch (apiError) {
          console.error("Gemini direct analysis failed, running local fallback classification...", apiError);
          const metaFallback = classifyGoal(goal);
          selectedClusterId = metaFallback.cluster;
          selectedClusterLabel = metaFallback.clusterLabel;
          tagsList = metaFallback.tags;
          aiAnalysisText = "Ý tưởng của bạn đã được sắp đặt an toàn vào Ngân Hà thông qua thuật toán rà quét từ khóa dự phòng.";
        }
      } else {
        console.log("No Gemini API key found, running standard keyword classification...");
        const metaFallback = classifyGoal(goal);
        selectedClusterId = metaFallback.cluster;
        selectedClusterLabel = metaFallback.clusterLabel;
        tagsList = metaFallback.tags;
        aiAnalysisText = "Bạn đã thắp sáng chòm sao! Hãy cấu hình GEMINI_API_KEY ở Settings để kích hoạt tính năng phân tích và bóc tách chuyên sâu từ mô hình AI.";
      }

      // Calculate position
      const coords = generateNodePosition(selectedClusterId, db.clusters);

      const sysEmail = email ? String(email).trim() : "";

      const newItem: GoalItem = {
        id: `goal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name,
        goal,
        cluster: selectedClusterId,
        clusterLabel: selectedClusterLabel,
        tags: tagsList,
        x: coords.x,
        y: coords.y,
        z: coords.z,
        createdAt: new Date().toISOString(),
        analysis: aiAnalysisText,
        email: sysEmail
      };

      db.items.unshift(newItem); // New submissions to the front
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");

      // Save client IP cooldown to prevent automated bot flood
      ipCooldowns.set(ip, now);

      // Trigger automatic background notification (non-blocking)
      sendGoalNotification(newItem).catch((err) => {
        console.error("Failed to run background student registration notification:", err);
      });

      res.status(201).json(newItem);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to persist goal" });
    }
  });

  // API 3: EXPORT Database
  app.get("/api/goals/export", (req, res) => {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return res.status(404).json({ error: "No storage file found" });
      }
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=ai-goal-galaxy-export.json");
      const fileStream = fs.createReadStream(DB_FILE);
      fileStream.pipe(res);
    } catch (err) {
      res.status(500).json({ error: "Export failed" });
    }
  });

  // API 3.5: DOWNLOAD Excel/CSV of Student Aliases AND Target Lists
  app.get("/api/goals/download-students-csv", (req, res) => {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return res.status(404).send("Chưa có danh sách đăng ký nào.");
      }
      const db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      const items: GoalItem[] = db.items || [];
      
      // UTF-8 BOM to display accented Vietnamese correctly in Excel
      let csvContent = "\uFEFF";
      csvContent += "STT,Bút danh / Học viên,Email Google,Chòm sao / Lĩnh vực,Ước mơ & Mục tiêu học,Thời gian đăng ký\n";
      
      items.forEach((item, index) => {
        const cleanName = (item.name || "").replace(/"/g, '""');
        const cleanEmail = (item.email || "Không liên kết Google").replace(/"/g, '""');
        const cleanCluster = (item.clusterLabel || "").replace(/"/g, '""');
        const cleanGoal = (item.goal || "").replace(/"/g, '""').replace(/\s+/g, ' ');
        const cleanDate = item.createdAt || "";
        csvContent += `${index + 1},"${cleanName}","${cleanEmail}","${cleanCluster}","${cleanGoal}","${cleanDate}"\n`;
      });
      
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=danh_sach_hoc_vien_ai_galaxy.csv");
      res.status(200).send(csvContent);
    } catch (err) {
      console.error("Export CSV error:", err);
      res.status(500).send("Có lỗi xảy ra khi xuất danh sách.");
    }
  });

  // API 4: SEED (Additional route to manually reset or reseed if needed)
  app.post("/api/goals/reset", (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.unlinkSync(DB_FILE);
      }
      initializeDatabase();
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      res.json({ message: "Database reseeded successfully", data: JSON.parse(raw) });
    } catch (err) {
      res.status(500).json({ error: "Reset failed" });
    }
  });

  // Serve Vite in Developer, serve static files in Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched successfully at http://localhost:${PORT}`);
  });
}

startServer();
