public class Bending extends ManufacturingProcess{
    public Bending() {
        super("Bending", 30);
    }

    @Override
    public double calculateCost(int quantity) {
        return quantity * costPerUnit;
    }
}
