# Deployment Guide: How End-Users Set Up the Local Node

When hosting DropVault publicly on the internet (e.g., on Vercel), other users visiting the site who want to **host/upload files** will need to run the local backend server on their own machines.

Here is how we package and distribute the backend to make it work seamlessly for end-users.

---

## 1. The Recipient User (Downloader)
- **Zero Installation Required**: Recipients do not need any backend setup or local node scripts.
- **Direct Streaming**: They simply open the share link (e.g., `https://dropvault.vercel.app/download/uuid?node=https://tunnel-address.localtunnel.me`). The browser automatically pulls file metadata and streams file downloads directly from the sender's local node via the public secure tunnel.

---

## 2. The Host User (Uploader)
To allow any visitor on the website to start hosting files from their own computer, we package the backend components using one of the following deployment strategies:

### Option A: The Desktop Helper ZIP (Recommended for simplicity)
We provide a small downloadable ZIP button on the "Local Node Offline" screen (e.g. `dropvault-desktop-helper.zip` hosted on the web server).
The ZIP contains:
1. `setup.bat` (Registry registration script)
2. `server.js`, `protocol-handler.js`, and `package.json`

**How the user works it:**
1. The user visits your hosted website.
2. The site detects the local node is offline and shows the setup overlay.
3. The user clicks **Download Desktop Helper** and extracts the ZIP.
4. They double-click `setup.bat` once. This runs the protocol registration script silently in the background.
5. From then on, whenever they visit the website, clicking **Launch Local Node** automatically boots the local server.

---

### Option B: The NPX CLI (Recommended for developers)
We publish the backend module to the npm registry as `dropvault-node`.

**How the user works it:**
1. The user opens their terminal and runs:
   ```bash
   npx dropvault-node --setup
   ```
2. This automatically downloads the code, installs dependencies, and registers the `dropvault://` protocol handler on their system.
3. They can now close the terminal and control launching entirely from the web browser interface.

---

### Option C: Standalone Electron / Tauri Desktop Client
Instead of hosting only as a website, we package the entire project into a desktop application installer (`DropVault.exe` / `DropVault.dmg`).

**How the user works it:**
1. The user downloads and installs the desktop app.
2. When opened, the app starts the Express server node in the background and displays the web frontend inside the desktop window frame.
3. This creates a fully native experience while keeping all operations local to the client's machine.
