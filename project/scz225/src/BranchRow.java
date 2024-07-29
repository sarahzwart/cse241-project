import java.util.ArrayList;
public class BranchRow{
    public final String branch_id;
    public String branch_type;

    public BranchRow(String branch_id, String branch_type){
        this.branch_id = branch_id;
        this.branch_type = branch_type;
    }

    /**
     * Gets the branch ID.
     */
    public String getBranchId() {
        return branch_id;
    }

    /**
     * Gets the branch type.
     */
    public String getBranchType() {
        return branch_type;
    }

    /**
     * Sets the branch type.
     */
    public void setBranchType(String branch_type) {
        this.branch_type = branch_type;
    }

    /**
     * Prints the branch details in a formatted manner.
     */
    public void printBranchRow() {
        System.out.printf("| %-10s | %-12s |\n", 
                          branch_id, branch_type);
    }

    /**
     * Prints all branch rows in a formatted manner.
     */
    public static void printBranchRows(ArrayList<BranchRow> branchRows) {
        System.out.printf("| %-10s | %-12s |\n", 
                          "Branch ID", "Branch Type");
        System.out.println("----------------------------");
        for (BranchRow branchRow : branchRows) {
            branchRow.printBranchRow();
        }
    }

    public static void printBranchRowsFullService(ArrayList<BranchRow> branchRows) {
        System.out.printf("| %-10s | %-12s |\n", 
                          "Branch ID", "Branch Type");
        System.out.println("----------------------------");
        for (BranchRow branchRow : branchRows) {
            if(branchRow.branch_type.equals("Full Service")){
                branchRow.printBranchRow();
            }
        }
    }
}