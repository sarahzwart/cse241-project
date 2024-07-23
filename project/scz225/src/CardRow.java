import java.util.ArrayList;
public class CardRow{
    public final String card_id;
    public String card_type;
    public final String account_id;
    public final String customer_id;
    public String customer_name;
    
    public CardRow(String card_id, String card_type, String account_id, String customer_id, String customer_name) {
        this.card_id = card_id;
        this.card_type = card_type;
        this.account_id = account_id;
        this.customer_id = customer_id;
        this.customer_name = customer_name;
    }

    /**
     * Gets the card ID.
     */
    public String getCardId() {
        return card_id;
    }

    /**
     * Gets the card type.
     */
    public String getCardType() {
        return card_type;
    }

    /**
     * Sets the card type.
     */
    public void setCardType(String card_type) {
        this.card_type = card_type;
    }

    /**
     * Gets the account ID.
     */
    public String getAccountId() {
        return account_id;
    }

    /**
     * Gets the customer ID.
     */
    public String getCustomerId() {
        return customer_id;
    }

    /**
     * Gets the customer name.
     */
    public String getCustomerName() {
        return customer_name;
    }

    /**
     * Prints the card details in a formatted manner.
     */
    public void printCardRow() {
        System.out.printf("| %-8d | %-12s | %-8d | %-8d | %-20s |\n", 
                          card_id, card_type, account_id, customer_id, customer_name);
    }

    public static void printCardRows(ArrayList<CardRow> cardRows) {
        System.out.printf("| %-8s | %-12s | %-8s | %-8s | %-20s |\n", 
                          "Card ID", "Card Type", "Account ID", "Customer ID", "Customer Name");
        System.out.println("---------------------------------------------------------------------");
        for (CardRow cardRow : cardRows) {
            cardRow.printCardRow();
        }
    }
}