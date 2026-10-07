public class Finishing extends ManufacturingProcess {

    public Finishing() {
        super("Finishing", 35);
    }

    @Override
    public double calculateCost(int quantity) {
        return quantity * getCostPerUnit();
    }
}