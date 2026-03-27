# RuleScope

RuleScope is a desktop app for browsing, searching, and outlining regulation documents. It is designed for structured policy files in Word, text, and PDF formats, with special support for Word auto-numbering recognition such as `Chapter 1`, `Article 1`, and `(1)` style headings.

[中文说明](./README.zh-CN.md)

## Highlights

- Desktop app built with Electron
- React + Ant Design frontend
- Embedded Express backend
- Upload and manage `.docx`, `.doc`, `.txt`, and `.pdf`
- Automatic outline extraction from Word numbering definitions
- In-document search and outline navigation
- Highlight collection with note support
- Chinese / English language switch
- Portable Windows build support

## Screenshots

![RuleScope screenshot](./assets/screenshots/rulescope-main.png)

## Download and Use the EXE

The recommended way for end users is to use the portable Windows package from GitHub Releases.

### Steps

1. Open the latest release on GitHub.
2. Download the portable package.
3. Extract the folder to any local directory.
4. Run `RuleScope.exe` or the packaged application executable inside the extracted folder.
5. Keep the executable and the `resources` folder together in the same directory.

### Notes for the portable version

- No installer is required.
- The app stores uploaded files and local metadata next to the portable executable during packaged usage.
- If you move the portable folder, move the entire folder together.
- Do not delete the `resources` folder or the locale files beside the executable.

## Development

### Requirements

- Node.js 18 or later recommended
- npm 8 or later

### Install dependencies

```bash
npm install
cd client
npm install
```

### Run in development

Backend:

```bash
npm start
```

Frontend:

```bash
cd client
npm start
```

Or run both:

```bash
npm run dev
```

### Build the frontend

```bash
cd client
npm run build
```

### Run Electron locally

```bash
npm run electron
```

## Project Structure

```text
client/                 React frontend
controllers/            Backend controllers
middleware/             Express middleware
models/                 Data models
routes/                 API routes
scripts/                Utility scripts
tests/                  Test files
utils/                  Document parsing utilities
main.js                 Electron entry
server-filemanager.js   Desktop backend entry
```

## Data Files

The packaged desktop app uses local JSON files and an upload directory during runtime:

- `db.json`
- `highlights.json`
- `uploads/`

These runtime files are not tracked in Git.

## License

MIT
