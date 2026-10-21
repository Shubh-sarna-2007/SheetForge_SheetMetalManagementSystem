# SheetForge — Sheet Metal Manufacturing Management System (MES / ERP)

[![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

**SheetForge** is a production-grade Sheet Metal Manufacturing Execution System (MES) and enterprise resource planning tool. It bridges core industrial engineering algorithms with a real-time relational database and an interactive web portal for factory managers, shop-floor operators, and fabrication clients.

---

## 📑 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Technology Stack](#-technology-stack)
- [Project Folder Structure](#-project-folder-structure)
- [Prerequisites](#-prerequisites)
- [Database Setup (MySQL 8.0+)](#-database-setup-mysql-80)
- [Environment Configuration](#-environment-configuration)
- [Installation & Setup](#-installation--setup)
- [Running on Windows](#-running-on-windows)
  - [Option A: Dual-Portal Web System](#option-a-dual-portal-web-system)
  - [Option B: Java Console Application (JDBC)](#option-b-java-console-application-jdbc)
  - [Option C: Standalone JDBC Verification Demo](#option-c-standalone-jdbc-verification-demo)
- [Running on macOS / Linux](#-running-on-macos--linux)
- [Application Portals](#-application-portals)
- [Testing & Verification](#-testing--verification)
- [Troubleshooting](#-troubleshooting)

---

## 🔍 Overview & Architecture

SheetForge consists of three cohesive layers:

1. **Industrial OOP Engine (Java)**:
   - Dynamic sheet metal requirement & scrap calculation (`CostCalculator`).
   - Multi-stage manufacturing pipelines: `Cutting` (₹50) → `Bending` (₹30) → `Punching` (₹40) → `Welding` (₹70) → `Finishing` (₹35).
   - Automated inventory deduction and machine state transitions (`ProductionOrder`, `Machine`, `RawMaterial`).
   - Parameterized JDBC persistence (`DatabaseManager`).

2. **Relational Database (MySQL 8.0)**:
   - 12 normalized tables (`CUSTOMER`, `SUPPLIER`, `RAW_MATERIAL`, `PRODUCT`, `PRODUCTION_ORDER`, `ORDER_PROCESS`, `MACHINE`, `STAFF`, `MACHINE_BOOKING`, `MANUFACTURING_PROCESS`, `INVENTORY_TRANSACTION`, `SHEET_CALCULATION`).
   - Strict referential integrity, foreign keys, and check constraints (`QuantityInStock >= 0`, `SellingPrice >= 0`).

3. **Real-Time Web Application (Node.js & Vanilla Web Components)**:
   - RESTful API server with connection pooling (`mysql2/promise`).
   - Factory Owner / Management Dashboard for real-time shop-floor monitoring.
   - Self-service Customer Portal for custom dimension entry, 2D nesting previews, and instant quote generation.

---

## 💻 Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Core Engine** | Java (JDK 17+) | Pure OOP with Exception Handling, Pipelines & JDBC |
| **JDBC Driver** | MySQL Connector/J 8.4.0 | Included in `lib/mysql-connector-j-8.4.0.jar` |
| **Backend API** | Node.js (v18+) | HTTP server with parameterized MySQL queries |
| **Database** | MySQL Server 8.0+ | Relational schema with normalized relational integrity |
| **Frontend UI** | HTML5 / Modern CSS / JS | Zero-dependency, responsive factory dashboard & client portal |

---

## 📂 Project Folder Structure

```text
SheetForge_SheetMetalManagementSystem/
├── .env.example              # Template environment variables (copy to .env)
├── .gitignore                # Git exclusions (build artifacts, caches, secrets)
├── PROJECT_GUIDE.md          # Reference guide and viva presentation notes
├── README.md                 # Project documentation
├── db.properties.example     # Template JDBC configuration for Java standalone
├── lib/
│   └── mysql-connector-j-8.4.0.jar  # Bundled MySQL JDBC Driver
├── package.json              # Node.js project manifest & start script
├── package-lock.json         # Pinned dependency tree
├── sheetforge.sql            # Complete database schema DDL & seed data
├── src/                      # Java source code
│   ├── Bending.java
│   ├── CostCalculator.java
│   ├── CustomProduct.java
│   ├── Customer.java
│   ├── Cutting.java
│   ├── DatabaseManager.java  # Parameterized JDBC persistence manager
│   ├── Finishing.java
│   ├── InsufficientMaterialException.java
│   ├── InvalidQuantityException.java
│   ├── Machine.java
│   ├── MachineBooking.java
│   ├── MachineUnavailableException.java
│   ├── Main.java             # Interactive CLI application
│   ├── ManufacturingProcess.java
│   ├── ProcessPipeline.java
│   ├── ProductionOrder.java
│   ├── Punching.java
│   ├── RawMaterial.java
│   ├── Staff.java
│   ├── Supplier.java
│   ├── Test.java             # OOP unit verification suite
│   ├── ValidationUtil.java
│   └── Welding.java
├── JavaMySQLDemo.java        # Standalone JDBC connectivity test script
└── web/                      # Web portal & API backend
    ├── db-test.js            # Node.js database connectivity verification
    ├── server.js             # REST API server & static asset dispatcher
    └── public/
        └── index.html        # Unified Factory Owner & Customer Single-Page App
```

---

## ⚙️ Prerequisites

Before running the application, ensure the following are installed on your machine:

1. **Java Development Kit (JDK 17 or higher)**:
   - Check version: `java -version` and `javac -version`
2. **Node.js (v18 or higher)** & **npm**:
   - Check version: `node -v` and `npm -v`
3. **MySQL Server 8.0 or higher**:
   - Verify MySQL service is running on port `3306`.

---

## 🗄️ Database Setup (MySQL 8.0+)

1. Start your local MySQL service.
2. Open terminal / command prompt and import the complete schema and seed records:

```bash
# Log in and import the database script
mysql -u root -p < sheetforge.sql
```

*Alternatively, open **MySQL Workbench**, create a query tab, open `sheetforge.sql`, and execute the entire script.*

The script will automatically create:
- The database `sheetforge`.
- 12 tables with constraints and indexes.
- Pre-seeded raw materials, machines, processes, staff, and initial demo records.

---

## 🔐 Environment Configuration

1. In the project root, create your local configuration by copying `.env.example`:

**On Windows (Command Prompt):**
```cmd
copy .env.example .env
```

**On Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**On macOS / Linux:**
```bash
cp .env.example .env
```

2. Open `.env` and set your MySQL password:
```ini
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sheetforge
DB_USER=root
DB_PASSWORD=your_actual_password_here
PORT=3000
```

*(Optional for Java)*: If you prefer using `db.properties` for the Java application, copy `db.properties.example` to `db.properties` and fill in your password.

---

## 📦 Installation & Setup

Install the required Node.js backend dependencies:

```bash
npm install
```

---

## 🪟 Running on Windows

### Option A: Dual-Portal Web System

1. Open **Command Prompt** (cmd) or **PowerShell** in the project root directory.
2. Set your database credentials and start the server:

**Using Command Prompt (cmd.exe):**
```cmd
set DB_PASSWORD=your_actual_password_here
npm start
```

**Using PowerShell:**
```powershell
$env:DB_PASSWORD="your_actual_password_here"
npm start
```

3. Open your browser and navigate to:
👉 **`http://localhost:3000`** *(or `http://localhost:3001` if port 3000 is occupied)*

---

### Option B: Java Console Application (JDBC)

The Java application can be compiled and executed directly from Windows Command Prompt or PowerShell.

> **Note for Windows:** The classpath separator on Windows is a **semicolon (`;`)**, not a colon (`:`).

**Using Command Prompt (cmd.exe):**
```cmd
:: 1. Set environment variable
set DB_PASSWORD=your_actual_password_here

:: 2. Compile all Java classes into 'out' directory
javac -cp "lib/mysql-connector-j-8.4.0.jar;src" -d out src/*.java

:: 3. Run the interactive console system
java -cp "lib/mysql-connector-j-8.4.0.jar;out" Main
```

**Using PowerShell:**
```powershell
# 1. Set environment variable
$env:DB_PASSWORD="your_actual_password_here"

# 2. Compile all Java classes into 'out' directory
javac -cp "lib/mysql-connector-j-8.4.0.jar;src" -d out src/*.java

# 3. Run the interactive console system
java -cp "lib/mysql-connector-j-8.4.0.jar;out" Main
```

*(Note: If `DB_PASSWORD` is omitted, the Java application will automatically fall back to local in-memory simulation mode without crashing).*

---

### Option C: Standalone JDBC Verification Demo

To verify that Java connects to your MySQL database on Windows:

**Command Prompt (cmd.exe):**
```cmd
set DB_PASSWORD=your_actual_password_here
java -cp "lib/mysql-connector-j-8.4.0.jar;." JavaMySQLDemo.java
```

**PowerShell:**
```powershell
$env:DB_PASSWORD="your_actual_password_here"
java -cp "lib/mysql-connector-j-8.4.0.jar;." JavaMySQLDemo.java
```

---

## 🍎 Running on macOS / Linux

**Start Web Portal:**
```bash
DB_PASSWORD="your_actual_password_here" npm start
```

**Compile and Run Java:**
```bash
export DB_PASSWORD="your_actual_password_here"
javac -cp "lib/mysql-connector-j-8.4.0.jar:src" -d out src/*.java
java -cp "lib/mysql-connector-j-8.4.0.jar:out" Main
```

---

## 🖥️ Application Portals

When accessing the web dashboard at `http://localhost:3000`, choose from two portals:

### 1. 🏭 Factory Owner & Management Portal
- **Default Login Credentials:**
  - **Username / ID:** `admin`
  - **Password:** `admin`
- **Capabilities:**
  - **Factory Overview**: Active Orders, Production Volume, Low Stock Alerts, and Machine Utilization.
  - **Production Queue**: Transition orders across stages (`Cutting` → `Bending` → `Welding` → `Finishing`).
  - **Inventory Management**: View raw sheet inventory, add sheets, 1-click restock (+10 sheets), and view transaction audit logs.
  - **Machine & Staff Scheduling**: Track live status of CNC laser cutters, press brakes, punch presses, and assign qualified operators.
  - **Customer Directory**: Registered fabrication clients and payment reconciliation.
  - **Engineering Sheet Estimator**: Cost estimation and 2D nesting simulation.

### 2. 👤 Fabrication Client / Customer Portal
- **Onboarding:** Enter Name, Company, Phone, and Factory Address.
- **Capabilities:**
  - **Available Materials**: Real-time stock levels of CRCA, Stainless Steel, Aluminium, GI, and Brass sheets.
  - **Sheet & Part Calculator**: Compute required sheet counts based on dimensions, margins, and scrap allowance.
  - **Instant Fabrication Quote**: Select processes, review live calculated pricing, and submit custom orders directly to the production queue.

---

## 🧪 Testing & Verification

### 1. In-Memory Java OOP Unit Verification
Runs unit tests verifying inheritance, custom exceptions, dynamic pricing, and stock deductions without needing a database:

**Windows:**
```cmd
java -cp "out" Test
```

**macOS / Linux:**
```bash
java -cp out Test
```

### 2. Web API Database Verification
Tests database connectivity from Node.js:
```bash
node web/db-test.js
```

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `java.lang.ClassNotFoundException: com.mysql.cj.jdbc.Driver` | MySQL Connector JAR is not in the classpath. | Ensure `lib/mysql-connector-j-8.4.0.jar` is included with `;` separator on Windows or `:` on Linux/macOS. |
| `Access denied for user 'root'@'localhost'` | Incorrect MySQL password. | Verify your password and ensure `DB_PASSWORD` matches your local MySQL root password. |
| `EADDRINUSE: address already in use :::3000` | Port 3000 is occupied by another process. | Set `PORT=3001` in your environment or terminate the process using port 3000 (`netstat -ano \| findstr :3000` on Windows). |
| `Communications link failure` | MySQL Server service is stopped. | Open Windows Services (`services.msc`) and start `MySQL80` (or `net start mysql`). |
| Windows path or classpath syntax error | Using UNIX colon (`:`) separator on Windows. | Use semicolons (`;`) in classpath strings on Windows: `-cp "lib/mysql-connector-j-8.4.0.jar;out"`. |

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
