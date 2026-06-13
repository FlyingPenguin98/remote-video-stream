# Streamio

A self-hosted media streaming server — a Plex alternative built for Raspberry Pi.

## Features

- HLS streaming with automatic hardware or software H.264 encoding
- Movies and TV shows with season/episode structure
- Automatic metadata from TMDb (posters, descriptions, ratings)
- Per-user accounts and playback progress tracking
- Resume where you left off
- React web UI — mobile and browser friendly
- Native Android app (phone, tablet, and Google TV)

---

## Raspberry Pi Setup

Tested on **Raspberry Pi 5 (4 GB)** and Raspberry Pi 4. See [Pi 4 vs Pi 5 notes](#pi-4-vs-pi-5-notes) for hardware encoder differences.

### 1. Install system dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ffmpeg git
```

**Install Node.js 20 LTS** (the version from `apt` is often too old):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should print v20.x.x
```

Verify ffmpeg works:

```bash
ffmpeg -version
ffprobe -version
```

### 2. Mount your external drive

Your media and database should live on the external drive, not the SD card.

```bash
# Find the drive device name (usually /dev/sda1)
lsblk

# Create mount point
sudo mkdir -p /mnt/external

# Mount it (replace /dev/sda1 with your device)
sudo mount /dev/sda1 /mnt/external

# Auto-mount on boot: get the UUID
sudo blkid /dev/sda1
# Copy the UUID value, then edit fstab:
sudo nano /etc/fstab
# Add a line like:
# UUID=your-uuid-here  /mnt/external  ext4  defaults,nofail  0  2
```

Create the required directories on the drive:

```bash
sudo mkdir -p /mnt/external/media/Movies
sudo mkdir -p /mnt/external/media/Shows
sudo mkdir -p /mnt/external/streamio-data
# Give your user ownership
sudo chown -R $USER:$USER /mnt/external/media /mnt/external/streamio-data
```

### 3. Clone and install

```bash
git clone https://github.com/FlyingPenguin98/remote-video-stream.git ~/streamio
cd ~/streamio
npm install
```

### 4. Configure environment

```bash
cp .env.example .env
nano .env
```

Fill in these required values:

| Variable | What to set |
|---|---|
| `MEDIA_ROOT` | `/mnt/external/media` |
| `DATA_DIR` | `/mnt/external/streamio-data` |
| `JWT_SECRET` | A random string, 32+ characters — run `openssl rand -hex 32` |
| `TMDB_API_KEY` | Free API key from [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |

Everything else can be left as the defaults initially.

### 5. Build

```bash
npm run build
```

### 6. Create your admin account

```bash
npm run create-user
# Enter a username, password (min 8 chars), and choose role: admin
```

### 7. Run

**Development (with live reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server starts on port 3000. Open `http://<pi-ip-address>:3000` from any browser on your network.

To find your Pi's IP address: `hostname -I`

### 8. Run as a systemd service (auto-start on boot)

```bash
# Copy the service file
sudo cp deploy/streamio.service /etc/systemd/system/

# Open it and verify the paths match your setup
sudo nano /etc/systemd/system/streamio.service

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable streamio
sudo systemctl start streamio

# Check it's running
sudo systemctl status streamio

# View logs
journalctl -u streamio -f
```

### 9. Scan your library

After adding media files, trigger a scan from the web UI (Settings → Admin → Scan Library) or via the API:

```bash
curl -X POST http://localhost:3000/api/library/scan \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Pi 4 vs Pi 5 Notes

| | Raspberry Pi 4 | Raspberry Pi 5 |
|---|---|---|
| CPU | Cortex-A72 (1.8 GHz) | Cortex-A76 (2.4 GHz) — ~2-3× faster |
| Hardware H.264 encoder | `h264_v4l2m2m` via `bcm2835-v4l2` module | Not available via the same path |
| Software encoding | Struggles at 720p | Handles 720p comfortably, decent at 1080p |
| Recommended encoding | Hardware preferred | Software encoding is fine |

### Pi 5 — hardware encoder module is not needed

The `bcm2835-v4l2` kernel module is specific to the VideoCore IV chip in the Pi 4 and earlier. It does not exist on the Pi 5 — do **not** try to load it.

The Streamio server auto-detects hardware encoder availability at startup. On Pi 5 it will fall back to software encoding (`libx264 -preset veryfast`) automatically. Given the Pi 5's faster CPU, this works well for typical home streaming workloads.

To confirm what the server detected, check the admin panel (Settings → Admin → System Info) or the startup log:

```bash
journalctl -u streamio | grep -i "hwaccel\|encoder"
```

### Pi 4 — enable hardware encoder

On Pi 4 you get better performance by enabling the V4L2 M2M hardware encoder:

```bash
# Load for this session
sudo modprobe bcm2835-v4l2

# Load automatically on every boot
echo 'bcm2835-v4l2' | sudo tee -a /etc/modules
```

Then restart the server. The admin panel will show `hwAccel: true`.

---

## Media folder layout

```
MEDIA_ROOT/
  Movies/
    Inception (2010).mkv
    The Dark Knight (2008).mkv
    Interstellar.2014.mkv
  Shows/
    Breaking Bad/
      Season 01/
        Breaking Bad S01E01.mkv
        Breaking Bad S01E02.mkv
    The Wire/
      The Wire S01E01.mkv
```

**Supported filename patterns:**
- Movies: `Title (Year).ext` or `Title.Year.ext`
- Episodes: any filename containing `S01E02` notation (case-insensitive)

Supported containers: `.mkv`, `.mp4`, `.avi`, `.m4v`

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `MEDIA_ROOT` | `./media` | Path to your media files |
| `DATA_DIR` | `./data` | DB, images, HLS segments — use external drive! |
| `JWT_SECRET` | — | Must be 32+ chars (`openssl rand -hex 32`) |
| `TMDB_API_KEY` | — | Free at themoviedb.org |
| `MAX_CONCURRENT_SESSIONS` | `2` | Simultaneous streams (raise if Pi 5) |
| `MAX_RESOLUTION` | `720` | Output height (720 or 1080) |
| `MAX_VIDEO_BITRATE` | `4000k` | Target encode bitrate |
| `HLS_SEGMENT_DURATION` | `6` | Seconds per HLS segment |
| `SCAN_CRON` | `0 */2 * * *` | Library rescan schedule |

---

## Android app

The Android app (`streamio-android/`) works on phones, tablets, and Google TV sticks. Build a debug APK via GitHub Actions (see `.github/workflows/android.yml`) or Android Studio.

On first launch, enter your Pi's IP address and port (e.g. `http://192.168.1.50:3000`). To explore the UI without a server, tap **Try Demo Mode**.

---

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Get JWT token |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/library/movies` | Paginated movie list |
| `GET` | `/api/library/shows` | Paginated show list |
| `GET` | `/api/library/shows/:id` | Show detail with seasons/episodes |
| `GET` | `/api/library/continue-watching` | Resume list |
| `POST` | `/api/stream/start` | Start HLS or direct-play session |
| `DELETE` | `/api/stream/:id` | Stop stream and clean up segments |
| `PUT` | `/api/progress` | Save playback position |
| `POST` | `/api/library/scan` | Trigger library scan (admin only) |
| `GET` | `/api/admin/system` | Hardware encoder status, disk info |

---

## Troubleshooting

**Server won't start — `better-sqlite3` native build error**

```bash
cd ~/streamio
npm rebuild better-sqlite3 --build-from-source
```

**ffmpeg not found**

```bash
which ffmpeg   # should print /usr/bin/ffmpeg
# If missing:
sudo apt install -y ffmpeg
```

**TMDb posters not showing**

Check your `TMDB_API_KEY` in `.env` and that the Pi has outbound internet access. Trigger a rescan after fixing it.

**Streams stutter or buffer**

- Lower `MAX_RESOLUTION` to `720` and `MAX_VIDEO_BITRATE` to `3000k` in `.env`
- Check CPU load: `htop` while a stream is running
- On Pi 4, verify the hardware encoder is active (admin panel)

**Can't reach the server from my phone**

- Confirm both devices are on the same Wi-Fi network
- Check the port isn't blocked: `sudo ufw allow 3000` (if ufw is active)
- Use `hostname -I` on the Pi to get the correct IP
