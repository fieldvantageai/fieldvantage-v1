alter table if exists order_status_events
  add column if not exists note text;
