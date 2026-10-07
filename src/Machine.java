public class Machine {
    private String machineId;
    private String machineName;
    private String machineType;
    private String status;
    private double costPerHour;

    public Machine(String machineId, String machineName, String machineType, String status, double costPerHour) {
        this.machineId = machineId;
        this.machineName = machineName;
        this.machineType = machineType;
        this.status = status;
        this.costPerHour = costPerHour;
    }

    public String getMachineId() {
        return machineId;
    }

    public String getMachineName() {
        return machineName;
    }

    public String getMachineType() {
        return machineType;
    }

    public String getStatus() {
        return status;
    }

    public double getCostPerHour() {
        return costPerHour;
    }

    public boolean isAvailable() {
        return status.equalsIgnoreCase("AVAILABLE");
    }

    public void setStatus(String status) {
        this.status = status;
    }
    public void displayDetails() {

        System.out.println("Machine ID   : " + machineId);
        System.out.println("Machine Name : " + machineName);
        System.out.println("Machine Type : " + machineType);
        System.out.println("Status       : " + status);
        System.out.println("Cost/Hour    : Rs. " + costPerHour);
    }
}
