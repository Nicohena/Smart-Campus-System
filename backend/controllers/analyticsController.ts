import { Request, Response } from 'express';
import Complaint from '../models/Complaint';
import Issue from '../models/Issue';
import DormInspection from '../models/DormInspection';
import Clearance from '../models/Clearance';
import User from '../models/User';
import { generateCampusInsights } from '../services/aiAnalyticsService';
import { sendSuccess, sendError } from '../utils/response';

const resolveDepartmentName = async (userId?: string, departmentFromToken?: string): Promise<string | null> => {
  if (departmentFromToken?.trim()) {
    return departmentFromToken.trim();
  }

  if (!userId) {
    console.log('resolveDepartmentName: No userId provided');
    return null;
  }

  const user = await User.findById(userId).select('department');
  console.log('resolveDepartmentName: Found user in DB:', user);
  return user?.department?.trim() || null;
};

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

    const insights = await generateCampusInsights(summary);

    sendSuccess(res, 'AI insights generated', { insights });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('AI insights error:', error);
    sendError(res, 'Could not generate AI insights', 502);
  }
};

// GET /api/analytics/department
export const getDepartmentAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const departmentName = await resolveDepartmentName(req.user?.id, req.user?.department);
    if (!departmentName) {
      sendError(res, 'No department assigned', 400);
      return;
    }

    // 1. Total students in department
    const students = await User.find({ role: 'student', department: departmentName }).select('_id year');
    const totalStudents = students.length;
    const studentIds = students.map(s => s._id);

    // 2. By year
    const studentsByYear = students.reduce((acc: any, student) => {
      const year = student.year || 'Unknown';
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});
    const byYear = Object.keys(studentsByYear).map(key => ({ _id: key, count: studentsByYear[key] }));

    // 3. active issues/complaints
    const [issues, complaints, clearances] = await Promise.all([
      Issue.distinct('student', { student: { $in: studentIds }, status: { $ne: 'resolved' } }),
      Complaint.distinct('student', { student: { $in: studentIds }, status: { $ne: 'resolved' } }),
      Clearance.find({ student: { $in: studentIds } })
    ]);

    const activeIssuesOrComplaintsStudents = new Set([...issues.map(id => id.toString()), ...complaints.map(id => id.toString())]).size;

    // 4. Clearance rate
    let completedClearances = 0;
    if (clearances.length > 0) {
      completedClearances = clearances.filter(c => c.status === 'approved').length;
    }
    const clearanceCompletionRate = totalStudents > 0 ? ((completedClearances / totalStudents) * 100).toFixed(1) : 0;

    sendSuccess(res, 'Department analytics fetched', {
      totalStudents,
      byYear,
      activeIssuesOrComplaintsStudents,
      clearanceCompletionRate,
      completedClearances,
      totalClearances: clearances.length
    });
  } catch (error) {
    console.error('Department analytics error:', error);
    sendError(res, 'Could not fetch department analytics');
  }
};
