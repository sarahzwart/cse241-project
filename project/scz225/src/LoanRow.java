import java.util.ArrayList;
public class LoanRow {
    public final int loan_id;
    public String loan_type;
    public double amount;
    public double interest_rate;
    public double monthly_payment;
    public final int customer_id;

    /** 
     * Constructor for LoanRow. 
    */
    public LoanRow(int loan_id, String loan_type, double amount, double interest_rate, double monthly_payment, int customer_id) {
        this.loan_id = loan_id;
        this.loan_type = loan_type;
        this.amount = amount;
        this.interest_rate = interest_rate;
        this.monthly_payment = monthly_payment;
        this.customer_id = customer_id;
    }

    /** 
     * Getter for Loan ID. 
     */
    public int getLoanID() {
        return loan_id;
    }

    /** 
     * Getter for Loan Type. 
     */
    public String getLoanType() {
        return loan_type;
    }

    /** 
     * Setter for Loan Type. 
     */
    public void setLoanType(String loan_type) {
        this.loan_type = loan_type;
    }

    /** 
     * Getter for Amount. 
     */
    public double getAmount() {
        return amount;
    }

    /** 
     * Setter for Amount. 
     */
    public void setAmount(double amount) {
        this.amount = amount;
    }

    /** 
     * Getter for Interest Rate. 
     */
    public double getInterestRate() {
        return interest_rate;
    }

    /** 
     * Setter for Interest Rate. 
     */
    public void setInterestRate(double interest_rate) {
        this.interest_rate = interest_rate;
    }

    /** 
     * Getter for Monthly Payment. 
     */
    public double getMonthlyPayment() {
        return monthly_payment;
    }

    /** 
     * Setter for Monthly Payment. 
     */
    public void setMonthlyPayment(double monthly_payment) {
        this.monthly_payment = monthly_payment;
    }

    /** 
     * Getter for Customer ID. 
     */
    public int getCustomerID() {
        return customer_id;
    }
    /** 
     * Print loan row. 
     */
    public void printLoanRow() {
        System.out.printf("| %-8d | %-10s | %-10.2f | %-12.2f | %-15.2f | %-10d |\n",
                loan_id, loan_type, amount, interest_rate, monthly_payment, customer_id);
    }

    /** 
     * Print all loan rows. 
     */
    public static void printLoans(ArrayList<LoanRow> loans) {
        System.out.printf("| %-8s | %-10s | %-10s | %-12s | %-15s | %-10s |\n",
                "Loan ID", "Loan Type", "Amount", "Interest Rate", "Monthly Payment", "Customer ID");
        System.out.println("----------------------------------------------------------------------------");
        for (LoanRow loan : loans) {
            loan.printLoanRow();
        }
    }
}