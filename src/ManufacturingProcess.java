public abstract class ManufacturingProcess {
    protected String processName;
    protected double costPerUnit;

    public ManufacturingProcess(String processName, double costPerUnit) {
        this.processName = processName;
        this.costPerUnit = costPerUnit;
    }
    public abstract double calculateCost(int quantity);

    public String getProcessName() {
        return processName;
    }

    public double getCostPerUnit() {
        return costPerUnit;
    }
}
