# Company Regulations Search Engine

A desktop document browser for internal regulations and policy documents. The app supports uploading Word, text, and PDF files, browsing versions, extracting Word auto-numbered outlines, searching inside documents, and collecting highlights.

## Features

- Electron desktop app with an embedded Express server
- React + Ant Design frontend
- Upload and manage `.docx`, `.doc`, `.txt`, and `.pdf` files
- Word auto-numbering recognition for headings such as `第一章`, `第一条`, `（一）`
- Structured outline generation from uploaded Word documents
- In-document search and quick outline navigation
- Highlight collection with notes and pinning
- Chinese / English UI language switch
- Portable desktop packaging support

## Project Structure

```text
client/                 React frontend
controllers/            Optional backend controllers
middleware/             Express middleware
models/                 Backend models
routes/                 API routes
scripts/                Utility scripts
tests/                  Test files
utils/                  Document extraction and processing utilities
main.js                 Electron entry
server-filemanager.js   Main backend used by the desktop app
loading.html            Startup loading page
```

## Tech Stack

- Electron
- Node.js
- Express
- React 18
- Ant Design
- Mammoth
- diff

## Local Development

### Requirements

- Node.js 18 or later recommended
- npm 8 or later

### Install

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

Or use the combined script from the root:

```bash
npm run dev
```

### Build frontend

```bash
cd client
npm run build
```

### Run Electron

```bash
npm run electron
```

## Data Files

The application uses local JSON files for metadata and highlights during desktop usage:

- `db.json`
- `highlights.json`
- `uploads/`

These files are intentionally excluded from version control and will be created locally when needed.

## Open Source Notes

- Sample business documents are not included in this repository.
- Local build outputs and packaged binaries are not included.
- Environment files such as `.env` are excluded from version control.

## License

MIT
