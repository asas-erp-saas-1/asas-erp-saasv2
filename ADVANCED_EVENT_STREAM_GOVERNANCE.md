# ADVANCED EVENT STREAM GOVERNANCE

## 1. Overview
An ERP that operates for 10 years will generate hundreds of terabytes of immutable events. Cold storage logic and compaction are mandatory to avoid crippling DB IO performance and exploding infrastructure spend.

## 2. Event Compaction Engine
- Repeated updates to `aggregateId: X` create extremely long replay tails.
- `EventCompactionEngine` periodically condenses the tail into an `AggregateSnapshot` record. Replays now start from the latest Snapshot version instead of version 1, saving thousands of compute cycles per entity without shedding legal history.

## 3. Immutable Stream Archiver & Cold Replay
- Events mapped prior to the Snapshot are pushed to AWS S3 / Glacier (`ImmutableStreamArchiver`).
- If an Audit requires true Version 1 reconstruction, the `ColdReplayCoordinator` temporarily retrieves the parquet files from S3 and mounts them to the replay logic stream transparently.
