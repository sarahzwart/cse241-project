import java.util.ArrayList;

public class SavingsRow{
    public final String account_id;
    public double minimum_balance;
    public double penalty;

    public SavingsRow(String account_id, double minimum_balance, double penalty) {
        this.account_id = account_id;
        this.minimum_balance = minimum_balance;
        this.penalty = penalty;
    }
    /*
     * Getter for Account ID.
     */
    public String getAccountID() {
        return account_id;
    }

    /**
     * Getter for Minimum Balance.
     */
    public double getMinimumBalance() {
        return minimum_balance;
    }

    /**
     * Setter for Minimum Balance.
     */
    public void setMinimumBalance(double minimum_balance) {
        this.minimum_balance = minimum_balance;
    }

    /**
     * Getter for Penalty.
     */
    public double getPenalty() {
        return penalty;
    }

    /**
     * Setter for Penalty.
     */
    public void setPenalty(double penalty) {
        this.penalty = penalty;
    }

    /**
     * Print savings row.
     */
    public void printSavingsRow() {
        System.out.printf("| %-10d | %-15.2f | %-10.2f |\n",
                account_id, minimum_balance, penalty);
    }

    /**
     * Print method for all savings rows.
     */
    public static void printSavings(ArrayList<SavingsRow> savings) {
        System.out.printf("| %-10s | %-15s | %-10s |\n",
                "Account ID", "Min Balance", "Penalty");
        System.out.println("-----------------------------------------");
        for (SavingsRow saving : savings) {
            saving.printSavingsRow();
        }
    }
}