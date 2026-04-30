# My Drive

A unified cloud storage client providing a seamless interface for multiple storage providers.

## Project Overview

This project is a full-stack application designed to aggregate and manage files from various cloud services like Google Drive, Microsoft OneDrive, Dropbox, and GitHub.

## Repository Structure

- **/client**: The frontend application built with React, Vite, and Tailwind CSS (or Vanilla CSS).
- **/backend**: The backend API services powered by Python.
- **/docs**: Documentation and architectural diagrams.

## Key Features

- **Multi-Account Integration**: Connect and manage files from Google Drive, OneDrive, and GitHub.
- **File Management**: Upload, download, move, share, and delete files across platforms.
- **Rich UI**: Interactive file explorer with grid/list views, context menus, and modals.
- **Security**: Secure authentication and protected routes.
- **Theming**: Support for dark and light modes.

## Development Setup

### Backend
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt`.
3. Run the application: `python app.py`.

### Client
1. Navigate to the `client` directory.
2. Install dependencies: `npm install`.
3. Start the development server: `npm run dev`.

## Deployment

The project includes Docker support for both the client and backend. Use `docker-compose up` from the root directory to start the entire stack.
