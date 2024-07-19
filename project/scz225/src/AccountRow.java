import java.util.ArrayList;
public class AccountRow{
    public final int account_id;
    public String account_type;
    public double balance;
    public double interest_rate;

    public AccountRow(int account_id, String account_type, double balance, double interest_rate) {
        this.account_id = account_id;
        this.account_type = account_type;
        this.balance = balance;
        this.interest_rate = interest_rate;
    }

    /*
    * Getter for Account ID
    */
    public int getAccountID() {
        return account_id;
    }
    /*
    * Getter for Account Type
    */
    public String getAccountType() {
        return account_type;
    }
    /*
    * Setter for Account Type
    */
    public void setAccountType(String account_type) {
        this.account_type = account_type;
    }
    /*
    * Getter for Balance
    */
    public double getBalance() {
        return balance;
    }
    /*
    * Setter for Balance
    */
    public void setBalance(double balance) {
        this.balance = balance;
    }
    /*
    * Getter for Interest Rate
    */
    public double getInterestRate() {
        return interest_rate;
    }
    /*
    * Setter for Interest Rate
    */
    public void setInterestRate(double interest_rate) {
        this.interest_rate = interest_rate;
    }
    /*
    * Print method for a single account row
    */
    public void printAccountRow() {
        System.out.printf("| %-10d | %-12s | %-10.2f | %-13.2f |\n",
                account_id, account_type, balance, interest_rate);
    }
    /*
    * Print method for all account rows
    */
    public static void printAccounts(ArrayList<AccountRow> accounts) {
        System.out.printf("| %-10s | %-12s | %-10s | %-13s |\n",
                "Account ID", "Account Type", "Balance", "Interest Rate");
        System.out.println("---------------------------------------------------------");
        for (AccountRow account : accounts) {
            account.printAccountRow();
        }
    }
}