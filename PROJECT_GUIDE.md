# SheetForge — Sheet Metal Manufacturing Management System (MES / ERP)

## 📌 Project Overview
**SheetForge** is an end-to-end Sheet Metal Manufacturing Management System designed for precision sheet fabrication, shop-floor control, and client quoting:
1. **Core Java OOP Engine**: Implements the manufacturing algorithms (cost estimation, sheet nesting, process pipelines, inventory decrement, machine scheduling).
2. **MySQL 8.0 Relational Database**: 12 normalized tables enforcing referential integrity, check constraints, and stock tracking.
3. **Dual-Portal Web Application**: 
   - **Factory Owner & Admin Portal**: Full workshop control, production pipeline, material inventory, machine status, staff scheduling, and customer directory.
   - **Customer & Client Portal**: Available materials catalog, interactive part & quantity calculator, and instant fabrication quote generation.

---

## 🚀 How to Run the Project on Localhost

### 1. Launch the Web System
Open Terminal in the project root and run:
```bash
npm start
# OR: node web/server.js
```
Then open your browser at:
👉 **`http://localhost:3001`** *(or `http://localhost:3000`)*

---

### 2. The Two Portals (Login Gateway)

When you open the web application, you are greeted with the **Authentication Gateway**:

#### A. 🏭 Factory Owner & Management Login
- **Username / ID:** `admin`
- **Password:** `admin`
- **Full Capabilities:**
  - **Factory Overview**: Live KPIs (Active Orders, Machine Utilization %, Low Stock Warnings, Workshop Revenue).
  - **Production Orders**: Start/Complete production runs, track pipeline steps (`Cutting` → `Bending` → `Punching` → `Welding` → `Finishing`), create new orders.
  - **Raw Material Inventory**: View and add new sheet materials, track stock, "+ Restock (10 Sheets)", and inspect the `INVENTORY_TRANSACTION` audit ledger.
  - **Machinery & Staff**: Monitor machine statuses (`AVAILABLE`, `IN USE`, `UNDER MAINTENANCE`), view staff operators and scheduled bookings.
  - **Customer Directory**: View all registered fabrication clients and their contact details.
  - **Engineering Sheet Estimator**: Full calculator for internal cost breakdown and 2D nesting simulator.

#### B. 👤 Customer & Client Portal
- **Onboarding:** Enter Name, Company, Phone, and Email to access client tools.
- **Client Capabilities:**
  - **Available Materials Catalog**: View metal grades in stock (Mild Steel, Aluminium, Stainless Steel, Galvanised Iron, Copper), available thicknesses (0.8mm to 3.0mm), sheet sizes (2400×1200mm), and prices.
  - **Component Quantity & Sheet Estimator**: Enter Part Length, Width, Quantity, and Wastage % to see total sheet plates required, parts per sheet, material efficiency, and a 2D nesting simulation.
  - **Instant Fabrication Quote**: Choose metal type, enter dimensions, select required fabrication processes (`Cutting`, `Bending`, `Welding`, `Punching`, `Finishing`), and generate an immediate price quote with 1-click **"Submit Order & Request Quote"**.
  - **My Orders & Quotes**: Live order status tracker showing production progression.

---

### 3. Run the Java Console Application (with MySQL Integration)
The Java application connects to MySQL via JDBC using `mysql-connector-j` located in `lib/`:
```bash
# Set your MySQL password in the environment
export DB_PASSWORD="your_mysql_password"

# Compile all classes (including DatabaseManager)
javac -cp "lib/mysql-connector-j-8.4.0.jar:src" -d out src/*.java

# Run the console application with JDBC connector
java -cp "lib/mysql-connector-j-8.4.0.jar:out" Main
```
*(If `DB_PASSWORD` is not set, it runs gracefully in local in-memory mode without errors).*

---

### 4. Import the MySQL Database
```bash
mysql -u root -p < sheetforge.sql
```

---

### 5. Test Java to MySQL JDBC Demo
```bash
export DB_PASSWORD="your_mysql_password"
java -cp "lib/mysql-connector-j-8.4.0.jar:." JavaMySQLDemo.java
```
