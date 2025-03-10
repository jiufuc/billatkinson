export async function GET({ platform }) {
  if (!platform) {
    return new Response("Platform not available", { status: 500 });
  }
  const db = platform.env.DB;
  const result = await db.prepare("SELECT * FROM photos").all();
  
  return new Response(JSON.stringify(result.results));
}