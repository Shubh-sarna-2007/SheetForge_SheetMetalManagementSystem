public class Test {
    public static void main(String[] args) {
        System.out.println("==============================================");
        System.out.println("  SheetForge OOP Component Verification Test  ");
        System.out.println("==============================================");

        try {
            // 1. Initialize core objects
            RawMaterial mat = new RawMaterial("RM01", "Mild Steel Sheet 1.5mm", 1.5, 2400, 1200, 10, 1200.0);
            Machine machine = new Machine("M01", "LVD CNC Laser Cutter", "Laser Cutter", "AVAILABLE", 850.0);
            CustomProduct prod = new CustomProduct("P01", "Steel Bracket", "Mild Steel", 200, 150, 1.5, 5);
            Customer cust = new Customer(1, "Arjun Mehta", "Mehta Fabricators", "9876543210", "arjun@mehta.com");
            ManufacturingProcess proc = new Cutting();

            // 2. Create production order and calculate costs dynamically
            ProductionOrder order = new ProductionOrder("ORD-TEST", cust, prod, mat, machine, proc);
            order.calculateCost();
            System.out.println("✔ Dynamic Cost Calculation Successful.");

            // 3. Start production (deducts stock and checks availability)
            order.startProduction();
            System.out.println("✔ Production Started. Remaining Stock: " + mat.getQuantity() + " sheets");

            // 4. Complete production
            order.completeProduction();
            System.out.println("✔ Production Completed. Machine Status: " + machine.getStatus());

            System.out.println("\n🎉 ALL OOP TESTS & VALIDATIONS PASSED CLEANLY!");
            System.out.println("==============================================");

        } catch (MachineUnavailableException | InsufficientMaterialException e) {
            System.out.println("❌ Test Error: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("❌ Unexpected Error: " + e.getMessage());
        }
    }
}
