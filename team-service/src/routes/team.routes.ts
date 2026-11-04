import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Team } from '../models/team.model';
import { requireAuth, requireLeader } from '../middleware/auth';
import { publishTeamNotification } from '../services/notification.publisher';
import {
  teamIdParamSchema,
  memberParamSchema,
  createTeamSchema,
  updateTeamSchema,
  addMemberSchema,
  TeamIdParam,
  MemberParam,
  CreateTeamInput,
  UpdateTeamInput,
  AddMemberInput,
} from '../schemas/team.schema';

export async function teamRoutes(server: FastifyInstance) {
  // GET /api/teams/mine - teams where user is a member
  server.get('/api/teams/mine', async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;

    return Team.find({ members: req.user.id }).sort({ createdAt: -1 });
  });

  // GET /api/teams/owned - teams where user is leader
  server.get('/api/teams/owned', async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;

    return Team.find({ leaderId: req.user.id }).sort({ createdAt: -1 });
  });

  // GET /api/teams - all teams (admin only)
  server.get('/api/teams', async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;

    if (req.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    return Team.find({}).sort({ createdAt: -1 });
  });

  // POST /api/teams - create team
  server.post('/api/teams', async (req: FastifyRequest<{ Body: CreateTeamInput }>, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;

    if (!['TEAM_LEADER', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'Only team leaders can create teams' });
    }

    const parse = createTeamSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.issues[0]?.message || 'Invalid input' });
    }

    const { name, description } = parse.data;

    const duplicate = await Team.findOne({ name });
    if (duplicate) {
      return reply.status(400).send({ error: 'This team already exists' });
    }

    const team = await Team.create({
      name,
      description,
      leaderId: req.user.id,
      members: [req.user.id],
    });

    return reply.status(201).send(team);
  });

  // GET /api/teams/:id - get team details
  server.get<{ Params: TeamIdParam }>('/api/teams/:id', async (req: FastifyRequest<{ Params: TeamIdParam }>, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;

    const parseParams = teamIdParamSchema.safeParse(req.params);
    if (!parseParams.success) {
      return reply.status(400).send({ error: 'Invalid team ID' });
    }

    const team = await Team.findById(parseParams.data.id);
    if (!team) return reply.status(404).send({ error: 'Team not found' });

    if (!team.members.includes(req.user.id) && req.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }

    return team;
  });

  // POST /api/teams/:id/members - add member
  server.post<{ Params: TeamIdParam; Body: AddMemberInput }>(
    '/api/teams/:id/members',
    async (req: FastifyRequest<{ Params: TeamIdParam; Body: AddMemberInput }>, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;

      const parseParams = teamIdParamSchema.safeParse(req.params);
      const parseBody = addMemberSchema.safeParse(req.body);

      if (!parseParams.success) return reply.status(400).send({ error: 'Invalid team ID' });
      if (!parseBody.success) return reply.status(400).send({ error: 'Invalid userIdToAdd' });

      const team = await Team.findById(parseParams.data.id);
      if (!team) return reply.status(404).send({ error: 'Team not found' });
      if (!requireLeader(req.user, team, reply)) return;

      const { userIdToAdd } = parseBody.data;
      await Team.findByIdAndUpdate(parseParams.data.id, { $addToSet: { members: userIdToAdd } });

      await publishTeamNotification({
        userIds: [userIdToAdd],
        type: 'TEAM_ADDED',
        message: `You have been added to team "${team.name}"`,
        relatedId: team._id.toString(),
        metadata: {
          teamName: team.name,
          leaderName: req.user.fullName || 'Team Leader',
        },
      });

      return { message: 'Member added successfully' };
    }
  );

  // DELETE /api/teams/:id/members/:userId - remove member
  server.delete<{ Params: MemberParam }>(
    '/api/teams/:id/members/:userId',
    async (req: FastifyRequest<{ Params: MemberParam }>, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;

      const parseParams = memberParamSchema.safeParse(req.params);
      if (!parseParams.success) return reply.status(400).send({ error: 'Invalid parameters' });

      const { id, userId } = parseParams.data;
      const team = await Team.findById(id);
      if (!team) return reply.status(404).send({ error: 'Team not found' });
      if (!requireLeader(req.user, team, reply)) return;

      const uid = Number(userId);
      if (uid === team.leaderId) {
        return reply.status(400).send({ error: 'Cannot remove leader' });
      }

      await Team.findByIdAndUpdate(id, { $pull: { members: uid } });
      return { message: 'Member removed successfully' };
    }
  );

  // PATCH /api/teams/:id - update team
  server.patch<{ Params: TeamIdParam; Body: UpdateTeamInput }>(
    '/api/teams/:id',
    async (req: FastifyRequest<{ Params: TeamIdParam; Body: UpdateTeamInput }>, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;

      const parseParams = teamIdParamSchema.safeParse(req.params);
      const parseBody = updateTeamSchema.safeParse(req.body);

      if (!parseParams.success) return reply.status(400).send({ error: 'Invalid team ID' });
      if (!parseBody.success) return reply.status(400).send({ error: 'Invalid update body' });

      const team = await Team.findById(parseParams.data.id);
      if (!team) return reply.status(404).send({ error: 'Team not found' });
      if (!requireLeader(req.user, team, reply)) return;

      const updateData: { name?: string; description?: string } = {};

      if (parseBody.data.name) {
        const newName = parseBody.data.name;
        const duplicate = await Team.findOne({ name: newName, _id: { $ne: parseParams.data.id } });
        if (duplicate) {
          return reply.status(400).send({ error: 'Team name must be unique' });
        }
        updateData.name = newName;
      }

      if (parseBody.data.description !== undefined) {
        updateData.description = parseBody.data.description;
      }

      const updatedTeam = await Team.findByIdAndUpdate(parseParams.data.id, updateData, { new: true });
      return updatedTeam;
    }
  );

  // DELETE /api/teams/:id - delete team
  server.delete<{ Params: TeamIdParam }>(
    '/api/teams/:id',
    async (req: FastifyRequest<{ Params: TeamIdParam }>, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;

      const parseParams = teamIdParamSchema.safeParse(req.params);
      if (!parseParams.success) return reply.status(400).send({ error: 'Invalid team ID' });

      const team = await Team.findById(parseParams.data.id);
      if (!team) return reply.status(404).send({ error: 'Team not found' });
      if (!requireLeader(req.user, team, reply)) return;

      await Team.findByIdAndDelete(parseParams.data.id);
      return { message: 'Team deleted successfully' };
    }
  );
}
