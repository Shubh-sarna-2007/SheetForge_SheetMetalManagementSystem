import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.sql.*;
import java.util.ArrayList;
import java.util.Properties;

/**
 * =============================================================================
 * SheetForge — DatabaseManager (JDBC Connectivity & Persistence)
 * =============================================================================
 * Connects the Java SheetForge application to the MySQL database 'sheetforge'.
 * Credentials are read securely from environment variables (DB_PASSWORD, DB_USER,
 * DB_HOST, DB_PORT, DB_NAME) or an external db.properties configuration file.
 * All SQL statements use parameterized queries to prevent SQL injection.
 * =============================================================================
 */
public class DatabaseManager {

    private static String dbUrl;
    private static String dbUser;
    private static String dbPassword;
    private static boolean initialized = false;
    private static boolean available = false;

    static {
        initConfiguration();
    }

    public static synchronized void initConfiguration() {
        if (initialized) return;

        // 1. Check environment variables first (Preferred)
        String host = System.getenv("DB_HOST") != null ? System.getenv("DB_HOST") : "localhost";
        String port = System.getenv("DB_PORT") != null ? System.getenv("DB_PORT") : "3306";
        String name = System.getenv("DB_NAME") != null ? System.getenv("DB_NAME") : "sheetforge";
        dbUser = System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "root";
        dbPassword = System.getenv("DB_PASSWORD");

        // 2. Fallback to db.properties if environment variable is not set
        if (dbPassword == null || dbPassword.trim().isEmpty()) {
            File propFile = new File("db.properties");
            if (!propFile.exists()) {
                propFile = new File("config/db.properties");
            }
            if (propFile.exists()) {
                try (InputStream input = new FileInputStream(propFile)) {
                    Properties prop = new Properties();
                    prop.load(input);
                    if (prop.getProperty("db.host") != null) host = prop.getProperty("db.host");
                    if (prop.getProperty("db.port") != null) port = prop.getProperty("db.port");
                    if (prop.getProperty("db.name") != null) name = prop.getProperty("db.name");
                    if (prop.getProperty("db.user") != null) dbUser = prop.getProperty("db.user");
                    if (prop.getProperty("db.password") != null) dbPassword = prop.getProperty("db.password");
                } catch (Exception ignored) {
                }
            }
        }

        dbUrl = "jdbc:mysql://" + host + ":" + port + "/" + name + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        initialized = true;

        // Test connectivity
        try (Connection conn = getConnection()) {
            available = (conn != null && !conn.isClosed());
        } catch (Exception e) {
            available = false;
        }
    }

    public static boolean isAvailable() {
        return available;
    }

    public static Connection getConnection() throws SQLException {
        if (dbPassword == null) {
            throw new SQLException("Database password not configured. Set DB_PASSWORD environment variable or db.properties.");
        }
        return DriverManager.getConnection(dbUrl, dbUser, dbPassword);
    }

    // ==========================================
    // CUSTOMER PERSISTENCE
    // ==========================================

    public static ArrayList<Customer> loadCustomers() {
        ArrayList<Customer> list = new ArrayList<>();
        if (!isAvailable()) return list;

        String sql = "SELECT CustomerID, Name, Company, Phone, Email, Address FROM CUSTOMER ORDER BY CustomerID ASC";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(new Customer(
                        rs.getInt("CustomerID"),
                        rs.getString("Name"),
                        rs.getString("Company"),
                        rs.getString("Phone"),
                        rs.getString("Email"),
                        rs.getString("Address")
                ));
            }
        } catch (SQLException e) {
            System.err.println("JDBC Error loading customers: " + e.getMessage());
        }
        return list;
    }

    public static boolean saveCustomer(Customer c) {
        if (!isAvailable()) return false;

        String sql = "INSERT INTO CUSTOMER (CustomerID, Name, Company, Phone, Email, Address, PaymentStatus) " +
                     "VALUES (?, ?, ?, ?, ?, ?, 'PENDING') " +
                     "ON DUPLICATE KEY UPDATE Name = VALUES(Name), Company = VALUES(Company), Phone = VALUES(Phone), Email = VALUES(Email), Address = VALUES(Address)";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, c.getCustomer_id());
            stmt.setString(2, c.getName());
            stmt.setString(3, c.getCompany() != null ? c.getCompany() : "");
            stmt.setString(4, c.getPhone());
            stmt.setString(5, c.getEmail() != null ? c.getEmail() : "");
            String addr = c.getAddress() != null ? c.getAddress() : "";
            if (addr.length() > 100) {
                addr = addr.substring(0, 100);
            }
            stmt.setString(6, addr);
            stmt.executeUpdate();
            return true;
        } catch (SQLException e) {
            System.err.println("JDBC Error saving customer: " + e.getMessage());
            return false;
        }
    }

    // ==========================================
    // SUPPLIER PERSISTENCE
    // ==========================================

    public static ArrayList<Supplier> loadSuppliers() {
        ArrayList<Supplier> list = new ArrayList<>();
        if (!isAvailable()) return list;

        String sql = "SELECT SupplierID, Name, Company, Phone, Email, Product FROM SUPPLIER ORDER BY SupplierID ASC";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(new Supplier(
                        rs.getInt("SupplierID"),
                        rs.getString("Name"),
                        rs.getString("Company"),
                        rs.getString("Phone"),
                        rs.getString("Email"),
                        rs.getString("Product")
                ));
            }
        } catch (SQLException e) {
            System.err.println("JDBC Error loading suppliers: " + e.getMessage());
        }
        return list;
    }

    public static boolean saveSupplier(Supplier s) {
        if (!isAvailable()) return false;

        String sql = "INSERT INTO SUPPLIER (SupplierID, Name, Company, Phone, Email, Product, PaymentStatus) " +
                     "VALUES (?, ?, ?, ?, ?, ?, 'PENDING') " +
                     "ON DUPLICATE KEY UPDATE Name = VALUES(Name), Company = VALUES(Company), Phone = VALUES(Phone), Email = VALUES(Email), Product = VALUES(Product)";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, s.getSupplier_id());
            stmt.setString(2, s.getName());
            stmt.setString(3, s.getCompany() != null ? s.getCompany() : "");
            stmt.setString(4, s.getPhone());
            stmt.setString(5, s.getEmail() != null ? s.getEmail() : "");
            stmt.setString(6, s.getProduct());
            stmt.executeUpdate();
            return true;
        } catch (SQLException e) {
            System.err.println("JDBC Error saving supplier: " + e.getMessage());
            return false;
        }
    }

    // ==========================================
    // RAW MATERIAL PERSISTENCE
    // ==========================================

    public static ArrayList<RawMaterial> loadMaterials() {
        ArrayList<RawMaterial> list = new ArrayList<>();
        if (!isAvailable()) return list;

        String sql = "SELECT MaterialID, MaterialName, Thickness, LengthMM, WidthMM, QuantityInStock, PricePerSheet FROM RAW_MATERIAL ORDER BY MaterialID ASC";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(new RawMaterial(
                        String.valueOf(rs.getInt("MaterialID")),
                        rs.getString("MaterialName"),
                        rs.getDouble("Thickness"),
                        rs.getDouble("LengthMM"),
                        rs.getDouble("WidthMM"),
                        rs.getInt("QuantityInStock"),
                        rs.getDouble("PricePerSheet")
                ));
            }
        } catch (SQLException e) {
            System.err.println("JDBC Error loading materials: " + e.getMessage());
        }
        return list;
    }

    public static boolean saveMaterial(RawMaterial m) {
        if (!isAvailable()) return false;

        String sql = "INSERT INTO RAW_MATERIAL (MaterialName, MaterialType, Thickness, LengthMM, WidthMM, QuantityInStock, PricePerSheet, ReorderLevel) " +
                     "VALUES (?, 'Steel', ?, ?, ?, ?, ?, 10)";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, m.getMaterialName());
            stmt.setDouble(2, m.getThickness());
            stmt.setDouble(3, m.getLength());
            stmt.setDouble(4, m.getWidth());
            stmt.setInt(5, m.getQuantity());
            stmt.setDouble(6, m.getPricePerSheet());
            stmt.executeUpdate();
            return true;
        } catch (SQLException e) {
            System.err.println("JDBC Error saving material: " + e.getMessage());
            return false;
        }
    }

    public static void updateMaterialStock(String materialIdStr, int newQuantity) {
        if (!isAvailable()) return;

        try {
            int matId = Integer.parseInt(materialIdStr);
            String sql = "UPDATE RAW_MATERIAL SET QuantityInStock = ? WHERE MaterialID = ?";
            try (Connection conn = getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, newQuantity);
                stmt.setInt(2, matId);
                stmt.executeUpdate();
            }
        } catch (Exception e) {
            System.err.println("JDBC Error updating material stock: " + e.getMessage());
        }
    }

    // ==========================================
    // MACHINE PERSISTENCE
    // ==========================================

    public static ArrayList<Machine> loadMachines() {
        ArrayList<Machine> list = new ArrayList<>();
        if (!isAvailable()) return list;

        String sql = "SELECT MachineID, MachineName, MachineType, Status, CostPerHour FROM MACHINE ORDER BY MachineID ASC";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(new Machine(
                        String.valueOf(rs.getInt("MachineID")),
                        rs.getString("MachineName"),
                        rs.getString("MachineType"),
                        rs.getString("Status"),
                        rs.getDouble("CostPerHour")
                ));
            }
        } catch (SQLException e) {
            System.err.println("JDBC Error loading machines: " + e.getMessage());
        }
        return list;
    }

    public static boolean saveMachine(Machine m) {
        if (!isAvailable()) return false;

        String sql = "INSERT INTO MACHINE (MachineName, MachineType, Status, CostPerHour) VALUES (?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, m.getMachineName());
            stmt.setString(2, m.getMachineType());
            stmt.setString(3, m.getStatus() != null ? m.getStatus() : "AVAILABLE");
            stmt.setDouble(4, m.getCostPerHour());
            stmt.executeUpdate();
            return true;
        } catch (SQLException e) {
            System.err.println("JDBC Error saving machine: " + e.getMessage());
            return false;
        }
    }

    public static void updateMachineStatus(String machineIdStr, String status) {
        if (!isAvailable()) return;

        try {
            int mId = Integer.parseInt(machineIdStr);
            String sql = "UPDATE MACHINE SET Status = ? WHERE MachineID = ?";
            try (Connection conn = getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, status);
                stmt.setInt(2, mId);
                stmt.executeUpdate();
            }
        } catch (Exception e) {
            System.err.println("JDBC Error updating machine status: " + e.getMessage());
        }
    }

    // ==========================================
    // STAFF PERSISTENCE
    // ==========================================

    public static ArrayList<Staff> loadStaff() {
        ArrayList<Staff> list = new ArrayList<>();
        if (!isAvailable()) return list;

        String sql = "SELECT StaffID, Name, Role, Phone, Status FROM STAFF ORDER BY StaffID ASC";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                Staff s = new Staff(
                        rs.getInt("StaffID"),
                        rs.getString("Name"),
                        rs.getString("Role"),
                        rs.getString("Phone")
                );
                s.setStatus(rs.getString("Status"));
                list.add(s);
            }
        } catch (SQLException e) {
            System.err.println("JDBC Error loading staff: " + e.getMessage());
        }
        return list;
    }

    public static boolean saveStaff(Staff s) {
        if (!isAvailable()) return false;

        String sql = "INSERT INTO STAFF (StaffID, Name, Role, Phone, Status) VALUES (?, ?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE Name=VALUES(Name), Role=VALUES(Role), Phone=VALUES(Phone), Status=VALUES(Status)";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, s.getStaffId());
            stmt.setString(2, s.getName());
            stmt.setString(3, s.getRole());
            stmt.setString(4, s.getPhone());
            stmt.setString(5, s.getStatus() != null ? s.getStatus() : "AVAILABLE");
            stmt.executeUpdate();
            return true;
        } catch (SQLException e) {
            System.err.println("JDBC Error saving staff: " + e.getMessage());
            return false;
        }
    }

    // ==========================================
    // CUSTOM PRODUCT PERSISTENCE
    // ==========================================

    public static ArrayList<CustomProduct> loadProducts() {
        ArrayList<CustomProduct> list = new ArrayList<>();
        if (!isAvailable()) return list;

        String sql = "SELECT p.ProductID, p.ProductName, p.Description, p.LengthMM, p.WidthMM, p.Thickness, m.MaterialName " +
                     "FROM PRODUCT p LEFT JOIN RAW_MATERIAL m ON p.MaterialID = m.MaterialID ORDER BY p.ProductID ASC";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(new CustomProduct(
                        String.valueOf(rs.getInt("ProductID")),
                        rs.getString("ProductName"),
                        rs.getString("MaterialName") != null ? rs.getString("MaterialName") : "Steel",
                        rs.getString("Description"),
                        rs.getDouble("LengthMM"),
                        rs.getDouble("WidthMM"),
                        rs.getDouble("Thickness"),
                        1
                ));
            }
        } catch (SQLException e) {
            System.err.println("JDBC Error loading products: " + e.getMessage());
        }
        return list;
    }

    public static boolean saveProduct(CustomProduct p) {
        if (!isAvailable()) return false;

        String sql = "INSERT INTO PRODUCT (ProductName, Description, MaterialID, LengthMM, WidthMM, Thickness, SellingPrice) " +
                     "VALUES (?, ?, 1, ?, ?, ?, 0.00)";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            String desc = p.getDescription();
            if (desc == null || desc.trim().isEmpty()) {
                desc = "Fabricated " + p.getMaterialName();
            }
            if (desc.length() > 250) {
                desc = desc.substring(0, 250);
            }

            stmt.setString(1, p.getProductName());
            stmt.setString(2, desc);
            stmt.setDouble(3, p.getLength());
            stmt.setDouble(4, p.getWidth());
            stmt.setDouble(5, p.getThickness());
            stmt.executeUpdate();
            return true;
        } catch (SQLException e) {
            System.err.println("JDBC Error saving product: " + e.getMessage());
            return false;
        }
    }
}
