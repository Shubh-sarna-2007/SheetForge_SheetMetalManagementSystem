public class Welding extends ManufacturingProcess {

    public Welding() {
        super("Welding", 70);
    }

    @Override
    public double calculateCost(int quantity) {
        return quantity * getCostPerUnit();
    }
}