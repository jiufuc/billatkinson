#!/usr/bin/env python3
import json
import argparse

def escape_string(s):
    """Escape single quotes for SQL insertion."""
    return s.replace("'", "''")

def generate_sql(photo):
    # Extract photo details and escape strings where necessary
    photo_id = photo["photo_id"]
    photo_title = escape_string(photo["photo_title"])
    photo_collection = escape_string(photo["photo_collection"])
    photo_location = escape_string(photo["photo_location"])
    photo_year = photo["photo_year"]
    camera = escape_string(photo["camera"])
    film_stock = escape_string(photo["film_stock"])
    film_format = escape_string(photo["film_format"])
    
    # Join tags into a single string for the FTS table
    tags = photo.get("photo_tags", [])
    tag_names = escape_string(",".join(tags))
    
    sql_lines = []
    
    # Insert photo into the photos table
    sql_lines.append(
        f"INSERT INTO photos (photo_id, photo_title, photo_collection, photo_location, photo_year, camera, film_stock, film_format) "
        f"VALUES ({photo_id}, '{photo_title}', '{photo_collection}', '{photo_location}', {photo_year}, '{camera}', '{film_stock}', '{film_format}');"
    )
    
    # Insert into the FTS table using a subquery to retrieve the photo_idx based on photo_id
    sql_lines.append(
        f"INSERT INTO photos_fts (photo_idx, photo_id, photo_title, photo_collection, photo_location, photo_year, camera, film_stock, film_format, tag_names) "
        f"VALUES ((SELECT photo_idx FROM photos WHERE photo_id = {photo_id}), {photo_id}, '{photo_title}', '{photo_collection}', '{photo_location}', {photo_year}, '{camera}', '{film_stock}', '{film_format}', '{tag_names}');"
    )
    
    # For each tag, insert it into the tags table and create the mapping in photo_tags
    for tag in tags:
        tag_escaped = escape_string(tag)
        sql_lines.append(f"INSERT OR IGNORE INTO tags (name) VALUES ('{tag_escaped}');")
        sql_lines.append(
            f"INSERT INTO photo_tags (photo_idx, tag_id) "
            f"VALUES ((SELECT photo_idx FROM photos WHERE photo_id = {photo_id}), (SELECT tag_id FROM tags WHERE name = '{tag_escaped}'));"
        )
    
    return "\n".join(sql_lines)

def main():
    parser = argparse.ArgumentParser(
        description='Generate SQL migration statements from photos.json for Cloudflare D1.'
    )
    parser.add_argument('input_json', help='Path to the photos.json file')
    parser.add_argument('output_sql', nargs='?', default=None, help='Path to the output SQL file (defaults to stdout)')
    args = parser.parse_args()

    # Load JSON data; assumed to be an array of photo objects
    with open(args.input_json, 'r') as f:
        photos_data = json.load(f)
    
    # Generate SQL statements for each photo
    all_sql = []
    for photo in photos_data:
        all_sql.append(generate_sql(photo))
        all_sql.append("")  # Blank line for readability
    
    output_content = "\n".join(all_sql)
    
    # Write to file or stdout
    if args.output_sql:
        with open(args.output_sql, 'w') as f:
            f.write(output_content)
        print(f"SQL migration script written to {args.output_sql}")
    else:
        print(output_content)

if __name__ == "__main__":
    main()
