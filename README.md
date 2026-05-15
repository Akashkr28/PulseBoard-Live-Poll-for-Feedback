# PulseBoard

PulseBoard is a full-stack live polling and feedback platform. Creators can build single-choice polls, share public links, collect anonymous or authenticated responses, watch analytics update live, and publish final results back to the same link.

## Features

- Email/password authentication with protected creator routes.
- Poll builder with multiple single-choice questions.
- Mandatory and optional question handling on both frontend and backend.
- Anonymous and authenticated response modes.
- Expiry checks that stop late responses automatically.
- Public poll links for smooth respondent submission.
- Creator analytics with total responses, question summaries, option counts, completion rate and participation split.
- Socket.io updates for live response counts and analytics refreshes.
- Publish flow so final results are visible publicly on the original poll URL.

## Tech Stack

- Frontend: React, Vite, React Router, Socket.io Client, Lucide icons.
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Socket.io.
- Repo style: one repository with `client` and `server` workspaces.

## Project Structure

```txt
client/          React app and public poll UI
server/          Express API, MongoDB models and Socket.io server
README.md        Setup, feature and deployment notes
package.json     Root workspace scripts
```

## Local Setup

Install dependencies from the repo root:

```bash
npm install
```

Create env files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Update `server/.env` with your MongoDB connection string and JWT secret:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/pulseboard
JWT_SECRET=use-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

Run the full app:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:4000`.

## Main API Routes

```txt
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/polls
POST   /api/polls
GET    /api/polls/:id
GET    /api/polls/:id/analytics
PATCH  /api/polls/:id/publish

GET    /api/public/polls/:publicId
POST   /api/public/polls/:publicId/responses
```

## Deployment Notes

Recommended deployment for this project:

- Database: MongoDB Atlas.
- Backend API: Render.
- Frontend: Vercel.

### 1. Create MongoDB Atlas Database

1. Create a free MongoDB Atlas cluster.
2. Create a database user.
3. Add your IP or allow access from `0.0.0.0/0` for Render.
4. Copy the connection string.

Use a database name like `pulseboard` in the URI:

```txt
mongodb+srv://<user>:<password>@<cluster-url>/pulseboard?retryWrites=true&w=majority
```

### 2. Deploy Backend on Render

This repo includes `render.yaml`, so Render can detect the backend service from the repository.

Render settings:

```txt
Build Command: npm install
Start Command: npm run start --workspace server
Health Check Path: /api/health
```

Add these Render environment variables:

```env
MONGO_URI=<MongoDB Atlas URI>
JWT_SECRET=<long random secret>
CLIENT_URL=https://<your-vercel-app>.vercel.app
NODE_VERSION=20
```

After deploy, your backend URL will look like:

```txt
https://<your-render-service>.onrender.com
```

Check it:

```txt
https://<your-render-service>.onrender.com/api/health
```

### 3. Deploy Frontend on Vercel

You can deploy from the repo root. The included root `vercel.json` builds the React app and serves `client/dist`.

Vercel settings:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: client/dist
Install Command: npm install
```

Add these Vercel environment variables:

```env
VITE_API_URL=https://<your-render-service>.onrender.com/api
VITE_SOCKET_URL=https://<your-render-service>.onrender.com
```

If you set Vercel's root directory to `client`, use:

```txt
Build Command: npm run build
Output Directory: dist
```

The `client/vercel.json` file keeps React Router routes working on refresh.

### 4. Connect Frontend and Backend

After Vercel gives you the final frontend URL, go back to Render and set:

```env
CLIENT_URL=https://<your-vercel-app>.vercel.app
```

Redeploy the Render backend once after changing `CLIENT_URL`.

## Submission Links

- GitHub repository: add the public repo link here.
- Deployed project: add the live app link here.

## Notes

Authenticated polls allow one response per signed-in respondent. Anonymous polls do not force sign-in and do not attach a user id to the response. Results only become public after the creator publishes them.
