import java.sql.Timestamp;
import java.util.ArrayList;

public class TransactionRow{
    public final String transaction_id;
    public String transaction_type;
    public Timestamp transaction_date;
    public double amount;
    public final String customer_id;
    public final String account_id;
    public final String branch_id;

    public TransactionRow(String transaction_id, String transaction_type, Timestamp transaction_date, double amount, String customer_id, String account_id, String branch_id) {
        this.transaction_id = transaction_id;
        this.transaction_type = transaction_type;
        this.transaction_date = transaction_date;
        this.amount = amount;
        this.customer_id = customer_id;
        this.account_id = account_id;
        this.branch_id = branch_id;
    }

    /**
     * Getter for Transaction ID
     */
    public String getTransactionID() {
        return transaction_id;
    }
    /**
     * Getter for Transaction Type
     */
    public String getTransactionType() {
        return transaction_type;
    }
    /**
     * Setter for Transaction Type
     */
    public void setTransactionType(String transaction_type) {
        this.transaction_type = transaction_type;
    }
    /**
     * Getter for Transaction Date
     */
    public Timestamp getTransactionDate() {
        return transaction_date;
    }
    /**
     * Setter for Transaction Date
     */
    public void setTransactionDate(Timestamp transaction_date) {
        this.transaction_date = transaction_date;
    }
    /**
     * Getter for Amount
     */
    public double getAmount() {
        return amount;
    }
    /**
     * Setter for Amount
     */
    public void setAmount(double amount) {
        this.amount = amount;
    }
    /**
     * Getter for Customer ID
     */
    public String getCustomerID() {
        return customer_id;
    }
    /**
     * Getter for Account ID
     */
    public String getAccountID() {
        return account_id;
    }
    /**
     * Getter for Branch ID
     */
    public String getBranchID() {
        return branch_id;
    }
    /**
     * Print transactions
     */
    public void printTransactionRow() {
        System.out.printf("| %-14d | %-15s | %-19s | %-10.2f | %-12s | %-10s | %-10s |\n", 
                          transaction_id, transaction_type, transaction_date, amount, customer_id, account_id, branch_id);
    }
    /**
     * Print all transactions
     */
    public static void printTransactions(ArrayList<TransactionRow> transactions) {
       System.out.printf("| %-14s | %-15s | %-19s | %-10s | %-12s | %-10s | %-10s |\n", 
                          "Transaction ID", "Transaction Type", "Transaction Date", "Amount", "Customer ID", "Account ID", "Branch ID");
    System.out.println("----------------------------------------------------------------------------------------------");
      for (TransactionRow review : transactions) {
          review.printTransactionRow();
      }
  }
}