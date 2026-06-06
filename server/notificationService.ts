import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { GoalItem } from "../src/types";

/**
 * Sends a real-time notification to Telegram or Email when a new goal/idea is submitted.
 * It dynamically reads the configured secret variables from process.env.
 */
export async function sendGoalNotification(item: GoalItem): Promise<void> {
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  // Compute total unique students count in real-time
  let totalUniqueStudentsCount = 1;
  const DB_FILE = path.join(process.cwd(), "goals.json");
  if (fs.existsSync(DB_FILE)) {
    try {
      const db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      const items = db.items || [];
      const uniqueStudentsSet = new Set(
        items.map((g: any) => (g.email && g.email.trim() ? g.email.trim().toLowerCase() : g.name.trim().toLowerCase()))
      );
      totalUniqueStudentsCount = uniqueStudentsSet.size;
    } catch (e) {
      console.error("Failed to read unique student count for notification:", e);
    }
  }

  // 1. TELEGRAM INTEGRATION
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;

  if (tgToken && tgChatId) {
    try {
      console.log(`Sending instant Telegram notification for learn goals of "${item.name}"...`);
      
      const message = 
`🚀 *CÓ HỌC VIÊN ĐĂNG KÝ Ý TƯỞNG MỚI!*

👤 *Bút danh:* ${item.name}
📧 *Email Google:* ${item.email || "Không liên kết Google"}
👥 *Tổng số học viên độc bản:* ${totalUniqueStudentsCount} học viên
🌌 *Nhóm chòm sao:* ${item.clusterLabel}
🎯 *Ý tưởng & Mục tiêu:*
_"${item.goal}"_

🤖 *Phân tích từ AI:*
${item.analysis}

📥 *Tải danh sách học viên & mục tiêu (CSV):*
${appUrl}/api/goals/download-students-csv

🔗 [Truy cập Galaxy Map](${appUrl})`;

      const url = `https://api.telegram.org/bot${tgToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: false
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Failed to send Telegram notification response:", errText);
      } else {
        console.log("Telegram notification sent successfully!");
      }
    } catch (tgError) {
      console.error("Error sending Telegram notification:", tgError);
    }
  } else {
    console.log("Telegram tokens not fully configured in environment variables. Skipping Telegram telegram-routing.");
  }

  // 2. SMTP EMAIL INTEGRATION
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const receiverEmail = process.env.NOTIFICATION_RECEIVER_EMAIL || smtpUser;

  if (smtpUser && smtpPass && receiverEmail) {
    try {
      console.log(`Sending SMTP notification Email to <${receiverEmail}>...`);
      
      const host = process.env.SMTP_HOST || "smtp.gmail.com";
      const port = parseInt(process.env.SMTP_PORT || "465", 10);

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // True for port 465, false for 587
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #1e293b; border-radius: 16px; background-color: #090d16; color: #f8fafc; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header decorative style -->
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1e293b;">
            <p style="font-size: 28px; font-weight: 800; color: #818cf8; margin: 0; tracking-wide: 1px;">🚀 AI BUILDER GALAXY</p>
            <p style="font-size: 13px; color: #94a3b8; margin: 5px 0 0 0; text-transform: uppercase; font-family: monospace;">Ghi nhận mẫu đăng ký ý tưởng mới</p>
          </div>
          
          <div style="padding-top: 20px;">
            <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">Chào bạn,</p>
            <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">Một học viên mới trong khóa học của bạn vừa chia sẻ mục tiêu & ý tưởng cụ thể lên Bản đồ Ngân hà:</p>
            
            <!-- Student card info -->
            <div style="background: rgba(17, 24, 39, 0.6); padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #334155;">
              <p style="margin: 0 0 12px 0; font-size: 16px; color: #f8fafc;">
                <strong>👤 Tên học viên:</strong> 
                <span style="color: #38bdf8; font-weight: bold; font-size: 17px; margin-left: 6px;">${item.name}</span>
              </p>
              
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #f8fafc;">
                <strong>🌌 Chòm sao nhóm:</strong> 
                <span style="background: #1e1b4b; color: #e0e7ff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; border: 1px solid #4338ca; display: inline-block; margin-left: 6px; text-transform: uppercase; font-family: monospace;">
                  ${item.clusterLabel}
                </span>
              </p>
              
              <p style="margin: 15px 0 6px 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; font-weight: bold; font-family: monospace; letter-spacing: 0.5px;">🎯 Ý tưởng & Mục tiêu chi tiết:</p>
              <div style="background: #020617; padding: 14px; border-left: 4px solid #818cf8; border-radius: 0 8px 8px 0; margin-top: 5px;">
                <p style="font-style: italic; color: #e2e8f0; margin: 0; line-height: 1.6; font-size: 15px;">"${item.goal}"</p>
              </div>
            </div>

            <!-- AI analysis part -->
            <div style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #4f46e5;">
              <p style="margin: 0 0 8px 0; color: #a5b4fc; font-weight: 800; font-size: 14px; text-transform: uppercase; tracking-wider: 1px; font-family: monospace; display: flex; items-center: center;">
                🤖 Hệ thống AI phân tích:
              </p>
              <p style="margin: 0; font-size: 14px; color: #e2e8f0; line-height: 1.6; white-space: pre-wrap;">${item.analysis}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #1e293b;">
            <a href="${appUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; transition: all 0.2s; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.45);">
              🚀 Mở Bản Đồ Ngân Hà 3D
            </a>
            <p style="font-size: 11px; color: #475569; margin: 20px 0 0 0;">
              Hệ thống gửi thư tự động từ AI Galaxy Space Hub Portal. Vui lòng cấu hình các trường SMTP_USER / SMTP_PASS trong Settings để quản lý gửi nhận.
            </p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"AI Galaxy Hub" <${smtpUser}>`,
        to: receiverEmail,
        subject: `🚀 [Ý TƯỞNG MỚI] Học viên "${item.name}" vừa thắp sáng Chòm Sao "${item.clusterLabel}"!`,
        html: htmlContent
      });

      console.log("SMTP Email notification sent successfully!");
    } catch (emailError) {
      console.error("Error sending SMTP email notification:", emailError);
    }
  } else {
    console.log("SMTP login parameters not fully configured in environment variables. Skipping Email notification routing.");
  }
}
