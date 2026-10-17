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
        // Calculate sheets required using dimensions and 10% standard wastage
        double requiredArea = product.getLength() * product.getWidth() * product.getQuantity();
        int sheetsRequired = CostCalculator.calculateSheetsRequired(
                requiredArea,
                material.getLength(),
                material.getWidth(),
                10.0
        );
        if (sheetsRequired < 1) sheetsRequired = 1;

        double materialCost = CostCalculator.calculateMaterialCost(material, sheetsRequired);
        double processCost = process.calculateCost(product.getQuantity());
        double machineCost = CostCalculator.calculateMachineCost(machine, 2.0);

        double baseProductionCost = materialCost + processCost + machineCost;
        double overhead = CostCalculator.calculateOverhead(baseProductionCost);

        totalCost = baseProductionCost + overhead;
        finalPrice = CostCalculator.calculateFinalPrice(totalCost, 20.0);
    }

    public boolean startProduction() throws MachineUnavailableException, InsufficientMaterialException {
        if (!machine.isAvailable()) {
            throw new MachineUnavailableException(
                    "Machine '" + machine.getMachineName() + "' is currently " + machine.getStatus() + " and unavailable for production."
            );
        }

        double requiredArea = product.getLength() * product.getWidth() * product.getQuantity();
        int sheetsRequired = CostCalculator.calculateSheetsRequired(
                requiredArea,
                material.getLength(),
                material.getWidth(),
                10.0
        );
        if (sheetsRequired < 1) sheetsRequired = 1;

        if (material.getQuantity() < sheetsRequired) {
            throw new InsufficientMaterialException(
                    "Insufficient Material for order: Needed " + sheetsRequired + " sheets, but only " + material.getQuantity() + " available in stock."
            );
        }

        material.reduceQuantity(sheetsRequired);
        machine.setStatus("IN USE");
        status = "IN PRODUCTION";

        System.out.println("\nProduction started successfully! Deducted " + sheetsRequired + " sheets from inventory.");
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
