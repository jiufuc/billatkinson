import type { RequestHandler } from "@sveltejs/kit";

export async function GET({ platform}) {
  if (!platform?.env?.DB) {
    return new Response(JSON.stringify({ error: "Database not available" }), { status: 500 });
  }

  try {
    const result = await platform.env.DB.prepare("SELECT * FROM photos").all();
    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};