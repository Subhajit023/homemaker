# Family sharing setup (Supabase)

Family sharing stores the household's data online so every family member's phone sees the
same items, shopping list and plans, live. Without this setup the app still works, but only
on one phone.

## 1. Create a free Supabase project

1. Go to <https://supabase.com> and sign up (free plan is enough).
2. **New project** → give it a name (e.g. `homemaker`), set a database password, pick the
   region closest to you (e.g. *Mumbai* for India) → **Create**.

## 2. Create the tables

1. In your project: **SQL Editor** → **New query**.
2. Open [`migrations/0001_family_sharing.sql`](migrations/0001_family_sharing.sql), copy all of it,
   paste it into the editor and press **Run**. You should see "Success. No rows returned".
3. Do the same with [`migrations/0002_surprises_photos_board.sql`](migrations/0002_surprises_photos_board.sql)
   (surprises, profile pictures and the family board). Always run the files in number order.

## 3. Allow invite-code sign-in

Family members join with an invite code and their name — no password. This uses Supabase
"anonymous sign-ins":

- **Authentication** → **Sign In / Providers** (or **Providers**) → turn on
  **Allow anonymous sign-ins** → **Save**.

## 4. Put the keys in the app

1. **Project Settings** → **API** (or the **Connect** button at the top).
2. Copy the **Project URL** and the **publishable** key (called *anon* key in older projects).
3. In the project folder, copy `.env.example` to `.env.local` and paste the two values:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

4. Restart the dev server (`Ctrl+C`, then `npx expo start`) so the keys are picked up.

## 5. Use it

1. On your phone: **Home → 👨‍👩‍👧 → Start a family**. Your current items and plans are uploaded.
2. Tap **🟢 WhatsApp** to send the invite code to your family.
3. On their phone: **👨‍👩‍👧 → Got an invite? → enter the code → pick their name → Join**.

> Each phone needs the app installed. Until the app is published, build an installable
> Android file with EAS (`npx eas-cli@latest build -p android --profile preview`) and share it.
> Make sure the two `EXPO_PUBLIC_…` values are also set for the build (EAS → Environment variables).

## Notes

- Access is protected by Row Level Security: only members of a family can read or change it.
- Surprises are enforced by the database: an item, plan or post hidden from someone is never
  sent to their phone.
- Profile pictures and board photos are shrunk and stored with the data (no extra storage setup).
- If someone uninstalls the app (or clears its data), they need the invite code again; they can
  pick their old name from the list. To let a name be picked again, remove and re-add that
  person, or ask them to "Leave family" first.
- Supabase recommends CAPTCHA for anonymous sign-ins on public apps and limits them to
  30 per hour per IP by default — fine for a family.
