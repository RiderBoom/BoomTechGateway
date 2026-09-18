import { addDoc, collection } from 'firebase/firestore';
import { EMAILJS_CONFIG, ADMIN_EMAIL } from '../constants';

/**
 * บันทึก report ลง Firestore แล้วส่ง email แจ้งแอดมินผ่าน EmailJS REST API
 * การส่ง email เป็น non-blocking — ถ้าล้มเหลวจะไม่กระทบการบันทึก Firestore
 *
 * ตั้งค่า EmailJS:
 *  1. สมัครที่ https://www.emailjs.com (Free tier: 200 emails/month)
 *  2. สร้าง Email Service (Gmail / SMTP)
 *  3. สร้าง Email Template พร้อม variables ด้านล่าง
 *  4. กรอก serviceId, templateId, publicKey ใน constants.js
 *
 * Template variables ที่ใช้ได้:
 *  {{to_email}}, {{report_id}}, {{report_reason}}, {{report_details}},
 *  {{reported_by}}, {{target_type}}, {{target_content}}, {{target_sender}},
 *  {{report_time}}, {{site_url}}
 */
export async function submitReport(db, appId, reportData) {
  if (!db) throw new Error('Database ไม่พร้อมใช้งาน');

  const docRef = await addDoc(
    collection(db, 'artifacts', appId, 'public', 'data', 'reports'),
    { ...reportData, status: 'pending', timestamp: Date.now() }
  );

  const { serviceId, templateId, publicKey } = EMAILJS_CONFIG;
  if (serviceId && templateId && publicKey) {
    fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: ADMIN_EMAIL,
          report_id: docRef.id,
          report_reason: reportData.reasonLabel || reportData.reason,
          report_details: reportData.details || '(ไม่มีรายละเอียดเพิ่มเติม)',
          reported_by: reportData.reportedBy || 'Guest',
          target_type: reportData.targetType || '-',
          target_content: (reportData.targetContent || '').substring(0, 300),
          target_sender: reportData.targetSender || '-',
          report_time: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
          site_url: window.location.origin,
        },
      }),
    }).catch(err => console.warn('[submitReport] Email notification failed (non-critical):', err.message));
  }

  return docRef.id;
}
