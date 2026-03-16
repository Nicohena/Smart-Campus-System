import { Request, Response } from 'express';
import axios from 'axios';
import Issue from '../models/Issue';
import { generateMaintenancePredictions } from '../services/predictiveService';

interface CountRow {
  _id: string;
  count: number;
}

interface BlockIssueRow {
  _id: {
    block: string;
    issueType: string;
  };
  count: number;
}

interface ResolutionRow {
  _id: string | null;
  avgHours: number;
  count: number;
}

const formatCounts = (rows: CountRow[]): string =>
  rows.length > 0
    ? rows.map((row) => `${row._id}: ${row.count}`).join(', ')
    : 'No data';

const formatBlockIssueCounts = (rows: BlockIssueRow[]): string =>
  rows.length > 0
    ? rows.map((row) => `${row._id.block} - ${row._id.issueType}: ${row.count}`).join(', ')
    : 'No data';

const formatResolutionStats = (rows: ResolutionRow[]): string =>
  rows.length > 0
    ? rows
        .map((row) => {
          const label = row._id ? row._id : 'overall';
          const hours = Number.isFinite(row.avgHours) ? row.avgHours.toFixed(1) : 'n/a';
          return `${label}: ${hours}h avg (${row.count} resolved)`;
        })
        .join(', ')
    : 'No resolved issues';

// GET /api/predictions/maintenance
// Generates predictive maintenance insights from historical issues
export const getMaintenancePredictions = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalIssuesPromise = Issue.countDocuments();

    const issueTypeCountsPromise = Issue.aggregate<CountRow>([
      { $group: { _id: '$issueType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const blockCountsPromise = Issue.aggregate<CountRow>([
      { $group: { _id: { $ifNull: ['$block', 'Unknown'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const blockIssueCountsPromise = Issue.aggregate<BlockIssueRow>([
      {
        $group: {
          _id: {
            block: { $ifNull: ['$block', 'Unknown'] },
            issueType: '$issueType'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const monthlyCountsPromise = Issue.aggregate<CountRow>([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$reportedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const resolutionOverallPromise = Issue.aggregate<ResolutionRow>([
      { $match: { resolvedAt: { $ne: null } } },
      {
        $project: {
          resolutionHours: {
            $divide: [{ $subtract: ['$resolvedAt', '$reportedAt'] }, 1000 * 60 * 60]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: '$resolutionHours' },
          count: { $sum: 1 }
        }
      }
    ]);

    const resolutionByIssuePromise = Issue.aggregate<ResolutionRow>([
      { $match: { resolvedAt: { $ne: null } } },
      {
        $project: {
          issueType: 1,
          resolutionHours: {
            $divide: [{ $subtract: ['$resolvedAt', '$reportedAt'] }, 1000 * 60 * 60]
          }
        }
      },
      {
        $group: {
          _id: '$issueType',
          avgHours: { $avg: '$resolutionHours' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgHours: -1 } }
    ]);

    const [
      totalIssues,
      issueTypeCounts,
      blockCounts,
      blockIssueCounts,
      monthlyCounts,
      resolutionOverall,
      resolutionByIssue
    ] = await Promise.all([
      totalIssuesPromise,
      issueTypeCountsPromise,
      blockCountsPromise,
      blockIssueCountsPromise,
      monthlyCountsPromise,
      resolutionOverallPromise,
      resolutionByIssuePromise
    ]);

    // Summarize data before sending to the AI model
    const summaryLines = [
      `Total issues: ${totalIssues}`,
      `Issues by type: ${formatCounts(issueTypeCounts)}`,
      `Issues by block: ${formatCounts(blockCounts)}`,
      `Top block + issue type pairs: ${formatBlockIssueCounts(blockIssueCounts.slice(0, 10))}`,
      `Monthly occurrence: ${formatCounts(monthlyCounts)}`,
      `Resolution time overall: ${formatResolutionStats(resolutionOverall)}`,
      `Resolution time by issue type: ${formatResolutionStats(resolutionByIssue)}`
    ];

    const summary = summaryLines.join('\n');

    // AI prediction logic: provide summarized maintenance history to DeepSeek
    const predictionText = await generateMaintenancePredictions(summary);

    const predictions = predictionText
      .split('\n')
      .map((line) => line.replace(/^[-*\d.]+\s*/, '').trim())
      .filter(Boolean);

    res.status(200).json({ predictions: predictions.length ? predictions : [predictionText] });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Predictive maintenance error:', error);

    if (axios.isAxiosError(error)) {
      res.status(502).json({ message: 'Prediction service is currently unavailable' });
      return;
    }

    res.status(500).json({ message: 'Could not generate maintenance predictions' });
  }
};
