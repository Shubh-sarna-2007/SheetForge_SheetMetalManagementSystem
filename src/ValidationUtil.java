public class ValidationUtil {

    public static void validateQuantity(int quantity)
            throws InvalidQuantityException {

        if (quantity <= 0) {
            throw new InvalidQuantityException(
                    "Quantity must be greater than zero."
            );
        }
    }

    public static void validateText(String value, String fieldName) {

        if (value == null || value.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    fieldName + " cannot be empty."
            );
        }
    }

    public static void validatePhone(String phone) {

        if (phone == null || !phone.matches("\\d{10}")) {

            throw new IllegalArgumentException(
                    "Phone number must contain 10 digits."
            );
        }
    }
}