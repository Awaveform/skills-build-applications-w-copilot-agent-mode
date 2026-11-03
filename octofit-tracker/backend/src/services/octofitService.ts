import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type RequestRecord = Record<string, unknown>;

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function asRecord(input: unknown): RequestRecord {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw httpError('Request body must be an object', 400);
  }
  return input as RequestRecord;
}

function requiredString(input: unknown, field: string) {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw httpError(`${field} is required`, 400);
  }
  return input.trim();
}

function objectId(input: unknown, field: string) {
  if (typeof input !== 'string' || !/^[a-f\d]{24}$/i.test(input)) {
    throw httpError(`${field} must be a valid ID`, 400);
  }
  return new mongoose.Types.ObjectId(input);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = asRecord(input);
  const userId = objectId(body.userId, 'userId');
  const teamId = objectId(body.teamId, 'teamId');
  const type = requiredString(body.type, 'type');
  const minutes = body.minutes;
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw httpError('minutes must be a positive number', 400);
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user) throw httpError('User not found', 404);
  if (!team) throw httpError('Team not found', 404);

  return Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = asRecord(input);
  const name = requiredString(body.name, 'name');
  const mascot = requiredString(body.mascot, 'mascot');
  const memberIds = body.members ?? [];
  if (!Array.isArray(memberIds)) throw httpError('members must be an array', 400);

  const members = memberIds.map((memberId) => objectId(memberId, 'members entry'));
  if (members.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== members.length) throw httpError('One or more team members were not found', 404);
  }

  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

function activityFocus(type: string) {
  const normalized = type.toLowerCase();
  if (['run', 'running', 'walk', 'walking', 'cycle', 'cycling', 'cardio'].includes(normalized)) return 'endurance';
  return normalized;
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = decodeURIComponent(userEmail).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) throw httpError('User not found', 404);

  const [recentActivity, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const recentFocus = recentActivity[0] ? activityFocus(recentActivity[0].type) : undefined;
  const preferredFocuses = [...new Set([goal, recentFocus].filter((focus): focus is string => Boolean(focus)))];
  const focusPriority = new Map(preferredFocuses.map((focus, index) => [focus, index]));

  return workouts
    .map((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const preferredIndex = focusPriority.get(focus);
      const reason = preferredIndex === 0
        ? `Recommended because it matches your ${user.fitnessGoal} fitness goal.`
        : preferredIndex === 1
          ? `Recommended based on your recent ${recentActivity[0].type} activity.`
          : `Suggested to support your ${user.fitnessGoal} fitness goal.`;
      return { ...workout, reason, preferredIndex: preferredIndex ?? Number.MAX_SAFE_INTEGER };
    })
    .sort((left, right) => left.preferredIndex - right.preferredIndex || left.title.localeCompare(right.title))
    .map(({ preferredIndex: _preferredIndex, ...workout }) => workout);
}

export { User };
