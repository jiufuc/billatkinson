export let db = null;

export function set_database(D1_database) {
  db ??= D1_database;

  console.log('db', db);
}