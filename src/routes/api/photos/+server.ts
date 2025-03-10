// routes/api/photos/+server.ts
export async function GET({ url, platform }) {
  if (!platform) return new Response("Platform not available", { status: 500 });

  const db = platform.env.DB;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = 25;
  const offset = (page - 1) * limit;

  try {
    const [result, { total }] = await Promise.all([
      db.prepare("SELECT * FROM photos LIMIT ? OFFSET ?").bind(limit, offset).all(),
      db.prepare("SELECT COUNT(*) as total FROM photos").first<{ total: number }>(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return new Response(JSON.stringify({
      photos: result.results,
      pagination: { currentPage: page, totalPages, totalItems: total, hasNext: page < totalPages }
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 });
  }
}