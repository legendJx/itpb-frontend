# ITPB – Frontend
 
> a baseball draft-and-season simulator where you spin a wheel to draft real MLB players and try to build a team that goes **162-0**.
 
**Status:** In development 
 
This repo contains the **frontend**. The simulation backend (Rust) lives in a separate repo: "https://github.com/ambmt/in-the-park-baseball.git" .
 
---
 
## What it does
 
- **Wheel-spin draft:** spin to get a random team and year (2016–2025) and pick a real player from that roster.
- **Build a 26-man roster:** fill every position across the draft.
- **Simulate a season:** send your roster to the backend and see how close you get to a perfect 162-0.
  
## Tech stack
 
| Area | Technology |
|------|------------|
| Language / framework | Javascript + React + Node.js |
| Styling | CSS, Tailwind |
| Communication with backend | planned |
| Tooling | npm |
 
Backend (separate repo, built by ambmt): Rust simulation engine with player data stored in SQLite.
 
## Getting started
 
### Prerequisites
 
- Node.js 20+
- npm
### Install and run
 
```bash
git clone https://github.com/legendJx/iptb-frontend.git
cd iptb-frontend
npm install
npm run dev
```
 
Then open http://localhost:3000.
 
## My role
 
I built the frontend: [e.g. the draft wheel, roster view, state management, and the connection to the backend]. My friend is building the Rust backend and the player database.
 
## How it fits together
 
```
[Frontend] <—— [socket / API] ——> [Rust backend] <——> [SQLite player data]
```
## Roadmap
 
- [x] Start and main menu
- [ ] Connection to backend
- [ ] Drafting screen
## Credits
 
- Player and team data: FanGraphs, BaseballReference, Baseball Savant
- Backend: [ambmt](https://github.com/ambmt)
