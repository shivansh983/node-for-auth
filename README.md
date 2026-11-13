# Upload API

A small Express server that accepts file uploads from the NativeUpload mobile
app and serves them back. Files are stored on disk.

Accepts PDF, DOC, DOCX and TXT, up to a configurable size limit.

## Endpoints

| Method | Route          | Description                                |
| ------ | -------------- | ------------------------------------------ |
| `GET`  | `/`            | health check                               |
| `POST` | `/api/upload`  | upload one file in a `file` form field     |
| `GET`  | `/api/upload`  | list everything uploaded                   |
| `GET`  | `/uploads/...` | download or view a stored file             |

A successful upload returns:

```json
{
  "message": "File uploaded!",
  "file": {
    "name": "report.pdf",
    "savedAs": "1794556697651-report.pdf",
    "size": 1312442,
    "url": "/uploads/1794556697651-report.pdf"
  }
}
```

Rejections return `{ "error": "..." }` with a 400, which the app shows to the
user as is.

## Running with Docker

```bash
cp .env.example .env
docker compose up -d
```

That's it. The server is on `http://localhost:5000`, and on
`http://<your-lan-ip>:5000` for phones on the same Wi-Fi.

```bash
docker compose logs -f    # watch requests
docker compose down       # stop, keeping uploaded files
docker compose down -v    # stop and delete uploaded files
```

### Configuration

Everything configurable lives in `.env`. Change a value and run
`docker compose up -d` again — **no rebuild needed**.

| Variable        | Default | What it does                               |
| --------------- | ------- | ------------------------------------------ |
| `HOST_PORT`     | `5000`  | port on the host, what clients connect to  |
| `PORT`          | `5000`  | port inside the container                  |
| `MAX_UPLOAD_MB` | `10`    | largest file accepted                      |

`HOST_PORT` and `PORT` are separate on purpose. To serve on 8080 while Node
keeps listening on 5000 inside:

```
HOST_PORT=8080
PORT=5000
```

Only `HOST_PORT` changes the address clients use.

### Uploaded files

They live in a named Docker volume mounted at `/app/uploads`, so they survive
container restarts, rebuilds and upgrades. `docker compose down -v` is the only
command that deletes them.

## Running without Docker

```bash
npm install
node server.js
```

Needs Node 20+. Reads the same `.env`.

## Notes

- `server.js` binds `0.0.0.0`, so the server is reachable from other devices on
  the network, not just localhost.
- The upload route has **no authentication**. The auth routes exist
  (`routes/authRoutes.js`, `middleware/authMiddleware.js`) but are commented out
  in `server.js` for local testing. Re-enable them before exposing this beyond a
  trusted network.
- Uploads are also served publicly from `/uploads`, so anyone with a URL can
  read a file.
- `fileFilter` accepts a file when either its MIME type or its extension
  matches, because Android often sends `application/octet-stream` for `.docx`.
