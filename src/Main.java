import java.util.ArrayList;
import java.util.Scanner;

public class Main {

    static Scanner scanner = new Scanner(System.in);

    // ArrayLists to store multiple objects
    static ArrayList<Customer> customers = new ArrayList<>();
    static ArrayList<RawMaterial> materials = new ArrayList<>();
    static ArrayList<Machine> machines = new ArrayList<>();
    static ArrayList<CustomProduct> products = new ArrayList<>();
    static ArrayList<ProductionOrder> orders = new ArrayList<>();
    static ArrayList<Staff> staffList = new ArrayList<>();

    static ArrayList<MachineBooking> bookings = new ArrayList<>();


    public static void main(String[] args) {

        int choice;

        System.out.println("======================================");
        System.out.println("       WELCOME TO SHEETFORGE");
        System.out.println("======================================");

        do {

            showMenu();

            System.out.print("\nEnter your choice: ");
            choice = scanner.nextInt();
            scanner.nextLine();

            switch (choice) {

                case 1:
                    addCustomer();
                    break;

                case 2:
                    viewCustomers();
                    break;

                case 3:
                    addMaterial();
                    break;

                case 4:
                    viewMaterials();
                    break;

                case 5:
                    addMachine();
                    break;

                case 6:
                    viewMachines();
                    break;

                case 7:
                    createProduct();
                    break;

                case 8:
                    viewProducts();
                    break;

                case 9:
                    createOrder();
                    break;

                case 10:
                    viewOrders();
                    break;

                case 11:
                    startProduction();
                    break;

                case 12:
                    completeProduction();
                    break;

                case 0:
                    System.out.println("\nExiting SheetForge...");
                    System.out.println("Thank you!");
                    break;

                default:
                    System.out.println("Invalid choice!");
            }

        } while (choice != 0);
    }


    // ==========================================
    // MENU
    // ==========================================

    public static void showMenu() {

        System.out.println("\n======================================");
        System.out.println("           SHEETFORGE MENU");
        System.out.println("======================================");

        System.out.println("1.  Add Customer");
        System.out.println("2.  View Customers");

        System.out.println("3.  Add Raw Material");
        System.out.println("4.  View Raw Materials");

        System.out.println("5.  Add Machine");
        System.out.println("6.  View Machines");

        System.out.println("7.  Create Custom Product");
        System.out.println("8.  View Products");

        System.out.println("9.  Create Production Order");
        System.out.println("10. View Production Orders");

        System.out.println("11. Start Production");
        System.out.println("12. Complete Production");

        System.out.println("0. Exit");

        System.out.println("======================================");
    }


    // ==========================================
    // CUSTOMER METHODS
    // ==========================================

    public static void addCustomer() {

        System.out.println("\n--- ADD CUSTOMER ---");

        System.out.print("Customer ID: ");
        int id = scanner.nextInt();
        scanner.nextLine();

        System.out.print("Name: ");
        String name = scanner.nextLine();

        System.out.print("Company: ");
        String company = scanner.nextLine();

        System.out.print("Phone: ");
        String phone = scanner.nextLine();

        System.out.print("Email: ");
        String email = scanner.nextLine();


        Customer customer = new Customer(
                id,
                name,
                company,
                phone,
                email
        );

        customers.add(customer);

        System.out.println("Customer added successfully!");
    }


    public static void viewCustomers() {

        System.out.println("\n--- CUSTOMER LIST ---");

        if (customers.isEmpty()) {

            System.out.println("No customers available.");
            return;
        }

        for (Customer customer : customers) {

            customer.displayDetails();
            System.out.println("----------------------------");
        }
    }


    // ==========================================
    // RAW MATERIAL METHODS
    // ==========================================

    public static void addMaterial() {

        System.out.println("\n--- ADD RAW MATERIAL ---");

        System.out.print("Material ID: ");
        String id = scanner.nextLine();

        System.out.print("Material Name: ");
        String name = scanner.nextLine();

        System.out.print("Thickness (mm): ");
        double thickness = scanner.nextDouble();

        System.out.print("Sheet Length (mm): ");
        double length = scanner.nextDouble();

        System.out.print("Sheet Width (mm): ");
        double width = scanner.nextDouble();

        System.out.print("Quantity (sheets): ");
        int quantity = scanner.nextInt();

        System.out.print("Price Per Sheet: ");
        double price = scanner.nextDouble();
        scanner.nextLine();


        RawMaterial material = new RawMaterial(
                id,
                name,
                thickness,
                length,
                width,
                quantity,
                price
        );

        materials.add(material);

        System.out.println("Raw material added successfully!");
    }


    public static void viewMaterials() {

        System.out.println("\n--- RAW MATERIAL LIST ---");

        if (materials.isEmpty()) {

            System.out.println("No raw materials available.");
            return;
        }

        for (RawMaterial material : materials) {

            material.displayDetails();
            System.out.println("----------------------------");
        }
    }


    // ==========================================
    // MACHINE METHODS
    // ==========================================

    public static void addMachine() {

        System.out.println("\n--- ADD MACHINE ---");

        System.out.print("Machine ID: ");
        String id = scanner.nextLine();

        System.out.print("Machine Name: ");
        String name = scanner.nextLine();

        System.out.print("Machine Type: ");
        String type = scanner.nextLine();

        System.out.print("Cost Per Hour: ");
        double costPerHour = scanner.nextDouble();
        scanner.nextLine();


        Machine machine = new Machine(
                id,
                name,
                type,
                "AVAILABLE",
                costPerHour
        );

        machines.add(machine);

        System.out.println("Machine added successfully!");
    }


    public static void viewMachines() {

        System.out.println("\n--- MACHINE LIST ---");

        if (machines.isEmpty()) {

            System.out.println("No machines available.");
            return;
        }

        for (Machine machine : machines) {

            machine.displayDetails();
            System.out.println("----------------------------");
        }
    }


    // ==========================================
    // PRODUCT METHODS
    // ==========================================

    public static void createProduct() {

        System.out.println("\n--- CREATE CUSTOM PRODUCT ---");

        System.out.print("Product ID: ");
        String id = scanner.nextLine();

        System.out.print("Product Name: ");
        String name = scanner.nextLine();

        System.out.print("Material Name: ");
        String material = scanner.nextLine();

        System.out.print("Length (mm): ");
        double length = scanner.nextDouble();

        System.out.print("Width (mm): ");
        double width = scanner.nextDouble();

        System.out.print("Thickness (mm): ");
        double thickness = scanner.nextDouble();

        System.out.print("Quantity: ");
        int quantity = scanner.nextInt();
        scanner.nextLine();


        CustomProduct product = new CustomProduct(
                id,
                name,
                material,
                length,
                width,
                thickness,
                quantity
        );

        products.add(product);

        System.out.println("Custom product created successfully!");
    }


    public static void viewProducts() {

        System.out.println("\n--- PRODUCT LIST ---");

        if (products.isEmpty()) {

            System.out.println("No products available.");
            return;
        }

        for (CustomProduct product : products) {

            product.displayDetails();
            System.out.println("----------------------------");
        }
    }


    // ==========================================
    // CREATE PRODUCTION ORDER
    // ==========================================

    public static void createOrder() {

        System.out.println("\n--- CREATE PRODUCTION ORDER ---");

        // Check required data

        if (customers.isEmpty()) {
            System.out.println("Please add a customer first.");
            return;
        }

        if (materials.isEmpty()) {
            System.out.println("Please add raw material first.");
            return;
        }

        if (machines.isEmpty()) {
            System.out.println("Please add machine first.");
            return;
        }

        if (products.isEmpty()) {
            System.out.println("Please create a product first.");
            return;
        }


        System.out.print("Order ID: ");
        String orderId = scanner.nextLine();


        // SELECT CUSTOMER

        System.out.println("\nSelect Customer:");

        for (int i = 0; i < customers.size(); i++) {

            System.out.println(
                    (i + 1) + ". "
                            + customers.get(i).getName()
            );
        }

        System.out.print("Enter choice: ");
        int customerChoice = scanner.nextInt() - 1;
        scanner.nextLine();

        if (customerChoice < 0
                || customerChoice >= customers.size()) {

            System.out.println("Invalid customer choice!");
            return;
        }

        Customer selectedCustomer =
                customers.get(customerChoice);


        // SELECT PRODUCT

        System.out.println("\nSelect Product:");

        for (int i = 0; i < products.size(); i++) {

            System.out.println(
                    (i + 1) + ". "
                            + products.get(i).getProductName()
            );
        }

        System.out.print("Enter choice: ");
        int productChoice = scanner.nextInt() - 1;
        scanner.nextLine();

        if (productChoice < 0
                || productChoice >= products.size()) {

            System.out.println("Invalid product choice!");
            return;
        }

        CustomProduct selectedProduct =
                products.get(productChoice);


        // SELECT MATERIAL

        System.out.println("\nSelect Raw Material:");

        for (int i = 0; i < materials.size(); i++) {

            System.out.println(
                    (i + 1) + ". "
                            + materials.get(i).getMaterialName()
            );
        }

        System.out.print("Enter choice: ");
        int materialChoice = scanner.nextInt() - 1;
        scanner.nextLine();

        if (materialChoice < 0
                || materialChoice >= materials.size()) {

            System.out.println("Invalid material choice!");
            return;
        }

        RawMaterial selectedMaterial =
                materials.get(materialChoice);


        // SELECT MACHINE

        System.out.println("\nSelect Machine:");

        for (int i = 0; i < machines.size(); i++) {

            System.out.println(
                    (i + 1) + ". "
                            + machines.get(i).getMachineName()
                            + " - "
                            + machines.get(i).getStatus()
            );
        }

        System.out.print("Enter choice: ");
        int machineChoice = scanner.nextInt() - 1;
        scanner.nextLine();

        if (machineChoice < 0
                || machineChoice >= machines.size()) {

            System.out.println("Invalid machine choice!");
            return;
        }

        Machine selectedMachine =
                machines.get(machineChoice);


        // SELECT PROCESS

        System.out.println("\nSelect Manufacturing Process:");
        System.out.println("1. Cutting");
        System.out.println("2. Bending");

        System.out.print("Enter choice: ");
        int processChoice = scanner.nextInt();
        scanner.nextLine();

        ManufacturingProcess selectedProcess;

        if (processChoice == 1) {

            selectedProcess = new Cutting();

        } else if (processChoice == 2) {

            selectedProcess = new Bending();

        } else {

            System.out.println("Invalid process choice!");
            return;
        }


        // CREATE ORDER

        ProductionOrder order = new ProductionOrder(
                orderId,
                selectedCustomer,
                selectedProduct,
                selectedMaterial,
                selectedMachine,
                selectedProcess
        );


        // Calculate cost

        order.calculateCost();


        // Store order

        orders.add(order);

        System.out.println(
                "\nProduction order created successfully!"
        );

        order.displayOrder();
    }


    // ==========================================
    // VIEW ORDERS
    // ==========================================

    public static void viewOrders() {

        System.out.println("\n--- PRODUCTION ORDER LIST ---");

        if (orders.isEmpty()) {

            System.out.println("No orders available.");
            return;
        }

        for (ProductionOrder order : orders) {

            order.displayOrder();
        }
    }


    // ==========================================
    // START PRODUCTION
    // ==========================================

    public static void startProduction() {

        System.out.println("\n--- START PRODUCTION ---");

        if (orders.isEmpty()) {

            System.out.println("No orders available.");
            return;
        }


        System.out.println("Available Orders:");

        for (ProductionOrder order : orders) {

            System.out.println(
                    order.getOrderId()
                            + " - "
                            + order.getStatus()
            );
        }


        System.out.print("Enter Order ID: ");
        String orderId = scanner.nextLine();


        ProductionOrder foundOrder = null;


        for (ProductionOrder order : orders) {

            if (order.getOrderId().equalsIgnoreCase(orderId)) {

                foundOrder = order;
                break;
            }
        }


        if (foundOrder == null) {

            System.out.println("Order not found!");
            return;
        }


        foundOrder.startProduction();
    }


    // ==========================================
    // COMPLETE PRODUCTION
    // ==========================================

    public static void completeProduction() {

        System.out.println("\n--- COMPLETE PRODUCTION ---");

        if (orders.isEmpty()) {

            System.out.println("No orders available.");
            return;
        }


        System.out.print("Enter Order ID: ");
        String orderId = scanner.nextLine();


        ProductionOrder foundOrder = null;


        for (ProductionOrder order : orders) {

            if (order.getOrderId().equalsIgnoreCase(orderId)) {

                foundOrder = order;
                break;
            }
        }


        if (foundOrder == null) {

            System.out.println("Order not found!");
            return;
        }


        foundOrder.completeProduction();
    }
}