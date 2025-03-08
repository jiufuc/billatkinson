DROP TABLE IF EXISTS photo_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS photos_fts; 

CREATE TABLE IF NOT EXISTS photos (
  photo_idx INTEGER PRIMARY KEY AUTOINCREMENT,
  photo_id INTEGER UNIQUE,
  photo_title TEXT,
  photo_collection TEXT,
  photo_location TEXT,
  photo_year INTEGER,
  camera TEXT,
  film_stock TEXT,
  film_format TEXT
);

CREATE TABLE IF NOT EXISTS tags (
  tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS photo_tags (
  photo_idx INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (photo_idx, tag_id),
  FOREIGN KEY (photo_idx) REFERENCES photos(photo_idx) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);

CREATE VIRTUAL TABLE photos_fts USING fts5(
  photo_idx UNINDEXED, 
  photo_title,
  photo_collection,
  tag_names  
);

CREATE INDEX idx_photo_tags_tag_photo ON photo_tags(tag_id, photo_idx);
CREATE INDEX idx_photos_collection ON photos(photo_collection);