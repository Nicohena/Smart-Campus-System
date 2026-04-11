import { Request, Response } from 'express';
import mongoose from 'mongoose';
import LostID, { ILostID, LostIdReason, LostIdStatus, HistoryEntry } from '../models/LostID';
import Notification from '../models/Notification';
import User from '../models/User';
import { sendSuccess, sendError, isValidId } from '../utils/response';
import { UserRole } from '../utils/roles';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Base replacement fee per reason type (ETB) */
const BASE_FEE: Record<LostIdReason, number> = {
  lost:    100,
  stolen:   75,
  damaged:  50,
  other:    75,
};

/** Extra penalty for each repeat report beyond the first */
const PENALTY_PER_REPEAT = 50;

/** Reports per student that triggers fraud flag */
const FRAUD_THRESHOLD = 3;

/** Days student has to pay before request expires */
const PAYMENT_DEADLINE_DAYS = 7;

/** Days a temporary ID remains valid */
const TEMP_ID_EXPIRY_DAYS = 14;

/**
 * Which roles may reject at each status.
 * Roles not listed cannot reject at that status.
 */
const REJECT_ALLOWED_AT: Partial<Record<LostIdStatus, UserRole[]>> = {
  blocked:               ['security', 'registrar'],
  replacement_requested: ['security', 'registrar'],
  payment_pending:       ['registrar'],
  payment_submitted:     ['registrar'],
  payment_verified:      ['registrar'],
  temporary_issued:      ['registrar'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcFee = (reason: LostIdReason, repeatCount: number) => {
  const base    = BASE_FEE[reason];
  const penalty = Math.max(0, repeatCount - 1) * PENALTY_PER_REPEAT;
  return { base, penalty, total: base + penalty };
};

const addHistory = (
  record: ILostID,
  action: string,
  actorId: string,
  actorRole: string,
  remarks?: string
) => {
  const entry: HistoryEntry = {
    action,
    actorId: new mongoose.Types.ObjectId(actorId),
    actorRole,
    timestamp: new Date(),
    remarks,
  };
  record.history.push(entry);
};

const notify = async (
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  relatedId: string
) => {
  try {
    await Notification.create({
      user:         new mongoose.Types.ObjectId(userId),
      title,
      message,
      type,
      relatedId:    new mongoose.Types.ObjectId(relatedId),
      relatedModel: 'LostID',
    });
  } catch {
    // Non-critical; don't fail the main operation
  }
};

const findRecord = async (id: string, res: Response): Promise<ILostID | null> => {
  if (!isValidId(id)) { sendError(res, 'Invalid request ID', 400); return null; }
  const rec = await LostID.findById(id);
  if (!rec) { sendError(res, 'Lost ID request not found', 404); return null; }
  return rec;
};

/** Auto-expire payment deadline on every read */
const expireIfOverdue = async (record: ILostID): Promise<boolean> => {
  if (
    record.status === 'payment_pending' &&
    record.paymentDeadline &&
    new Date() > record.paymentDeadline
  ) {
    record.status = 'expired';
    addHistory(record, 'expired', record.student.toString(), 'system', 'Payment deadline passed');
    await record.save();
    return true;
  }
  return false;
};

// ─── Step 1: Student reports lost ID (auto-blocked immediately) ───────────────
// POST /api/lost-id/report
export const reportLostId = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId   = req.user?.id;
    const actorRole = req.user?.role ?? 'student';
    if (!userId) { sendError(res, 'Unauthorized', 401); return; }

    const { reason } = req.body as { reason?: LostIdReason };
    if (!reason || !['lost','damaged','stolen','other'].includes(reason)) {
      sendError(res, 'A valid reason is required (lost | damaged | stolen | other)', 400);
      return;
    }

    // One active request at a time
    const active = await LostID.findOne({
      student: userId,
      status: { $nin: ['completed', 'expired', 'rejected'] },
    });
    if (active) {
      sendError(res, 'You already have an active lost ID request', 409);
      return;
    }

    const userDoc = await User.findById(userId).select('studentId');
    if (!userDoc) { sendError(res, 'User not found', 404); return; }

    // Count previous requests to calculate repeat count & fraud flag
    const previousCount = await LostID.countDocuments({ student: userId });
    const repeatCount   = previousCount + 1;
    const { base, penalty, total } = calcFee(reason, repeatCount);
    const isFraudSuspected = repeatCount >= FRAUD_THRESHOLD;

    const record = await LostID.create({
      student:          userId,
      studentId:        userDoc.studentId,
      reason,
      status:           'blocked',     // Auto-blocked on report
      paymentAmount:    total,
      penaltyAmount:    penalty,
      repeatCount,
      isFraudSuspected,
      history: [{
        action:    'reported_and_blocked',
        actorId:   new mongoose.Types.ObjectId(userId),
        actorRole,
        timestamp: new Date(),
        remarks:   `Reason: ${reason}. Fee: ${total} ETB (base ${base} + penalty ${penalty}).${isFraudSuspected ? ' ⚠ Fraud suspected.' : ''}`,
      }],
    });

    await notify(userId, 'Lost ID Reported', `Your ID has been blocked. Reason: ${reason}. Replacement fee: ${total} ETB.`, 'warning', record._id.toString());

    if (isFraudSuspected) {
      await notify(userId, '⚠ Fraud Alert', `This is your ${repeatCount}${repeatCount === 2 ? 'nd' : 'th'} lost ID report. A penalty of ${penalty} ETB has been added.`, 'error', record._id.toString());
    }

    sendSuccess(res, 'Lost ID reported. Your ID has been blocked immediately.', { record }, 201);
  } catch (err) {
    console.error('Report lost ID error:', err);
    sendError(res, 'Could not report lost ID');
  }
};

// ─── Step 2: Student requests replacement ─────────────────────────────────────
// PATCH /api/lost-id/:id/request-replacement
export const requestReplacement = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId    = req.user?.id;
    const actorRole = req.user?.role ?? 'student';
    if (!userId) { sendError(res, 'Unauthorized', 401); return; }

    const record = await findRecord(req.params.id, res);
    if (!record) return;

    if (record.student.toString() !== userId) { sendError(res, 'Forbidden', 403); return; }
    if (record.status !== 'blocked') {
      sendError(res, 'ID must be in blocked status to request replacement', 400); return;
    }

    record.status = 'replacement_requested';
    addHistory(record, 'replacement_requested', userId, actorRole);
    await record.save();

    await notify(userId, 'Replacement Requested', `Your replacement request has been submitted. Await payment instructions from the registrar. Fee: ${record.paymentAmount} ETB.`, 'info', record._id.toString());

    sendSuccess(res, 'Replacement requested. Await payment instructions.', { record });
  } catch (err) {
    console.error('Request replacement error:', err);
    sendError(res, 'Could not request replacement');
  }
};

// ─── Step 3: Registrar sets up payment (can override fee) ────────────────────
// PATCH /api/lost-id/:id/request-payment
export const requestPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId   = req.user?.id;
    const actorRole = req.user?.role ?? 'registrar';
    if (!actorId) { sendError(res, 'Unauthorized', 401); return; }

    const record = await findRecord(req.params.id, res);
    if (!record) return;

    if (record.status !== 'replacement_requested') {
      sendError(res, `Cannot request payment at status '${record.status}'`, 400); return;
    }

    // Optional override amount by registrar
    const { overrideAmount } = req.body as { overrideAmount?: number };
    if (overrideAmount !== undefined && Number(overrideAmount) > 0) {
      record.paymentAmount = Number(overrideAmount);
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + PAYMENT_DEADLINE_DAYS);

    record.status             = 'payment_pending';
    record.paymentDeadline    = deadline;
    record.paymentRequestedAt = new Date();
    addHistory(record, 'payment_requested', actorId, actorRole, `Amount: ${record.paymentAmount} ETB. Deadline: ${deadline.toLocaleDateString()}`);
    await record.save();

    await notify(record.student.toString(), 'Payment Required', `Please pay ${record.paymentAmount} ETB by ${deadline.toLocaleDateString()}. Submit your receipt reference after payment.`, 'warning', record._id.toString());

    sendSuccess(res, `Payment of ${record.paymentAmount} ETB requested. Deadline: ${deadline.toLocaleDateString()}.`, { record });
  } catch (err) {
    console.error('Request payment error:', err);
    sendError(res, 'Could not set up payment');
  }
};

// ─── Step 4: Student submits payment receipt ──────────────────────────────────
// PATCH /api/lost-id/:id/submit-payment
export const submitPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId    = req.user?.id;
    const actorRole = req.user?.role ?? 'student';
    if (!userId) { sendError(res, 'Unauthorized', 401); return; }

    const record = await findRecord(req.params.id, res);
    if (!record) return;

    if (record.student.toString() !== userId) { sendError(res, 'Forbidden', 403); return; }

    // Auto-expire if deadline passed
    if (await expireIfOverdue(record)) {
      sendError(res, 'Payment deadline has passed. Please resubmit a new request.', 400); return;
    }

    if (record.status !== 'payment_pending') {
      sendError(res, 'No pending payment for this request', 400); return;
    }

    const { paymentReference } = req.body as { paymentReference?: string };
    if (!paymentReference?.trim()) {
      sendError(res, 'Payment reference / receipt number is required', 400); return;
    }

    record.status             = 'payment_submitted';
    record.paymentReference   = paymentReference.trim();
    record.paymentSubmittedAt = new Date();
    addHistory(record, 'payment_submitted', userId, actorRole, `Reference: ${paymentReference.trim()}`);
    await record.save();

    await notify(userId, 'Receipt Submitted', 'Your payment receipt has been submitted. Awaiting registrar verification.', 'info', record._id.toString());

    sendSuccess(res, 'Payment receipt submitted. Awaiting verification.', { record });
  } catch (err) {
    console.error('Submit payment error:', err);
    sendError(res, 'Could not submit payment');
  }
};

// ─── Step 5: Registrar verifies payment ──────────────────────────────────────
// PATCH /api/lost-id/:id/verify-payment
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId   = req.user?.id;
    const actorRole = req.user?.role ?? 'registrar';
    if (!actorId) { sendError(res, 'Unauthorized', 401); return; }

    const record = await findRecord(req.params.id, res);
    if (!record) return;

    if (record.status !== 'payment_submitted') {
      sendError(res, `Cannot verify payment at status '${record.status}'`, 400); return;
    }

    record.status           = 'payment_verified';
    record.paymentVerifiedAt = new Date();
    addHistory(record, 'payment_verified', actorId, actorRole, `Reference confirmed: ${record.paymentReference}`);
    await record.save();

    await notify(record.student.toString(), 'Payment Verified', 'Your payment has been confirmed. The registrar will now issue your temporary ID.', 'success', record._id.toString());

    sendSuccess(res, 'Payment verified. Proceed to issue temporary ID.', { record });
  } catch (err) {
    console.error('Verify payment error:', err);
    sendError(res, 'Could not verify payment');
  }
};

// ─── Step 6: Registrar issues temporary ID ────────────────────────────────────
// PATCH /api/lost-id/:id/issue-temporary
export const issueTemporaryId = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId   = req.user?.id;
    const actorRole = req.user?.role ?? 'registrar';
    if (!actorId) { sendError(res, 'Unauthorized', 401); return; }

    const record = await findRecord(req.params.id, res);
    if (!record) return;

    if (record.status !== 'payment_verified') {
      sendError(res, 'Payment must be verified before issuing a temporary ID', 400); return;
    }

    const { temporaryIdNumber } = req.body as { temporaryIdNumber?: string };
    const issuedAt  = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TEMP_ID_EXPIRY_DAYS);

    const idNumber = temporaryIdNumber?.trim() || `TEMP-${record.studentId}-${Date.now()}`;

    record.status      = 'temporary_issued';
    record.temporaryId = { idNumber, issuedAt, expiresAt, isActive: true };
    addHistory(record, 'temporary_id_issued', actorId, actorRole, `Temp ID: ${idNumber}. Expires: ${expiresAt.toLocaleDateString()}`);
    await record.save();

    await notify(record.student.toString(), '🪪 Temporary ID Issued', `Your temporary ID is ready: ${idNumber}. Valid until ${expiresAt.toLocaleDateString()}. Collect it from the registrar office.`, 'success', record._id.toString());

    sendSuccess(res, `Temporary ID issued: ${idNumber}`, { record });
  } catch (err) {
    console.error('Issue temporary ID error:', err);
    sendError(res, 'Could not issue temporary ID');
  }
};

// ─── Step 7: Registrar issues permanent ID ────────────────────────────────────
// PATCH /api/lost-id/:id/issue-permanent
export const issuePermanentId = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId   = req.user?.id;
    const actorRole = req.user?.role ?? 'registrar';
    if (!actorId) { sendError(res, 'Unauthorized', 401); return; }

    const record = await findRecord(req.params.id, res);
    if (!record) return;

    if (record.status !== 'temporary_issued') {
      sendError(res, 'Temporary ID must be issued before permanent ID', 400); return;
    }

    const { permanentIdNumber } = req.body as { permanentIdNumber?: string };
    const permId = permanentIdNumber?.trim() || `PERM-${record.studentId}-${Date.now()}`;

    record.status            = 'completed';
    record.permanentIdNumber = permId;
    record.completedAt       = new Date();
    if (record.temporaryId) record.temporaryId.isActive = false;   // deactivate temp ID
    addHistory(record, 'permanent_id_issued', actorId, actorRole, `Permanent ID: ${permId}`);
    await record.save();

    await notify(record.student.toString(), '✅ Permanent ID Ready', `Congratulations! Your permanent ID is ready: ${permId}. Collect it from the registrar office.`, 'success', record._id.toString());

    sendSuccess(res, `Permanent ID issued: ${permId}. Request completed.`, { record });
  } catch (err) {
    console.error('Issue permanent ID error:', err);
    sendError(res, 'Could not issue permanent ID');
  }
};

// ─── Reject ───────────────────────────────────────────────────────────────────
// PATCH /api/lost-id/:id/reject
export const rejectLostIdRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId   = req.user?.id;
    const actorRole = req.user?.role as UserRole;
    if (!actorId) { sendError(res, 'Unauthorized', 401); return; }

    const record = await findRecord(req.params.id, res);
    if (!record) return;

    if (['completed','expired','rejected'].includes(record.status)) {
      sendError(res, 'Cannot reject a request in its current state', 400); return;
    }

    const allowed = REJECT_ALLOWED_AT[record.status] ?? [];
    if (!allowed.includes(actorRole)) {
      sendError(res, `Your role (${actorRole}) cannot reject a request at status '${record.status}'`, 403); return;
    }

    const { remarks } = req.body as { remarks?: string };
    if (!remarks?.trim()) { sendError(res, 'Rejection reason is required', 400); return; }

    record.rejectedFromStatus = record.status;
    record.status             = 'rejected';
    record.rejectionReason    = remarks.trim();
    record.rejectedAt         = new Date();
    addHistory(record, 'rejected', actorId, actorRole, remarks.trim());
    await record.save();

    await notify(record.student.toString(), 'Request Rejected', `Your lost ID request has been rejected. Reason: ${remarks.trim()}. You may resubmit if applicable.`, 'error', record._id.toString());

    sendSuccess(res, 'Request rejected', { record });
  } catch (err) {
    console.error('Reject error:', err);
    sendError(res, 'Could not reject request');
  }
};

// ─── Resubmit (from rejected) ─────────────────────────────────────────────────
// PATCH /api/lost-id/:id/resubmit
export const resubmitRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId    = req.user?.id;
    const actorRole = req.user?.role ?? 'student';
    if (!userId) { sendError(res, 'Unauthorized', 401); return; }

    const record = await findRecord(req.params.id, res);
    if (!record) return;

    if (record.student.toString() !== userId) { sendError(res, 'Forbidden', 403); return; }
    if (record.status !== 'rejected') { sendError(res, 'Only rejected requests can be resubmitted', 400); return; }

    // Roll back to a recoverable state based on where rejection happened
    const paymentStages: LostIdStatus[] = ['payment_pending','payment_submitted','payment_verified'];
    const rollbackTo: LostIdStatus = paymentStages.includes(record.rejectedFromStatus as LostIdStatus)
      ? 'payment_pending'
      : 'replacement_requested';

    record.status            = rollbackTo;
    record.rejectionReason   = undefined;
    record.rejectedAt        = undefined;
    record.rejectedFromStatus = undefined;
    // Reset payment fields if rolling back to payment_pending
    if (rollbackTo === 'payment_pending') {
      record.paymentReference   = undefined;
      record.paymentSubmittedAt = undefined;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + PAYMENT_DEADLINE_DAYS);
      record.paymentDeadline = deadline;
    }
    addHistory(record, 'resubmitted', userId, actorRole);
    await record.save();

    await notify(userId, 'Request Resubmitted', `Your request has been resubmitted and is back at status: ${rollbackTo.replace(/_/g,' ')}.`, 'info', record._id.toString());

    sendSuccess(res, `Request resubmitted. Status: ${rollbackTo.replace(/_/g,' ')}.`, { record });
  } catch (err) {
    console.error('Resubmit error:', err);
    sendError(res, 'Could not resubmit request');
  }
};

// ─── Bulk approve payment verification (Registrar) ────────────────────────────
// PATCH /api/lost-id/bulk-verify
export const bulkVerifyPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId   = req.user?.id;
    const actorRole = req.user?.role ?? 'registrar';
    if (!actorId) { sendError(res, 'Unauthorized', 401); return; }

    const { ids } = req.body as { ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      sendError(res, 'ids array is required', 400); return;
    }

    const results: { id: string; success: boolean; error?: string }[] = [];
    for (const id of ids) {
      if (!isValidId(id)) { results.push({ id, success: false, error: 'Invalid ID' }); continue; }
      const rec = await LostID.findById(id);
      if (!rec || rec.status !== 'payment_submitted') {
        results.push({ id, success: false, error: 'Not in payment_submitted state' }); continue;
      }
      rec.status            = 'payment_verified';
      rec.paymentVerifiedAt = new Date();
      addHistory(rec, 'payment_verified_bulk', actorId, actorRole);
      await rec.save();
      void notify(rec.student.toString(), 'Payment Verified', 'Your payment has been confirmed. Temporary ID will be issued shortly.', 'success', id);
      results.push({ id, success: true });
    }

    sendSuccess(res, 'Bulk verification complete', { results });
  } catch (err) {
    console.error('Bulk verify error:', err);
    sendError(res, 'Could not complete bulk verification');
  }
};

// ─── Read: student ────────────────────────────────────────────────────────────
export const getMyLostIdRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { sendError(res, 'Unauthorized', 401); return; }

    const requests = await LostID.find({ student: userId }).sort({ createdAt: -1 });

    // Auto-expire overdue requests
    for (const r of requests) {
      await expireIfOverdue(r);
    }
    // Also check temp ID expiry
    for (const r of requests) {
      if (r.temporaryId?.isActive && new Date() > r.temporaryId.expiresAt) {
        r.temporaryId.isActive = false;
        await r.save();
      }
    }

    sendSuccess(res, 'Lost ID requests fetched', { requests });
  } catch (err) {
    console.error('Get my lost ID requests error:', err);
    sendError(res, 'Could not fetch requests');
  }
};

// ─── Read: staff ──────────────────────────────────────────────────────────────
export const getAllLostIdRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip  = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const filter: Record<string,unknown> = {};
    if (status) filter.status = status;

    // Auto-expire overdue requests before returning
    const overdue = await LostID.find({
      status: 'payment_pending',
      paymentDeadline: { $lt: new Date() },
    });
    for (const r of overdue) {
      r.status = 'expired';
      addHistory(r, 'expired', r.student.toString(), 'system', 'Payment deadline passed');
      await r.save();
    }

    const [requests, total] = await Promise.all([
      LostID.find(filter)
        .populate('student', 'name studentId email role department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LostID.countDocuments(filter),
    ]);

    sendSuccess(res, 'Lost ID requests fetched', { requests, total, page, limit });
  } catch (err) {
    console.error('Get all lost ID requests error:', err);
    sendError(res, 'Could not fetch requests');
  }
};

// ─── Fraud summary (analytics) ────────────────────────────────────────────────
export const getLostIdAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [byReason, byStatus, fraudCases, repeatOffenders] = await Promise.all([
      LostID.aggregate([{ $group: { _id: '$reason', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      LostID.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      LostID.countDocuments({ isFraudSuspected: true }),
      LostID.aggregate([
        { $match: { repeatCount: { $gt: 1 } } },
        { $group: { _id: '$studentId', times: { $max: '$repeatCount' } } },
        { $sort: { times: -1 } },
        { $limit: 10 },
      ]),
    ]);
    sendSuccess(res, 'Lost ID analytics', { byReason, byStatus, fraudCases, repeatOffenders });
  } catch (err) {
    console.error('Lost ID analytics error:', err);
    sendError(res, 'Could not fetch analytics');
  }
};
