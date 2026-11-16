# Upload API

Express + Sequelize + PostgreSQL. Takes file uploads from the **NativeUpload**
app, stores each file on disk and a row about it in Postgres, and serves the
files back so the app can view them.

App repo: https://github.com/shivansh983/native-wind

Accepts PDF, Word, Excel, PowerPoint, images and text, up to a configurable
size limit.

---

## Quick start (Docker — recommended for testing)

You only need Docker Desktop. Postgres comes with it, nothing to install.

```bash
git clone https://github.com/shivansh983/node-for-auth.git
cd node-for-auth
cp .env.example .env
docker compose up -d --build
```

That builds the API, starts Postgres, creates the `files` table and serves on
`http://localhost:5000`.

Check it:

```bash
curl http://localhost:5000/
# {"message":"Upload server is running!"}
```

### Pointing the phone at it

The phone and the computer must be on the **same Wi-Fi**.

1. Find the computer's Wi-Fi IP:
   - Windows: `ipconfig` → *IPv4 Address* under your Wi-Fi adapter
   - macOS/Linux: `ipconfig getifaddr en0` or `hostname -I`
2. Open the app → **Config** tab → enter `http://<that-ip>:5000` → **Test**,
   then **Save**.

If **Test** says nothing replied, it is almost always the firewall. On Windows,
allow inbound TCP 5000 once:

```powershell
New-NetFirewallRule -DisplayName "Upload API 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

### Handy commands

```bash
docker compose logs -f api     # watch requests
docker compose down            # stop, keep the data
docker compose down -v         # stop and wipe files + database
```

---

## Running without Docker

Needs **Node 20+** and a **PostgreSQL** server you can log into.

```bash
npm install
cp .env.example .env     # then put your real postgres password in it
npm run db:create        # creates the database named in DB_NAME
npm run db:migrate       # creates the files table
npm run db:seed          # optional, three sample files
npm run dev              # or: npm start
```

`db:create` is only needed on the non-Docker path — the Docker image creates
the database itself. Migrations run on every container start, so Docker needs
none of this.

---

## Configuration

Everything lives in `.env`. Copy `.env.example` and edit it.

| Variable        | Default         | What it does                                        |
| --------------- | --------------- | --------------------------------------------------- |
| `HOST_PORT`     | `5000`          | port on your computer — what the phone connects to  |
| `PORT`          | `5000`          | port Node listens on inside the container           |
| `MAX_UPLOAD_MB` | `10`            | largest file accepted                               |
| `DB_NAME`       | `native_upload` | database name                                       |
| `DB_USERNAME`   | `postgres`      | database user                                       |
| `DB_PASSWORD`   | `postgres`      | database password                                   |
| `DB_HOST`       | `localhost`     | non-Docker path only — where your own Postgres runs  |
| `DB_PORT`       | `5432`          | non-Docker path only — port it listens on           |
| `DB_DIALECT`    | `postgres`      | Sequelize dialect                                   |
| `DB_HOST_PORT`  | `5433`          | Docker only — look into the container's Postgres    |
| `DB_HOST_DOCKER` | *(blank)*      | Docker only — blank uses the bundled Postgres, or set your own host |
| `DB_PORT_DOCKER` | *(blank)*      | Docker only — port of that database, blank means `5432` |
| `DB_LOGGING`    | `false`         | `true` prints every SQL query                       |

Two notes that save time:

- **`DB_HOST` is the one to get right.** Running Node yourself, it is
  `localhost`. With Docker it is ignored — compose uses `DB_HOST_DOCKER`, and
  falls back to the `db` service when that is blank. So one `.env` works on
  both paths and you do not have to keep editing it.
- **`DB_HOST_PORT` is 5433 on purpose.** If you already have Postgres installed
  on 5432, publishing the container on 5432 too would fail to start. Connect
  pgAdmin to `localhost:5433` to inspect the container's database.

### Looking at the data

```bash
docker compose exec db psql -U postgres -d native_upload -c "select * from files;"
```

---

## Hosting it against your own Postgres

The quick start brings its own Postgres, which is what you want for testing. On
a real server you probably already have a database — RDS, Neon, Supabase, or one
your team runs. Point the API at that instead of running a second Postgres.

1. Create an empty database on it first. Docker runs the migrations, not
   `db:create`, so the database has to exist already — the `files` table does
   not, that gets created for you.

2. Put the details in `.env`. The last two are the ones that matter — with
   Docker they are read instead of the `db` service:

   ```bash
   DB_NAME=native_upload
   DB_USERNAME=your_user
   DB_PASSWORD=your_password

   DB_HOST_DOCKER=your-db-host.example.com
   DB_PORT_DOCKER=5432
   ```

3. Start the API on its own, so the bundled Postgres stays out of the way:

   ```bash
   docker compose up -d --build --no-deps api
   ```

   `--no-deps` is the part to remember. Without it compose starts the `db`
   container too, because the API still depends on it for the testing path.

4. Watch the first boot. Migrations run on every start, so the `files` table
   turns up in your database on its own:

   ```bash
   docker compose logs -f api
   ```

If it does not come up, it is usually one of these three:

- **SSL.** Managed Postgres normally insists on it, and `config/db.js` sends no
  SSL options at all. Add `dialectOptions` there if your provider refuses the
  connection.
- **The database name.** `DB_NAME` has to match a database that already exists,
  spelled exactly.
- **Firewall.** The database has to allow connections from the server's IP, not
  only from your laptop.

To go back to the bundled Postgres, blank out `DB_HOST_DOCKER` and
`DB_PORT_DOCKER` and run `docker compose up -d` as usual. Nothing else changes.

Two things this still does not do for you: there is **no authentication** (see
Notes at the bottom), and `HOST_PORT` publishes the API straight onto the host,
so put it behind nginx or a load balancer before anyone outside can reach it.

---

## Endpoints

| Method   | Route                     | Description                                   |
| -------- | ------------------------- | --------------------------------------------- |
| `GET`    | `/`                       | health check                                  |
| `POST`   | `/api/upload`             | upload one file in a `file` field, optional `name` field |
| `GET`    | `/api/upload`             | list every row, newest first                  |
| `PATCH`  | `/api/upload/:id`         | rename — `{ "name": "New name" }`             |
| `DELETE` | `/api/upload/:id`         | remove the row and the file                   |
| `GET`    | `/api/upload/preview/:name` | Office file converted to PDF for viewing    |
| `GET`    | `/uploads/...`            | download or view a stored file                |

A successful upload returns:

```json
{
  "message": "File uploaded!",
  "file": {
    "id": 2,
    "name": "Senior Demo File",
    "originalName": "sample.pdf",
    "savedAs": "Senior_Demo_File.pdf",
    "mimeType": "application/pdf",
    "size": 69,
    "uploadedAt": "2026-11-14T11:27:30.203Z",
    "renamedAt": "2026-11-14T11:27:30.203Z",
    "url": "/uploads/Senior_Demo_File.pdf"
  }
}
```

Errors return `{ "error": "..." }`, which the app shows to the user as is.

---

## The `files` table

Created by the migration in `migrations/`, mapped in `models/file.js`.

| Column          | Type          | Notes                                      |
| --------------- | ------------- | ------------------------------------------ |
| `id`            | serial        | primary key                                |
| `name`          | varchar       | the name the user typed — editable         |
| `original_name` | varchar       | what the file was called on the phone      |
| `saved_as`      | varchar       | the name on disk, unique                   |
| `mime_type`     | varchar       | as reported by the phone                   |
| `size`          | integer       | bytes                                      |
| `created_at`    | timestamptz   | when it was uploaded                       |
| `updated_at`    | timestamptz   | when it was last renamed                   |

### Renaming

The app asks for a name when a file is picked, and the **Rename** action on the
Files list changes it later. A rename updates `name` **and moves the file on
disk**, so `saved_as` and the `url` change with it. Collisions get a `-2`
suffix, and names are stripped of anything awkward for a filesystem.

---

## Notes

- `server.js` binds `0.0.0.0`, so the server is reachable from other devices on
  the network, not just localhost.
- **There is no authentication.** Anyone on the network can upload, rename,
  delete and read files. That is fine on a trusted Wi-Fi for testing; add auth
  before putting this anywhere public.
- `uploads/` is created on boot, so a fresh clone works with no setup.
- Uploaded files live in a Docker volume at `/app/uploads`, so they survive
  restarts and rebuilds. Only `docker compose down -v` deletes them.
- `fileFilter` accepts a file when either its MIME type or its extension
  matches, because Android often sends `application/octet-stream` for `.docx`.
- Office previews need LibreOffice. It is in the Docker image. Running Node
  yourself, install `soffice` or Office files will upload but not preview.
