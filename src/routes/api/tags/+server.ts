// routes/api/colors/+server.ts
export async function GET({ platform }) {
  // Check if the platform environment is available
  if (!platform) {
    return new Response("Platform not available", { status: 500 });
  }

  try {
    // Fetch distinct tag names from the database
    const result = await platform.env.DB
      .prepare("SELECT DISTINCT t.name FROM tags t JOIN photo_tags pt ON t.tag_id = pt.tag_id WHERE t.name IS NOT NULL")
      .all();

    // Extract and return the tag names as an array
    const tags = result.results.map(row => row.name);
    return new Response(JSON.stringify(tags), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    // Handle any database or query errors
    return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 });
  }
}