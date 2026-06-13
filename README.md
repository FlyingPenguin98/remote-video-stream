# Streamio

A self-hosted media streaming server — a Plex alternative built for Raspberry Pi 4.

## Features

- HLS streaming with hardware H.264 encoding (Pi 4 V4L2)
- Movies and TV shows with season/episode structure
- Automatic metadata from TMDb (posters, descriptions, ratings)
- Per-user accounts and playback progress tracking
- Resume where you left off
- React web UI — mobile and browser friendly

## Pi 4 Setup

### Prerequisites

```bash
sudo apt update && sudo apt install -y ffmpeg nodejs npm

# Enable hardware encoder kernel module
echo 'bcm2835-v4l2' | sudo tee -a /etc/modules
sudo modprobe bcm2835-v4l2
```

### Install

```bash
git clone https://github.com/FlyingPenguin98/remote-video-stream.git streamio
cd streamio
npm install
cp .env.example .env
# Edit .env with your MEDIA_ROOT, DATA_DIR, JWT_SECRET, TMDB_API_KEY
```

### Build

```bash
npm run build
```

### Create first admin account

```bash
npm run create-user
# Follow the prompts, choose role: admin
```

### Run (development)

```bash
npm run dev
```

### Run (production)

```bash
npm start
```

### Run as systemd service

```bash
sudo cp deploy/streamio.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now streamio
```

## Media folder layout

```
MEDIA_ROOT/
  Movies/
    Inception (2010).mkv
    The Dark Knight (2008).mkv
  Shows/
    Breaking Bad/
      Season 01/
        Breaking Bad S01E01.mkv
    The Wire/
      The Wire S01E01.mkv
```

Supported patterns:
- Movies: `Title (Year).ext` or `Title.Year.ext`
- Episodes: any filename containing `S01E02` notation

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `MEDIA_ROOT` | `./media` | Path to your media files |
| `DATA_DIR` | `./data` | DB, images, HLS segments (use external drive!) |
| `JWT_SECRET` | — | Must be 32+ chars |
| `TMDB_API_KEY` | — | Free at themoviedb.org |
| `MAX_CONCURRENT_SESSIONS` | `2` | Max simultaneous streams |
| `MAX_RESOLUTION` | `720` | Output height (720 or 1080) |
| `SCAN_CRON` | `0 */2 * * *` | Library rescan schedule |

## API

- `POST /api/auth/login` — get JWT token
- `GET /api/library/movies` — paginated movie list
- `GET /api/library/shows` — paginated show list
- `POST /api/stream/start` — start HLS session
- `PUT /api/progress` — save playback position
- `POST /api/library/scan` — trigger library scan (admin)
