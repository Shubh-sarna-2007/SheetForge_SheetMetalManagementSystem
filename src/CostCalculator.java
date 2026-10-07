public class CostCalculator {

    public static double calculateMaterialCost(
            RawMaterial material,
            int quantity) {

        return material.getPricePerSheet() * quantity;
    }

    public static double calculateProcessCost(
            ProcessPipeline pipeline,
            int quantity) {

        return pipeline.calculateTotalProcessCost(quantity);
    }

    public static double calculateMachineCost(
            Machine machine,
            double hours) {

        return machine.getCostPerHour() * hours;
    }

    public static double calculateLabourCost(
            double hourlyRate,
            double hours) {

        return hourlyRate * hours;
    }

    public static double calculateOverhead(
            double productionCost) {

        return productionCost * 0.10;
    }

    public static double calculateFinalPrice(
            double productionCost,
            double profitPercentage) {

        return productionCost +
                (productionCost * profitPercentage / 100);
    }
}