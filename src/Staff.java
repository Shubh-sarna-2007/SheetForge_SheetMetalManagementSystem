public class Staff {

    private int staffId;
    private String name;
    private String role;
    private String phone;
    private String status;

    public Staff(int staffId, String name, String role, String phone) {
        this.staffId = staffId;
        this.name = name;
        this.role = role;
        this.phone = phone;
        this.status = "AVAILABLE";
    }

    public int getStaffId() {
        return staffId;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }

    public String getPhone() {
        return phone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void displayDetails() {

        System.out.println("Staff ID : " + staffId);
        System.out.println("Name     : " + name);
        System.out.println("Role     : " + role);
        System.out.println("Phone    : " + phone);
        System.out.println("Status   : " + status);
        System.out.println("-----------------------------");
    }
}