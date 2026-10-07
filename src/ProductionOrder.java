public class ProductionOrder {
    private String orderId;

    private Customer customer;
    private CustomProduct product;
    private RawMaterial material;
    private Machine machine;
    private ManufacturingProcess process;

    private double totalCost;
    private double finalPrice;
    private String status;
    public ProductionOrder(String orderId,
                           Customer customer,
                           CustomProduct product,
                           RawMaterial material,
                           Machine machine,
                           ManufacturingProcess process) {

        this.orderId = orderId;
        this.customer = customer;
        this.product = product;
        this.material = material;
        this.machine = machine;
        this.process = process;

        this.totalCost = 0;
        this.finalPrice = 0;
        this.status = "PENDING";
    }
    public void calculateCost() {

        // Temporary basic calculation for Version 1

        int sheetsRequired = 1;

        double materialCost =
                sheetsRequired * material.getPricePerSheet();

        double processCost =
                process.calculateCost(product.getQuantity());

        // Assume machine is used for 2 hours for now
        double machineCost =
                machine.getCostPerHour() * 2;

        totalCost =
                materialCost + processCost + machineCost;

        // 20% profit
        finalPrice = totalCost * 1.20;
    }
    public boolean startProduction() {

        if (!machine.isAvailable()) {

            System.out.println(
                    "Production cannot start. Machine is not available.");

            return false;
        }

        int sheetsRequired = 1;

        if (material.getQuantity() < sheetsRequired) {

            System.out.println(
                    "Production cannot start. Insufficient material.");

            return false;
        }

        material.reduceQuantity(sheetsRequired);

        machine.setStatus("IN USE");

        status = "IN PRODUCTION";

        System.out.println("\nProduction started successfully!");

        return true;
    }
    public void completeProduction() {

        if (!status.equals("IN PRODUCTION")) {

            System.out.println(
                    "Production has not been started yet.");

            return;
        }

        status = "COMPLETED";
        machine.setStatus("AVAILABLE");

        System.out.println("Production completed successfully!");
    }
    public void displayOrder(){
        System.out.println("\n======================================");
        System.out.println("          PRODUCTION ORDER");
        System.out.println("======================================");
        System.out.println("Order ID     : " + orderId);
        System.out.println("Customer     : " + customer.getName());
        System.out.println("Company     : " + customer.getCompany());
        System.out.println("Product     : " + product.getProductName());
        System.out.println("Material     : " + product.getMaterialName());
        System.out.println("Quantity     : " + product.getQuantity());
        System.out.println("Process     : " + process.getProcessName());
        System.out.println("Machine     : " + machine.getMachineName());
        System.out.println("Machine Status : " + machine.getStatus());
        System.out.println("Order Status : " + status);
        System.out.println("Total Cost : "+ totalCost);
        System.out.println("Final Price : " + finalPrice) ;
        System.out.println("======================================");
    }
    public String getOrderId() {
        return orderId;
    }

    public String getStatus() {
        return status;
    }

    public Customer getCustomer() {
        return customer;
    }

    public CustomProduct getProduct() {
        return product;
    }

    public RawMaterial getMaterial() {
        return material;
    }

    public Machine getMachine() {
        return machine;
    }

    public ManufacturingProcess getProcess() {
        return process;
    }
}
