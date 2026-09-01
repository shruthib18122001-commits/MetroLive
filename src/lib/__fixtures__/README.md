# GTFS-realtime test fixtures

These `.pb` files are **synthetic** TripUpdates feeds, encoded with the real
`gtfs-realtime-bindings` protobuf schema. They are not recordings of live LA
Metro data — LA Metro's feed requires a Swiftly API key
(`SWIFTLY_API_KEY`, see `.env.example`). Once a key is available, capture a real
sample with:

```
curl -sS -H "Authorization: $SWIFTLY_API_KEY" \
  https://api.goswift.ly/real-time/lametro/gtfs-rt-trip-updates \
  -o src/lib/__fixtures__/live-sample.pb
```

| File | What it is |
| --- | --- |
| `trip-updates.pb` | Populated feed exercising every `extractArrivals` branch (late / on time / early / unknown / delay-only / SKIPPED / already departed / other stop). |
| `empty.pb` | Valid feed, header only, zero entities. |
| `not-protobuf.bin` | Garbage bytes — `decodeTripUpdates` must throw `FeedDecodeError`. |
| `meta.json` | The reference `now` and expected per-case values, regenerated with the fixtures. |

Regenerate: `npm run fixtures`. The source of truth is `feed.ts` in this folder.
