// routes/api/collections/+server.ts
export async function GET({ platform }) {
  // Check if the platform environment is available
  if (!platform) {
    return new Response("Platform not available", { status: 500 });
  }

  try {
    // Fetch distinct collection names from the database
    const result = await platform.env.DB
      .prepare("SELECT DISTINCT photo_collection FROM photos WHERE photo_collection IS NOT NULL")
      .all();

    // Extract and return the collection names as an array
    const collections = result.results.map(row => row.photo_collection);
    return new Response(JSON.stringify(collections), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    // Handle any database or query errors
    return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 });
  }
}