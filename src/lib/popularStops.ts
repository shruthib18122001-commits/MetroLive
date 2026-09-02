export interface PopularStop {
  /** Real LA Metro GTFS `stop_id` (present in `api/_data/stops.json`). */
  id: string;
  label: string;
}

/** Marquee stations shown as quick-links on the search screen when there are
 * no favourites yet. */
export const POPULAR_STOPS: readonly PopularStop[] = [
  { id: '80122', label: '7th St / Metro Center' },
  { id: '80409', label: 'Union Station' },
  { id: '80203', label: 'Hollywood / Highland' },
  { id: '80201', label: 'North Hollywood' },
  { id: '80139', label: 'Downtown Santa Monica' },
  { id: '80101', label: 'Downtown Long Beach' },
];
