import { useApiResource } from '../api/useApiResource.js';

type Workout = { title: string; focus: string; minutes: number; reason: string };
type WorkoutResponse = { suggestions: Workout[] };
const userEmail = 'mona@example.com';

export default function Workouts() {
  const result = useApiResource<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);
  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {result.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
        {result.status === 'error' && <p role="alert">Unable to load workout suggestions. Please try again.</p>}
        {result.status === 'success' && result.data.suggestions.length === 0 && <p>No workout suggestions available.</p>}
        {result.status === 'success' && result.data.suggestions.length > 0 && (
          <ul className="list-group">
            {result.data.suggestions.map((workout) => (
              <li className="list-group-item" key={workout.title}>
                <strong>{workout.title}</strong> — {workout.focus}, {workout.minutes} minutes. {workout.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
