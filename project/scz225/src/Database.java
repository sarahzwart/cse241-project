import java.sql.*;
import java.util.Scanner;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Database{
    /** 
    * The connection to the database. When there is no connection, it should
    * be null. Otherwise, there is a valid open connection
    */
    private Connection databaseConnection;

    /**
     * Purchases
     */
    private PreparedStatement selectOneVendorId;
    private PreparedStatement selectAllVendor;
    private PreparedStatement showPastPurchasesByCardId;
    private PreparedStatement addToCreditBalance;
    /**
     * Adding a Card
     */
    private PreparedStatement selectAllCardByCustomerId;

    /**
     * Getting Customer Accounts
     */
    private PreparedStatement getAccountByCustomer;
    private PreparedStatement insertOwnership;
    /**
     * Prepared Statements for Account Table
     */
    private PreparedStatement selectAllAccount;
    private PreparedStatement selectOneAccount;
    private PreparedStatement selectAllAccountByType;
    private PreparedStatement selectAllAccountByBalance;
    private PreparedStatement addToAccountAmount;
    private PreparedStatement subtractFromAccountAmount;

    private PreparedStatement getMinimumBalance;
    private PreparedStatement getTypeOfAccount;
    private PreparedStatement getSavingsRow;


    /**
     * Prepared statements for Branch Table
     */
    private PreparedStatement selectAllBranch;
    private PreparedStatement selectOneBranch;
    private PreparedStatement selectAllBranchByType;
    
    /**
     * Prepared Statements for Card Table
     */
    private PreparedStatement selectAllCard;
    private PreparedStatement selectOneCard;
    private PreparedStatement selectOneCardByType;

    /**
     * Prepared Statements for Credit Table
     */
    private PreparedStatement selectAllCredit;
    private PreparedStatement selectOneCredit;
    
    /**
     * Prepared Statements for Customer Table
     */
    private PreparedStatement selectAllCustomer;
    private PreparedStatement selectOneCustomer;
    private PreparedStatement selectOneCustomerByName;

    /**
     * Prepared Statements for Loan Table
     */
    private PreparedStatement selectAllLoan;
    private PreparedStatement selectOneLoan;

    /**
     * Prepared Statements for Saving Table
     */
    private PreparedStatement selectAllSavings;
    private PreparedStatement selectOneSavings;

    /**
     * Prepared Statements for Transaction Table
     */
    private PreparedStatement selectAllTransaction;
    private PreparedStatement selectOneTransaction;
    private PreparedStatement selectAllTransactionByCustomer;

    /**
     * Declarations for Insertions
     */
    private PreparedStatement insertPurchase;
    private PreparedStatement insertAccount;
    private PreparedStatement insertBranch;
    private PreparedStatement insertCard;
    private PreparedStatement insertCreditCard;
    private PreparedStatement insertCustomer;
    private PreparedStatement insertLoan;
    private PreparedStatement insertSavingsAccount;
    private PreparedStatement insertTransaction;

    /**
     * Declarations for Deletions
     */
    private PreparedStatement deleteAccount;
    private PreparedStatement deleteBranch;
    private PreparedStatement deleteCard;
    private PreparedStatement deleteCreditCard;
    private PreparedStatement deleteCustomer;
    private PreparedStatement deleteLoan;
    private PreparedStatement deleteSavingsAccount;
    private PreparedStatement deleteTransaction;

    static Database getDatabase( String user, String password){
        Database database = new Database();
        try {
            String dbURL = "jdbc:oracle:thin:@edgar1.cse.lehigh.edu:1521:cse241";
            Connection conn = DriverManager.getConnection(dbURL, user, password);
            if (conn == null){
                System.err.println("Error: DriverManager.getConnection() returned a null object");
                return null;
            }
            database.databaseConnection = conn;
        } catch (SQLException e){
            System.err.println("Error: DriverManager.getConnection() threw a SQLException");
            e.printStackTrace();
            return null;
        }

        // Set Up Prepared Statements

        try {
            database.insertPurchase = database.databaseConnection.prepareStatement(
                "INSERT INTO Purchase (card_id, vendor_id, amount, purchase_date) VALUES (?, ?, ?, ?)"
            );
            
            database.selectOneVendorId = database.databaseConnection.prepareStatement(
                "SELECT * FROM Vendor WHERE vendor_name = ?"
            );
            
            database.selectAllVendor = database.databaseConnection.prepareStatement(
                "SELECT * FROM Vendor"
            );
            
            database.showPastPurchasesByCardId = database.databaseConnection.prepareStatement(
                "SELECT * FROM Purchases WHERE card_id = ?"
            );
            database.addToCreditBalance = database.databaseConnection.prepareStatement(
                "UPDATE Credit SET running_balance = running_balance + ? WHERE card_id = ?"
            );
            database.addToAccountAmount = database.databaseConnection.prepareStatement(
                "UPDATE Account SET balance = balance + ? WHERE account_id = ?"
            );
            database.subtractFromAccountAmount = database.databaseConnection.prepareStatement(
                "UPDATE Account SET balance = balance - ? WHERE account_id = ?"
            );
            database.getMinimumBalance = database.databaseConnection.prepareStatement(
                "SELECT minimum_balance FROM Savings WHERE account_id = ?"
            );

            database.getAccountByCustomer = database.databaseConnection.prepareStatement(
                "SELECT account_id FROM Account_Ownership where customer_id = ?"
            );
            // ACCOUNTS
            database.selectAllAccount = database.databaseConnection.prepareStatement(
                "SELECT * FROM Account"
            );
            database.selectOneAccount = database.databaseConnection.prepareStatement(
                "SELECT * FROM Account WHERE account_id = ?"
            );
            database.selectAllAccountByType = database.databaseConnection.prepareStatement(
                "SELECT * FROM Account WHERE account_type = ?"
            );
            database.selectAllAccountByBalance = database.databaseConnection.prepareStatement(
                "SELECT * FROM Account WHERE balance > ?"
            );

            // BRANCH
            database.selectAllBranch = database.databaseConnection.prepareStatement(
                "SELECT * FROM Branch"
            );
            database.selectOneBranch = database.databaseConnection.prepareStatement(
                "SELECT * FROM Branch WHERE branch_id = ?"
            );
            database.selectAllBranchByType = database.databaseConnection.prepareStatement(
                "SELECT * FROM Branch WHERE branch_type = ?"
            );

            // CARD
            database.selectAllCard = database.databaseConnection.prepareStatement(
                "SELECT * FROM Card"
            );
            database.selectOneCard = database.databaseConnection.prepareStatement(
                "SELECT * FROM Card WHERE card_id = ?"
            );
            database.selectOneCardByType = database.databaseConnection.prepareStatement(
                "SELECT * FROM Card WHERE card_type = ? and customer_id = ?"
            ); 

            database.selectAllCardByCustomerId = database.databaseConnection.prepareStatement(
                "SELECT * FROM Card WHERE customer_id = ?"
            );

            // CREDIT
            database.selectAllCredit = database.databaseConnection.prepareStatement(
                "SELECT * FROM Credit"
            );

            database.selectOneCredit = database.databaseConnection.prepareStatement(
                "SELECT * FROM Credit WHERE card_id = ?"
            );

            // CUSTOMER
            database.selectAllCustomer = database.databaseConnection.prepareStatement(
                "SELECT * FROM Customer"
            );
            database.selectOneCustomer = database.databaseConnection.prepareStatement(
                "SELECT * FROM Customer WHERE customer_id = ?"
            );
            database.selectOneCustomerByName = database.databaseConnection.prepareStatement(
                "SELECT * FROM Customer WHERE customer_name = ?"
            );

            // LOAN
            database.selectAllLoan = database.databaseConnection.prepareStatement(
                "SELECT * FROM Loan"
            );
            database.selectOneLoan = database.databaseConnection.prepareStatement(
                "SELECT * FROM Loan WHERE loan_id = ?"
            );

            // SAVINGS
            database.selectAllSavings = database.databaseConnection.prepareStatement(
                "SELECT * FROM Savings"
            );
            database.selectOneSavings = database.databaseConnection.prepareStatement(
                "SELECT * FROM Savings WHERE account_id = ?"
            );

            // TRANSACTIONS
            database.selectAllTransaction = database.databaseConnection.prepareStatement(
                "SELECT * FROM Transaction"
            );
            database.selectOneTransaction = database.databaseConnection.prepareStatement(
                "SELECT * FROM Transaction where transaction_id = ?"
            );
             database.selectAllTransactionByCustomer = database.databaseConnection.prepareStatement(
                "SELECT * FROM Transaction where customer_id = ?"
            );

            // PREPARED STATEMENTS FOR CREATING DATA
            database.insertAccount = database.databaseConnection.prepareStatement(
                "INSERT INTO Account(account_type, balance, interest_rate) VALUES (?, ?, ?)", 
                new String[]{"account_id"});
            /*database.insertCard = database.databaseConnection.prepareStatement(
                //NEED TO INCREMENT
            ;
            database.insertCreditCard = database.databaseConnection.prepareStatement(
                //NEED TO INCREMENT
            );*/
            database.insertOwnership = database.databaseConnection.prepareStatement(
                "INSERT INTO Account_Ownership (account_id, customer_id) VALUES (?, ?)"
            );
            database.insertCustomer = database.databaseConnection.prepareStatement(
                "INSERT INTO Customer (customer_name, birthday, address) VALUES (?, ?, ?)"
            );
            database.insertLoan = database.databaseConnection.prepareStatement(
                "INSERT INTO Loan (loan_type, amount, interest_rate, monthly_payment, customer_id) VALUES (?, ?, ?, ?, ?)",
                new String[]{"loan_id"});
            database.insertSavingsAccount = database.databaseConnection.prepareStatement(
                "INSERT INTO Savings VALUES (?, ?, ?)"
            );
            database.insertTransaction = database.databaseConnection.prepareStatement(
                "INSERT INTO Transaction (transaction_type, transaction_date, amount, customer_id, account_id, branch_id) VALUES (?,?,?,?,?,?) ", 
                new String[]{"transaction_id"});


            // Implement Prepared Statements for Deposit/Withdrwal
            // Implement Prepared Statements for Purchases
        } catch (SQLException e) {
            System.err.println("Error creating prepared statement");
            e.printStackTrace();
            return null;
        }
        return database;
    }

    boolean disconnect() {
        if (databaseConnection == null) {
            System.err.println("Unable to close connection: Connection was null");
            return false;
        }
        try {
            databaseConnection.close();
        } catch (SQLException e) {
            System.err.println("Error: Connection.close() threw a SQLException");
            e.printStackTrace();
            databaseConnection = null;
            return false;
        }
        databaseConnection = null;
        return true;
    }
    // account_type, balance, interest_rate
    // insert methods


    public ArrayList<CardRow> selectAllCardByCustomerId(String customer_id){
        ArrayList<CardRow> cards = new ArrayList<CardRow>();
        try {
            selectAllCardByCustomerId.setString(1, customer_id);
            ResultSet rs = selectAllCardByCustomerId.executeQuery();
            while(rs.next()){
                String card_id = rs.getString("card_id");
                String card_type = rs.getString("card_type");
                String account_id = rs.getString("account_id");
                String cust_id = rs.getString("customer_id");
                String customer_name = rs.getString("customer_name");
                CardRow card = new CardRow(card_id, card_type, account_id, cust_id, customer_name);
                cards.add(card);
            }
            return cards;
        } catch (SQLException e){
            e.printStackTrace();
        }
        return cards;
    }
    public void insertPurchase(String card_id, String vendor_id, double amount, Timestamp purchase_date){
        try {
            insertPurchase.setString(1, card_id);
            insertPurchase.setString(2, vendor_id);
            insertPurchase.setDouble(3, amount);
            insertPurchase.setTimestamp(4, purchase_date);
            insertPurchase.executeUpdate();
        } catch (SQLException e){
            e.printStackTrace();
        }
        return;
    }
    // A00003   checking    2425.89             0
    public String selectOneVendorId(String vendor_name){
        try{
            selectOneVendorId.setString(1, vendor_name);
            ResultSet rs = selectOneVendorId.executeQuery();
            if(rs.next()){
                String vendor_id = rs.getString("vendor_id");
                return vendor_id;
            }
        } catch (SQLException e){
            e.printStackTrace();
        }
        return null;
    }

    public ArrayList<VendorRow> selectAllVendor(){
        ArrayList<VendorRow> vendors = new ArrayList<VendorRow>();
        try {
            ResultSet rs = selectAllVendor.executeQuery();
            while(rs.next()){
                String vendor_name = rs.getString("vendor_name");
                String vendor_id = rs.getString("vendor_id");
                VendorRow vendor = new VendorRow(vendor_id, vendor_name);
                vendors.add(vendor);
            }
            return vendors;
        } catch (SQLException e){
            e.printStackTrace();
        }
        return vendors;
    }

    public ArrayList<PurchaseRow> showPastPurchasesByCardId(String card_id){
        ArrayList<PurchaseRow> purchases= new ArrayList<PurchaseRow>();
        try {
            showPastPurchasesByCardId.setString(1, card_id);
            ResultSet rs = showPastPurchasesByCardId.executeQuery();
            while(rs.next()){
                int purchase_id = rs.getInt("purchase_id");
                String cardId = rs.getString("card_id");
                String vendor_id = rs.getString("vendor_id");
                double amount = rs.getDouble("amount");
                Timestamp purchase_date = rs.getTimestamp("purchase_date");

                PurchaseRow purchase = new PurchaseRow(purchase_id, cardId, vendor_id, amount, purchase_date);
                purchases.add(purchase);
            }
            return purchases;
        } catch (SQLException e){
            e.printStackTrace();
        }
        return purchases;
    }

    public void addToCreditBalance(double amount, String card_id){
        try {
            addToCreditBalance.setDouble(1, amount);
            addToCreditBalance.setString(2, card_id);
            int rowsAffected = addToCreditBalance.executeUpdate();
            if (rowsAffected == 0) {
                System.out.println("No card found with the provided card_id.");
            } else {
                System.out.println("Deposit successful.");
            }
        } catch (SQLException e) {
            System.out.println("Error in addToCreditBalance");
            e.printStackTrace();
        }
    }

    public void addToAccountAmount(double deposit_amount, String account_id) {
        try {
            addToAccountAmount.setDouble(1, deposit_amount);
            addToAccountAmount.setString(2, account_id);
            int rowsAffected = addToAccountAmount.executeUpdate();
            if (rowsAffected == 0) {
                System.out.println("No account found with the provided account_id.");
            } else {
                System.out.println("Deposit successful.");
            }
        } catch (SQLException e) {
            System.out.println("Error in addToAccountAmount");
            e.printStackTrace();
        }
    }

    void subtractFromAccountAmount(double deposit_amount, String account_id){
        try{
            subtractFromAccountAmount.setDouble(1, deposit_amount);
            subtractFromAccountAmount.setString(2, account_id);
            subtractFromAccountAmount.executeUpdate();
        } catch (SQLException e){
            System.out.println("Error in subtractFromAccountAmount");
            e.printStackTrace();
        }
    }

    double getMinimumBalance(String account_id) {
        try {
            getMinimumBalance.setString(1, account_id);
            ResultSet rs = getMinimumBalance.executeQuery();
            if (rs.next()) {
                return rs.getDouble("minimum_balance");
            }
        } catch (SQLException e) {
            System.out.println("Error in getMinimumBalance");
            e.printStackTrace();
        }
        return 0.0;
    }

    ArrayList<AccountRow> getAccountByCustomer(String customer_id){
        ArrayList<String> account_ids = new ArrayList<String>();
        try {
            getAccountByCustomer.setString(1, customer_id);
            ResultSet rs = getAccountByCustomer.executeQuery();
            while (rs.next()) {
                account_ids.add(rs.getString("account_id"));
            }
            rs.close();
        } catch (SQLException e) {
            System.out.println("Error in selectOneTransaction");
            e.printStackTrace();
        }
        ArrayList<AccountRow> accountRow = new ArrayList<AccountRow>();
        for (int i = 0; i < account_ids.size(); i++) {
            accountRow.add(selectOneAccount(account_ids.get(i)));
        }
        return accountRow;
    }

    String insertOwnership(String account_id, String customer_id){
        try{
            insertOwnership.setString(1, account_id);
            insertOwnership.setString(2, customer_id);
            insertOwnership.executeUpdate();
        } catch (SQLException e){
            e.printStackTrace();
        }
        return null;
    }

    String insertAccount(String account_type, double balance, double interest_rate){
        try {
            insertAccount.setString(1, account_type);
            insertAccount.setDouble(2, balance);
            insertAccount.setDouble(3, interest_rate);

            int affectedRows = insertAccount.executeUpdate();
            if (affectedRows > 0){
                ResultSet generatedKeys = insertAccount.getGeneratedKeys();
                if(generatedKeys.next()){
                    String newAccountId = generatedKeys.getString(1);
                    return newAccountId;
                }
            }
        } catch (SQLException e){
            e.printStackTrace();
        }
        return null;
    }

    String insertCustomer(String customer_name, Date birthday, String address) {
        try {
            insertCustomer.setString(1, customer_name);
            insertCustomer.setDate(2, birthday);
            insertCustomer.setString(3, address);

            int affectedRows = insertCustomer.executeUpdate();
            if (affectedRows > 0) {
                ResultSet generatedKeys = insertCustomer.getGeneratedKeys();
                if (generatedKeys.next()) {
                    return generatedKeys.getString(1);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    String insertLoan(String loan_type, double amount, double interest_rate, double monthly_payment, String customer_id){
        try {
            insertLoan.setString(1, loan_type);
            insertLoan.setDouble(2, amount);
            insertLoan.setDouble(3, interest_rate);
            insertLoan.setDouble(4, monthly_payment);
            insertLoan.setString(5, customer_id);

            int affectedRows = insertLoan.executeUpdate();
            if (affectedRows > 0) {
                ResultSet generatedKeys = insertLoan.getGeneratedKeys();
                if (generatedKeys.next()) {
                    return generatedKeys.getString(1);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    String insertSavings(String account_id, double minimum_balance, double penalty) {
        try {
            insertSavingsAccount.setString(1, account_id);
            insertSavingsAccount.setDouble(2, minimum_balance);
            insertSavingsAccount.setDouble(3, penalty);
            insertSavingsAccount.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }


    String insertTransaction(String transaction_type, Timestamp transaction_date, double amount, String customer_id, String account_id, String branch_id){
        try {
            insertTransaction.setString(1, transaction_type);
            insertTransaction.setTimestamp(2, transaction_date);
            insertTransaction.setDouble(3, amount);
            insertTransaction.setString(4, customer_id);
            insertTransaction.setString(5, account_id);
            insertTransaction.setString(6, branch_id);

            int affectedRows = insertTransaction.executeUpdate();
            if (affectedRows > 0) {
                ResultSet generatedKeys = insertTransaction.getGeneratedKeys();
                if (generatedKeys.next()) {
                    return generatedKeys.getString(1);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }   

    TransactionRow selectOneTransaction(String transaction_id){
        TransactionRow transaction = null;
        try {
            selectOneTransaction.setString(1, transaction_id);
            ResultSet rs = selectOneTransaction.executeQuery();
            if (rs.next()) {
                String trans_id = rs.getString("transaction_id");
                String transType = rs.getString("transaction_type");
                Timestamp transDate = rs.getTimestamp("transaction_date");
                double amount = rs.getDouble("amount");
                String customerId = rs.getString("customer_id");
                String accountId = rs.getString("account_id");
                String branchId = rs.getString("branch_id");

                transaction = new TransactionRow(trans_id, transType, transDate, amount, customerId, accountId, branchId);
            }
        } catch (SQLException e) {
            System.out.println("Error in selectOneTransaction");
            e.printStackTrace();
        }
        return transaction;
    }

    AccountRow selectOneAccount(String account_id){
        AccountRow account = null;
        try {
            selectOneAccount.setString(1, account_id);
            ResultSet rs = selectOneAccount.executeQuery();
            if(rs.next()){
                String acc_id = rs.getString("account_id");
                String account_type = rs.getString("account_type");
                double balance = rs.getDouble("balance");
                double interest_rate = rs.getDouble("interest_rate");

                account = new AccountRow(acc_id, account_type, balance, interest_rate);
            }
        } catch (SQLException e){
            System.out.println("Error in selectOneAccount");
            e.printStackTrace();
        }
        return account;
    }// Branch

    ArrayList<Customer> selectAllCustomer(){
        ArrayList<Customer> customers = new ArrayList<Customer>();
        try{
            ResultSet rs = selectAllCustomer.executeQuery();
            while (rs.next()){
                String customer_name = rs.getString("customer_name");
                String customer_id = rs.getString("customer_id");
                Date date = rs.getDate("birthday");
                String address = rs.getString("address");
                Customer customer = new Customer(customer_id, customer_name, date, address);
                customers.add(customer);
            }
            return customers;
        } catch (SQLException e){
            System.out.println("Error in selectAllCustomer");
            e.printStackTrace();
        }
        return customers;
    }

    BranchRow selectOneBranch(String branch_id) {
        BranchRow branch = null;
        try {
            selectOneBranch.setString(1, branch_id);
            ResultSet rs = selectOneBranch.executeQuery();
            if (rs.next()) {
                String br_id = rs.getString("branch_id");
                String branch_type = rs.getString("branch_type");

                branch = new BranchRow(br_id, branch_type);
            }
        } catch (SQLException e) {
            System.out.println("Error in selectOneBranch");
            e.printStackTrace();
        }
        return branch;
    }

    ArrayList<BranchRow> selectAllBranch(){
        ArrayList<BranchRow> branches = new ArrayList<BranchRow>();
        try {
            ResultSet rs = selectAllBranch.executeQuery();
            while (rs.next()) {
                branches.add(new BranchRow(rs.getString("branch_id"), rs.getString("branch_type")));
            }
            rs.close();
        } catch (SQLException e) {
            System.out.println("Error in selectAllBranch");
            e.printStackTrace();
        }
        return branches;
    }

    // Card
    /*
     *     
    public final String card_id;
    public String card_type;
    public final String account_id;
    public final String customer_id;
    public String customer_name;
     */
    CardRow selectOneCard(String card_id) {
        CardRow card = null;
        try {
            selectOneCard.setString(1, card_id);
            ResultSet rs = selectOneCard.executeQuery();
            if (rs.next()) {
                String crd_id = rs.getString("card_id");
                String card_type = rs.getString("card_type");
                String acc_id = rs.getString("account_id");
                String customerId = rs.getString("customer_id");
                String customer_name = rs.getString("customer_name");

                card = new CardRow(crd_id, card_type, acc_id, customerId, customer_name);
            }
        } catch (SQLException e) {
            System.out.println("Error in selectOneCard");
            e.printStackTrace();
        }
        return card;
    }

    // Credit
    /*
     *  public final String card_id;
    public double interest_rate;
    public double limit;
    public double running_balance;
    public double balance_due;
     */
    CreditRow selectOneCredit(String card_id) {
        try {
            selectOneCredit.setString(1, card_id);
            ResultSet rs = selectOneCredit.executeQuery();
            if (rs.next()) {
                String crd_id = rs.getString("card_id");
                double int_rate = rs.getDouble("interest_rate");
                double limit = rs.getDouble("limit");
                double running_balance = rs.getDouble("running_balance");
                double balance_due = rs.getDouble("balance_due");
                CreditRow credit = new CreditRow(crd_id, int_rate, limit, running_balance, balance_due);
                return credit;
            }
        } catch (SQLException e) {
            System.out.println("Error in selectOneCredit");
            e.printStackTrace();
        }
        return null;
    }

    // Customer
    Customer selectOneCustomer(String customer_id) {
        Customer customer = null;
        try {
            selectOneCustomer.setString(1, customer_id);
            ResultSet rs = selectOneCustomer.executeQuery();
            if (rs.next()) {
                String cust_id = rs.getString("customer_id");
                String customer_name = rs.getString("customer_name");
                Date birthday = rs.getDate("birthday");
                String address = rs.getString("address");
                customer = new Customer(cust_id, customer_name, birthday, address);
            }
        } catch (SQLException e) {
            System.out.println("Error in selectOneCustomer");
            e.printStackTrace();
        }
        return customer;
    }

    Customer selectOneCustomerByName(String customer_name) {
        Customer customer = null;
        try {
            selectOneCustomerByName.setString(1, customer_name);
            ResultSet rs = selectOneCustomerByName.executeQuery();
            if (rs.next()) {
                String cust_id = rs.getString("customer_id");
                String cust_name = rs.getString("customer_name");
                Date birthday = rs.getDate("birthday");
                String address = rs.getString("address");
                customer = new Customer(cust_id, cust_name, birthday, address);
            }
        } catch (SQLException e) {
            System.out.println("Error in selectOneCustomerByName");
            e.printStackTrace();
        }
        return customer;
    }

    // Loan
    LoanRow selectOneLoan(String loan_id) {
        LoanRow loan = null;
        try {
            selectOneLoan.setString(1, loan_id);
            ResultSet rs = selectOneLoan.executeQuery();
            if (rs.next()) {
                String ln_id = rs.getString("loan_id");
                String loan_type = rs.getString("loan_type");
                double amount = rs.getDouble("amount");
                double interest_rate = rs.getDouble("interest_rate");
                double monthly_payment = rs.getDouble("monthly_payment");
                String customerId = rs.getString("customer_id");

                loan = new LoanRow(ln_id, loan_type, amount, interest_rate, monthly_payment, customerId);
            }
        } catch (SQLException e) {
            System.out.println("Error in selectOneLoan");
            e.printStackTrace();
        }
        return loan;
    }

    // Savings
    SavingsRow selectOneSavings(String account_id) {
        SavingsRow savings = null;
        try {
            selectOneSavings.setString(1, account_id);
            ResultSet rs = selectOneSavings.executeQuery();
            if (rs.next()) {
                String acc_id = rs.getString("account_id");
                double minimum_balance = rs.getDouble("minimum_balance");
                double penalty = rs.getDouble("penalty");

                savings = new SavingsRow(acc_id, minimum_balance, penalty);
            }
        } catch (SQLException e) {
            System.out.println("Error in selectOneSavings");
            e.printStackTrace();
        }
        return savings;
    }
}