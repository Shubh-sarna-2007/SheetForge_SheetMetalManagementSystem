import java.util.ArrayList;

public class ProcessPipeline {

    private ArrayList<ManufacturingProcess> processes;

    public ProcessPipeline() {
        processes = new ArrayList<>();
    }

    public void addProcess(ManufacturingProcess process) {
        processes.add(process);
    }

    public void removeProcess(int index) {

        if (index >= 0 && index < processes.size()) {
            processes.remove(index);
        }
    }

    public double calculateTotalProcessCost(int quantity) {

        double total = 0;

        for (ManufacturingProcess process : processes) {
            total += process.calculateCost(quantity);
        }

        return total;
    }

    public void displayPipeline() {

        System.out.println("\nManufacturing Process Pipeline");
        System.out.println("-------------------------------");

        if (processes.isEmpty()) {
            System.out.println("No processes added.");
            return;
        }

        for (int i = 0; i < processes.size(); i++) {

            System.out.println(
                    (i + 1) + ". " +
                            processes.get(i).getProcessName()
            );
        }
    }

    public ArrayList<ManufacturingProcess> getProcesses() {
        return processes;
    }
}