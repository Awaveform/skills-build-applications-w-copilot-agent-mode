import { useApiResource } from '../api/useApiResource.js';

type Team = { name: string; mascot: string; members: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const result = useApiResource<TeamResponse>('/api/teams');
  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {result.status === 'loading' && <p role="status">Loading teams...</p>}
        {result.status === 'error' && <p role="alert">Unable to load teams. Please try again.</p>}
        {result.status === 'success' && result.data.teams.length === 0 && <p>No teams yet.</p>}
        {result.status === 'success' && result.data.teams.length > 0 && (
          <ul className="list-group">
            {result.data.teams.map((team) => (
              <li className="list-group-item" key={team.name}>
                <strong>{team.name}</strong> — {team.mascot}; {team.members.length} members
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
