import { useApiResource } from '../api/useApiResource.js';

type Activity = { type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const result = useApiResource<ActivityResponse>('/api/activities');
  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {result.status === 'loading' && <p role="status">Loading activities...</p>}
        {result.status === 'error' && <p role="alert">Unable to load activities. Please try again.</p>}
        {result.status === 'success' && result.data.activities.length === 0 && <p>No activities yet.</p>}
        {result.status === 'success' && result.data.activities.length > 0 && (
          <ul className="list-group">
            {result.data.activities.map((activity, index) => (
              <li className="list-group-item" key={`${activity.type}-${index}`}>
                {activity.type}: {activity.minutes} minutes, {activity.points} points
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
