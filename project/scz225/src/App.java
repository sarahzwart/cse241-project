import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URISyntaxException;
import java.sql.*;
import java.util.Scanner;
import java.util.ArrayList;
import java.util.List;
import java.io.BufferedReader;

public class App {
    private static Database getConnection(BufferedReader in, String password) throws URISyntaxException{
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
        System.out.println("\nOpen a Credit or Debit Card");
        System.out.println(" [C] Open a Credit Card");
        System.out.println(" [D] Open a Debit Card");
        System.out.println(" [Q] Quit");

        String actions = "C D Q";
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
        System.out.println(" [V] View my Account(s): ");
        System.out.println(" [C] Create new Account: ");
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

    public static void depositAction(BufferedReader in, Database db, String customer_id){
        ArrayList<BranchRow> branches = db.selectAllBranch();
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
        BranchRow.printBranchRows(branches);
        String branch_chosen = getString(in, "\nPlease enter the branch you wish to use :> ");
        String account_id = getString(in, "\nPlease enter the account_id in which you would like to make a withdrawal :> ");
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
    
    public static void debitOrCreditChoice(BufferedReader in, Database db){
        while(true){
            char tableChoice = debitOrCreditMenu(in);
            switch (tableChoice) {
                case 'D':
                case 'C':
                case 'Q':
                    return;
                default:
                    continue;
            }
        }
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
        while(true){
            String card_id = getString(in, "Please enter the ID of the Card you want to use :>");
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
        System.out.println("**Showing all cards of " + customer_name + "**");
        ArrayList<CardRow> cards = db.selectAllCardByCustomerId(customer_id);
        CardRow.printCardRows(cards);
        
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
        System.out.println("**Showing all credit card info**");
        CreditRow.printCredits(creditCard);
    }

    public static String showAllVendors(Database db, BufferedReader in){
        System.out.println("**Showing all vendors**");
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



    
    public static void main(String[] args) {
        // USER LOGIN
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));   
        String password = getString(in, "\nPlease enter password: ");
        Database db = new Database();
        boolean validUser = false;
        try {
            db = getConnection(in, password);
        } catch (URISyntaxException e) {
            e.printStackTrace();
            return;
        }
        System.out.println("Connection Successful");
        // USER LOGIN ^^^
        ArrayList<Customer> customers = db.selectAllCustomer();
        Customer.printCustomers(customers);
        String user = "";
        while (!validUser) {
            user = getString(in, "\nPlease enter the user you would like to login as from the list above :> ");
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

        // GET USER INFO
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
                    // debitCreditAction()
                    continue;
                case 'L':
                    System.out.println("\n**Take out a Loan**");
                    continue;
                case 'P':
                    System.out.println("\n**Make a Purchase**");
                    purchaseChoice(in, db, customer_id, user);
                    continue;
                case 'Q':
                    db.disconnect();
                    System.out.println("\nDisconnecting from Bank Database... BYE!");
                    return;
                default: 
                    continue;
            }
        }
    }
}