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
  
  // Extract sorting parameters
  const sortField = url.searchParams.get("sortField") || "id";
  const sortDirection = url.searchParams.get("sortDirection") || "asc";

  try {
    // Initialize the base SQL query
    let sqlQuery = "SELECT p.* FROM photos p";
    const queryParameters: any[] = [];
    
    // Build the WHERE clause based on filters
    const whereConditions: string[] = [];
    let hasJoinedTags = false;

    if (searchTerm) {
      // Split the search term into individual tags for restrictive filtering
      const searchTags = searchTerm.trim().split(/\s+/).filter(tag => tag.length > 0);
      
      if (searchTags.length > 0) {
        // Create a unified FTS query
        const ftsConditions: string[] = [];
        
        for (const tag of searchTags) {
          // Construct the FTS query
          const ftsQuery = `photo_idx IN (SELECT photo_idx FROM photos_fts WHERE photos_fts MATCH ?)`;
          queryParameters.push(`${tag}*`); // Use prefix matching with wildcard
          ftsConditions.push(ftsQuery);
        }
        
        // Add the combined FTS conditions to the main WHERE clause
        whereConditions.push(`(${ftsConditions.join(" AND ")})`);
      }
    }
    
    // Join tags table if needed for color filtering
    if (selectedColor) {
      hasJoinedTags = true;
      sqlQuery += " JOIN photo_tags pt ON p.photo_idx = pt.photo_idx JOIN tags t ON pt.tag_id = t.tag_id";
      whereConditions.push("t.name = ?");
      queryParameters.push(selectedColor);
    }
    
    if (selectedCollection) {
      whereConditions.push("p.photo_collection = ?");
      queryParameters.push(selectedCollection);
    }

    // Add WHERE clause if any conditions exist
    if (whereConditions.length > 0) {
      sqlQuery += " WHERE " + whereConditions.join(" AND ");
    }
    
    // Add GROUP BY if we joined the tags table to avoid duplicates
    if (hasJoinedTags) {
      sqlQuery += " GROUP BY p.photo_idx";
    }

    // Calculate total items for pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${sqlQuery}) sub`;
    const countResult = await database.prepare(countQuery).bind(...queryParameters).first<{ total: number }>();
    const totalItems = countResult?.total || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Determine the ORDER BY clause based on the sort field and direction
    let orderByField: string;
    switch (sortField) {
      case "year":
        // Order by year, then by ID for consistent results when years match
        orderByField = "p.photo_year";
        break;
      case "id":
      default:
        orderByField = "p.photo_id";
        break;
    }

    // Add ordering and pagination to the main query
    sqlQuery += ` ORDER BY ${orderByField} ${sortDirection === "desc" ? "DESC" : "ASC"}`;
    
    // Add a secondary sort by ID to ensure consistent ordering
    if (sortField !== "id") {
      sqlQuery += `, p.photo_id ${sortDirection === "desc" ? "DESC" : "ASC"}`;
    }
    
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
    // Log the complete error for debugging
    console.error('Database error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Database error', 
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}