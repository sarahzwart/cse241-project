import java.sql.Timestamp;

public class PurchaseRow {
    public final int purchase_id;
    public String card_id;
    public String vendor_id;
    public double amount;
    public Timestamp purchase_date;

    public PurchaseRow(int purchase_id, String card_id, String vendor_id, double amount, Timestamp purchase_date) {
        this.purchase_id = purchase_id;
        this.card_id = card_id;
        this.vendor_id = vendor_id;
        this.amount = amount;
        this.purchase_date = purchase_date;
    }

    // Getters
    public int getPurchaseId() {
        return purchase_id;
    }

    public String getCardId() {
        return card_id;
    }

    public String getVendorId() {
        return vendor_id;
    }

    public double getAmount() {
        return amount;
    }

    public Timestamp getPurchaseDate() {
        return purchase_date;
    }

    // Setters
    public void setCardId(String card_id) {
        this.card_id = card_id;
    }

    public void setVendorId(String vendor_id) {
        this.vendor_id = vendor_id;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public void setPurchaseDate(Timestamp purchase_date) {
        this.purchase_date = purchase_date;
    }

    // Print method
    public void printPurchaseRow() {
        System.out.printf("| %-10d | %-10s | %-10s | %-10.2f | %-20s |\n",
                purchase_id, card_id, vendor_id, amount, purchase_date.toString());
    }

    // Print method for a list of purchase rows
    public static void printPurchases(java.util.List<PurchaseRow> purchases) {
        System.out.printf("| %-10s | %-10s | %-10s | %-10s | %-20s |\n",
                "Purchase ID", "Card ID", "Vendor ID", "Amount", "Purchase Date");
        System.out.println("--------------------------------------------------------------------");
        for (PurchaseRow purchase : purchases) {
            purchase.printPurchaseRow();
        }
    }
}
