# Daymark

A modern, multi-user daily discipline planner designed to help you turn intentions into actionable, trackable daily routines.

---

## ✨ Features

### Core Functionality
- **Google Sign-In**: Secure, one-click authentication using your Google account
- **User-Isolated Data**: Private MongoDB collections for each user's tasks and preferences
- **Daily Time-Block Timeline**: Visual, structured view of your day
- **Task Categories**: Predefined categories: DSA, Learning, Reading, Personal, Office, and Habit
- **Priority Levels**: Low, Medium, High priority flags for each task
- **Completion Tracking**: Mark tasks as complete, or skip them with a required justification
- **AI-Powered Planning**: Natural language planning with Google Gemini, with review before task creation
- **"Do This Next" Guidance**: Smart suggestion of your next prioritized task

### Productivity & Analytics
- **Daily Discipline Score**: A weighted score combining completed and planned tasks
- **Planned Focus Totals**: See how much time you've scheduled for each day
- **Google Calendar Sync**: One-way task sync to your personal Google Calendar
- **Resource Attachments**: Add article, blog, or documentation links directly to your reading tasks
- **Progress View**: Detailed breakdown of your consistency over time

### Interface
- **Three Views**: Today (daily plan), All Tasks (task library), and Progress (analytics)
- **Browser History Integration**: Navigate using browser back/forward buttons
- **Responsive Design**: Works beautifully on both desktop and mobile devices
- **Light & Dark Theme**: Eye-friendly color schemes with persistent theme preference
- **Hamburger Menu**: Clean sidebar toggle for optimal mobile experience
- **Task Management**: Full edit and delete functionality for all tasks

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- A Google Cloud Console account
- A MongoDB Atlas account (or local MongoDB instance)

### Installation & Setup

1. **Clone or download the project**
   ```bash
   cd "C:\Users\ADMIN\Documents\Daily plan"
   ```

2. **Install dependencies**
   ```powershell
   npm.cmd install
   # OR
   yarn install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env.local`
   ```powershell
   copy .env.example .env.local
   ```

4. **Configure Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the **Google Calendar API** and **Google Identity Services API**
   - Create an **OAuth 2.0 Web Application** client:
     - Add `http://localhost:3000` as an authorized JavaScript origin
     - Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI
   - Add your Google account as a test user while the OAuth app is in testing mode
   - Copy your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your `.env.local` file

5. **Set up MongoDB**
   - Create a free tier cluster on [MongoDB Atlas](https://www.mongodb.com/atlas/database)
   - Get your connection string and update `MONGODB_URI` in `.env.local`
   - Create a database named `daymark` (or your preferred name)

6. **Get your Google Gemini API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create an API key and add it as `GEMINI_API_KEY` in your `.env.local` file
   - (Optional) Set `GEMINI_MODEL` (default: `gemini-1.5-flash-latest`)

7. **Generate a secure NextAuth secret**
   - You can generate one using:
     ```bash
     openssl rand -base64 32
     ```
   - Or use a secure random string generator
   - Add this to `NEXTAUTH_SECRET` in your `.env.local` file

8. **Start the development server**
   ```powershell
   npm.cmd run dev
   # OR
   yarn dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action!

---

## 📝 Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/daymark

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-secure-random-secret>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Google AI (Gemini)
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-1.5-flash-latest
```

---

## 📦 Tech Stack

| Technology       | Version | Purpose                          |
|-------------------|---------|----------------------------------|
| Next.js           | 15.3.3  | Full-stack framework             |
| React             | 19.1.0  | UI library                       |
| TypeScript        | 5.8.3   | Type-safe development            |
| MongoDB           | 8.15.1  | NoSQL database                   |
| Mongoose          | 8.15.1  | ODM for MongoDB                  |
| NextAuth.js       | 4.24.11 | Authentication                   |
| Google Generative AI | 0.24.1 | AI planning using Gemini      |
| Tailwind CSS      | Built-in (via globals.css) | Responsive styling |

---

## 🤝 Contributing

This is a personal project, but if you'd like to fork it and adapt it for your own use, you're welcome to!

---

## 📄 License

MIT License (feel free to use for personal or commercial purposes with attribution)

---

## 🔒 Important Notes

- **API Key Security**: The `GEMINI_API_KEY` is only used server-side and should NEVER be exposed in a variable beginning with `NEXT_PUBLIC_`!
- **OAuth Testing**: Your Google OAuth app must be in "Testing" mode (with your email added as a test user) unless you publish it!
- **MongoDB Security**: Always use environment variables for database credentials, never commit them to version control!
