public class Supplier {
    private int supplier_id;
    private String name;
    private String company;
    private String phone;
    private String email;
    private String product;

    public Supplier(int supplier_id, String name, String company,
                    String phone, String email, String product) {
        this.supplier_id = supplier_id;
        this.name = name;
        this.company = company;
        this.phone = phone;
        this.email = email;
        this.product = product;
    }

    public int getSupplier_id() {
        return supplier_id;
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

    public String getProduct() {
        return product;
    }

    public void displayDetails() {
        System.out.println("Supplier ID : " + supplier_id);
        System.out.println("Name        : " + name);
        System.out.println("Company     : " + company);
        System.out.println("Phone       : " + phone);
        System.out.println("Email       : " + email);
        System.out.println("Product     : " + product);
    }
}
