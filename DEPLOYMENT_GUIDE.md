# Cloud Deployment Guide (Option 1)

I have patched your code so that it correctly handles resume uploads when the Server and AI Service are on completely different servers! Your codebase is now ready for cloud deployment. 

Follow these steps exactly to get everything live on the web for free.

## Step 0: Upload to GitHub
First, you need to push this entire repository folder (`SmartAI`) to a GitHub repository if you haven't already. Both Vercel and Render deploy by directly fetching from your GitHub.

## Step 1: Set up MongoDB Atlas (Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Build a new "Free" Database cluster.
3. In Database Access, create a user and password. (Keep a note of these!)
4. In Network Access, allow access from anywhere (IP `0.0.0.0/0`).
5. Click **Connect**, choose "Connect your application", and copy the connection string.
   > It should look like this: `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`

---

## Step 2: Deploy AI Service (Render.com)
1. Go to [Render](https://render.com/), create an account, and click **New > Web Service**.
2. Connect your GitHub repository.
3. **IMPORTANT**: In the "Root Directory" field, type `ai_service`.
4. Render Configuration:
   * **Environment**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt` (I added gunicorn to your code so it's ready!)
   * **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120`
5. **Environment Variables**: Add a new variable:
   * `GEMINI_API_KEY` = `(Your Google Gemini key)`
6. Click **Create Web Service**. Wait 3-4 minutes for it to build. Once live, copy its URL (e.g., `https://smartai-ai-service.onrender.com`).

---

## Step 3: Deploy Node Server (Render.com)
1. Go back to your Render Dashboard and click **New > Web Service**.
2. Connect the exact same GitHub repository again.
3. **IMPORTANT**: This time, for "Root Directory", type `server`.
4. Render Configuration:
   * **Environment**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node index.js`
5. **Environment Variables**: Add these exact keys:
   * `MONGO_URI` = `(Your MongoDB Connection String from Step 1)`
   * `JWT_SECRET` = `(Create a random secret password, e.g., my_super_secret_key_123)`
   * `FLASK_AI_SERVICE` = `(The URL you copied from Step 2)`
   * `PORT` = `5000`
6. Click **Create Web Service**. Once live, copy its URL (e.g., `https://smartai-server.onrender.com`).

---

## Step 4: Deploy Frontend Client (Vercel.com)
1. Go to [Vercel](https://vercel.com/) and create a free account.
2. Click **Add New > Project** and import your GitHub repository.
3. Click "Edit" next to "Root Directory" and select the `client` folder.
4. Open the **Environment Variables** dropdown and add:
   * `REACT_APP_API_BASE` = `(The Server URL you copied from Step 3, plus /api, like this: https://smartai-server.onrender.com/api)`
5. Click **Deploy**. Vercel will install dependencies and build your React app.
6. Once finished, click on the preview image. Congratulations! Your app is live.

---
**Note:** Free instances on Render spin down after 15 minutes of inactivity. The very first time you load the website or try to upload a resume after a period of inactivity, it might take 1-2 minutes for the servers to wake up. This is perfectly normal!
