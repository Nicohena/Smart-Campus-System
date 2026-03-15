import { Request, Response } from 'express';
import Complaint from '../models/Complaint';
import Issue from '../models/Issue';
import DormInspection from '../models/DormInspection';
import Clearance from '../models/Clearance';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/analytics/dashboard
// Basic dashboard counts for admins/staff
export const getDashboardAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const [complaints, issues, inspections, clearances] = await Promise.all([
      Complaint.countDocuments(),
      Issue.countDocuments(),
      DormInspection.countDocuments(),
      Clearance.countDocuments()
    ]);

    sendSuccess(res, 'Dashboard analytics fetched', {
      complaints,
      issues,
      inspections,
      clearances
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Dashboard analytics error:', error);
    sendError(res, 'Could not fetch dashboard analytics');
  }
};

// GET /api/analytics/issues
// Issues analytics (by type, status, and dorm block)
export const getIssuesAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const [byType, byStatus, byBlock] = await Promise.all([
      Issue.aggregate([{ $group: { _id: '$issueType', count: { $sum: 1 } } }]).sort({
        count: -1
      }),
      Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).sort({
        count: -1
      }),
      Issue.aggregate([
        { $match: { block: { $exists: true, $ne: null } } },
        { $group: { _id: '$block', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    sendSuccess(res, 'Issue analytics fetched', { byType, byStatus, byBlock });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Issues analytics error:', error);
    sendError(res, 'Could not fetch issue analytics');
  }
};

// GET /api/analytics/complaints
// Complaints analytics (by category, status, priority)
export const getComplaintsAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const [byCategory, byStatus, byPriority] = await Promise.all([
      Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]).sort({
        count: -1
      }),
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).sort({
        count: -1
      }),
      Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]).sort({
        count: -1
      })
    ]);

    sendSuccess(res, 'Complaint analytics fetched', { byCategory, byStatus, byPriority });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Complaints analytics error:', error);
    sendError(res, 'Could not fetch complaint analytics');
  }
};

// GET /api/analytics/ai-insights
// Generate AI insights using DeepSeek
export const getAiInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const [issues, complaints, inspections, clearances] = await Promise.all([
      Issue.aggregate([
        { $group: { _id: '$issueType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      DormInspection.aggregate([
        { $group: { _id: '$approved', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Clearance.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const summary = [
      `Issues by type: ${JSON.stringify(issues)}`,
      `Complaints by category: ${JSON.stringify(complaints)}`,
      `Dorm inspections approved vs rejected: ${JSON.stringify(inspections)}`,
      `Clearance status breakdown: ${JSON.stringify(clearances)}`
    ].join('\n');

    sendSuccess(res, 'AI insights summary prepared', { insights: [], summary });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('AI insights error:', error);
    sendError(res, 'Could not generate AI insights', 502);
  }
};
