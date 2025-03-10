import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, platform }) => {
  if (!platform?.env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = platform.env.DB;
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const search = url.searchParams.get('search') || '';
  const collection = url.searchParams.get('collection') || '';
  const tag = url.searchParams.get('tag') || '';

  let query = `SELECT p.* FROM photos p`;
  let conditions: string[] = [];
  let params: unknown[] = [];
  console.log('Query:', query, 'Params:', params);
  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();
  console.log('Result:', result.results);

  if (search) {
    query = `
      SELECT p.* FROM photos p
      JOIN photos_fts fts ON p.photo_idx = fts.photo_idx
      WHERE fts.photo_title MATCH ? OR fts.photo_location MATCH ?
    `;
    params.push(search, search);
  }

  if (collection) {
    conditions.push(`p.photo_collection = ?`);
    params.push(collection);
  }

  if (tag) {
    query += ` 
      JOIN photo_tags pt ON p.photo_idx = pt.photo_idx
      JOIN tags t ON pt.tag_id = t.tag_id
    `;
    conditions.push(`t.name = ?`);
    params.push(tag);
  }

  if (conditions.length) {
    query += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY p.photo_year DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  try {
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).all();
    return new Response(JSON.stringify(result.results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};