# Sarah Zwart

## How to Run Code
1. Navigate to the `scz225` directory:
   ```bash
   cd scz225
   ```
2. Run the following command:
   ```bash
   make
   ```

---

## Interfaces

### Login
1. Prompts user for a password.
2. User is then prompted to choose one of the following options:
   ```
   Employee or User:
       [E] Employee Login
       [U] User Login
       [Q] Quit
       [E U Q] :>
   ```

### Employee Action Options
Displays choices for employees:
```
Employee actions:
    [C] View all customers
    [D] View all cards
    [A] View all accounts
    [T] View all transactions
    [L] View all loans
    [Q] Quit
    [C D A T L Q] :>
```

### User Action Options
1. Enter a name from the displayed list of customers. All customers have existing data.
   **TIP:** Harry Styles is a user with extensive data.
2. Displays five interfaces for users:
   ```
   Main Menu:
       [D] Account Deposit/Withdrawal
       [A] View Account Information or Open Account(s)
       [C] Obtain New Debit/Credit Card
       [L] Take Out a Loan
       [P] Purchases Using a Card
       [Q] Quit
       [D A C L P Q] :>
   ```
3. The quit option is available from all menus.

---

## Types of Interfaces

### Account Deposit/Withdrawal
Interface for making deposits or withdrawals:
```
Make a Deposit or Withdrawal:
    [V] View my Accounts
    [D] Make a Deposit
    [W] Make a Withdrawal
    [Q] Quit
    [V D W Q] :>
```

### View Account Information or Open Account(s)
Interface for account actions:
```
Account Menu:
    [V] View my Account(s)
    [C] Create new Account
    [Q] Quit
    [V C Q] :>
```

### Obtain New Debit/Credit Card
Interface for managing cards:
```
Open a Credit or Debit Card:
    [V] View All Card Info
    [C] Open a Credit Card
    [D] Open a Debit Card
    [Q] Quit
    [V C D Q] :>
```

### Take Out a Loan
Interface for loan management:
```
Loan Menu:
    [V] View my Loan(s)
    [T] Take out a Loan
    [P] Pay my Loan(s)
    [Q] Quit
    [V T P Q] :>
```

### Purchases Using a Card
Interface for making purchases:
```
Make a Purchase:
    [V] View Credit/Debit Info
    [P] Make Purchase
    [Q] Quit
    [V P Q] :>
```

---

## To Quit the Program
To quit the entire program, enter `Q` to quit each menu until the program exits.

