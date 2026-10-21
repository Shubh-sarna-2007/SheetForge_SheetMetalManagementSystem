-- ============================================================
--  SheetForge - Sheet Metal Manufacturing Management System
--  Database : sheetforge
--  MySQL    : 8.0
--
--  HOW TO IMPORT
--  Open Terminal and run:
--  mysql -u root -p < sheetforge.sql
--
--  PASSWORD NOTE:
--  Never store plain passwords. Your Java application must
--  convert passwords to bcrypt hashes before saving them.
-- ============================================================


-- ============================================================
--  CREATE AND SELECT DATABASE
-- ============================================================

CREATE DATABASE IF NOT EXISTS sheetforge;

USE sheetforge;


-- ============================================================
--  TABLE 1 : CUSTOMER
--  Stores customer details.
--  One customer can place many production orders.
-- ============================================================

CREATE TABLE IF NOT EXISTS CUSTOMER (
    CustomerID    INT          NOT NULL AUTO_INCREMENT,
    Name          VARCHAR(100) NOT NULL,
    Company       VARCHAR(150) NOT NULL DEFAULT '',
    Phone         VARCHAR(15)  NOT NULL,
    Email         VARCHAR(100) NOT NULL,
    Address       VARCHAR(100) NOT NULL DEFAULT '',
    PaymentStatus VARCHAR(20)  NOT NULL DEFAULT 'PENDING',

    PRIMARY KEY (CustomerID),
    UNIQUE (Email)
);


-- ============================================================
--  TABLE 2 : USER_ACCOUNT
--  Stores login accounts for the application.
--  Role   : ADMIN, MANAGER, OPERATOR
--  Status : ACTIVE, INACTIVE
--  PasswordHash must be a bcrypt hash - never a plain password.
-- ============================================================

CREATE TABLE IF NOT EXISTS USER_ACCOUNT (
    UserID       INT          NOT NULL AUTO_INCREMENT,
    Username     VARCHAR(50)  NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role         VARCHAR(20)  NOT NULL DEFAULT 'OPERATOR',
    Status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',

    PRIMARY KEY (UserID),
    UNIQUE (Username)
);


-- ============================================================
--  TABLE 3 : RAW_MATERIAL
--  Stores sheet metal materials available in the workshop.
--  All dimensions stored in millimetres (mm).
--  Price stored in Indian Rupees (INR).
-- ============================================================

CREATE TABLE IF NOT EXISTS RAW_MATERIAL (
    MaterialID      INT            NOT NULL AUTO_INCREMENT,
    MaterialName    VARCHAR(150)   NOT NULL,
    MaterialType    VARCHAR(80)    NOT NULL,
    Thickness       DECIMAL(8, 3)  NOT NULL,
    LengthMM        DECIMAL(10, 3) NOT NULL,
    WidthMM         DECIMAL(10, 3) NOT NULL,
    QuantityInStock INT            NOT NULL DEFAULT 0,
    PricePerSheet   DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    ReorderLevel    INT            NOT NULL DEFAULT 10,

    PRIMARY KEY (MaterialID),
    CHECK (QuantityInStock >= 0),
    CHECK (PricePerSheet   >= 0),
    CHECK (Thickness        > 0),
    CHECK (LengthMM         > 0),
    CHECK (WidthMM          > 0)
);


-- ============================================================
--  TABLE 4 : PRODUCT
--  Stores the finished products that can be manufactured.
--  Each product is linked to the raw material it is made from.
--  All dimensions stored in millimetres (mm).
-- ============================================================

CREATE TABLE IF NOT EXISTS PRODUCT (
    ProductID    INT            NOT NULL AUTO_INCREMENT,
    ProductName  VARCHAR(150)   NOT NULL,
    Description  VARCHAR(250),
    MaterialID   INT            NOT NULL,
    LengthMM     DECIMAL(10, 3) NOT NULL,
    WidthMM      DECIMAL(10, 3) NOT NULL,
    Thickness    DECIMAL(8, 3)  NOT NULL,
    SellingPrice DECIMAL(12, 2) NOT NULL DEFAULT 0.00,

    PRIMARY KEY (ProductID),
    FOREIGN KEY (MaterialID) REFERENCES RAW_MATERIAL (MaterialID),
    CHECK (SellingPrice >= 0),
    CHECK (LengthMM      > 0),
    CHECK (WidthMM       > 0),
    CHECK (Thickness     > 0)
);


-- ============================================================
--  TABLE 5 : MACHINE
--  Stores machines available in the workshop.
--  Status : AVAILABLE, BOOKED, IN USE, UNDER MAINTENANCE
--  CostPerHour stored in INR.
-- ============================================================

CREATE TABLE IF NOT EXISTS MACHINE (
    MachineID   INT            NOT NULL AUTO_INCREMENT,
    MachineName VARCHAR(150)   NOT NULL,
    MachineType VARCHAR(80)    NOT NULL,
    Status      VARCHAR(30)    NOT NULL DEFAULT 'AVAILABLE',
    CostPerHour DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    PRIMARY KEY (MachineID),
    CHECK (CostPerHour >= 0)
);


-- ============================================================
--  TABLE 6 : STAFF
--  Stores workshop staff members.
--  Status : AVAILABLE, ASSIGNED, ON LEAVE
-- ============================================================

CREATE TABLE IF NOT EXISTS STAFF (
    StaffID INT          NOT NULL AUTO_INCREMENT,
    Name    VARCHAR(100) NOT NULL,
    Role    VARCHAR(80)  NOT NULL,
    Phone   VARCHAR(15)  NOT NULL,
    Status  VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE',

    PRIMARY KEY (StaffID)
);


-- ============================================================
--  TABLE 7 : MACHINE_BOOKING
--  Records when a machine is booked and which staff member
--  is assigned to operate it.
--  Depends on MACHINE and STAFF.
--  EndTime must always be after StartTime.
-- ============================================================

CREATE TABLE IF NOT EXISTS MACHINE_BOOKING (
    BookingID   INT         NOT NULL AUTO_INCREMENT,
    MachineID   INT         NOT NULL,
    StaffID     INT         NOT NULL,
    BookingDate DATE        NOT NULL,
    StartTime   TIME        NOT NULL,
    EndTime     TIME        NOT NULL,
    Status      VARCHAR(20) NOT NULL DEFAULT 'BOOKED',

    PRIMARY KEY (BookingID),
    FOREIGN KEY (MachineID) REFERENCES MACHINE (MachineID),
    FOREIGN KEY (StaffID)   REFERENCES STAFF   (StaffID),
    CHECK (EndTime > StartTime)
);


-- ============================================================
--  TABLE 8 : MANUFACTURING_PROCESS
--  Stores the types of manufacturing processes.
--  Maps to the Java subclasses:
--    Cutting   = 50 per unit
--    Bending   = 30 per unit
--    Punching  = 40 per unit
--    Welding   = 70 per unit
--    Finishing = 35 per unit
-- ============================================================

CREATE TABLE IF NOT EXISTS MANUFACTURING_PROCESS (
    ProcessID   INT            NOT NULL AUTO_INCREMENT,
    ProcessName VARCHAR(100)   NOT NULL,
    CostPerUnit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    PRIMARY KEY (ProcessID),
    UNIQUE (ProcessName),
    CHECK (CostPerUnit >= 0)
);


-- ============================================================
--  TABLE 9 : PRODUCTION_ORDER
--  A customer order to manufacture a specific product.
--  Stores the full cost breakdown from CostCalculator.java:
--    MaterialCost = PricePerSheet x sheets used
--    LabourCost   = hourly rate x hours worked
--    MachineCost  = CostPerHour x hours used
--    OtherCost    = overhead (10% of production cost)
--    TotalCost    = sum of all the above costs
--    FinalPrice   = TotalCost x 1.20  (20% profit)
--  Status : PENDING, IN PRODUCTION, COMPLETED, CANCELLED
--  Depends on CUSTOMER and PRODUCT.
-- ============================================================

CREATE TABLE IF NOT EXISTS PRODUCTION_ORDER (
    OrderID          INT            NOT NULL AUTO_INCREMENT,
    CustomerID       INT            NOT NULL,
    ProductID        INT            NOT NULL,
    RequiredQuantity INT            NOT NULL DEFAULT 1,
    OrderDate        DATE           NOT NULL DEFAULT (CURRENT_DATE),
    DueDate          DATE,
    Status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    MaterialCost     DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    LabourCost       DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    MachineCost      DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    OtherCost        DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    TotalCost        DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    FinalPrice       DECIMAL(14, 2) NOT NULL DEFAULT 0.00,

    PRIMARY KEY (OrderID),
    FOREIGN KEY (CustomerID) REFERENCES CUSTOMER (CustomerID),
    FOREIGN KEY (ProductID)  REFERENCES PRODUCT  (ProductID),
    CHECK (RequiredQuantity > 0),
    CHECK (MaterialCost    >= 0),
    CHECK (LabourCost      >= 0),
    CHECK (MachineCost     >= 0),
    CHECK (OtherCost       >= 0),
    CHECK (TotalCost       >= 0),
    CHECK (FinalPrice      >= 0)
);


-- ============================================================
--  TABLE 10 : ORDER_PROCESS
--  Links a production order to its manufacturing process steps.
--  Maps to ProcessPipeline.java in the Java project.
--  ProcessSequence stores the step number: 1, 2, 3 ...
--  Depends on PRODUCTION_ORDER and MANUFACTURING_PROCESS.
--  Status : PENDING, IN PROGRESS, COMPLETED, SKIPPED
-- ============================================================

CREATE TABLE IF NOT EXISTS ORDER_PROCESS (
    OrderProcessID  INT         NOT NULL AUTO_INCREMENT,
    OrderID         INT         NOT NULL,
    ProcessID       INT         NOT NULL,
    ProcessSequence INT         NOT NULL DEFAULT 1,
    Status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    PRIMARY KEY (OrderProcessID),
    FOREIGN KEY (OrderID)    REFERENCES PRODUCTION_ORDER    (OrderID),
    FOREIGN KEY (ProcessID)  REFERENCES MANUFACTURING_PROCESS (ProcessID),
    UNIQUE (OrderID, ProcessSequence),
    CHECK  (ProcessSequence > 0)
);


-- ============================================================
--  TABLE 11 : INVENTORY_TRANSACTION
--  Records every stock movement for each raw material.
--  TransactionType : STOCK_IN  (materials received)
--                   STOCK_OUT (materials used in production)
--  Depends on RAW_MATERIAL.
-- ============================================================

CREATE TABLE IF NOT EXISTS INVENTORY_TRANSACTION (
    TransactionID   INT          NOT NULL AUTO_INCREMENT,
    MaterialID      INT          NOT NULL,
    TransactionType VARCHAR(10)  NOT NULL,
    Quantity        INT          NOT NULL,
    TransactionDate DATE         NOT NULL DEFAULT (CURRENT_DATE),
    Reference       VARCHAR(100),
    Notes           TEXT,

    PRIMARY KEY (TransactionID),
    FOREIGN KEY (MaterialID) REFERENCES RAW_MATERIAL (MaterialID),
    CHECK (Quantity > 0)
);


-- ============================================================
--  TABLE 12 : SHEET_CALCULATION
--  Stores the inputs and result of the sheet calculation
--  from CostCalculator.java:
--
--    totalArea      = RequiredArea + (RequiredArea x WastagePercentage / 100)
--    SheetsRequired = CEIL(totalArea / (SheetLengthMM x SheetWidthMM))
--
--  All areas are in square millimetres (mm squared).
--  WastagePercentage: e.g. 10 means 10 percent wastage.
--  This table has no foreign keys - it is standalone.
-- ============================================================

CREATE TABLE IF NOT EXISTS SHEET_CALCULATION (
    CalculationID     INT            NOT NULL AUTO_INCREMENT,
    RequiredArea      DECIMAL(18, 4) NOT NULL,
    SheetLengthMM     DECIMAL(10, 3) NOT NULL,
    SheetWidthMM      DECIMAL(10, 3) NOT NULL,
    WastagePercentage DECIMAL(5, 2)  NOT NULL DEFAULT 10.00,
    SheetsRequired    INT            NOT NULL,
    CreatedAt         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (CalculationID),
    CHECK (RequiredArea      > 0),
    CHECK (SheetLengthMM     > 0),
    CHECK (SheetWidthMM      > 0),
    CHECK (WastagePercentage >= 0),
    CHECK (SheetsRequired    > 0)
);


-- ============================================================
--  TABLE 13 : SUPPLIER
--  Stores raw material vendors and suppliers.
--  Only accessible by the Owner/Admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS SUPPLIER (
    SupplierID    INT          NOT NULL AUTO_INCREMENT,
    Name          VARCHAR(100) NOT NULL,
    Company       VARCHAR(150) NOT NULL DEFAULT '',
    Phone         VARCHAR(15)  NOT NULL,
    Email         VARCHAR(100) NOT NULL,
    Product       VARCHAR(150) NOT NULL,
    PaymentStatus VARCHAR(20)  NOT NULL DEFAULT 'PENDING',

    PRIMARY KEY (SupplierID),
    UNIQUE (Email)
);


-- ============================================================
--
--  SAMPLE DATA
--  Inserted in correct foreign key order.
--  All costs match the Java class values exactly:
--    Cutting=50, Bending=30, Punching=40, Welding=70, Finishing=35
--    Overhead = 10% of (Material + Labour + Machine cost)
--    FinalPrice = TotalCost x 1.20  (20% profit)
--
--  PASSWORD NOTE:
--  The PasswordHash values below are bcrypt hashes of
--  "Admin@123" (cost factor 12), generated by BCryptPasswordEncoder.
--  Never type a real password directly into SQL.
--
-- ============================================================


-- ============================================================
--  INSERT : CUSTOMER
-- ============================================================

INSERT INTO CUSTOMER (Name, Company, Phone, Email, Address, PaymentStatus) VALUES
('Arjun Mehta',   'Mehta Fabricators Pvt Ltd',  '9876543210', 'arjun@mehtafab.com',  '12, Industrial Area, Pune', 'COMPLETED'),
('Priya Sharma',  'Sharma Engineering Works',    '9123456780', 'priya@sharmaeng.com', '45, MIDC Phase 2, Nashik', 'PENDING'),
('Ravi Nair',     'Nair Steel Solutions',        '9988776655', 'ravi@nairsteel.com',  '7, Ambattur Estate, Chennai', 'COMPLETED');


-- ============================================================
--  INSERT : SUPPLIER (Owner Only)
-- ============================================================

INSERT INTO SUPPLIER (Name, Company, Phone, Email, Product, PaymentStatus) VALUES
('Sunil Kulkarni', 'Jindal Steel & Power Ltd', '9811223344', 'sunil@jindalsteel.com', 'Mild Steel Sheets (1.5mm - 3.0mm)', 'COMPLETED'),
('Anil Agarwal',   'Hindalco Industries',      '9822334455', 'anil@hindalco.com',    'Aluminium Sheets & Coils',       'PENDING'),
('Vikramaditya',   'Salem Stainless Corp',     '9833445566', 'vikram@salemss.com',   'SS 304 / 316 Food Grade Sheets', 'COMPLETED');


-- ============================================================
--  INSERT : USER_ACCOUNT
--  PasswordHash is a bcrypt hash - never a plain password.
-- ============================================================

INSERT INTO USER_ACCOUNT (Username, PasswordHash, Role, Status) VALUES
('admin',     '$2a$12$D4rYiJREKRgKqHv3rV9iJeWBH7zTZ6U8YpVRoQFtCrMWfQfgzBFXi', 'ADMIN',    'ACTIVE'),
('operator1', '$2a$12$D4rYiJREKRgKqHv3rV9iJeWBH7zTZ6U8YpVRoQFtCrMWfQfgzBFXi', 'OPERATOR', 'ACTIVE');


-- ============================================================
--  INSERT : RAW_MATERIAL
--  Dimensions in mm. Price in INR.
-- ============================================================

INSERT INTO RAW_MATERIAL (MaterialName, MaterialType, Thickness, LengthMM, WidthMM, QuantityInStock, PricePerSheet, ReorderLevel) VALUES
('Mild Steel Sheet 1.5mm',      'Steel',           1.500, 2400.000, 1200.000, 50, 1200.00, 15),
('Aluminium Sheet 1.0mm',       'Aluminium',       1.000, 2000.000, 1000.000, 30, 1850.00, 10),
('Stainless Steel Sheet 1.2mm', 'Stainless Steel', 1.200, 2440.000, 1220.000, 20, 3500.00,  5);


-- ============================================================
--  INSERT : PRODUCT
--  MaterialID references RAW_MATERIAL.
--  MaterialID 1 = Mild Steel, 2 = Aluminium, 3 = Stainless Steel
-- ============================================================

INSERT INTO PRODUCT (ProductName, Description, MaterialID, LengthMM, WidthMM, Thickness, SellingPrice) VALUES
('Steel Enclosure Box',    'Standard electrical enclosure box',    1,  500.000, 400.000, 1.500, 3200.00),
('Aluminium Bracket',      'L-shaped aluminium mounting bracket',  2,  150.000, 100.000, 1.000,  650.00),
('SS Kitchen Panel',       'Stainless steel kitchen wall panel',   3, 1200.000, 600.000, 1.200, 8500.00);


-- ============================================================
--  INSERT : MACHINE
-- ============================================================

INSERT INTO MACHINE (MachineName, MachineType, Status, CostPerHour) VALUES
('LVD CNC Laser Cutter',   'Laser Cutter',  'AVAILABLE', 850.00),
('AMADA Press Brake 100T', 'Press Brake',   'AVAILABLE', 650.00),
('MIG Welder Station A',   'Welding',       'AVAILABLE', 300.00);


-- ============================================================
--  INSERT : STAFF
-- ============================================================

INSERT INTO STAFF (Name, Role, Phone, Status) VALUES
('Mohan Das',    'CNC Operator',   '9870001111', 'AVAILABLE'),
('Ramesh Singh', 'Welder',         '9870002222', 'ASSIGNED'),
('Sunil Verma',  'Press Operator', '9870003333', 'AVAILABLE');


-- ============================================================
--  INSERT : MACHINE_BOOKING
--  MachineID and StaffID reference MACHINE and STAFF above.
--  Machine 1 (Laser Cutter) booked for Staff 1 (Mohan Das)
--  Machine 3 (Welder) booked for Staff 2 (Ramesh Singh)
-- ============================================================

INSERT INTO MACHINE_BOOKING (MachineID, StaffID, BookingDate, StartTime, EndTime, Status) VALUES
(1, 1, '2026-10-16', '08:00:00', '12:00:00', 'BOOKED'),
(3, 2, '2026-10-16', '09:00:00', '15:00:00', 'BOOKED');


-- ============================================================
--  INSERT : MANUFACTURING_PROCESS
--  CostPerUnit values match the Java subclass constructors exactly:
--    Cutting   -> super("Cutting",   50)
--    Bending   -> super("Bending",   30)
--    Punching  -> super("Punching",  40)
--    Welding   -> super("Welding",   70)
--    Finishing -> super("Finishing", 35)
-- ============================================================

INSERT INTO MANUFACTURING_PROCESS (ProcessName, CostPerUnit) VALUES
('Cutting',   50.00),
('Bending',   30.00),
('Punching',  40.00),
('Welding',   70.00),
('Finishing', 35.00);


-- ============================================================
--  INSERT : PRODUCTION_ORDER
--  CustomerID references CUSTOMER. ProductID references PRODUCT.
--
--  Order 1 : Arjun Mehta, Steel Enclosure Box, qty=10
--    MaterialCost = 1200.00 x 10              = 12000.00
--    LabourCost   = 200/hr x 10 hrs           =  2000.00
--    MachineCost  = 850/hr x 4 hrs            =  3400.00
--    OtherCost    = (12000+2000+3400) x 10%   =  1740.00
--    TotalCost    = 12000+2000+3400+1740      = 19140.00
--    FinalPrice   = 19140 x 1.20              = 22968.00
--
--  Order 2 : Priya Sharma, Aluminium Bracket, qty=50
--    MaterialCost = 1850.00 x 3 sheets        =  5550.00
--    LabourCost   = 200/hr x 7.5 hrs          =  1500.00
--    MachineCost  = 650/hr x 3 hrs            =  1950.00
--    OtherCost    = (5550+1500+1950) x 10%    =   900.00
--    TotalCost    = 5550+1500+1950+900        =  9900.00
--    FinalPrice   = 9900 x 1.20              = 11880.00
--
--  Order 3 : Ravi Nair, SS Kitchen Panel, qty=5
--    MaterialCost = 3500.00 x 5              = 17500.00
--    LabourCost   = 200/hr x 15 hrs          =  3000.00
--    MachineCost  = 300/hr x 6 hrs           =  1800.00
--    OtherCost    = (17500+3000+1800) x 10%  =  2230.00
--    TotalCost    = 17500+3000+1800+2230     = 24530.00
--    FinalPrice   = 24530 x 1.20             = 29436.00
-- ============================================================

INSERT INTO PRODUCTION_ORDER (CustomerID, ProductID, RequiredQuantity, OrderDate, DueDate, Status, MaterialCost, LabourCost, MachineCost, OtherCost, TotalCost, FinalPrice) VALUES
(1, 1, 10, '2026-10-14', '2026-10-24', 'IN PRODUCTION', 12000.00, 2000.00, 3400.00, 1740.00, 19140.00, 22968.00),
(2, 2, 50, '2026-10-15', '2026-10-28', 'PENDING',        5550.00, 1500.00, 1950.00,  900.00,  9900.00, 11880.00),
(3, 3,  5, '2026-10-15', '2026-11-05', 'PENDING',       17500.00, 3000.00, 1800.00, 2230.00, 24530.00, 29436.00);


-- ============================================================
--  INSERT : ORDER_PROCESS
--  Links each order to its process pipeline (step by step).
--  OrderID references PRODUCTION_ORDER.
--  ProcessID references MANUFACTURING_PROCESS:
--    1=Cutting, 2=Bending, 3=Punching, 4=Welding, 5=Finishing
--
--  Order 1 pipeline : Cutting -> Bending -> Welding -> Finishing
--  Order 2 pipeline : Cutting -> Bending
--  Order 3 pipeline : Cutting -> Welding -> Finishing
-- ============================================================

INSERT INTO ORDER_PROCESS (OrderID, ProcessID, ProcessSequence, Status) VALUES
(1, 1, 1, 'COMPLETED'),
(1, 2, 2, 'COMPLETED'),
(1, 4, 3, 'IN PROGRESS'),
(1, 5, 4, 'PENDING'),
(2, 1, 1, 'PENDING'),
(2, 2, 2, 'PENDING'),
(3, 1, 1, 'PENDING'),
(3, 4, 2, 'PENDING'),
(3, 5, 3, 'PENDING');


-- ============================================================
--  INSERT : INVENTORY_TRANSACTION
--  MaterialID references RAW_MATERIAL.
--  MaterialID 1 = Mild Steel, 2 = Aluminium, 3 = SS
-- ============================================================

INSERT INTO INVENTORY_TRANSACTION (MaterialID, TransactionType, Quantity, TransactionDate, Reference, Notes) VALUES
(1, 'STOCK_IN',  60, '2026-09-01', 'PO-SUPPLIER-001', 'Initial stock - Mild Steel 1.5mm'),
(2, 'STOCK_IN',  35, '2026-09-01', 'PO-SUPPLIER-002', 'Initial stock - Aluminium 1.0mm'),
(1, 'STOCK_OUT', 10, '2026-10-14', 'ORDER-1',         'Used in Order 1 - Steel Enclosure Box');


-- ============================================================
--  INSERT : SHEET_CALCULATION
--  Formula from CostCalculator.java:
--    totalArea      = RequiredArea + (RequiredArea x WastagePercentage / 100)
--    SheetsRequired = CEIL(totalArea / (SheetLengthMM x SheetWidthMM))
--
--  Calc 1 : Steel Enclosure Box (500x400 mm = 200000 mm2)
--    totalArea = 200000 + (200000x10/100) = 220000
--    sheetArea = 2400 x 1200 = 2880000
--    sheets    = CEIL(220000 / 2880000)   = 1
--
--  Calc 2 : Aluminium Bracket (150x100 mm = 15000 mm2), 50 units
--    RequiredArea = 15000 x 50 = 750000
--    totalArea    = 750000 + (750000x10/100) = 825000
--    sheetArea    = 2000 x 1000 = 2000000
--    sheets       = CEIL(825000 / 2000000)  = 1
--
--  Calc 3 : SS Kitchen Panel (1200x600 mm = 720000 mm2)
--    totalArea = 720000 + (720000x15/100) = 828000
--    sheetArea = 2440 x 1220 = 2976800
--    sheets    = CEIL(828000 / 2976800)   = 1
-- ============================================================

INSERT INTO SHEET_CALCULATION (RequiredArea, SheetLengthMM, SheetWidthMM, WastagePercentage, SheetsRequired) VALUES
( 200000.0000, 2400.000, 1200.000, 10.00, 1),
( 750000.0000, 2000.000, 1000.000, 10.00, 1),
( 720000.0000, 2440.000, 1220.000, 15.00, 1);


-- ============================================================
--
--  EXAMPLE SELECT QUERIES
--  Run these after you have inserted data.
--
-- ============================================================


-- Q1 : View all customers
SELECT CustomerID, Name, Company, Phone, Email, Address
FROM CUSTOMER
ORDER BY Name;


-- Q2 : View all raw materials
SELECT MaterialID, MaterialName, MaterialType,
       Thickness, LengthMM, WidthMM,
       QuantityInStock, PricePerSheet, ReorderLevel
FROM RAW_MATERIAL
ORDER BY MaterialType, MaterialName;


-- Q3 : View all products with their material name
SELECT P.ProductID, P.ProductName, R.MaterialName,
       P.LengthMM, P.WidthMM, P.Thickness, P.SellingPrice
FROM PRODUCT P
JOIN RAW_MATERIAL R ON R.MaterialID = P.MaterialID
ORDER BY P.ProductName;


-- Q4 : View all machines
SELECT MachineID, MachineName, MachineType, Status, CostPerHour
FROM MACHINE
ORDER BY MachineType;


-- Q5 : View all staff
SELECT StaffID, Name, Role, Phone, Status
FROM STAFF
ORDER BY Role, Name;


-- Q6 : View all manufacturing processes
SELECT ProcessID, ProcessName, CostPerUnit
FROM MANUFACTURING_PROCESS
ORDER BY ProcessName;


-- Q7 : View all production orders with customer and product names
SELECT PO.OrderID,
       C.Name        AS CustomerName,
       C.Company,
       P.ProductName,
       PO.RequiredQuantity,
       PO.OrderDate,
       PO.DueDate,
       PO.Status,
       PO.TotalCost,
       PO.FinalPrice
FROM PRODUCTION_ORDER PO
JOIN CUSTOMER C ON C.CustomerID = PO.CustomerID
JOIN PRODUCT  P ON P.ProductID  = PO.ProductID
ORDER BY PO.DueDate;


-- Q8 : View machine bookings with machine name and staff name
SELECT MB.BookingID,
       M.MachineName,
       S.Name        AS StaffName,
       S.Role        AS StaffRole,
       MB.BookingDate,
       MB.StartTime,
       MB.EndTime,
       MB.Status
FROM MACHINE_BOOKING MB
JOIN MACHINE M ON M.MachineID = MB.MachineID
JOIN STAFF   S ON S.StaffID   = MB.StaffID
ORDER BY MB.BookingDate, MB.StartTime;


-- Q9 : View process pipeline for each production order
SELECT OP.OrderID,
       C.Name             AS CustomerName,
       P.ProductName,
       OP.ProcessSequence,
       MP.ProcessName,
       MP.CostPerUnit,
       OP.Status          AS ProcessStatus
FROM ORDER_PROCESS OP
JOIN PRODUCTION_ORDER     PO ON PO.OrderID   = OP.OrderID
JOIN CUSTOMER              C ON C.CustomerID  = PO.CustomerID
JOIN PRODUCT               P ON P.ProductID   = PO.ProductID
JOIN MANUFACTURING_PROCESS MP ON MP.ProcessID = OP.ProcessID
ORDER BY OP.OrderID, OP.ProcessSequence;


-- Q10 : Cost breakdown and profit for each production order
SELECT PO.OrderID,
       C.Name          AS CustomerName,
       P.ProductName,
       PO.RequiredQuantity,
       PO.MaterialCost,
       PO.LabourCost,
       PO.MachineCost,
       PO.OtherCost,
       PO.TotalCost,
       PO.FinalPrice,
       (PO.FinalPrice - PO.TotalCost) AS Profit
FROM PRODUCTION_ORDER PO
JOIN CUSTOMER C ON C.CustomerID = PO.CustomerID
JOIN PRODUCT  P ON P.ProductID  = PO.ProductID
ORDER BY PO.OrderID;


-- Q11 : Check which materials are below their reorder level
SELECT MaterialID, MaterialName, QuantityInStock, ReorderLevel
FROM RAW_MATERIAL
WHERE QuantityInStock <= ReorderLevel
ORDER BY QuantityInStock;


-- Q12 : Total stock value per material
SELECT MaterialName,
       QuantityInStock,
       PricePerSheet,
       ROUND(QuantityInStock * PricePerSheet, 2) AS TotalStockValue
FROM RAW_MATERIAL
ORDER BY TotalStockValue DESC;


-- Q13 : Grand total value of all stock
SELECT ROUND(SUM(QuantityInStock * PricePerSheet), 2) AS GrandTotalStockValue
FROM RAW_MATERIAL;


-- Q14 : View inventory transaction history
SELECT IT.TransactionID,
       R.MaterialName,
       IT.TransactionType,
       IT.Quantity,
       IT.TransactionDate,
       IT.Reference,
       IT.Notes
FROM INVENTORY_TRANSACTION IT
JOIN RAW_MATERIAL R ON R.MaterialID = IT.MaterialID
ORDER BY IT.TransactionDate DESC;


-- Q15 : View all sheet calculations
SELECT CalculationID,
       RequiredArea,
       SheetLengthMM,
       SheetWidthMM,
       WastagePercentage,
       SheetsRequired,
       CreatedAt
FROM SHEET_CALCULATION
ORDER BY CreatedAt DESC;


-- Q16 : View orders that are currently IN PRODUCTION
SELECT PO.OrderID,
       C.Name    AS CustomerName,
       P.ProductName,
       PO.DueDate,
       PO.Status
FROM PRODUCTION_ORDER PO
JOIN CUSTOMER C ON C.CustomerID = PO.CustomerID
JOIN PRODUCT  P ON P.ProductID  = PO.ProductID
WHERE PO.Status = 'IN PRODUCTION'
ORDER BY PO.DueDate;


-- Q17 : View machines that are currently available
SELECT MachineID, MachineName, MachineType, CostPerHour
FROM MACHINE
WHERE Status = 'AVAILABLE'
ORDER BY MachineType;


-- Q18 : View staff members that are currently available
SELECT StaffID, Name, Role, Phone
FROM STAFF
WHERE Status = 'AVAILABLE'
ORDER BY Role, Name;


-- Q19 : Total process cost per order
SELECT OP.OrderID,
       C.Name             AS CustomerName,
       PO.RequiredQuantity,
       SUM(MP.CostPerUnit * PO.RequiredQuantity) AS TotalProcessCost
FROM ORDER_PROCESS OP
JOIN PRODUCTION_ORDER     PO ON PO.OrderID   = OP.OrderID
JOIN CUSTOMER              C ON C.CustomerID  = PO.CustomerID
JOIN MANUFACTURING_PROCESS MP ON MP.ProcessID = OP.ProcessID
GROUP BY OP.OrderID, C.Name, PO.RequiredQuantity
ORDER BY OP.OrderID;


-- Q20 : Net stock movement per material
SELECT R.MaterialName,
       SUM(CASE WHEN IT.TransactionType = 'STOCK_IN'  THEN  IT.Quantity ELSE 0 END) AS TotalIn,
       SUM(CASE WHEN IT.TransactionType = 'STOCK_OUT' THEN  IT.Quantity ELSE 0 END) AS TotalOut
FROM INVENTORY_TRANSACTION IT
JOIN RAW_MATERIAL R ON R.MaterialID = IT.MaterialID
GROUP BY R.MaterialID, R.MaterialName
ORDER BY R.MaterialName;


-- ============================================================
--  END OF FILE
--  Steps after import:
--  1. Add your data using INSERT INTO statements.
--  2. Run the SELECT queries above to check the results.
-- ============================================================
