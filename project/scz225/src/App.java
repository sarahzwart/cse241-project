import java.net.URI;
import java.net.URISyntaxException;
import java.sql.*;
import java.util.Scanner;
import java.util.ArrayList;
import java.util.List;

public class App {
    private static Database getConnection() throws URISyntaxException{
        String user = "scz225";
        String password = "$arahCat1";
        return Database.getDatabase(user, password);
    }
    public static void main(String[] args) {
        // Get Database instance
        Database db = new Database();
        try {
            db = getConnection();
        } catch (URISyntaxException e) {
            e.printStackTrace();
            return;
        }
        System.out.println("Connection Successful");
        try {
                // Retrieve and print the transaction
                TransactionRow transaction = db.selectOneTransaction("T00005");

                if (transaction != null) {
                    System.out.println("Transaction ID: " + transaction.transaction_id
                            + ", Type: " + transaction.transaction_type
                            + ", Date: " + transaction.transaction_date
                            + ", Amount: " + transaction.amount
                            + ", Customer ID: " + transaction.customer_id
                            + ", Account ID: " + transaction.account_id
                            + ", Branch ID: " + transaction.branch_id);
                } else {
                    System.out.println("Transaction not found.");
                }
        } finally {
            // Close the database connection
            if (db.disconnect()) {
                System.out.println("Connection closed.");
            } else {
                System.out.println("Failed to close the connection.");
            }
        }
    }
}