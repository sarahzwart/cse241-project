import java.util.ArrayList;
public class BranchRow{
    public final int branch_id;
    public String branch_type;

    public BranchRow(int branch_id, String branch_type){
        this.branch_id = branch_id;
        this.branch_id = branch_type;
    }

    /**
     * Gets the branch ID.
     */
    public int getBranchId() {
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
        System.out.printf("| %-10d | %-12s |\n", 
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
}