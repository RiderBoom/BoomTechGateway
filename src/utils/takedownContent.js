import { updateDoc, deleteDoc, addDoc, doc, collection } from 'firebase/firestore';

const CONTENT_COLLECTIONS = {
  chat_message: 'community_chat',
  product:      'products',
};

/**
 * ดำเนินการ Take-down (ซ่อน/ลบ/คืนสถานะ) และบันทึก Audit Log ก่อนทุกครั้ง
 * เพื่อให้เป็นไปตาม พ.ร.บ. คอมพิวเตอร์ มาตรา 15 และหลักฐานทางกฎหมาย
 *
 * @param {object} db - Firestore instance
 * @param {string} appId - App ID
 * @param {object} params
 *   content       — object ที่ถูก take-down: { id, contentType, text, sender, walletAddress }
 *   action        — 'hide' | 'delete' | 'restore'
 *   legalReason   — ID ของเหตุผลทางกฎหมาย
 *   legalReasonLabel — ป้ายชื่อแสดงผล
 *   note          — หมายเหตุแอดมิน
 *   actionBy      — wallet address ของแอดมิน
 *   reportId      — ID ของ report ที่เกี่ยวข้อง (optional)
 *
 * @returns {string} Audit log document ID
 */
export async function takedownContent(db, appId, {
  content, action, legalReason, legalReasonLabel, note = '', actionBy, reportId = null,
}) {
  if (!db || !content?.id) throw new Error('ข้อมูลไม่ครบถ้วน');

  const contentType = content.contentType || content.type || 'chat_message';
  const collectionName = CONTENT_COLLECTIONS[contentType] ?? 'community_chat';

  // บันทึก Audit Log ก่อนดำเนินการเสมอ (immutable record)
  const logRef = await addDoc(
    collection(db, 'artifacts', appId, 'public', 'data', 'takedown_log'),
    {
      contentId:       content.id,
      contentType,
      contentSnapshot: (content.text || content.content || '').substring(0, 500),
      contentSender:   content.sender || content.targetSender || '-',
      contentWallet:   content.walletAddress || content.targetWallet || null,
      action,
      legalReason,
      legalReasonLabel,
      note,
      actionBy:        actionBy || 'admin',
      actionAt:        Date.now(),
      reportId,
    }
  );

  const contentRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, content.id);

  if (action === 'hide') {
    await updateDoc(contentRef, {
      contentStatus:  'hidden',
      takedownBy:     actionBy,
      takedownAt:     Date.now(),
      takedownReason: legalReason,
      takedownLogId:  logRef.id,
    });
  } else if (action === 'delete') {
    // Hard delete — audit log already persisted above
    await deleteDoc(contentRef);
  } else if (action === 'restore') {
    await updateDoc(contentRef, {
      contentStatus: 'active',
      restoredBy:    actionBy,
      restoredAt:    Date.now(),
    });
  }

  // อัปเดตสถานะ report ที่เกี่ยวข้อง (ถ้ามี)
  if (reportId) {
    try {
      await updateDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'reports', reportId),
        { status: 'resolved', resolvedAction: action, resolvedBy: actionBy, resolvedAt: Date.now() }
      );
    } catch { /* report might have been deleted already */ }
  }

  return logRef.id;
}
