public class VendorRow {
    public final String vendor_id;
    public final String vendor_name;

    // Constructor
    public VendorRow(String vendor_id, String vendor_name) {
        this.vendor_id = vendor_id;
        this.vendor_name = vendor_name;
    }

    // Getters
    public String getVendorId() {
        return vendor_id;
    }

    public String getVendorName() {
        return vendor_name;
    }

    // Print method for vendor row
    public void printVendorRow() {
        System.out.printf("| %-10s | %-20s |\n", vendor_id, vendor_name);
    }

    // Print method for list of vendor rows
    public static void printVendors(java.util.List<VendorRow> vendors) {
        System.out.printf("| %-10s | %-20s |\n", "Vendor ID", "Vendor Name");
        System.out.println("-----------------------------------------------");
        for (VendorRow vendor : vendors) {
            vendor.printVendorRow();
        }
    }
}
