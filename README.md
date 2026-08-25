# Three Do List — Complete Fixed Version

This build contains the complete app:
- Tasks with photo proof verification.
- 30-level platform game.
- 15 characters with 1–15 hearts and working Buy/Select.
- 5 progressively stronger weapons.
- Multiple enemy types with HP bars.
- A different boss at the end of every level with increasing HP.
- Points shared between tasks and the game.

## Run locally
1. Install Node.js.
2. Run `npm install` in this folder.
3. Set `OPENAI_API_KEY` as a server environment variable. Optionally set `OPENAI_VISION_MODEL` (default: `gpt-4.1-mini`).
4. Run `npm start`.
5. Open `http://localhost:3000`.

The API key stays on the server and is never placed in browser JavaScript.

## V12 — game music + stronger AI verification
- Added an original high-energy arcade/chiptune level theme at `assets/level_theme.wav`.
- Music plays only while a level is active, loops, stops when returning to the level menu, and has an in-game mute button.
- Fixed JavaScript issues that could stop the game from initializing.
- Improved task verification prompt so a clear bed photo passes Take a Nap even without a person in it; clear gym/street/homework evidence is likewise accepted.
- Added `.env` support through `dotenv` so `OPENAI_API_KEY` is loaded automatically when the server starts.
- Added `/api/health` to make it easy to confirm that the server sees the AI key.

### Local verification setup
Create a `.env` file beside `server.js`:
`OPENAI_API_KEY=your_key_here`
`OPENAI_VISION_MODEL=gpt-4.1-mini`
Then run `npm install` and `npm start` again.


## V13 — Enemy attacks + paid heart refills
- Enemies now shoot projectiles at the player, with different speed/damage by enemy type.
- Flying enemies attack from the air.
- Bosses fire stronger projectiles, with attack speed increasing on later levels.
- When all character hearts are lost, the level enters Game Over instead of silently restarting.
- The player can spend **25 points per heart** to refill the selected character's hearts, then continue.
- The heart shop is available only inside the game; the rest of the app has no game music.

\n## V14 — Harder platforming combat
- Player bullets now have a bright, reliable visual tracer so shots are clearly visible.
- Added environmental hazards: spikes, fire/lava, low gates and pits.
- Added flying creatures above the player that drop bombs/projectiles.
- Hazards require different movement responses: jump over some, duck under others.
- Enemy contact damage scales into later levels.
- Regular enemy HP scales upward in later levels.

\n## V15 — Level flow + persistent hearts
- Added visible Restart button inside the game.
- Added a Level Complete screen with Restart Level, Next Level, and Levels buttons.
- Completing a level unlocks the next level and persists progress.
- Leaving a level no longer silently restores lost hearts.
- Game Over keeps the player at 0 hearts until they buy hearts for 25 points each or explicitly restart the level.

\n## V17 — Visible enemy fire + no free heart refill on Restart
- Enemy projectiles and falling bombs are now explicitly rendered in the game world.
- Bosses now fire visible ranged projectiles at the player.
- Flying enemies and their attacks are clearly visible from above.
- Restarting a level preserves the player's current heart count; it no longer refills hearts for free.
- If the player has 0 hearts, Restart keeps 0 hearts and the Heart Shop remains available. Buying a heart costs 25 points.

\n## V19 — Stable rollback from V17
This build is based on the known-working V17 code, not the broken V18 branch.
- Existing localStorage data keys are preserved.
- Enemy/flying projectiles remain visible.
- One hit removes exactly one heart.
- Restart preserves the current heart count; it does not refill hearts for free.
- Fire/hazard obstacles are short and kept away from the finish.


### Music
The game is configured to use `assets/sonic_adventure.mp3` if that file is supplied locally. If it is not present, it automatically falls back to the bundled `assets/level_theme.wav`. The copyrighted Sonic Adventure track is not bundled here.


## V21 safe fixes
- Daily task text now accepts spaces normally; the game's keyboard shortcuts no longer intercept typing inside inputs.
- Task text saves while typing (`input` event), not only after leaving the field.
- AI verification uses a configurable backend URL via `window.THREE_DO_API_URL`.
- The Express server supports optional CORS with `FRONTEND_ORIGIN` for GitHub Pages -> backend communication.
- AI verification remains server-side so the OpenAI API key is never exposed in the browser.

### Important for GitHub Pages
GitHub Pages can host the static frontend, but it cannot run `server.js` or keep `OPENAI_API_KEY` secret. The AI endpoint must therefore be deployed on a backend host (for example Render). Set:
- `OPENAI_API_KEY` = your API key
- `OPENAI_VISION_MODEL` = `gpt-5.6-luna` (or another vision-capable model available to your API project)
- `FRONTEND_ORIGIN` = your exact GitHub Pages URL

Then set `window.THREE_DO_API_URL` in the frontend to the backend URL.


## AI verification — the 4 supported tasks
The verifier accepts these four task categories:
1. Homework — proof should show homework/study papers, notebook, textbook, etc.
2. Hang Out — proof should show a recognizable street/outdoor/public environment.
3. Take a Nap — proof should show a bed, mattress, pillow/blanket or sleeping setup.
4. Workout — proof should show a gym/exercise environment or equipment.

### GitHub Pages + Render
1. Deploy this folder's `server.js` to Render as a Node Web Service.
2. Set `OPENAI_API_KEY` in Render Environment Variables.
3. Set `OPENAI_VISION_MODEL=gpt-5.6-luna`.
4. Set `FRONTEND_ORIGIN` to the exact GitHub Pages URL.
5. Put the Render service URL in `config.js` as `window.THREE_DO_API_URL`.
6. The API key must stay on Render; never put it in GitHub Pages files.

The OpenAI Responses API supports multimodal image analysis, and the platform currently lists GPT-5.6 Luna as a cost-sensitive model.


## V24 — Offline reference-image verification
No AI/API/backend is required for photo verification. The app compares the exact SHA-256 hash of the uploaded file against bundled reference images.
Eight generated reference images are included:
- Homework: accepted + rejected
- Hang Out: accepted + rejected
- Take a Nap: accepted + rejected
- Workout: accepted + rejected

Use the files in `verification-images/` to test the verifier. Only the exact accepted reference file for the matching task will verify; the exact rejected reference file is explicitly rejected, and all other images are rejected.
Game level progress is persisted in localStorage via `threeDoUnlockedLevels`, `threeDoCompletedLevels`, and `threeDoSelectedLevel`.
