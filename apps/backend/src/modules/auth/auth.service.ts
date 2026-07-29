import { google } from "googleapis";
import { query } from "../../config/db";
import { env } from "../../config/env";
import { encryptToken } from "../../utils/crypto";
import type { SessionUser } from "../../middleware/auth.middleware";

const scopes = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"];

export function getOAuthClient() {
  return new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
}

export function getGoogleAuthUrl() {
  return getOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
}

export async function handleGoogleCallback(code: string) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: profile } = await oauth2.userinfo.get();
  if (!profile.email) throw new Error("Google profile did not include an email address");

  const userResult = await query<{ id: string; email: string }>(
    `
      INSERT INTO users (email, name, avatar_url)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, updated_at = now()
      RETURNING id, email
    `,
    [profile.email, profile.name ?? null, profile.picture ?? null],
  );
  const user = userResult.rows[0];

  await query(
    `
      INSERT INTO google_accounts (
        user_id, google_sub, access_token_enc, refresh_token_enc, scope, token_type, expiry_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7 / 1000.0))
      ON CONFLICT (google_sub) DO UPDATE
      SET access_token_enc = EXCLUDED.access_token_enc,
          refresh_token_enc = COALESCE(EXCLUDED.refresh_token_enc, google_accounts.refresh_token_enc),
          scope = EXCLUDED.scope,
          token_type = EXCLUDED.token_type,
          expiry_date = EXCLUDED.expiry_date,
          updated_at = now()
    `,
    [
      user.id,
      profile.id ?? profile.email,
      encryptToken(tokens.access_token ?? ""),
      tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
      tokens.scope ?? scopes.join(" "),
      tokens.token_type ?? "Bearer",
      tokens.expiry_date ?? Date.now() + 3600 * 1000,
    ],
  );

  const sessionUser: SessionUser = { id: user.id, email: user.email };
  return { user: sessionUser };
}

export async function getCurrentUser(userId: string) {
  const result = await query(
    `
      SELECT id, email, name, avatar_url AS "avatarUrl"
      FROM users
      WHERE id = $1
    `,
    [userId],
  );
  return result.rows[0] ?? null;
}
