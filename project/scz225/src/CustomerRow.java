import java.sql.Date;
import java.util.ArrayList;
public class Customer{
    public final int customr_id;
    public String customer_name;
    public Date birthday;
    public String address;
    /**
     * Constructor for Customer.
     */
    public Customer(int customer_id, String customer_name, Date birthday, String address) {
        this.customer_id = customer_id;
        this.customer_name = customer_name;
        this.birthday = birthday;
        this.address = address;
    }

    /**
     * Default constructor for Customer.
     */
    public Customer() {
        this.customer_id = 0; 
        this.customer_name = "";
        this.birthday = new Date(); 
        this.address = "";
    }

    /**
     * Getter for Customer ID.
     */
    public int getCustomerID() {
        return customer_id;
    }

    /**
     * Getter for Customer Name.
     */
    public String getCustomerName() {
        return customer_name;
    }

    /**
     * Setter for Customer Name.
     */
    public void setCustomerName(String customer_name) {
        this.customer_name = customer_name;
    }

    /**
     * Getter for Birthday.
     */
    public Date getBirthday() {
        return birthday;
    }

    /**
     * Setter for Birthday.
     */
    public void setBirthday(Date birthday) {
        this.birthday = birthday;
    }

    /**
     * Getter for Address.
     */
    public String getAddress() {
        return address;
    }

    /**
     * Setter for Address.
     */
    public void setAddress(String address) {
        this.address = address;
    }

    /**
     * Print customer.
     */
    public void printCustomer() {
        System.out.printf("| %-10d | %-20s | %-10s | %-30s |\n",
                customer_id, customer_name, birthday, address);
    }

    /**
     * Print all customers.
     */
    public static void printCustomers(ArrayList<Customer> customers) {
        System.out.printf("| %-10s | %-20s | %-10s | %-30s |\n",
                "Customer ID", "Customer Name", "Birthday", "Address");
        System.out.println("---------------------------------------------------------------");
        for (Customer customer : customers) {
            customer.printCustomer();
        }
    }
}