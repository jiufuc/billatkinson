import json
import sqlite3

# Connect to local SQLite database
conn = sqlite3.connect('photos.db')
cursor = conn.cursor()

# Read JSON file
with open('photos.json', 'r') as f:
    photos_data = json.load(f)

# Apply schema
cursor.executescript(open('schema-migration.sql', 'r').read())

# Start transaction
cursor.execute('BEGIN TRANSACTION;')

try:
    for photo in photos_data:
        # Insert into photos
        cursor.execute('''
            INSERT INTO photos (photo_id, photo_title, photo_collection, photo_location, photo_year, camera, film_stock, film_format)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        ''', (
            photo['photo_id'],
            photo['photo_title'],
            photo['photo_collection'],
            photo['photo_location'],
            photo['photo_year'],
            photo['camera'],
            photo['film_stock'],
            photo['film_format']
        ))
        photo_idx = cursor.lastrowid

        # Insert tags and link in photo_tags
        tag_list = photo['photo_tags']
        for tag_name in tag_list:
            cursor.execute('INSERT OR IGNORE INTO tags (name) VALUES (?);', (tag_name,))
            cursor.execute('SELECT tag_id FROM tags WHERE name = ?;', (tag_name,))
            tag_id = cursor.fetchone()[0]
            cursor.execute('INSERT INTO photo_tags (photo_idx, tag_id) VALUES (?, ?);', (photo_idx, tag_id))

        # Insert into FTS table (concatenate tags into a single string)
        tags_str = ' '.join(tag_list)  # Combine tags with spaces
        cursor.execute('''
            INSERT INTO photos_fts (photo_idx, photo_title, photo_collection, tag_names)
            VALUES (?, ?, ?, ?);
        ''', (photo_idx, photo['photo_title'], photo['photo_collection'], tags_str))

    # Commit transaction
    conn.commit()
    print("Migration completed successfully!")

except Exception as e:
    cursor.execute('ROLLBACK;')
    print(f"Error during migration: {e}")

finally:
    conn.close()