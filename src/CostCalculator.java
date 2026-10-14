
public class CostCalculator {

    // Calculate material cost
    public static double calculateMaterialCost(
            RawMaterial material,
            int quantity) {
        return material.getPricePerSheet() * quantity;
    }

    // Calculate number of sheets required
    public static int calculateSheetsRequired(
            double requiredArea,
            double sheetLength,
            double sheetWidth,
            double wastagePercentage) {

        double sheetArea = sheetLength * sheetWidth;

        double totalArea = requiredArea +
                (requiredArea * wastagePercentage / 100);

        return (int) Math.ceil(totalArea / sheetArea);
    }

    // Calculate total sheet area
    public static double calculateSheetArea(
            double sheetLength,
            double sheetWidth) {

        return sheetLength * sheetWidth;
    }

    // Calculate manufacturing process cost
    public static double calculateProcessCost(
            ProcessPipeline pipeline,
            int quantity ) {

        return pipeline.calculateTotalProcessCost(quantity);
    }

    // Calculate machine cost
    public static double calculateMachineCost(
            Machine machine,
            double hours) {

        return machine.getCostPerHour() * hours;
    }

    // Calculate labour cost
    public static double calculateLabourCost(
            double hourlyRate,
            double hours) {

        return hourlyRate * hours;
    }

    // Calculate overhead at 10%
    public static double calculateOverhead(
            double productionCost) {

        return productionCost * 0.10;
    }

    // Calculate final price with profit
    public static double calculateFinalPrice(
            double productionCost,
            double profitPercentage) {

        return productionCost +
                (productionCost * profitPercentage / 100);
    }
}
