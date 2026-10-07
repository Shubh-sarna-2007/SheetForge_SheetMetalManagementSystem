public class Punching extends ManufacturingProcess {

    public Punching() {
        super("Punching", 40);
    }

    @Override
    public double calculateCost(int quantity) {
        return quantity * getCostPerUnit();
    }
}