# Guide: How to Publish "dropvault-node" to NPM for Free

Publishing public packages to the official Node Package Manager (npm) registry is **100% free**. This enables any user in the world to run your package instantly using the `npx` command.

Here is the step-by-step publishing guide.

---

## Step 1: Create a Free NPM Account
1. Go to [npmjs.com/signup](https://www.npmjs.com/signup).
2. Sign up for a free public account.
3. Verify your email address (NPM requires verified emails before publishing).

---

## Step 2: Log In via the Terminal
Open your terminal in the backend directory (`k:/projects/sydions-scheduler-task3/backend`) and run:
```bash
npm login
```
This will open a browser window to authenticate your terminal session.

---

## Step 3: Handle Package Name Availability
NPM names must be unique. If the name `"dropvault-node"` is already registered by another user, you can publish it as a **scoped package** under your own username:

1. Open `backend/package.json` and change the name field:
   ```json
   "name": "@your-npm-username/dropvault-node"
   ```
2. Your users will then run the tool using your scoped command name:
   ```bash
   npx @your-npm-username/dropvault-node --setup
   ```

---

## Step 4: Publish Your Package
Run the following command inside the `backend/` folder:
```bash
npm publish --access public
```
*(The `--access public` flag is required for scoped packages to ensure they are published as free public packages).*

---

## Step 5: Verify and Run
Once published successfully, any visitor to your web app can launch the backend by running:
```bash
npx dropvault-node --setup
```
*(Or your scoped equivalent `npx @your-npm-username/dropvault-node --setup`)*
