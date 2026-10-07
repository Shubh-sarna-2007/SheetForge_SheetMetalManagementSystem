public class CustomProduct {
    private String productId;
    private String productName;
    private String materialName;

    private double length;
    private double width;
    private double thickness;

    private int quantity;

    public CustomProduct(String productId, String productName, String materialName, double length, double width, double thickness, int quantity) {
        this.productId = productId;
        this.productName = productName;
        this.materialName = materialName;
        this.length = length;
        this.width = width;
        this.thickness = thickness;
        this.quantity = quantity;
    }

    public String getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public String getMaterialName() {
        return materialName;
    }

    public double getLength() {
        return length;
    }

    public double getWidth() {
        return width;
    }

    public double getThickness() {
        return thickness;
    }

    public int getQuantity() {
        return quantity;
    }
    public void displayDetails() {

        System.out.println("Product ID   : " + productId);
        System.out.println("Product Name : " + productName);
        System.out.println("Material     : " + materialName);
        System.out.println("Length       : " + length + " mm");
        System.out.println("Width        : " + width + " mm");
        System.out.println("Thickness    : " + thickness + " mm");
        System.out.println("Quantity     : " + quantity);
    }
    
}
