// routes/api/photos/+server.ts
export async function GET({ url, platform }) {
  // Check if the platform environment is available
  if (!platform) {
    return new Response("Platform not available", { status: 500 });
  }

  // Access the database instance
  const database = platform.env.DB;

  // Parse and validate the page number from the URL parameters
  const pageNumber = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const itemsPerPage = 15;
  const offsetValue = (pageNumber - 1) * itemsPerPage;

  // Extract filter parameters from the URL
  const searchTerm = url.searchParams.get("search") || "";
  const selectedCollection = url.searchParams.get("collection") || "";
  const selectedColor = url.searchParams.get("color") || "";

  try {
    // Initialize the base SQL query
    let sqlQuery = "SELECT p.* FROM photos p";
    const queryParameters = [];

    // Join tables if a color filter is applied
    if (selectedColor) {
      sqlQuery += " JOIN photo_tags pt ON p.photo_idx = pt.photo_idx JOIN tags t ON pt.tag_id = t.tag_id";
    }

    // Build the WHERE clause based on filters
    const whereConditions = [];
    if (searchTerm) {
      // Perform full-text search and get matching photo indices
      const fullTextSearchQuery = "SELECT photo_idx FROM photos_fts WHERE photos_fts MATCH ?";
      const fullTextResult = await database.prepare(fullTextSearchQuery).bind(searchTerm + "*").all();
      const matchingPhotoIds = fullTextResult.results.map(row => row.photo_idx);

      if (matchingPhotoIds.length === 0) {
        // Return empty result if no matches found
        return new Response(JSON.stringify({
          photos: [],
          pagination: {
            currentPage: pageNumber,
            totalPages: 0,
            totalItems: 0,
            hasNext: false
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      whereConditions.push(`p.photo_idx IN (${matchingPhotoIds.join(",")})`);
    }
    if (selectedCollection) {
      whereConditions.push("p.photo_collection = ?");
      queryParameters.push(selectedCollection);
    }
    if (selectedColor) {
      whereConditions.push("t.name = ?");
      queryParameters.push(selectedColor);
    }

    // Add WHERE clause if any conditions exist
    if (whereConditions.length > 0) {
      sqlQuery += " WHERE " + whereConditions.join(" AND ");
    }

    // Calculate total items for pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${sqlQuery}) sub`;
    const countResult = await database.prepare(countQuery).bind(...queryParameters).first<{ total: number }>();
    const totalItems = countResult!.total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Add pagination to the main query
    sqlQuery += " LIMIT ? OFFSET ?";
    queryParameters.push(itemsPerPage, offsetValue);

    // Execute the final query to fetch photos
    const result = await database.prepare(sqlQuery).bind(...queryParameters).all();

    // Return the response with photos and pagination data
    return new Response(JSON.stringify({
      photos: result.results,
      pagination: {
        currentPage: pageNumber,
        totalPages: totalPages,
        totalItems: totalItems,
        hasNext: pageNumber < totalPages
      }
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    // Handle any database or query errors
    return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 });
  }
}