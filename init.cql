CREATE KEYSPACE IF NOT EXISTS url_shortener WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3'};

USE url_shortener;

CREATE TABLE IF NOT EXISTS urls (
  short_code TEXT PRIMARY KEY,
  alias TEXT,
  long_url TEXT,
  created_at TIMESTAMP,
  access_count BIGINT
);