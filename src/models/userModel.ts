import { pool } from "../config/db";

export interface User {
  id?: number;
  email: string;
 password?: string | null;
  name?: string;
  provider?: string;
  provider_id?: string;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0] || null;
}

export async function createUser(user: User): Promise<User> {
  const result = await pool.query(
    "INSERT INTO users (email, password, name, provider, provider_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [user.email, user.password, user.name, user.provider, user.provider_id]
  );
  return result.rows[0];
}
