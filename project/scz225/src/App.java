import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URISyntaxException;
import java.sql.*;
import java.util.ArrayList;
import java.io.BufferedReader;

public class App {

    private static Database getConnection(BufferedReader in, String password) throws URISyntaxException, SQLException {
        return Database.getDatabase("scz225", password);
    }

    static String getString(BufferedReader in, String message) {
        String s;
        try {
          System.out.print(message);
          s = in.readLine();
        } catch (IOException e) {
          e.printStackTrace();
          return "";
        }
        return s;
    }

    static char employeePromptMenu(BufferedReader in){
        System.out.println("\nEmployee actions: ");
        System.out.println(" [C] View all customers");
        System.out.println(" [D] View all cards");
        System.out.println(" [A] View all accounts");
        System.out.println(" [T] View all transactions");
        System.out.println(" [L] View all loans");
        System.out.println(" [Q] Quit");
        String actions = "C D A T L Q" ;
        while(true){
            System.out.print("[" + actions + "] :> ");
            String action;
            try {
                action = in.readLine();
            } catch (IOException e) {
                e.printStackTrace();
                continue;
            }
            if (action.length() != 1)
                continue;
            if (actions.contains(action)) {
                return action.charAt(0);
            }
            System.out.println("Invalid Command");
        }
    }

    static char userOrEmployeePromptMenu(BufferedReader in){
        System.out.println("\nEmployee or User: ");
        System.out.println(" [E] Employee Login");
        System.out.println(" [U] User Login");
        System.out.println(" [Q] Quit");
        String actions = "E U Q";
        while(true){
            System.out.print("[" + actions + "] :> ");
            String action;
            try {
                action = in.readLine();
            } catch (IOException e) {
                e.printStackTrace();
                continue;
            }
            if (action.length() != 1)
                continue;
            if (actions.contains(action)) {
                return action.charAt(0);
            }
            System.out.println("Invalid Command");
        }
    }

    static char mainPromptMenu(BufferedReader in){
        System.out.println("\nMain Menu: ");
        System.out.println(" [D] Account Deposit/Withdrawal");
        System.out.println(" [A] View Account Information or Open Account(s)");
        System.out.println(" [C] Obtain New Debit/Credit Card");
        System.out.println(" [L] Take Out a Loan");
        System.out.println(" [P] Purchases Using a Card");
        System.out.println(" [Q] Quit");

        String actions = "D A C L P Q";

        while(true){
            System.out.print("[" + actions + "] :> ");
            String action;
            try {
                action = in.readLine();
            } catch (IOException e) {
                e.printStackTrace();
                continue;
            }
            if (action.length() != 1)
                continue;
            if (actions.contains(action)) {
                return action.charAt(0);
            }
            System.out.println("Invalid Command");
        }
    }

    static char depositWithDrawalMenu(BufferedReader in){
        System.out.println("\nMake a Deposit or Withdrawal:");
        System.out.println(" [V] View my Accounts");
        System.out.println(" [D] Make a Deposit");
        System.out.println(" [W] Make a  Withdrawal");
        System.out.println(" [Q] Quit");

        String actions = "V D W Q";
        while (true) {
            System.out.print("[" + actions + "] :> ");
            String action;
            try {
              action = in.readLine();
            } catch (IOException e) {
              e.printStackTrace();
              continue;
            }
            if (action.length() != 1)
              continue;
            if (actions.contains(action)) {
              return action.charAt(0);
            }
            System.out.println("Invalid Command");
        }
    }

    static char debitOrCreditMenu(BufferedReader in){
        System.out.println("\nOpen a Credit or Debit Card:");
        System.out.println(" [V] View All Card Info");
        System.out.println(" [C] Open a Credit Card");
        System.out.println(" [D] Open a Debit Card");
        System.out.println(" [Q] Quit");

        String actions = "V C D Q";
        while (true) {
            System.out.print("[" + actions + "] :> ");
            String action;
            try {
              action = in.readLine();
            } catch (IOException e) {
              e.printStackTrace();
              continue;
            }
            if (action.length() != 1)
              continue;
            if (actions.contains(action)) {
              return action.charAt(0);
            }
            System.out.println("Invalid Command");
        }
    }

    static char purchaseMenu(BufferedReader in){
        System.out.println("\nMake a Purchase:");
        System.out.println(" [V] View Credit/Debit Info");
        System.out.println(" [P] Make Purchase");
        System.out.println(" [Q] Quit");

        String actions = "V P Q";
        while (true) {
            System.out.print("[" + actions + "] :> ");
            String action;
            try {
              action = in.readLine();
            } catch (IOException e) {
              e.printStackTrace();
              continue;
            }
            if (action.length() != 1)
              continue;
            if (actions.contains(action)) {
              return action.charAt(0);
            }
            System.out.println("Invalid Command");
        }
    }

    static char accountMenu(BufferedReader in){
        System.out.println("\nAccount Menu:");
        System.out.println(" [V] View my Account(s)");
        System.out.println(" [C] Create new Account");
        System.out.println(" [Q] Quit");
        String actions = "V C Q";
        while (true) {
            System.out.print("[" + actions + "] :> ");
            String action;
            try {
              action = in.readLine();
            } catch (IOException e) {
              e.printStackTrace();
              continue;
            }
            if (action.length() != 1)
              continue;
            if (actions.contains(action)) {
              return action.charAt(0);
            }
            System.out.println("Invalid Command");
        }
    }

    static char loanMenu(BufferedReader in){
        System.out.println("\nLoan Menu:");
        System.out.println(" [V] View my Loan(s) ");
        System.out.println(" [T] Take out a Loan ");
        System.out.println(" [P] Pay my Loan(s) ");
        System.out.println(" [Q] Quit ");
        String actions = "V T P Q";
        while (true) {
            System.out.print("[" + actions + "] :> ");
            String action;
            try {
              action = in.readLine();
            } catch (IOException e) {
              e.printStackTrace();
              continue;
            }
            if (action.length() != 1)
              continue;
            if (actions.contains(action)) {
              return action.charAt(0);
            }
            System.out.println("Invalid Command");
        }
    }
    static char loanMenu2(BufferedReader in){
        System.out.println("\nLoan Menu:");
        System.out.println(" [V] View my Loan(s) ");
        System.out.println(" [T] Take out a Loan ");
        System.out.println(" [Q] Quit ");
        String actions = "V T Q";
        while (true) {
            System.out.print("[" + actions + "] :> ");
            String action;
            try {
              action = in.readLine();
            } catch (IOException e) {
              e.printStackTrace();
              continue;
            }
            if (action.length() != 1)
              continue;
            if (actions.contains(action)) {
              return action.charAt(0);
            }
            System.out.println("Invalid Command");
        }
    }
    public static void loanAction2(BufferedReader in, Database db, String customer_id, String customer_name){

    }
    public static void loanAction(BufferedReader in, Database db, String customer_id, String customer_name){
        while(true){
            char loanChoice = loanMenu(in);
            ArrayList<LoanRow> loans = db.selectAllLoanByCustomer(customer_id);
            switch(loanChoice){
                case 'V':
                    if(loans.size() == 0) {
                        System.out.println("You do not have any loans out.");
                    } else {
                        System.out.println("** Showing all loans of customer " + customer_name + " **");
                        LoanRow.printLoans(loans);
                    }
                    continue;
                case 'T':
                    getLoan(in, db, customer_id);
                    continue;
                case 'P':
                    if(loans.size() == 0){
                        System.out.println("You do not have any loans out to pay.\nPlease choose another option.");
                    }
                    else{
                        payLoan(in, db, customer_id, customer_name);
                    }
                    continue;
                case 'Q':
                    return;
                default:
                    continue;

            }
        }
    }

    public static void getLoan(BufferedReader in, Database db, String customer_id){
        System.out.println("Mortgage secured by your home address automatically.");
        System.out.println("Unsecured loans are not.");
        double amount = 0.00;
        String loanType = "";
        while(true){
            loanType = getString(in, "\nWould you like a mortgage or unsecured loan :> ");
            if(loanType.equalsIgnoreCase("unsecured") || loanType.equalsIgnoreCase("mortgage")){
                break;
            }
            else {
                System.out.println("Invalid loan type. Please try again.");
                continue;
            }
        }
        while(true){
            String loanAmount = getString(in, "\n How much would you like your loan to be :> ");
            try {
                amount = Double.parseDouble(loanAmount);
                break;
            } catch (NumberFormatException e) {
                System.out.println("Invalid amount. Please enter a valid number.");
                continue;
            }
        }
        double interest_rate = 0.00;
        double monthlypayment = 0.00;
        if(amount > 100000 ){
            interest_rate = 5.00;
            monthlypayment = 500.00;
        }
        else if (amount < 100000 || amount > 50000){
            interest_rate = 4.00;
            monthlypayment = 400.00;
        }
        else if (amount < 50000 || amount > 25000){
            interest_rate = 3.75;
            monthlypayment = 350.00;
        }
        else if (amount < 25000 || amount > 10000){
            interest_rate = 5.00;
            monthlypayment = 250.00;
        }
        else if (amount < 10000 || amount > 1000){
            interest_rate = 5.00;
            monthlypayment = 100.00;
        }
        else {
            interest_rate = 6.00;
            monthlypayment = 50.00;
        }
        db.insertLoan(loanType, amount, interest_rate, monthlypayment, customer_id);
    }

    public static void payLoan(BufferedReader in, Database db, String customer_id, String customer_name ){
        ArrayList<LoanRow> loans = db.selectAllLoanByCustomer(customer_id);
        boolean validLoan = false;
        String loan_chosen = "";
        while (!validLoan) {
            loan_chosen = getString(in, "\nPlease enter the loan id of the loan you wish to pay :> ");
            for (LoanRow l: loans) {
                if (loan_chosen.equalsIgnoreCase(l.getLoanID())) {
                    validLoan = true;
                    break;
                }
            }
            if (!validLoan) {
                System.out.println("Error: Loan'" + loan_chosen + "' not found. Please enter a valid branch ID");
            }
        }
        ArrayList<AccountRow> accounts = db.getAccountByCustomer(customer_id);
        System.out.println("** Showing all accounts of customer " + customer_name + " **");
        System.out.printf("| %-10s | %-12s | %-10s | %-13s |\n",
                "Account ID", "Account Type", "Balance", "Interest Rate");
        System.out.println("---------------------------------------------------------");
        boolean validAccount = false;
        String account_chosen = "";
        double payment = 0.00;
        while (!validAccount) {
            account_chosen = getString(in, "\nPlease enter the ID of the Account you would like to use to pay your loan :> ");
            for (AccountRow a: accounts) {
                if (account_chosen.equalsIgnoreCase(a.getAccountID())) {
                    validAccount = true;
                    break;
                }
            }
            if (!validAccount) {
                System.out.println("Error: Account'" + account_chosen + "' not found. Please enter a valid Account ID");
            }
        }
        while(true){
            String loanPayment = getString(in, "\n How much would you like to pay :> ");
            try {
                payment = Double.parseDouble(loanPayment);
                break;
            } catch (NumberFormatException e) {
                System.out.println("Invalid amount. Please enter a valid number.");
                continue;
            }
        }
        db.subtractFromLoan(loan_chosen, payment);
        db.subtractFromAccountAmount(payment, account_chosen);
        
    }

    public static void depositWithdrawalChoice(BufferedReader in, Database db, String customer_id, String customer_name){
        while(true){
            char tableChoice = depositWithDrawalMenu(in);
            switch (tableChoice) {
                case 'V':
                    ArrayList<AccountRow> accounts = db.getAccountByCustomer(customer_id);
                    System.out.println("** Showing all accounts of customer " + customer_name + " **");
                    AccountRow.printAccounts(accounts);
                    continue;
                case 'D':
                    depositAction(in, db, customer_id);
                    continue;
                case 'W':
                    withdrawalAction(in, db, customer_id);
                    continue;
                case 'Q':
                    return;
                default:
                    continue;
            }
        }
    }

    public static void handleEmployeeActions(Database db, BufferedReader in) {
        while (true) {
            char action = employeePromptMenu(in);
            switch (action) {
                case 'C':
                    ArrayList<Customer> customers = db.selectAllCustomer();
                    Customer.printCustomers(customers);
                    continue;
                case 'D':
                    ArrayList<CardRow> cards = db.selectAllCard();
                    CardRow.printCardRows(cards);
                    continue;
                case 'A':
                    ArrayList<AccountRow> accounts = db.selectAllAccount();
                    AccountRow.printAccounts(accounts);
                    continue;
                case 'T':
                    // View all transactions
                    ArrayList<TransactionRow> transactions = db.selectAllTransaction();
                    TransactionRow.printTransactions(transactions);
                    continue;
                case 'L':
                    // View all loans (assuming you have a method for this)
                    ArrayList<LoanRow> loans = db.selectAllLoan();
                    LoanRow.printLoans(loans);
                    continue;
                case 'Q':
                    return; // Exit the method
                default:
                    continue;
            }
        }
    }
    
    public static void depositAction(BufferedReader in, Database db, String customer_id){
        ArrayList<BranchRow> branches = db.selectAllBranchByType();
        ArrayList<AccountRow> accounts = db.getAccountByCustomer(customer_id);
        BranchRow.printBranchRowsFullService(branches);
        // Loop for Branches
        boolean validBranch = false;
        String branch_chosen = "";
        while (!validBranch) {
            branch_chosen = getString(in, "\nPlease enter the branch you wish to use :> ");
            for (BranchRow b: branches) {
                if (branch_chosen.equalsIgnoreCase(b.getBranchId())) {
                    validBranch = true;
                    break;
                }
            }
            if (!validBranch) {
                System.out.println("Error: Branch'" + branch_chosen + "' not found. Please enter a valid branch ID");
            }
        }
        // Loop for Account ID
        String account_id = "";
        boolean validAccount = false;
        while (!validAccount) {
            account_id = getString(in, "\nPlease enter the account_id in which you would like to make a deposit :> ");
            for (AccountRow a: accounts) {
                if (account_id.equalsIgnoreCase(a.getAccountID())) {
                    validAccount = true;
                    break;
                }
            }
            if (!validAccount) {
                System.out.println("Error: Acccount'" + account_id + "' not found. Please enter a valid Account ID");
            }
        }
        double amount = 0.00;
        Timestamp transactionDate = new Timestamp(System.currentTimeMillis()); 
        while(true){    
            String amount_input = getString(in, "\nEnter how much you would like to deposit :> ");
            try {
                amount = Double.parseDouble(amount_input);
                break;
            } catch (NumberFormatException e) {
                System.out.println("Invalid balance amount. Please enter a valid number.");
                continue;
            }   
        }
        db.addToAccountAmount(amount, account_id);
        db.insertTransaction("deposit", transactionDate, amount, customer_id, account_id, branch_chosen);
        System.out.println("Deposit made successfully! ");
    }

    public static void withdrawalAction(BufferedReader in, Database db, String customer_id){
        ArrayList<BranchRow> branches = db.selectAllBranch();
        ArrayList<AccountRow> accounts = db.getAccountByCustomer(customer_id);
        BranchRow.printBranchRows(branches);
        boolean validBranch = false;
        String branch_chosen = "";
        while (!validBranch) {
            branch_chosen = getString(in, "\nPlease enter the branch you wish to use :> ");
            for (BranchRow b: branches) {
                if (branch_chosen.equalsIgnoreCase(b.getBranchId())) {
                    validBranch = true;
                    break;
                }
            }
            if (!validBranch) {
                System.out.println("Error: Branch'" + branch_chosen + "' not found. Please enter a valid branch ID");
            }
        }
        String account_id = "";
        boolean validAccount = false;
        while (!validAccount) {
            account_id = getString(in, "\nPlease enter the account_id in which you would like to make a deposit :> ");
            for (AccountRow a: accounts) {
                if (account_id.equalsIgnoreCase(a.getAccountID())) {
                    validAccount = true;
                    break;
                }
            }
            if (!validAccount) {
                System.out.println("Error: Acccount'" + account_id + "' not found. Please enter a valid Account ID");
            }
        }
        AccountRow account_info = db.selectOneAccount(account_id);
        String account_type = account_info.getAccountType();
        double account_bal = account_info.getBalance();
        Timestamp transactionDate = new Timestamp(System.currentTimeMillis()); 
        if(account_type.equals("savings")){
            Double minimum_bal = db.getMinimumBalance(account_id);
            while(true){
                String amount_input = getString(in, "\nEnter how much you would like to withdraw :> ");
                double amount = 0.00;
                try {
                    amount = Double.parseDouble(amount_input);
                } catch (NumberFormatException e) {
                    System.out.println("Invalid balance amount. Please enter a valid number.");
                    return;
                }
                if((account_bal - amount) < minimum_bal){
                    System.out.println("Are you sure you would like to withdraw that amount? ");
                    System.out.println("There will be a penalty");
                    String decision = getString(in, "YES or NO :> ").trim().toLowerCase();
                    if(decision.equals("yes")){
                        db.subtractFromAccountAmount((amount-50.00), account_id);
                        System.out.println("Withdrawal made successfully! ");
                        System.out.println("Penalty applied to account. ");
                        return;
                    }
                    continue;
                }
                if((account_bal - amount) < 50.00){
                    System.out.println("You cannot withdraw that amount.");
                    System.out.println("Your account balance will be less that 0");
                }
                else{
                    db.subtractFromAccountAmount(amount, account_id);
                    db.insertTransaction("withdrawal", transactionDate, amount, customer_id, account_id, branch_chosen);
                    System.out.println("Withdrawal made successfully!");
                    return;
                }
            }
        } else {
            while(true){
                String amount_input = getString(in, "\nEnter how much you would like to withdraw :> ");
                double amount = 0.00;
                try {
                    amount = Double.parseDouble(amount_input);
                } catch (NumberFormatException e) {
                    System.out.println("Invalid balance amount. Please enter a valid number.");
                    return;
                }
                if(account_bal - amount <= 0){
                    System.out.println("You cannot withdraw that amount. It will set your account below zero.");
                    System.out.println("Please enter a new value.");
                    continue;
                } else {
                    db.subtractFromAccountAmount(amount, account_id);
                    db.insertTransaction("withdrawal", transactionDate, amount, customer_id, account_id, branch_chosen);
                    System.out.println("Withdrawal made successfully!");
                    return;
                }
            }
        }
        
    }
    


    public static void accountAction(BufferedReader in, Database db, String customer_id, String customer_name) {
        while(true){
            char accountAction = accountMenu(in);
            switch (accountAction) {
                case 'V':   
                    ArrayList<AccountRow> accounts = db.getAccountByCustomer(customer_id);
                    System.out.println("** Showing all accounts of customer " + customer_name + " **");
                    AccountRow.printAccounts(accounts);
                    continue;
                case 'C':
                    String accountType = "";
                    //Check that using entered checking or saving
                    while(true){
                        accountType = getString(in,"Would you like a Savings or Checking Account? :> ").trim().toLowerCase();
                        if(accountType.equals("savings") ||accountType.equals("checking") ){
                            break;
                        }
                        else{
                            continue;
                        }
                    }
                    String accountAmountInput = "";
                    double accountAmount = 0.00;
                    while(true){
                        accountAmountInput = getString(in,"What would you like the balance to be? :> ");
                        try {
                            accountAmount = Double.parseDouble(accountAmountInput);
                            break;
                        } catch (NumberFormatException e) {
                            System.out.println("Invalid balance amount. Please enter a valid number.");
                            continue;
                        }
                    }
                    String accountId = null;
                    if (accountType.equals("savings")) {
                        accountId = db.insertAccount("savings", accountAmount, 1.25);
                        if(accountAmount > 2000.00){
                            db.insertSavings(accountId, 1000.00, 50.00);
                        }
                        else if(accountAmount > 1000.00 || accountAmount < 2000.00){
                            db.insertSavings(accountId, 500.00, 50.00);
                        }
                        else{
                            db.insertSavings(accountId, 100.00, 25.00);
                        }
                       
                    } else if (accountType.equals("checking")) {
                        accountId = db.insertAccount("checking", accountAmount, 0);
                        db.insertChecking(accountId);
                    } else {
                        System.out.println("Invalid account type. Please enter either 'savings' or 'checking'.");
                        return;
                    }
                    if (accountId != null) {
                        db.insertOwnership(accountId, customer_id);
                        System.out.println("Account successfully created with ID: " + accountId);
                    } else {
                        System.out.println("Error creating account.");
                    }
                    continue;
                case 'Q':
                    return;
            }
        }
    
    }
    
    public static void debitOrCreditChoice(BufferedReader in, Database db, String customer_id, String customer_name){
        while(true){
            char tableChoice = debitOrCreditMenu(in);
            switch (tableChoice) {
                case 'V':
                    showCardInformation(db, customer_name, customer_id);
                    continue;
                case 'D':
                    createDebit(in, db, customer_id, customer_name);
                    continue;
                case 'C':
                    createCredit(in, db, customer_id, customer_name);
                    continue;
                case 'Q':
                    return;
                default:
                    continue;
            }
        }
    }

    public static void createDebit(BufferedReader in, Database db, String customer_id, String customer_name){
        String account_id = "";
        ArrayList<AccountRow> accounts = db.getAccountByCustomer(customer_id);
        System.out.println("** Showing all accounts of customer " + customer_name + " **");
        System.out.printf("| %-10s | %-12s | %-10s | %-13s |\n",
                "Account ID", "Account Type", "Balance", "Interest Rate");
        System.out.println("---------------------------------------------------------");
        for(AccountRow a: accounts){
            if(a.getAccountType().equalsIgnoreCase("checking")){
                AccountRow.printAccount(a);
            }
        }
        boolean validAccount = false;
        while (!validAccount) {
            account_id = getString(in, "\nChoose a checking account ID to connect to your debit card :> ");
            for (AccountRow a : accounts) {
                if (a.getAccountID().equalsIgnoreCase(account_id)) {
                    validAccount = true;  
                    break;
                }
            }
            if (!validAccount) {
                System.out.println("Invalid account ID. Please choose a valid checking account.");
            }
        }
        db.insertNewDebitCard(account_id, customer_id, customer_name);
    }

    public static void createCredit(BufferedReader in, Database db, String customer_id, String customer_name){
        double amount = 0;
        while(true){    
            String amount_input = getString(in, "\nWhat would you like the credit limit to be :> ");
            try {
                amount = Double.parseDouble(amount_input);
                break;
            } catch (NumberFormatException e) {
                System.out.println("Invalid amount. Please enter a valid number.");
                continue;
            }   
        }
        db.insertNewCreditCard(customer_id, customer_name, amount);
    }

    public static void purchaseChoice(BufferedReader in, Database db, String customer_id, String customer_name){
        while(true){
            char purchaseAction = purchaseMenu(in);
            switch(purchaseAction){
                case 'V':
                    showCardInformation(db, customer_name, customer_id);
                    continue;
                case 'P':
                    String vendorId = showAllVendors(db, in);
                    purchase(in, db, customer_id, customer_name, vendorId);
                    continue;
                case 'Q':
                    return;
                default:
                    continue;
            }
        }
    }

    public static void useCredit(BufferedReader in, Database db, String card_id, String vendor_id){
        double amount = 0.00;
        Timestamp purchaseDate = new Timestamp(System.currentTimeMillis()); 
        CreditRow credit_info = db.selectOneCredit(card_id); 
        double limit = credit_info.getLimit();
        double balance = credit_info.getRunningBalance();
        double amount_left = limit - balance;
        while(true){
            String amount_input = getString(in, "\nEnter how much your purchase is :> ");
            try {
                amount = Double.parseDouble(amount_input);
            } catch (NumberFormatException e) {
                System.out.println("Invalid amount. Please enter a valid number.");
                return;
            }

            if(amount > amount_left){
                System.out.println("The expense is too high for this account.");
                System.out.println("Please purchase something else.");
                continue;
            } 
            else {
                db.addToCreditBalance(amount, card_id);
                db.insertPurchase(card_id, vendor_id, amount, purchaseDate);
                System.out.println("Purchase made successfully");
                return;
            }

        }
    }

    public static void useDebit(BufferedReader in, Database db, String vendor_id, String card_id, String account_id){
        AccountRow account_info = db.selectOneAccount(account_id);
        double account_bal = account_info.getBalance(); 
        double amount = 0.00;
        Timestamp purchaseDate = new Timestamp(System.currentTimeMillis()); 
        while(true){
            String amount_input = getString(in, "\nEnter how much your purchase is :> ");
            try {
                amount = Double.parseDouble(amount_input);
            } catch (NumberFormatException e) {
                System.out.println("Invalid amount. Please enter a valid number.");
                return;
            }
            if(account_bal - amount <= 0){
                System.out.println("The expense is too high for this account");
                System.out.println("Please buy something else");
                continue;
            } else {
                db.subtractFromAccountAmount(amount, account_id);
                db.insertPurchase(card_id, vendor_id, amount, purchaseDate);
                System.out.println("Purchase made successfully!");
                return;
            }
        }
    }

    public static void purchase(BufferedReader in, Database db, String customer_id, String customer_name, String vendor_id){
        showCardInformation(db, customer_name, customer_id);
        String card_type = "";
        ArrayList<CardRow> cards = db.selectAllCardByCustomerId(customer_id);
        String card_id = "";
        while(true){
            for (CardRow card : cards) {
                card_id = getString(in, "Please enter the ID of the Card you want to use :> ");
                if (card.getCardId().equalsIgnoreCase(card_id)){
                    break;
                }
            }
            CardRow card = db.selectOneCard(card_id);
            String account_id = card.getAccountId();
            card_type = card.getCardType();
            if(card_type.equalsIgnoreCase("credit")){
                useCredit(in, db, card_id, vendor_id);
                break;
            }
            if(card_type.equalsIgnoreCase("debit")){
                useDebit(in, db, vendor_id, card_id, account_id);
                break;
            }
            else {
                System.out.println("Please enter a valid ID. ");
            }
        }
        
    }

    public static void showCardInformation(Database db, String customer_name, String customer_id){
        System.out.println(" ");
        System.out.println("** Showing all cards of " + customer_name + " **");
        ArrayList<CardRow> cards = db.selectAllCardByCustomerId(customer_id);

        System.out.println("** DEBIT **");
        System.out.printf("| %-20s | %-10s | %-10s |\n", "Customer Name", "Card ID", "Balance");
        System.out.println("----------------------------------------------");
        for(CardRow c : cards){
            if(c.getCardType().equalsIgnoreCase("debit")){
                db.showDebitInfo(c.getAccountId());
            }
        }
        
        ArrayList<CreditRow> creditCard = new ArrayList<CreditRow>();
        for (CardRow card : cards) {
            if (card.getCardType().equalsIgnoreCase("credit")) {
                CreditRow credit = db.selectOneCredit(card.getCardId());
                if (credit == null) {
                    System.out.println("No credit information found for card ID: " + card.getCardId());
                } else {
                    creditCard.add(credit);
                }
            }
        }

        System.out.println(" ");
        System.out.println("** CREDIT **");
        CreditRow.printCredits(creditCard);
    }

    public static String showAllVendors(Database db, BufferedReader in){
        System.out.println("** Showing all vendors **");
        ArrayList<VendorRow> vendors = db.selectAllVendor();
        VendorRow.printVendors(vendors);
        String store = "";
        boolean validVendor = false;
        // Checking that the Vendor is in the list
        while (!validVendor) {
            // Prompt user for the vendor name
            store = getString(in, "\nPlease enter the name of the vendor you shopped at: ");
            
            // Validate the entered vendor name
            validVendor = false;
            for (VendorRow vendor : vendors) {
                if (vendor.getVendorName().equalsIgnoreCase(store)) {
                    validVendor = true;
                    break;
                }
            }

            if (!validVendor) {
                System.out.println("Error: Vendor '" + store + "' not found. Please enter a valid vendor name.");
            }
        }
       return db.selectOneVendorId(store);
    }

    public static void handleUserOption(Database db, BufferedReader in){
        boolean validUser = false;
        System.out.println("Showing list of customer names to choose from: ");
        ArrayList<Customer> customers = db.selectAllCustomer();
        Customer.printCustomerNames(customers);
        String user = "";
        while (!validUser) {
            user = getString(in, "\nPlease enter the user you would like to login as or type 'Q' to go back :> ");
            if (user.equalsIgnoreCase("Q")) {
                System.out.println("\nReturning to main menu...");
                return;
            }
            for (Customer c : customers) {
                if (user.equalsIgnoreCase(c.getCustomerName())) {
                    validUser = true;
                    break;
                }
            }
            if (!validUser) {
                System.out.println("Error: User '" + user + "' not found. Please enter a valid user");
            }
        }

        Customer customer = db.selectOneCustomerByName(user);
        String customer_id = customer.getCustomerID();
        System.out.println(customer_id);
        // D A C L P Q 
        while(true){
            char menuAction = mainPromptMenu(in);
            switch (menuAction) {
                case 'D':
                    System.out.println("\n**Account Deposits and Withdrawal**");
                    depositWithdrawalChoice(in, db, customer_id, user);
                    continue;
                case 'A':
                    System.out.println("\n**Opening a New Account**");
                    accountAction(in, db, customer_id, user);
                    continue;
                case 'C':
                    System.out.println("\n**Obtain New Debit/Credit Card**");
                    debitOrCreditChoice(in, db, customer_id, user);
                    continue;
                case 'L':
                    System.out.println("\n**Manage Loans**");
                    loanAction(in, db, customer_id, user);
                    continue;
                case 'P':
                    System.out.println("\n**Make a Purchase**");
                    purchaseChoice(in, db, customer_id, user);
                    continue;
                case 'Q':
                    System.out.println("\nReturning to Employee/User Option Menu..");
                    return;
                default: 
                    continue;
            }
        }
    }

    
    public static void main(String[] args) {
        // USER LOGIN
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));   
        Database db = null;

        while (db == null) {
            String password = getString(in, "\nPlease enter password: ");
            try {
                db = getConnection(in, password);
            } catch (URISyntaxException e) {
                System.out.println("Incorrect password. Please try again.");
                return;
            } catch (SQLException e) {
                // Print a user-friendly message instead of the stack trace
                System.out.println("Incorrect password. Please try again.");
                db = null; // Ensure db is null if connection fails
            }
        }
        System.out.println("**HELLO! WELCOME TO NSL BANK**");
        // USER LOGIN ^^^
        while(true){
            char loginAction = userOrEmployeePromptMenu(in);
            switch(loginAction){
                case 'E':
                    handleEmployeeActions(db, in);
                    continue;
                case 'U':
                    handleUserOption(db, in);
                    continue;
                case 'Q':
                    db.disconnect();
                    System.out.println("\nDisconnecting from Bank... BYE!");
                    return;
                default:
                    System.out.println("Please enter a valid character :> ");
                    continue;
            }
        }

        // GET USER INFO
        
    }
}