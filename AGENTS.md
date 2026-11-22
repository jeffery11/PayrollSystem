# AI Agent Guide for PayrollSystem

## Project overview
- This repository contains a payroll application with a Node/Express backend and a React frontend.
- Backend source lives under `backend/src/`.
- Frontend source lives under `frontend/`.
- There is no existing `README.md` or `.github/copilot-instructions.md` in this workspace.

## Key entrypoints
- Backend API server: `backend/src/app.js`
- Email config: `backend/src/config/email.js`
- Excel export logic: `backend/src/services/excelService.js`
- Bank file generation logic: `backend/src/services/bankService.js`
- Frontend SPA entrypoint: `frontend/src/index.js` and `frontend/src/app.js`

## Run commands
From the repository root:
- Start backend directly: `node backend/src/app.js`
- Start backend with watcher: `npx nodemon backend/src/app.js`
- Start frontend: `cd frontend && npm start`

> Note: The root `package.json` is backend-oriented but the main backend source file is in `backend/src/app.js`.

## Important conventions
- The backend is built as a single Express app in `backend/src/app.js`.
- Authentication, employee management, payroll processing, payslip generation, and leave management are all implemented in `backend/src/app.js`.
- The backend reads environment variables from `backend/.env` via `dotenv`.
- The frontend is a React application using `react-scripts`, `react-router-dom`, and component folders under `frontend/src/components/`.

## When editing code
- For new API endpoints, add them in `backend/src/app.js` unless the change clearly belongs in a dedicated backend module.
- Use `backend/src/config/email.js`, `backend/src/services/excelService.js`, and `backend/src/services/bankService.js` for email, Excel, and bank-related functionality.
- Avoid modifying generated or dependency folders such as `frontend/node_modules`.

## What is not present
- No repository-level documentation besides source files.
- No explicit test suite or test commands in `package.json` outside frontend `react-scripts test`.

## Suggested future customization
- Add `.github/copilot-instructions.md` for more detailed agent behavior once more repo conventions are confirmed.
