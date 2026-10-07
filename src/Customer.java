public class Customer {
    private int customer_id;
    private String name;
    private String company;
    private String phone;
    private String email;

    public Customer(int customer_id, String name, String company, String phone, String email) {
        this.customer_id = customer_id;
        this.name = name;
        this.company = company;
        this.phone = phone;
        this.email = email;
    }

    public int getCustomer_id() {
        return customer_id;
    }

    public String getName() {
        return name;
    }

    public String getCompany() {
        return company;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public void displayDetails(){
        System.out.println("Customer ID : " + customer_id);
        System.out.println("Name        : " + name);
        System.out.println("Company     : " + company);
        System.out.println("Phone       : " + phone);
        System.out.println("Email       : " + email);
    }
}
