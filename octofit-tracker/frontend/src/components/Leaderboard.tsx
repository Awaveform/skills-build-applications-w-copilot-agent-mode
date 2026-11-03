import { useApiResource } from '../api/useApiResource.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const result = useApiResource<LeaderboardResponse>('/api/leaderboard');
  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {result.status === 'loading' && <p role="status">Loading leaderboard...</p>}
        {result.status === 'error' && <p role="alert">Unable to load leaderboard. Please try again.</p>}
        {result.status === 'success' && result.data.leaderboard.length === 0 && <p>No leaderboard rankings yet.</p>}
        {result.status === 'success' && result.data.leaderboard.length > 0 && (
          <ol className="list-group list-group-numbered">
            {result.data.leaderboard.map((entry) => (
              <li className="list-group-item" key={entry.rank}>
                {entry.teamName}: {entry.totalPoints} points
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
