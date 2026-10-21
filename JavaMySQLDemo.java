import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * =============================================================================
 * SheetForge — Java to MySQL JDBC Connection Demo
 * =============================================================================
 * This simple, clean file demonstrates standard JDBC connectivity to the
 * MySQL SheetForge database for your college viva / lab presentation.
 *
 * HOW TO RUN:
 * 1. Download mysql-connector-j.jar
 * 2. Compile: javac -cp mysql-connector-j.jar JavaMySQLDemo.java
 * 3. Run    : java  -cp .:mysql-connector-j.jar JavaMySQLDemo
 * =============================================================================
 */
public class JavaMySQLDemo {

    // Database connection parameters
    private static final String DB_URL  = "jdbc:mysql://localhost:3306/sheetforge";
    private static final String USER    = System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "root";
    private static final String PASS    = System.getenv("DB_PASSWORD") != null ? System.getenv("DB_PASSWORD") : "root";

    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("  SheetForge — Java to MySQL JDBC Connection Test  ");
        System.out.println("==================================================");

        try {
            // 1. Establish connection to MySQL
            System.out.println("Connecting to database: " + DB_URL);
            Connection conn = DriverManager.getConnection(DB_URL, USER, PASS);
            System.out.println(">>> Connection Successful! <<<\n");

            Statement stmt = conn.createStatement();

            // 2. Query Raw Materials
            System.out.println("--- RAW MATERIAL INVENTORY (from MySQL) ---");
            ResultSet rs = stmt.executeQuery("SELECT MaterialID, MaterialName, QuantityInStock, PricePerSheet FROM RAW_MATERIAL");
            while (rs.next()) {
                System.out.printf("ID: %-2d | %-28s | Stock: %-3d sheets | Price: Rs. %.2f%n",
                        rs.getInt("MaterialID"),
                        rs.getString("MaterialName"),
                        rs.getInt("QuantityInStock"),
                        rs.getDouble("PricePerSheet"));
            }
            rs.close();

            // 3. Query Active Production Orders
            System.out.println("\n--- PRODUCTION ORDERS (from MySQL) ---");
            rs = stmt.executeQuery(
                    "SELECT PO.OrderID, C.Name AS CustomerName, P.ProductName, PO.RequiredQuantity, PO.Status, PO.FinalPrice " +
                    "FROM PRODUCTION_ORDER PO " +
                    "JOIN CUSTOMER C ON C.CustomerID = PO.CustomerID " +
                    "JOIN PRODUCT P  ON P.ProductID  = PO.ProductID"
            );
            while (rs.next()) {
                System.out.printf("Order #%-2d | %-15s | %-20s | Qty: %-3d | Status: %-13s | Price: Rs. %.2f%n",
                        rs.getInt("OrderID"),
                        rs.getString("CustomerName"),
                        rs.getString("ProductName"),
                        rs.getInt("RequiredQuantity"),
                        rs.getString("Status"),
                        rs.getDouble("FinalPrice"));
            }
            rs.close();

            conn.close();
            System.out.println("\nDatabase connection closed cleanly.");

        } catch (Exception e) {
            System.out.println("Connection status: " + e.getMessage());
            System.out.println("Note: Ensure MySQL server is running on port 3306 and username/password are correct.");
        }
    }
}
