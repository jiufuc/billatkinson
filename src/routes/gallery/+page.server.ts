import { db } from '$lib/server/db.js';


/** @type {import('@sveltejs/kit').RequestHandler} */
export async function load() {
  const sql = 'select * from photo_id';

  const response = await db.prepare(sql).run();

  return { 
    photo_ids: response.results,
  };
}