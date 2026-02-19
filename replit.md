# RFID Patient Manager

## Overview
A secure web application for psychologists to manage patient records using RFID cards. Each patient is linked to a unique RFID card UID. The application supports registration of new patients, scanning cards to view profiles, editing records, and managing patient data.

## Architecture
- **Backend**: Node.js + Express (server.js)
- **Frontend**: Vanilla HTML/CSS/JS with design token system (public/)
- **Database**: PostgreSQL (Replit built-in)
- **RFID**: USB readers work as keyboard wedge devices - the app accepts UID input via text field which works with both manual entry and USB RFID readers

## Project Structure
```
server.js              - Express server entry point
src/
  db/
    schema.sql         - Database schema
    database.js        - Database access layer (all queries)
  routes/
    patients.js        - REST API routes for patient CRUD
public/
  index.html           - Main application page (sidebar layout)
  css/style.css        - Design system (tokens, themes, components, animations, RTL)
  js/app.js            - Frontend application logic (theme, RFID state machine, CRUD)
  js/i18n.js           - Internationalization: translations (EN/AR/FR), RTL support
```

## Design System
- **Themes**: Light Medical (default) and Dark Medical, persisted in localStorage
- **Color tokens**: Primary, success, danger, warning, info — all via CSS custom properties
- **Typography**: Inter font, clear hierarchy (page titles, section headers, labels, hints)
- **Spacing**: Consistent token scale (xs through 2xl)
- **Layout**: Fixed sidebar navigation + scrollable main panel
- **Animations**: State-driven RFID scan animation (idle/scanning/found/notfound/error), modal transitions, skeleton loaders, reduced-motion support
- **Accessibility**: Focus-visible outlines, keyboard navigation, ARIA roles, screen reader labels

## Key Features
- **Dashboard**: Central entry point with stat cards (total patients, active/inactive cards, system status), last activity display, quick action buttons
- **Read Card (Unified Flow)**: Scan RFID card — if registered, shows patient profile; if unregistered, shows inline registration form to create a new patient
- **Management Mode**: Search, edit, deactivate/reactivate patients
- **Multi-language**: English, Arabic (RTL), French — language selector in sidebar, persisted in localStorage
- **Theme Toggle**: Light/dark mode switch in sidebar footer
- **RFID State Machine**: Visual feedback for idle, scanning, found, unknown, error states
- **Custom Fields**: Dynamic JSON fields for extensibility
- **Duplicate Prevention**: RFID UIDs are unique per patient

## Database Schema
- `patients` table with rfid_uid (unique), full_name, age, gender, diagnosis, notes, custom_fields (JSONB), is_active flag

## API Endpoints
- GET /api/patients/stats/dashboard - Dashboard statistics
- POST /api/patients/scan - Scan card UID
- POST /api/patients/register - Register new patient
- PUT /api/patients/:id - Update patient
- DELETE /api/patients/:id - Deactivate patient
- POST /api/patients/:id/reactivate - Reactivate patient
- GET /api/patients - List/search patients
- GET /api/patients/:id - Get single patient
- GET /api/patients/:id/visits - Get patient visits
- POST /api/patients/:id/visits - Create visit (with visit_date, notes)
- PUT /api/patients/:id/visits/:visitId - Update visit
- DELETE /api/patients/:id/visits/:visitId - Delete visit

## Running
- `node server.js` starts on port 5000

## Recent Changes
- 2026-02-19: Enhanced visit history — date picker for visits, inline edit/delete per visit with confirmation, translations in all 3 languages
- 2026-02-18: Merged Read Card and Register Card into unified flow — scan a card to view or register
- 2026-02-18: Added multi-language support (English, Arabic with RTL, French) with language selector in sidebar and full UI translation
- 2026-02-18: Added Dashboard as central entry point with stat cards, last activity, and quick actions
- 2026-02-18: Major UX/UI redesign — sidebar layout, design token system, light/dark themes, RFID state-driven animations, skeleton loaders, accessibility improvements, component library
- 2026-02-18: Initial build - full CRUD, RFID scanning, registration, management modes
