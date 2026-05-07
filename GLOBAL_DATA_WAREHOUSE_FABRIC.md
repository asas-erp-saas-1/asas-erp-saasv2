# GLOBAL DATA WAREHOUSE & ANALYTICS FABRIC

## 1. Overview
Once the core OLTP system reaches millions of rows per tenant, real-time analytics queries collapse standard Postgres databases. Phase 16 separates OLAP entirely into a Global Data Warehouse.

## 2. Event-Stream Warehousing (Kafka/Redpanda)
- `KafkaEventBridge` connects the transactional `outbox_events` table (via Debezium CDC or equivalent logical replication) into massively scalable topics.
- Cold storage events are instantly synced into ClickHouse, BigQuery, or Snowflake.

## 3. Real-Time Executive Dashboards
- Dashboards no longer perform aggressive JOINs on the OLTP primary DB.
- They execute read-only queries against the sub-100ms OLAP column-stores, protecting the ERP's core transactional velocity.

## 4. Tenant Analytics Isolation
- BI Federation limits tenant users to only view aggregations derived from their specific Data Warehouse partitions, maintaining mathematically sound ABAC bounds even at the OLAP level.
