import java.util.ArrayList;
public class CreditRow{
    public final String card_id;
    public double interest_rate;
    public double limit;
    public double running_balance;
    public double balance_due;
    /**
     * Constructor for CreditRow.
     */
    public CreditRow(String card_id, double interest_rate, double limit, double running_balance, double balance_due) {
        this.card_id = card_id;
        this.interest_rate = interest_rate;
        this.limit = limit;
        this.running_balance = running_balance;
        this.balance_due = balance_due;
    }

    /**
     * Getter for Card ID.
     */
    public String getCardID() {
        return card_id;
    }

    /**
     * Getter for Interest Rate.
     */
    public double getInterestRate() {
        return interest_rate;
    }

    /**
     * Setter for Interest Rate.
     * 
     * @param interest_rate the new interest rate.
     */
    public void setInterestRate(double interest_rate) {
        this.interest_rate = interest_rate;
    }

    /**
     * Getter for Credit Limit.
     */
    public double getLimit() {
        return limit;
    }

    /**
     * Setter for Credit Limit.
     */
    public void setLimit(double limit) {
        this.limit = limit;
    }

    /**
     * Getter for Running Balance.
     */
    public double getRunningBalance() {
        return running_balance;
    }

    /**
     * Setter for Running Balance.
     */
    public void setRunningBalance(double running_balance) {
        this.running_balance = running_balance;
    }

    /**
     * Getter for Balance Due.
     */
    public double getBalanceDue() {
        return balance_due;
    }

    /**
     * Setter for Balance Due.
     */
    public void setBalanceDue(double balance_due) {
        this.balance_due = balance_due;
    }

    /**
     * Print credit card.
     */
    public void printCreditRow() {
        System.out.printf("| %-8d | %-15.2f | %-10.2f | %-15.2f | %-12.2f |\n",
                card_id, interest_rate, limit, running_balance, balance_due);
    }

    /**
     * Print all credit cards.
     */
    public static void printCredits(ArrayList<CreditRow> credits) {
        System.out.printf("| %-8s | %-15s | %-10s | %-15s | %-12s |\n",
                "Card ID", "Interest Rate", "Limit", "Running Balance", "Balance Due");
        System.out.println("-------------------------------------------------------------------------------");
        for (CreditRow credit : credits) {
            credit.printCreditRow();
        }
    }
}