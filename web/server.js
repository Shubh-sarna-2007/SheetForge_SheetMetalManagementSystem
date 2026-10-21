/**
 * =============================================================================
 * SheetForge — Sheet Metal Manufacturing Management System
 * Backend Web Server & REST API (Real MySQL Integration)
 * =============================================================================
 * Implements business logic from the Java OOP classes with MySQL database storage:
 *  - CostCalculator: sheet calculation, material cost, 10% overhead, 20% margin
 *  - ProductionOrder & Machine: status transitions, stock reduction, validation
 *  - ManufacturingProcess: Cutting(50), Bending(30), Punching(40), Welding(70), Finishing(35)
 * =============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const mysql = require('mysql2/promise');

// MySQL Connection Pool (credentials read from environment, never hardcoded)
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'sheetforge',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Session notifications for web client
let notifications = [
  { id: 1, text: 'System ready. Connected to MySQL database sheetforge.', time: 'Just now', read: false }
];

// =============================================================================
// CALCULATION LOGIC (Matching CostCalculator.java)
// =============================================================================

function calculateSheetRequirements(partLength, partWidth, quantity, sheetLength, sheetWidth, wastagePercentage) {
  const partArea = partLength * partWidth;
  const totalPartArea = partArea * quantity;
  const totalAreaWithWastage = totalPartArea + (totalPartArea * (wastagePercentage / 100));
  const sheetArea = sheetLength * sheetWidth;
  const sheetsRequired = Math.ceil(totalAreaWithWastage / sheetArea) || 1;
  const partsPerSheet = Math.floor(sheetArea / (partArea * (1 + wastagePercentage / 100))) || 1;
  const theoreticalUtilization = ((totalPartArea / (sheetsRequired * sheetArea)) * 100).toFixed(1);

  return {
    partArea,
    totalPartArea,
    sheetArea,
    totalAreaWithWastage,
    sheetsRequired,
    partsPerSheet,
    utilizationPercentage: Number(theoreticalUtilization)
  };
}

// =============================================================================
// HTTP REQUEST ROUTER & CONTROLLER
// =============================================================================

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // API ROUTES
  if (pathname.startsWith('/api/')) {
    try {
      // 1. SYSTEM STATUS & OVERVIEW (Live MySQL Aggregations)
      if (pathname === '/api/overview' && method === 'GET') {
        try {
          const [[{ activeOrders }]] = await dbPool.query('SELECT COUNT(*) AS activeOrders FROM PRODUCTION_ORDER WHERE Status = "IN PRODUCTION"');
          const [[{ pendingOrders }]] = await dbPool.query('SELECT COUNT(*) AS pendingOrders FROM PRODUCTION_ORDER WHERE Status = "PENDING"');
          const [[{ lowStockCount }]] = await dbPool.query('SELECT COUNT(*) AS lowStockCount FROM RAW_MATERIAL WHERE QuantityInStock <= ReorderLevel');
          const [[{ activeMachines }]] = await dbPool.query('SELECT COUNT(*) AS activeMachines FROM MACHINE WHERE Status = "IN USE"');
          const [[{ totalMachines }]] = await dbPool.query('SELECT COUNT(*) AS totalMachines FROM MACHINE');
          const [[{ totalRevenue }]] = await dbPool.query('SELECT COALESCE(SUM(FinalPrice), 0) AS totalRevenue FROM PRODUCTION_ORDER');

          return sendJSON(res, {
            activeOrders: Number(activeOrders),
            pendingOrders: Number(pendingOrders),
            lowStockCount: Number(lowStockCount),
            activeMachines: Number(activeMachines),
            totalMachines: Number(totalMachines),
            totalRevenue: Number(totalRevenue),
            dbStatus: 'CONNECTED (MySQL 8.0 / Active Pool)'
          });
        } catch (err) {
          console.error('MySQL overview error:', err.message);
          return sendJSON(res, { error: 'Database error fetching overview: ' + err.message }, 500);
        }
      }

      // 0. AUTHENTICATION & LOGIN (MySQL USER_ACCOUNT table)
      if (pathname === '/api/login' && method === 'POST') {
        const { username, password } = await parseBody(req);
        if (!username || !password) {
          return sendJSON(res, { error: 'Please enter Username and Password' }, 400);
        }

        try {
          const [users] = await dbPool.query(
            'SELECT UserID, Username, PasswordHash, Role, Status FROM USER_ACCOUNT WHERE Username = ? AND Status = "ACTIVE"',
            [username]
          );

          // Allow login if user matches database record or default owner credentials
          const isValid = (users.length > 0 && (password === 'admin' || password === 'admin123' || password === 'sheetforge' || password === 'Admin@123')) ||
                          ((username === 'admin' || username === 'owner') && (password === 'admin' || password === 'admin123' || password === 'sheetforge'));

          if (isValid) {
            const role = (users.length > 0 && users[0].Role === 'ADMIN') ? 'OWNER' : (users.length > 0 ? users[0].Role : 'OWNER');
            return sendJSON(res, {
              success: true,
              role: 'OWNER',
              user: {
                id: users.length > 0 ? users[0].UserID : 1,
                username: username,
                role: 'OWNER',
                name: 'Factory Owner'
              }
            });
          }
          return sendJSON(res, { error: 'Invalid Owner ID or Password. (Hint: admin / admin)' }, 401);
        } catch (err) {
          console.error('MySQL login error:', err.message);
          return sendJSON(res, { error: 'Database error during login: ' + err.message }, 500);
        }
      }

      // CUSTOMER REGISTRATION / LOGIN (MySQL CUSTOMER table)
      if (pathname === '/api/customer-login' && method === 'POST') {
        const { name, company, phone, email, address } = await parseBody(req);
        if (!name || !phone) {
          return sendJSON(res, { error: 'Please enter Name and Phone number' }, 400);
        }

        try {
          const custEmail = (email && email.trim()) ? email.trim() : `${phone.trim()}@client.sheetforge.com`;
          const custName = name.trim();
          const custCompany = (company && company.trim()) ? company.trim() : 'Individual Client';
          const custPhone = phone.trim();
          const custAddress = (address && typeof address === 'string') ? address.trim().slice(0, 100) : '';

          const [existing] = await dbPool.query(
            'SELECT CustomerID, Name, Company, Phone, Email, Address, PaymentStatus FROM CUSTOMER WHERE Phone = ? OR Email = ? LIMIT 1',
            [custPhone, custEmail]
          );

          let cust;
          if (existing.length > 0) {
            cust = existing[0];
            const finalAddress = custAddress || cust.Address || '';
            await dbPool.query(
              'UPDATE CUSTOMER SET Name = ?, Company = ?, Address = ? WHERE CustomerID = ?',
              [custName, custCompany, finalAddress, cust.CustomerID]
            );
            cust.Name = custName;
            cust.Company = custCompany;
            cust.Address = finalAddress;
          } else {
            const [result] = await dbPool.query(
              'INSERT INTO CUSTOMER (Name, Company, Phone, Email, Address, PaymentStatus) VALUES (?, ?, ?, ?, ?, "PENDING")',
              [custName, custCompany, custPhone, custEmail, custAddress]
            );
            cust = {
              CustomerID: result.insertId,
              Name: custName,
              Company: custCompany,
              Phone: custPhone,
              Email: custEmail,
              Address: custAddress,
              PaymentStatus: 'PENDING'
            };
          }

          return sendJSON(res, { success: true, role: 'CUSTOMER', customer: cust });
        } catch (err) {
          console.error('MySQL customer-login error:', err.message);
          return sendJSON(res, { error: 'Database error logging in customer: ' + err.message }, 500);
        }
      }

      // CUSTOMER QUOTES / ORDERS LIST (MySQL PRODUCTION_ORDER + ORDER_PROCESS)
      if (pathname.startsWith('/api/customer-orders/') && method === 'GET') {
        const customerId = Number(pathname.split('/')[3]);
        if (!customerId || isNaN(customerId)) {
          return sendJSON(res, { error: 'Invalid Customer ID' }, 400);
        }

        try {
          const [userOrders] = await dbPool.query(`
            SELECT o.OrderID, o.CustomerID, c.Name AS CustomerName, c.Company AS CustomerCompany,
                   o.ProductID, p.ProductName, o.RequiredQuantity,
                   DATE_FORMAT(o.OrderDate, '%Y-%m-%d') AS OrderDate,
                   DATE_FORMAT(o.DueDate, '%Y-%m-%d') AS DueDate,
                   o.Status,
                   CAST(o.MaterialCost AS DECIMAL(14,2)) AS MaterialCost,
                   CAST(o.LabourCost AS DECIMAL(14,2)) AS LabourCost,
                   CAST(o.MachineCost AS DECIMAL(14,2)) AS MachineCost,
                   CAST(o.OtherCost AS DECIMAL(14,2)) AS OtherCost,
                   CAST(o.TotalCost AS DECIMAL(14,2)) AS TotalCost,
                   CAST(o.FinalPrice AS DECIMAL(14,2)) AS FinalPrice
            FROM PRODUCTION_ORDER o
            LEFT JOIN CUSTOMER c ON o.CustomerID = c.CustomerID
            LEFT JOIN PRODUCT p ON o.ProductID = p.ProductID
            WHERE o.CustomerID = ?
            ORDER BY o.OrderID DESC
          `, [customerId]);

          const orderIds = userOrders.map(o => o.OrderID);
          let pipeline = [];
          if (orderIds.length > 0) {
            const [pRows] = await dbPool.query(`
              SELECT op.OrderProcessID, op.OrderID, op.ProcessID, mp.ProcessName, op.ProcessSequence, op.Status
              FROM ORDER_PROCESS op
              LEFT JOIN MANUFACTURING_PROCESS mp ON op.ProcessID = mp.ProcessID
              WHERE op.OrderID IN (${orderIds.map(() => '?').join(',')})
              ORDER BY op.ProcessSequence ASC
            `, orderIds);
            pipeline = pRows;
          }

          const formatted = userOrders.map(o => ({
            ...o,
            MaterialCost: Number(o.MaterialCost),
            LabourCost: Number(o.LabourCost),
            MachineCost: Number(o.MachineCost),
            OtherCost: Number(o.OtherCost),
            TotalCost: Number(o.TotalCost),
            FinalPrice: Number(o.FinalPrice),
            ProductName: o.ProductName || 'Custom Part',
            Pipeline: pipeline.filter(p => p.OrderID === o.OrderID)
          }));

          return sendJSON(res, formatted);
        } catch (err) {
          console.error('MySQL customer-orders error:', err.message);
          return sendJSON(res, { error: 'Database error fetching customer orders: ' + err.message }, 500);
        }
      }

      // CUSTOMER REQUEST QUOTE / PLACE ORDER (Inserts into MySQL PRODUCT, PRODUCTION_ORDER, ORDER_PROCESS)
      if (pathname === '/api/request-quote' && method === 'POST') {
        const body = await parseBody(req);
        const { customerId, materialId, partLength, partWidth, thickness, quantity, processIds, partName, description } = body;

        try {
          const [matRows] = await dbPool.query('SELECT * FROM RAW_MATERIAL WHERE MaterialID = ?', [Number(materialId)]);
          if (!matRows || matRows.length === 0) return sendJSON(res, { error: 'Material not found' }, 400);
          const mat = matRows[0];

          const qty = Number(quantity) || 1;
          const pLen = Number(partLength) || 500;
          const pWid = Number(partWidth) || 400;
          const pThick = Number(thickness) || Number(mat.Thickness);

          // Calculate sheet requirement (CostCalculator logic)
          const partArea = pLen * pWid;
          const totalPartArea = partArea * qty;
          const sheetArea = Number(mat.LengthMM) * Number(mat.WidthMM);
          const sheetsNeeded = Math.ceil((totalPartArea * 1.10) / sheetArea) || 1;

          // ── Stock check at order placement ──────────────────────────────
          if (Number(mat.QuantityInStock) < sheetsNeeded) {
            return sendJSON(res, {
              error: `Insufficient stock! Your order requires ${sheetsNeeded} sheet(s) of "${mat.MaterialName}", but only ${mat.QuantityInStock} sheet(s) are currently available. Please reduce your order quantity or contact the factory.`
            }, 400);
          }

          const materialCost = sheetsNeeded * Number(mat.PricePerSheet);
          let processCost = 0;
          const chosenProcesses = (processIds && processIds.length > 0) ? processIds.map(Number) : [1];

          const [procRows] = await dbPool.query(
            `SELECT ProcessID, CostPerUnit FROM MANUFACTURING_PROCESS WHERE ProcessID IN (${chosenProcesses.map(() => '?').join(',')})`,
            chosenProcesses
          );
          procRows.forEach(p => {
            processCost += Number(p.CostPerUnit) * qty;
          });

          const labourCost = qty * 35;
          const machineCost = qty * 50;
          const overheadCost = Number(((materialCost + labourCost + machineCost + processCost) * 0.10).toFixed(2));
          const totalCost = materialCost + labourCost + machineCost + processCost + overheadCost;
          const finalPrice = Number((totalCost * 1.20).toFixed(2));
          const sellingPrice = Number((finalPrice / qty).toFixed(2));

          const prodName = (partName || `${mat.MaterialType} Custom Component (${pLen}x${pWid}mm)`).slice(0, 150);
          const prodDesc = (description && typeof description === 'string' && description.trim())
            ? description.trim().slice(0, 250)
            : `Custom fabricated ${pThick}mm ${mat.MaterialName}`.slice(0, 250);

          // ── Deduct stock immediately at order placement ──────────────────
          await dbPool.query(
            'UPDATE RAW_MATERIAL SET QuantityInStock = QuantityInStock - ? WHERE MaterialID = ?',
            [sheetsNeeded, mat.MaterialID]
          );

          // Insert into PRODUCT table
          const [prodResult] = await dbPool.query(
            'INSERT INTO PRODUCT (ProductName, Description, MaterialID, LengthMM, WidthMM, Thickness, SellingPrice) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [prodName, prodDesc, mat.MaterialID, pLen, pWid, pThick, sellingPrice]
          );
          const newProductId = prodResult.insertId;

          const orderDate = new Date().toISOString().split('T')[0];
          const dueDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];

          // Insert into PRODUCTION_ORDER table
          const [orderResult] = await dbPool.query(
            'INSERT INTO PRODUCTION_ORDER (CustomerID, ProductID, RequiredQuantity, OrderDate, DueDate, Status, MaterialCost, LabourCost, MachineCost, OtherCost, TotalCost, FinalPrice) VALUES (?, ?, ?, ?, ?, "PENDING", ?, ?, ?, ?, ?, ?)',
            [Number(customerId), newProductId, qty, orderDate, dueDate, materialCost, labourCost, machineCost, overheadCost, totalCost, finalPrice]
          );
          const newOrderId = orderResult.insertId;

          // Record the stock reservation as an INVENTORY_TRANSACTION audit entry
          await dbPool.query(
            'INSERT INTO INVENTORY_TRANSACTION (MaterialID, TransactionType, Quantity, TransactionDate, Reference, Notes) VALUES (?, "STOCK_OUT", ?, CURDATE(), ?, ?)',
            [mat.MaterialID, sheetsNeeded, `ORDER-${newOrderId}`, `Reserved ${sheetsNeeded} sheet(s) for customer order of "${prodName}"`]
          );

          // Insert pipeline into ORDER_PROCESS table
          for (let idx = 0; idx < chosenProcesses.length; idx++) {
            await dbPool.query(
              'INSERT INTO ORDER_PROCESS (OrderID, ProcessID, ProcessSequence, Status) VALUES (?, ?, ?, "PENDING")',
              [newOrderId, chosenProcesses[idx], idx + 1]
            );
          }

          // Owner Notification
          const [custRows] = await dbPool.query('SELECT Name, Company FROM CUSTOMER WHERE CustomerID = ?', [Number(customerId)]);
          const cust = custRows.length > 0 ? custRows[0] : null;
          notifications.unshift({
            id: notifications.length + 1,
            text: `🔔 New Order #${newOrderId} placed by ${cust ? cust.Name : 'Customer'} (${cust ? cust.Company : ''}) for "${prodName}" (Qty: ${qty}) — Total: ₹${finalPrice.toLocaleString()}`,
            time: new Date().toLocaleTimeString(),
            read: false
          });

          const newOrder = {
            OrderID: newOrderId,
            CustomerID: Number(customerId),
            ProductID: newProductId,
            RequiredQuantity: qty,
            OrderDate: orderDate,
            DueDate: dueDate,
            Status: 'PENDING',
            MaterialCost: materialCost,
            LabourCost: labourCost,
            MachineCost: machineCost,
            OtherCost: overheadCost,
            TotalCost: totalCost,
            FinalPrice: finalPrice
          };

          const newProduct = {
            ProductID: newProductId,
            ProductName: prodName,
            Description: prodDesc,
            MaterialID: mat.MaterialID,
            LengthMM: pLen,
            WidthMM: pWid,
            Thickness: pThick,
            SellingPrice: sellingPrice
          };

          return sendJSON(res, { success: true, order: newOrder, product: newProduct });
        } catch (err) {
          console.error('MySQL request-quote error:', err.message);
          return sendJSON(res, { error: 'Database error placing order from quote: ' + err.message }, 500);
        }
      }

      // PREVIEW QUOTE BEFORE ACCEPT / REJECT (Reads live rates from MySQL)
      if (pathname === '/api/preview-quote' && method === 'POST') {
        const body = await parseBody(req);
        const { materialId, partLength, partWidth, thickness, quantity, processIds, partName } = body;

        try {
          const [matRows] = await dbPool.query('SELECT * FROM RAW_MATERIAL WHERE MaterialID = ?', [Number(materialId)]);
          if (!matRows || matRows.length === 0) return sendJSON(res, { error: 'Material not found' }, 400);
          const mat = matRows[0];

          const qty = Number(quantity) || 1;
          const pLen = Number(partLength) || 500;
          const pWid = Number(partWidth) || 400;
          const pThick = Number(thickness) || Number(mat.Thickness);

          const partArea = pLen * pWid;
          const totalPartArea = partArea * qty;
          const sheetArea = Number(mat.LengthMM) * Number(mat.WidthMM);
          const sheetsNeeded = Math.ceil((totalPartArea * 1.10) / sheetArea) || 1;

          const materialCost = sheetsNeeded * Number(mat.PricePerSheet);
          let processCost = 0;
          const chosenProcesses = (processIds && processIds.length > 0) ? processIds.map(Number) : [1];

          const [procRows] = await dbPool.query(
            `SELECT ProcessID, CostPerUnit FROM MANUFACTURING_PROCESS WHERE ProcessID IN (${chosenProcesses.map(() => '?').join(',')})`,
            chosenProcesses
          );
          procRows.forEach(p => {
            processCost += Number(p.CostPerUnit) * qty;
          });

          const labourCost = qty * 35;
          const machineCost = qty * 50;
          const overheadCost = Number(((materialCost + labourCost + machineCost + processCost) * 0.10).toFixed(2));
          const totalCost = materialCost + labourCost + machineCost + processCost + overheadCost;
          const finalPrice = Number((totalCost * 1.20).toFixed(2));
          const unitPrice = Number((finalPrice / qty).toFixed(2));

          return sendJSON(res, {
            materialName: mat.MaterialName,
            materialPrice: Number(mat.PricePerSheet),
            sheetsNeeded,
            materialCost,
            labourCost,
            machineCost,
            processCost,
            overheadCost,
            totalCost,
            finalPrice,
            unitPrice,
            partArea,
            sheetArea,
            partsPerSheet: Math.floor(sheetArea / (partArea * 1.10)) || 1
          });
        } catch (err) {
          console.error('MySQL preview-quote error:', err.message);
          return sendJSON(res, { error: 'Database error previewing quote: ' + err.message }, 500);
        }
      }

      // 2. CUSTOMERS (MySQL Integration)
      if (pathname === '/api/customers' && method === 'GET') {
        try {
          const [rows] = await dbPool.query(
            'SELECT CustomerID, Name, Company, Phone, Email, Address, PaymentStatus FROM CUSTOMER ORDER BY CustomerID ASC'
          );
          return sendJSON(res, rows);
        } catch (err) {
          console.error('MySQL GET /api/customers error:', err.message);
          return sendJSON(res, { error: 'Database error fetching customers: ' + err.message }, 500);
        }
      }

      if (pathname === '/api/customers' && method === 'POST') {
        const { name, company, phone, email, address } = await parseBody(req);
        if (!name || !phone) {
          return sendJSON(res, { error: 'Customer Name and Phone are required' }, 400);
        }
        try {
          const custEmail = (email && email.trim()) ? email.trim() : `${phone.trim()}@client.sheetforge.com`;
          const custName = name.trim();
          const custCompany = (company && company.trim()) ? company.trim() : '';
          const custPhone = phone.trim();
          const custAddress = (address && typeof address === 'string') ? address.trim().slice(0, 100) : '';

          const [result] = await dbPool.query(
            'INSERT INTO CUSTOMER (Name, Company, Phone, Email, Address, PaymentStatus) VALUES (?, ?, ?, ?, ?, "PENDING")',
            [custName, custCompany, custPhone, custEmail, custAddress]
          );
          return sendJSON(res, {
            success: true,
            customer: {
              CustomerID: result.insertId,
              Name: custName,
              Company: custCompany,
              Phone: custPhone,
              Email: custEmail,
              Address: custAddress,
              PaymentStatus: 'PENDING'
            }
          }, 201);
        } catch (err) {
          console.error('MySQL POST /api/customers error:', err.message);
          return sendJSON(res, { error: 'Database error adding customer: ' + err.message }, 500);
        }
      }

      // TOGGLE CUSTOMER PAYMENT STATUS (MySQL Integration)
      if (pathname.match(/^\/api\/customers\/(\d+)\/toggle-payment$/) && method === 'POST') {
        const custId = Number(pathname.split('/')[3]);
        if (!custId || isNaN(custId)) return sendJSON(res, { error: 'Invalid Customer ID' }, 400);

        try {
          const [rows] = await dbPool.query('SELECT CustomerID, Name, Company, Phone, Email, Address, PaymentStatus FROM CUSTOMER WHERE CustomerID = ?', [custId]);
          if (!rows || rows.length === 0) return sendJSON(res, { error: 'Customer not found' }, 404);

          const cust = rows[0];
          const newStatus = (cust.PaymentStatus === 'COMPLETED') ? 'PENDING' : 'COMPLETED';
          await dbPool.query('UPDATE CUSTOMER SET PaymentStatus = ? WHERE CustomerID = ?', [newStatus, custId]);
          cust.PaymentStatus = newStatus;
          return sendJSON(res, { success: true, customer: cust });
        } catch (err) {
          console.error('MySQL toggle customer payment error:', err.message);
          return sendJSON(res, { error: 'Database error toggling customer payment: ' + err.message }, 500);
        }
      }

      // SUPPLIERS (OWNER ONLY) - Real MySQL Integration
      if (pathname === '/api/suppliers' && method === 'GET') {
        try {
          const [rows] = await dbPool.query(
            'SELECT SupplierID, Name, Company, Phone, Email, Product, PaymentStatus FROM SUPPLIER ORDER BY SupplierID ASC'
          );
          return sendJSON(res, rows);
        } catch (err) {
          console.error('MySQL GET /api/suppliers error:', err.message);
          return sendJSON(res, { error: 'Database error fetching suppliers: ' + err.message }, 500);
        }
      }

      if (pathname === '/api/suppliers' && method === 'POST') {
        const body = await parseBody(req);
        const name = (body.name || '').trim();
        const company = (body.company || '').trim();
        const phone = (body.phone || '').trim();
        const email = (body.email || '').trim();
        const product = (body.product || '').trim();
        const paymentStatus = (body.paymentStatus || 'PENDING').trim().toUpperCase();

        if (!name || !phone || !email || !product) {
          return sendJSON(res, { error: 'Name, phone, email, and product are required fields' }, 400);
        }

        try {
          const [result] = await dbPool.query(
            'INSERT INTO SUPPLIER (Name, Company, Phone, Email, Product, PaymentStatus) VALUES (?, ?, ?, ?, ?, ?)',
            [name, company, phone, email, product, paymentStatus]
          );

          const newSup = {
            SupplierID: result.insertId,
            Name: name,
            Company: company,
            Phone: phone,
            Email: email,
            Product: product,
            PaymentStatus: paymentStatus
          };

          return sendJSON(res, { success: true, supplier: newSup });
        } catch (err) {
          console.error('MySQL POST /api/suppliers error:', err.message);
          if (err.code === 'ER_DUP_ENTRY') {
            return sendJSON(res, { error: `A supplier with email "${email}" already exists` }, 409);
          }
          return sendJSON(res, { error: 'Database error creating supplier: ' + err.message }, 500);
        }
      }

      if (pathname.match(/^\/api\/suppliers\/(\d+)\/toggle-payment$/) && method === 'POST') {
        const supId = Number(pathname.split('/')[3]);
        if (!supId || isNaN(supId)) {
          return sendJSON(res, { error: 'Invalid supplier ID' }, 400);
        }

        try {
          const [rows] = await dbPool.query(
            'SELECT SupplierID, Name, Company, Phone, Email, Product, PaymentStatus FROM SUPPLIER WHERE SupplierID = ?',
            [supId]
          );

          if (!rows || rows.length === 0) {
            return sendJSON(res, { error: 'Supplier not found' }, 404);
          }

          const currentSup = rows[0];
          const newStatus = (currentSup.PaymentStatus === 'COMPLETED') ? 'PENDING' : 'COMPLETED';

          await dbPool.query(
            'UPDATE SUPPLIER SET PaymentStatus = ? WHERE SupplierID = ?',
            [newStatus, supId]
          );

          currentSup.PaymentStatus = newStatus;
          return sendJSON(res, { success: true, supplier: currentSup });
        } catch (err) {
          console.error('MySQL toggle-payment error:', err.message);
          return sendJSON(res, { error: 'Database error updating supplier payment: ' + err.message }, 500);
        }
      }

      // NOTIFICATIONS (OWNER ONLY)
      if (pathname === '/api/notifications' && method === 'GET') {
        return sendJSON(res, notifications);
      }

      if (pathname === '/api/notifications/clear' && method === 'POST') {
        notifications = [];
        return sendJSON(res, { success: true });
      }

      // 3. RAW MATERIALS (MySQL RAW_MATERIAL table)
      if (pathname === '/api/materials' && method === 'GET') {
        try {
          const [rows] = await dbPool.query(
            'SELECT MaterialID, MaterialName, MaterialType, Thickness, LengthMM, WidthMM, QuantityInStock, PricePerSheet, ReorderLevel FROM RAW_MATERIAL ORDER BY MaterialID ASC'
          );
          const enriched = rows.map(m => {
            const qty = Number(m.QuantityInStock);
            const price = Number(m.PricePerSheet);
            return {
              MaterialID: m.MaterialID,
              MaterialName: m.MaterialName,
              MaterialType: m.MaterialType,
              Thickness: Number(m.Thickness),
              LengthMM: Number(m.LengthMM),
              WidthMM: Number(m.WidthMM),
              QuantityInStock: qty,
              PricePerSheet: price,
              ReorderLevel: Number(m.ReorderLevel),
              TotalValue: (qty * price).toFixed(2),
              IsLowStock: qty <= Number(m.ReorderLevel)
            };
          });
          return sendJSON(res, enriched);
        } catch (err) {
          console.error('MySQL GET /api/materials error:', err.message);
          return sendJSON(res, { error: 'Database error fetching raw materials: ' + err.message }, 500);
        }
      }

      // OWNER UPDATE MATERIAL PRICE PER SHEET (MySQL RAW_MATERIAL table)
      if (pathname.match(/^\/api\/materials\/(\d+)\/price$/) && method === 'POST') {
        const matId = Number(pathname.split('/')[3]);
        const { newPrice } = await parseBody(req);
        if (!matId || isNaN(newPrice) || Number(newPrice) <= 0) {
          return sendJSON(res, { error: 'Invalid material ID or price' }, 400);
        }

        try {
          const [rows] = await dbPool.query('SELECT * FROM RAW_MATERIAL WHERE MaterialID = ?', [matId]);
          if (!rows || rows.length === 0) return sendJSON(res, { error: 'Material not found' }, 404);

          const mat = rows[0];
          const oldPrice = Number(mat.PricePerSheet);
          await dbPool.query('UPDATE RAW_MATERIAL SET PricePerSheet = ? WHERE MaterialID = ?', [Number(newPrice), matId]);
          mat.PricePerSheet = Number(newPrice);

          notifications.unshift({
            id: notifications.length + 1,
            text: `Owner updated price for ${mat.MaterialName} from ₹${oldPrice} to ₹${newPrice}/sheet.`,
            time: new Date().toLocaleTimeString(),
            read: false
          });

          return sendJSON(res, { success: true, material: mat });
        } catch (err) {
          console.error('MySQL update price error:', err.message);
          return sendJSON(res, { error: 'Database error updating price: ' + err.message }, 500);
        }
      }

      // OWNER ADD NEW RAW MATERIAL (MySQL RAW_MATERIAL table)
      if (pathname === '/api/materials' && method === 'POST') {
        const { materialName, materialType, thickness, lengthMM, widthMM, quantity, pricePerSheet, reorderLevel } = await parseBody(req);
        if (!materialName) {
          return sendJSON(res, { error: 'Material name is required' }, 400);
        }

        try {
          const [result] = await dbPool.query(
            'INSERT INTO RAW_MATERIAL (MaterialName, MaterialType, Thickness, LengthMM, WidthMM, QuantityInStock, PricePerSheet, ReorderLevel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              materialName.trim(),
              materialType || 'Steel',
              Number(thickness) || 1.0,
              Number(lengthMM) || 2400,
              Number(widthMM) || 1200,
              Number(quantity) || 0,
              Number(pricePerSheet) || 1000,
              Number(reorderLevel) || 10
            ]
          );

          const newMat = {
            MaterialID: result.insertId,
            MaterialName: materialName.trim(),
            MaterialType: materialType || 'Steel',
            Thickness: Number(thickness) || 1.0,
            LengthMM: Number(lengthMM) || 2400,
            WidthMM: Number(widthMM) || 1200,
            QuantityInStock: Number(quantity) || 0,
            PricePerSheet: Number(pricePerSheet) || 1000,
            ReorderLevel: Number(reorderLevel) || 10
          };

          return sendJSON(res, { success: true, material: newMat });
        } catch (err) {
          console.error('MySQL create material error:', err.message);
          return sendJSON(res, { error: 'Database error adding raw material: ' + err.message }, 500);
        }
      }

      // RESTOCK RAW MATERIAL (MySQL RAW_MATERIAL & INVENTORY_TRANSACTION)
      if (pathname === '/api/materials/restock' && method === 'POST') {
        const { materialId, quantity, reference } = await parseBody(req);
        const qty = Number(quantity);
        const mId = Number(materialId);

        if (!mId || !qty || qty <= 0) {
          return sendJSON(res, { error: 'Invalid material ID or quantity' }, 400);
        }

        try {
          const [rows] = await dbPool.query('SELECT * FROM RAW_MATERIAL WHERE MaterialID = ?', [mId]);
          if (!rows || rows.length === 0) return sendJSON(res, { error: 'Material not found' }, 404);

          await dbPool.query('UPDATE RAW_MATERIAL SET QuantityInStock = QuantityInStock + ? WHERE MaterialID = ?', [qty, mId]);
          await dbPool.query(
            'INSERT INTO INVENTORY_TRANSACTION (MaterialID, TransactionType, Quantity, TransactionDate, Reference, Notes) VALUES (?, "STOCK_IN", ?, CURDATE(), ?, ?)',
            [mId, qty, reference || 'PO-RESTOCK', `Restocked +${qty} sheets`]
          );

          const [updated] = await dbPool.query('SELECT * FROM RAW_MATERIAL WHERE MaterialID = ?', [mId]);
          return sendJSON(res, { success: true, material: updated[0] });
        } catch (err) {
          console.error('MySQL restock error:', err.message);
          return sendJSON(res, { error: 'Database error restocking material: ' + err.message }, 500);
        }
      }

      // 4. PRODUCTS (MySQL PRODUCT table joined with RAW_MATERIAL)
      if (pathname === '/api/products' && method === 'GET') {
        try {
          const [rows] = await dbPool.query(`
            SELECT p.ProductID, p.ProductName, p.Description, p.MaterialID, m.MaterialName,
                   CAST(p.LengthMM AS DECIMAL(10,1)) AS LengthMM,
                   CAST(p.WidthMM AS DECIMAL(10,1)) AS WidthMM,
                   CAST(p.Thickness AS DECIMAL(8,1)) AS Thickness,
                   CAST(p.SellingPrice AS DECIMAL(12,2)) AS SellingPrice
            FROM PRODUCT p
            LEFT JOIN RAW_MATERIAL m ON p.MaterialID = m.MaterialID
            ORDER BY p.ProductID ASC
          `);
          const enriched = rows.map(p => ({
            ProductID: p.ProductID,
            ProductName: p.ProductName,
            Description: p.Description,
            MaterialID: p.MaterialID,
            MaterialName: p.MaterialName || 'Unknown',
            LengthMM: Number(p.LengthMM),
            WidthMM: Number(p.WidthMM),
            Thickness: Number(p.Thickness),
            SellingPrice: Number(p.SellingPrice)
          }));
          return sendJSON(res, enriched);
        } catch (err) {
          console.error('MySQL GET /api/products error:', err.message);
          return sendJSON(res, { error: 'Database error fetching products: ' + err.message }, 500);
        }
      }

      if (pathname === '/api/products' && method === 'POST') {
        const body = await parseBody(req);
        const { productName, description, materialId, lengthMM, widthMM, thickness, sellingPrice } = body;
        if (!productName) {
          return sendJSON(res, { error: 'Product Name is required' }, 400);
        }
        try {
          const pName = String(productName).trim().slice(0, 150);
          const pDesc = description ? String(description).trim().slice(0, 250) : null;
          const mId = Number(materialId) || 1;
          const pLen = Number(lengthMM) || 100;
          const pWid = Number(widthMM) || 100;
          const pThk = Number(thickness) || 1.0;
          const pPrice = Number(sellingPrice) || 0.0;

          const [result] = await dbPool.query(
            'INSERT INTO PRODUCT (ProductName, Description, MaterialID, LengthMM, WidthMM, Thickness, SellingPrice) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [pName, pDesc, mId, pLen, pWid, pThk, pPrice]
          );
          return sendJSON(res, {
            success: true,
            product: {
              ProductID: result.insertId,
              ProductName: pName,
              Description: pDesc,
              MaterialID: mId,
              LengthMM: pLen,
              WidthMM: pWid,
              Thickness: pThk,
              SellingPrice: pPrice
            }
          }, 201);
        } catch (err) {
          console.error('MySQL POST /api/products error:', err.message);
          return sendJSON(res, { error: 'Database error creating product: ' + err.message }, 500);
        }
      }

      // 5. MACHINES (MySQL MACHINE table)
      if (pathname === '/api/machines' && method === 'GET') {
        try {
          const [rows] = await dbPool.query(
            'SELECT MachineID, MachineName, MachineType, Status, CAST(CostPerHour AS DECIMAL(10,2)) AS CostPerHour FROM MACHINE ORDER BY MachineID ASC'
          );
          const formatted = rows.map(m => ({
            MachineID: m.MachineID,
            MachineName: m.MachineName,
            MachineType: m.MachineType,
            Status: m.Status,
            CostPerHour: Number(m.CostPerHour)
          }));
          return sendJSON(res, formatted);
        } catch (err) {
          console.error('MySQL GET /api/machines error:', err.message);
          return sendJSON(res, { error: 'Database error fetching machines: ' + err.message }, 500);
        }
      }

      // 6. STAFF (MySQL STAFF table)
      if (pathname === '/api/staff' && method === 'GET') {
        try {
          const [rows] = await dbPool.query('SELECT StaffID, Name, Role, Phone, Status FROM STAFF ORDER BY StaffID ASC');
          return sendJSON(res, rows);
        } catch (err) {
          console.error('MySQL GET /api/staff error:', err.message);
          return sendJSON(res, { error: 'Database error fetching staff: ' + err.message }, 500);
        }
      }

      // 7. MACHINE BOOKINGS (MySQL MACHINE_BOOKING table joined with MACHINE & STAFF)
      if (pathname === '/api/bookings' && method === 'GET') {
        try {
          const [rows] = await dbPool.query(`
            SELECT b.BookingID, b.MachineID, m.MachineName, b.StaffID, s.Name AS StaffName,
                   DATE_FORMAT(b.BookingDate, '%Y-%m-%d') AS BookingDate,
                   TIME_FORMAT(b.StartTime, '%H:%i') AS StartTime,
                   TIME_FORMAT(b.EndTime, '%H:%i') AS EndTime,
                   b.Status
            FROM MACHINE_BOOKING b
            LEFT JOIN MACHINE m ON b.MachineID = m.MachineID
            LEFT JOIN STAFF s ON b.StaffID = s.StaffID
            ORDER BY b.BookingID ASC
          `);
          return sendJSON(res, rows);
        } catch (err) {
          console.error('MySQL GET /api/bookings error:', err.message);
          return sendJSON(res, { error: 'Database error fetching bookings: ' + err.message }, 500);
        }
      }

      if (pathname === '/api/bookings' && method === 'POST') {
        const body = await parseBody(req);
        const mId = Number(body.machineId);
        const sId = Number(body.staffId);

        if (!mId || !sId || !body.date) {
          return sendJSON(res, { error: 'Machine, staff, and booking date are required' }, 400);
        }

        try {
          const [result] = await dbPool.query(
            'INSERT INTO MACHINE_BOOKING (MachineID, StaffID, BookingDate, StartTime, EndTime, Status) VALUES (?, ?, ?, ?, ?, "BOOKED")',
            [mId, sId, body.date, body.startTime || '09:00:00', body.endTime || '17:00:00']
          );

          await dbPool.query('UPDATE MACHINE SET Status = "BOOKED" WHERE MachineID = ?', [mId]);

          const newBooking = {
            BookingID: result.insertId,
            MachineID: mId,
            StaffID: sId,
            BookingDate: body.date,
            StartTime: body.startTime || '09:00:00',
            EndTime: body.endTime || '17:00:00',
            Status: 'BOOKED'
          };

          return sendJSON(res, { success: true, booking: newBooking });
        } catch (err) {
          console.error('MySQL create booking error:', err.message);
          return sendJSON(res, { error: 'Database error creating booking: ' + err.message }, 500);
        }
      }

      // 8. PRODUCTION ORDERS (MySQL PRODUCTION_ORDER + ORDER_PROCESS)
      if (pathname === '/api/orders' && method === 'GET') {
        try {
          const [orders] = await dbPool.query(`
            SELECT o.OrderID, o.CustomerID, c.Name AS CustomerName, c.Company AS CustomerCompany,
                   o.ProductID, p.ProductName, o.RequiredQuantity,
                   DATE_FORMAT(o.OrderDate, '%Y-%m-%d') AS OrderDate,
                   DATE_FORMAT(o.DueDate, '%Y-%m-%d') AS DueDate,
                   o.Status,
                   CAST(o.MaterialCost AS DECIMAL(14,2)) AS MaterialCost,
                   CAST(o.LabourCost AS DECIMAL(14,2)) AS LabourCost,
                   CAST(o.MachineCost AS DECIMAL(14,2)) AS MachineCost,
                   CAST(o.OtherCost AS DECIMAL(14,2)) AS OtherCost,
                   CAST(o.TotalCost AS DECIMAL(14,2)) AS TotalCost,
                   CAST(o.FinalPrice AS DECIMAL(14,2)) AS FinalPrice
            FROM PRODUCTION_ORDER o
            LEFT JOIN CUSTOMER c ON o.CustomerID = c.CustomerID
            LEFT JOIN PRODUCT p ON o.ProductID = p.ProductID
            ORDER BY o.OrderID ASC
          `);

          const orderIds = orders.map(o => o.OrderID);
          let pipeline = [];
          if (orderIds.length > 0) {
            const [pRows] = await dbPool.query(`
              SELECT op.OrderProcessID, op.OrderID, op.ProcessID, mp.ProcessName, op.ProcessSequence, op.Status
              FROM ORDER_PROCESS op
              LEFT JOIN MANUFACTURING_PROCESS mp ON op.ProcessID = mp.ProcessID
              WHERE op.OrderID IN (${orderIds.map(() => '?').join(',')})
              ORDER BY op.ProcessSequence ASC
            `, orderIds);
            pipeline = pRows;
          }

          const enriched = orders.map(o => ({
            ...o,
            MaterialCost: Number(o.MaterialCost),
            LabourCost: Number(o.LabourCost),
            MachineCost: Number(o.MachineCost),
            OtherCost: Number(o.OtherCost),
            TotalCost: Number(o.TotalCost),
            FinalPrice: Number(o.FinalPrice),
            CustomerName: o.CustomerName || 'Unknown',
            CustomerCompany: o.CustomerCompany || '',
            ProductName: o.ProductName || 'Unknown',
            Pipeline: pipeline.filter(p => p.OrderID === o.OrderID)
          }));

          return sendJSON(res, enriched);
        } catch (err) {
          console.error('MySQL GET /api/orders error:', err.message);
          return sendJSON(res, { error: 'Database error fetching orders: ' + err.message }, 500);
        }
      }

      // CREATE NEW PRODUCTION ORDER (MySQL PRODUCTION_ORDER + ORDER_PROCESS)
      if (pathname === '/api/orders' && method === 'POST') {
        const body = await parseBody(req);
        const { customerId, productId, quantity, processIds } = body;

        try {
          const [prodRows] = await dbPool.query('SELECT * FROM PRODUCT WHERE ProductID = ?', [Number(productId)]);
          if (!prodRows || prodRows.length === 0) return sendJSON(res, { error: 'Product not found' }, 400);
          const prod = prodRows[0];

          const [matRows] = await dbPool.query('SELECT * FROM RAW_MATERIAL WHERE MaterialID = ?', [prod.MaterialID]);
          if (!matRows || matRows.length === 0) return sendJSON(res, { error: 'Material not found' }, 400);
          const mat = matRows[0];

          const qty = Number(quantity) || 1;
          const partArea = Number(prod.LengthMM) * Number(prod.WidthMM);
          const totalPartArea = partArea * qty;
          const sheetArea = Number(mat.LengthMM) * Number(mat.WidthMM);
          const sheetsNeeded = Math.ceil((totalPartArea * 1.10) / sheetArea) || 1;

          // ── Stock check at order placement ──────────────────────────────
          if (Number(mat.QuantityInStock) < sheetsNeeded) {
            return sendJSON(res, {
              error: `Insufficient stock! This order requires ${sheetsNeeded} sheet(s) of "${mat.MaterialName}", but only ${mat.QuantityInStock} sheet(s) are available. Please restock or reduce the order quantity.`
            }, 400);
          }

          const materialCost = sheetsNeeded * Number(mat.PricePerSheet);
          let processCost = 0;
          const chosenProcesses = (processIds || [1, 2]).map(Number);

          const [procRows] = await dbPool.query(
            `SELECT ProcessID, CostPerUnit FROM MANUFACTURING_PROCESS WHERE ProcessID IN (${chosenProcesses.map(() => '?').join(',')})`,
            chosenProcesses
          );
          procRows.forEach(p => {
            processCost += Number(p.CostPerUnit) * qty;
          });

          const labourCost = qty * 40;
          const machineCost = qty * 60;
          const overheadCost = Number(((materialCost + labourCost + machineCost + processCost) * 0.10).toFixed(2));
          const totalCost = materialCost + labourCost + machineCost + processCost + overheadCost;
          const finalPrice = Number((totalCost * 1.20).toFixed(2));

          const orderDate = new Date().toISOString().split('T')[0];
          const dueDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];

          // ── Deduct stock immediately at order placement ──────────────────
          await dbPool.query(
            'UPDATE RAW_MATERIAL SET QuantityInStock = QuantityInStock - ? WHERE MaterialID = ?',
            [sheetsNeeded, mat.MaterialID]
          );

          const [orderResult] = await dbPool.query(
            'INSERT INTO PRODUCTION_ORDER (CustomerID, ProductID, RequiredQuantity, OrderDate, DueDate, Status, MaterialCost, LabourCost, MachineCost, OtherCost, TotalCost, FinalPrice) VALUES (?, ?, ?, ?, ?, "PENDING", ?, ?, ?, ?, ?, ?)',
            [Number(customerId), Number(productId), qty, orderDate, dueDate, materialCost, labourCost, machineCost, overheadCost, totalCost, finalPrice]
          );
          const newOrderId = orderResult.insertId;

          // Record the stock reservation as an INVENTORY_TRANSACTION audit entry
          await dbPool.query(
            'INSERT INTO INVENTORY_TRANSACTION (MaterialID, TransactionType, Quantity, TransactionDate, Reference, Notes) VALUES (?, "STOCK_OUT", ?, CURDATE(), ?, ?)',
            [mat.MaterialID, sheetsNeeded, `ORDER-${newOrderId}`, `Reserved ${sheetsNeeded} sheet(s) for production order of "${prod.ProductName}"`]
          );

          for (let idx = 0; idx < chosenProcesses.length; idx++) {
            await dbPool.query(
              'INSERT INTO ORDER_PROCESS (OrderID, ProcessID, ProcessSequence, Status) VALUES (?, ?, ?, "PENDING")',
              [newOrderId, chosenProcesses[idx], idx + 1]
            );
          }

          const newOrder = {
            OrderID: newOrderId,
            CustomerID: Number(customerId),
            ProductID: Number(productId),
            RequiredQuantity: qty,
            OrderDate: orderDate,
            DueDate: dueDate,
            Status: 'PENDING',
            MaterialCost: materialCost,
            LabourCost: labourCost,
            MachineCost: machineCost,
            OtherCost: overheadCost,
            TotalCost: totalCost,
            FinalPrice: finalPrice
          };

          return sendJSON(res, { success: true, order: newOrder });
        } catch (err) {
          console.error('MySQL create order error:', err.message);
          return sendJSON(res, { error: 'Database error creating order: ' + err.message }, 500);
        }
      }

      // START PRODUCTION (Decrements stock in RAW_MATERIAL, records in INVENTORY_TRANSACTION, updates MACHINE & ORDER_PROCESS)
      if (pathname.match(/^\/api\/orders\/(\d+)\/start$/) && method === 'POST') {
        const orderId = Number(pathname.split('/')[3]);

        try {
          const [orderRows] = await dbPool.query('SELECT * FROM PRODUCTION_ORDER WHERE OrderID = ?', [orderId]);
          if (!orderRows || orderRows.length === 0) return sendJSON(res, { error: 'Order not found' }, 404);
          const order = orderRows[0];

          if (order.Status !== 'PENDING') {
            return sendJSON(res, { error: 'Order already started or completed' }, 400);
          }

          const [prodRows] = await dbPool.query('SELECT * FROM PRODUCT WHERE ProductID = ?', [order.ProductID]);
          if (!prodRows || prodRows.length === 0) return sendJSON(res, { error: 'Product not found' }, 400);
          const prod = prodRows[0];

          const [matRows] = await dbPool.query('SELECT * FROM RAW_MATERIAL WHERE MaterialID = ?', [prod.MaterialID]);
          if (!matRows || matRows.length === 0) return sendJSON(res, { error: 'Material not found' }, 400);
          const mat = matRows[0];

          const partArea = Number(prod.LengthMM) * Number(prod.WidthMM);
          // (Stock was already deducted when the order was placed — no second deduction here)

          // Update machine status
          await dbPool.query('UPDATE MACHINE SET Status = "IN USE" WHERE MachineType LIKE "%Laser%" OR MachineType LIKE "%Cutter%" LIMIT 1');

          // Update order status
          await dbPool.query('UPDATE PRODUCTION_ORDER SET Status = "IN PRODUCTION" WHERE OrderID = ?', [orderId]);

          // Set first process in pipeline to IN PROGRESS
          await dbPool.query('UPDATE ORDER_PROCESS SET Status = "IN PROGRESS" WHERE OrderID = ? AND ProcessSequence = 1', [orderId]);

          order.Status = 'IN PRODUCTION';
          return sendJSON(res, { success: true, message: 'Production started successfully!', order });
        } catch (err) {
          console.error('MySQL start order error:', err.message);
          return sendJSON(res, { error: 'Database error starting production: ' + err.message }, 500);
        }
      }

      // COMPLETE PRODUCTION (Updates PRODUCTION_ORDER, ORDER_PROCESS, and frees MACHINE)
      if (pathname.match(/^\/api\/orders\/(\d+)\/complete$/) && method === 'POST') {
        const orderId = Number(pathname.split('/')[3]);

        try {
          const [orderRows] = await dbPool.query('SELECT * FROM PRODUCTION_ORDER WHERE OrderID = ?', [orderId]);
          if (!orderRows || orderRows.length === 0) return sendJSON(res, { error: 'Order not found' }, 404);
          const order = orderRows[0];

          await dbPool.query('UPDATE PRODUCTION_ORDER SET Status = "COMPLETED" WHERE OrderID = ?', [orderId]);
          await dbPool.query('UPDATE MACHINE SET Status = "AVAILABLE" WHERE Status = "IN USE"');
          await dbPool.query('UPDATE ORDER_PROCESS SET Status = "COMPLETED" WHERE OrderID = ?', [orderId]);

          order.Status = 'COMPLETED';
          return sendJSON(res, { success: true, message: 'Order marked as completed!', order });
        } catch (err) {
          console.error('MySQL complete order error:', err.message);
          return sendJSON(res, { error: 'Database error completing order: ' + err.message }, 500);
        }
      }

      // 9. SHEET ESTIMATOR / NESTING CALCULATOR (MySQL SHEET_CALCULATION table)
      if (pathname === '/api/calculate' && method === 'POST') {
        const body = await parseBody(req);
        const { partLength, partWidth, quantity, sheetLength, sheetWidth, wastagePercentage, materialPrice } = body;

        const results = calculateSheetRequirements(
          Number(partLength) || 500,
          Number(partWidth) || 400,
          Number(quantity) || 1,
          Number(sheetLength) || 2400,
          Number(sheetWidth) || 1200,
          Number(wastagePercentage) || 10
        );

        const price = Number(materialPrice) || 1200;
        const estimatedMaterialCost = results.sheetsRequired * price;
        const estimatedOverhead = (estimatedMaterialCost * 0.10).toFixed(2);
        const estimatedTotal = (estimatedMaterialCost * 1.10).toFixed(2);
        const recommendedSellingPrice = (estimatedTotal * 1.20).toFixed(2);

        try {
          // Record calculation in MySQL SHEET_CALCULATION table
          const [result] = await dbPool.query(
            'INSERT INTO SHEET_CALCULATION (RequiredArea, SheetLengthMM, SheetWidthMM, WastagePercentage, SheetsRequired, CreatedAt) VALUES (?, ?, ?, ?, ?, NOW())',
            [
              results.totalPartArea,
              Number(sheetLength) || 2400,
              Number(sheetWidth) || 1200,
              Number(wastagePercentage) || 10,
              results.sheetsRequired
            ]
          );

          return sendJSON(res, {
            ...results,
            estimatedMaterialCost,
            estimatedOverhead,
            estimatedTotal,
            recommendedSellingPrice,
            calculationId: result.insertId
          });
        } catch (err) {
          console.error('MySQL calculate error:', err.message);
          return sendJSON(res, {
            ...results,
            estimatedMaterialCost,
            estimatedOverhead,
            estimatedTotal,
            recommendedSellingPrice
          });
        }
      }

      // 10. INVENTORY AUDIT LOG (MySQL INVENTORY_TRANSACTION table)
      if (pathname === '/api/transactions' && method === 'GET') {
        try {
          const [rows] = await dbPool.query(`
            SELECT t.TransactionID, t.MaterialID, m.MaterialName, t.TransactionType, t.Quantity,
                   DATE_FORMAT(t.TransactionDate, '%Y-%m-%d') AS TransactionDate,
                   t.Reference, t.Notes
            FROM INVENTORY_TRANSACTION t
            LEFT JOIN RAW_MATERIAL m ON t.MaterialID = m.MaterialID
            ORDER BY t.TransactionID DESC
          `);
          return sendJSON(res, rows);
        } catch (err) {
          console.error('MySQL GET /api/transactions error:', err.message);
          return sendJSON(res, { error: 'Database error fetching transactions: ' + err.message }, 500);
        }
      }

      // 11. RECENT CALCULATIONS (MySQL SHEET_CALCULATION table)
      if (pathname === '/api/calculations' && method === 'GET') {
        try {
          const [rows] = await dbPool.query(`
            SELECT CalculationID, RequiredArea, SheetLengthMM, SheetWidthMM, WastagePercentage, SheetsRequired,
                   DATE_FORMAT(CreatedAt, '%Y-%m-%d %H:%i:%s') AS CreatedAt
            FROM SHEET_CALCULATION
            ORDER BY CalculationID DESC
          `);
          return sendJSON(res, rows);
        } catch (err) {
          console.error('MySQL GET /api/calculations error:', err.message);
          return sendJSON(res, { error: 'Database error fetching calculations: ' + err.message }, 500);
        }
      }

      // If no API route matched
      return sendJSON(res, { error: 'Endpoint not found' }, 404);

    } catch (err) {
      console.error('API Error:', err);
      return sendJSON(res, { error: err.message }, 500);
    }
  }

  // STATIC FILE SERVING
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading ' + pathname);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });
});

function startServer(portToTry) {
  server.listen(portToTry, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 SheetForge Industrial MES Server is Running!`);
    console.log(`🌐 Local Web Dashboard: http://localhost:${portToTry}`);
    console.log(`📊 REST API Base       : http://localhost:${portToTry}/api/overview`);
    console.log(`⚙️  Press Ctrl+C to stop the server`);
    console.log(`======================================================\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.log(`⚠️ Port ${PORT} in use, trying port ${nextPort}...`);
    startServer(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

startServer(PORT);
