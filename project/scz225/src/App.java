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

    static char mainPromptMenu(BufferedReader in){
        System.out.println("\nMain Menu: ");
        System.out.println(" [D] Account Deposit/Withdrawal");
        System.out.println(" [A] Open a New Account");
        System.out.println(" [C] Obtain New Debit/Credit Card");
        System.out.println(" [L] Take Out a Loan");
        System.out.println(" [P] Purchases Using a Card");
        System.out.println(" [Q] Quit");

        String actions = "D A C L P Q ?";

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
        System.out.println(" [D] Make a Deposit");
        System.out.println(" [W] Make a  Withdrawal");
        System.out.println(" [Q] Quit");

        String actions = "D W Q ?";
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

        String actions = "C D Q ?";
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
        System.out.println(" [D] Use Debit:");
        System.out.println(" [C] Use Credit:");
        System.out.println(" [Q] Quit");

        String actions = "D C Q ?";
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

    public static void depositWithdrawalChoice(BufferedReader in, Database db){
        while(true){
            char tableChoice = depositWithDrawalMenu(in);
            switch (tableChoice) {
                case 'D':
                case 'W':
                case 'Q':
                    return;
                default:
                    continue;
            }
        }
    }

    public static void openNewAccountAction(BufferedReader in, Database db){

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
    
    public static void main(String[] args) {
        // USER LOGIN
        String user = "";
        String password = "";
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        System.out.println("\nPlease enter the user you would like to login as: ");
        try{
            user = in.readLine();
        } catch (IOException e) {
            e.printStackTrace();
        }
        System.out.println("\nPlease enter password: ");
        try{
            password = in.readLine();
        } catch (IOException e) {
            e.printStackTrace();
        }
        Database db = new Database();
        try {
            db = getConnection(in, password);
        } catch (URISyntaxException e) {
            e.printStackTrace();
            return;
        }
        System.out.println("Connection Successful");
        // USER LOGIN ^^^

        // GET USER INFO
        Customer customer = db.selectOneCustomerByName(user);
        String customer_id = customer.getCustomerID();
        System.out.println(customer_id);
        // D A C L P Q ?
        while(true){
            char menuAction = mainPromptMenu(in);
            switch (menuAction) {
                case 'D':

                case 'A':
                case 'C':
                case 'L':
                case 'P':
                case 'Q':
                    db.disconnect();
                    System.out.println("\nDisconnecting from Bank Database... BYE!");
                default: 
                    continue;
            }
        }
    }
}