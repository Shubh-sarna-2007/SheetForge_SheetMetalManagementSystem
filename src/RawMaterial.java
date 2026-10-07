public class RawMaterial {
    private String materialId;
    private String materialName;
    private double thickness;
    private double length;
    private double width;
    private int quantity;
    private double pricePerSheet;

    public RawMaterial(String materialId, String materialName, double thickness, double length, double width, int quantity, double pricePerSheet) {
        this.materialId = materialId;
        this.materialName = materialName;
        this.thickness = thickness;
        this.length = length;
        this.width = width;
        this.quantity = quantity;
        this.pricePerSheet = pricePerSheet;
    }

    public String getMaterialId() {
        return materialId;
    }

    public String getMaterialName() {
        return materialName;
    }

    public double getThickness() {
        return thickness;
    }

    public double getLength() {
        return length;
    }

    public double getWidth() {
        return width;
    }

    public int getQuantity() {
        return quantity;
    }

    public double getPricePerSheet() {
        return pricePerSheet;
    }
    public void reduceQuantity(int amount){
        if(amount>quantity){
            System.out.println("Insufficient Material");
            return;
        }
        quantity = quantity-amount;
    }
    public void addQuantity(int amount){
        quantity = quantity + amount;
    }
    public void displayDetails() {

        System.out.println("Material ID   : " + materialId);
        System.out.println("Material Name : " + materialName);
        System.out.println("Thickness     : " + thickness + " mm");
        System.out.println("Sheet Size    : " + length + " x " + width + " mm");
        System.out.println("Quantity      : " + quantity + " sheets");
        System.out.println("Price/Sheet   : Rs. " + pricePerSheet);
    }
}
