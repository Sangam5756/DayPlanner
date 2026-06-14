# Daymark

A multi-user daily discipline planner.

## Included

- Google sign-in
- Private MongoDB data for each user
- Daily time-block timeline
- DSA, learning, personal, habit, and office-name categories
- Priorities, completion, skipping, and required skip reasons
- "Do this next" guidance
- Planned focus totals and daily discipline score
- One-way task sync to Google Calendar
- Reading tasks with attached article, blog, or documentation links
- AI natural-language planning with review before task creation
- Working Today, All Tasks, and Progress views with browser history
- Responsive desktop and mobile interface

## Setup

1. Install dependencies:

   ```powershell
   npm.cmd install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values.

3. In Google Cloud Console:

   - Create an OAuth 2.0 Web Application client.
   - Enable the Google Calendar API.
   - Add `http://localhost:3000/api/auth/callback/google` as an authorized
     redirect URI.
   - Add your Google account as a test user while the OAuth app is in testing.

4. Create a MongoDB Atlas database and place its connection string in
   `MONGODB_URI`.

5. Start the app:

   ```powershell
   npm.cmd run dev
   ```

Open `http://localhost:3000`.

## Environment

```text
MONGODB_URI=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
```

Generate `NEXTAUTH_SECRET` with a secure random value.

The OpenAI key is used only on the server. Never expose it in a variable beginning
with `NEXT_PUBLIC_`.
