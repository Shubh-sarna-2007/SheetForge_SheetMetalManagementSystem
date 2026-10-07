public class Cutting extends ManufacturingProcess{
    public Cutting() {
        super("Cutting", 50);
    }

    @Override
    public double calculateCost(int quantity) {
        return quantity * costPerUnit;
    }
}
