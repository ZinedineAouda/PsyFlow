# PsyFlow - Patient Management & Genogram Maker

PsyFlow is a modern, lightweight Electronic Health Record (EHR) and Genogram authoring tool. It uses RFID card scanning to quickly access patient records, and includes a full-featured SVG-based vector Genogram drawing application.

## Prerequisites
- **Node.js**: Required to run the backend server.
- **PostgreSQL**: A running instance of PostgreSQL is required to store patient data, visits, and genograms.

## Setup Instructions

1. **Install Dependencies**
   Navigate to the `psyflow` directory and install the required npm packages:
   ```bash
   npm install
   ```

2. **Database Configuration**
   Ensure your PostgreSQL server is currently running.
   Open the `.env` file in the root of the `psyflow` directory and configure your Database URL:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/psyflow
   PORT=5000
   ```
   *(Update the username `postgres`, password `postgres`, and database name `psyflow` to appropriately match your local PostgreSQL configuration.)*

3. **Start the Application**
   Run the following command to start the backend server:
   ```bash
   npm start
   ```
   The backend will automatically initialize the database schema for you if it is empty.

4. **Access the Application**
   Open your browser and navigate to:
   [http://localhost:5000](http://localhost:5000)

## Features
- **Dashboard**: Track your clinic's patient metrics in real-time.
- **RFID Scanning**: "Read Card" functionality immediately fetches the respective patient's profile from the database.
- **Patient Profiles**: Store notes, visits, file documents, and view registered Genograms.
- **Advanced Genogram Maker**:
  - Drag and drop intuitive interface.
  - Automatic relationship management (Family, Children, Emotional links).
  - Direct straight-line adjustable child relationship vectors.
  - Double-click edge interactions for comprehensive visual relation configurations (Marriage, Divorce, Hostility, etc.).
  - Exports directly to PNG or saves continuously to a target Patient Profile.
