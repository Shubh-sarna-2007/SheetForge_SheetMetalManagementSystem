public class MachineBooking {

    private int bookingId;
    private Machine machine;
    private Staff staff;
    private String date;
    private String startTime;
    private String endTime;
    private String status;

    public MachineBooking(int bookingId,
                          Machine machine,
                          Staff staff,
                          String date,
                          String startTime,
                          String endTime) {

        this.bookingId = bookingId;
        this.machine = machine;
        this.staff = staff;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = "BOOKED";
    }

    public int getBookingId() {
        return bookingId;
    }

    public Machine getMachine() {
        return machine;
    }

    public Staff getStaff() {
        return staff;
    }

    public String getDate() {
        return date;
    }

    public String getStartTime() {
        return startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public String getStatus() {
        return status;
    }

    public void cancelBooking() {
        status = "CANCELLED";
    }

    public void displayBooking() {

        System.out.println("Booking ID : " + bookingId);
        System.out.println("Machine    : " + machine.getMachineName());
        System.out.println("Staff      : " + staff.getName());
        System.out.println("Date       : " + date);
        System.out.println("Time       : " + startTime + " - " + endTime);
        System.out.println("Status     : " + status);
        System.out.println("-----------------------------");
    }
}