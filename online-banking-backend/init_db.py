import sys
import os

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text

def init_db():
    print("Initializing database...")
    
    # 1. Create Database if strictly necessary
    from sqlalchemy import create_engine
    from config import settings
    
    # Parse URL to remove database name for initial connection
    # Assuming standard format: dialect+driver://user:pass@host:port/dbname
    base_url = settings.DATABASE_URL.rsplit('/', 1)[0] 
    db_name = settings.DATABASE_URL.rsplit('/', 1)[1].split('?')[0] # handle query params if any

    print(f"Connecting to {base_url} to create {db_name}...")
    temp_engine = create_engine(base_url)
    
    try:
        with temp_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name}"))
            conn.execute(text(f"USE {db_name}")) # Not strictly needed if we reconnect, but good to check
            print(f"Database {db_name} created or exists.")
    except Exception as e:
        print(f"Warning during DB creation (might already exist): {e}")

    # 2. Connect to the specific database
    # valid engine imported from database.py is fine now
    
    # Define SQL blocks
    
    tables_sql = [
        "SET FOREIGN_KEY_CHECKS = 0",
        "DROP TABLE IF EXISTS transactions",
        "DROP TABLE IF EXISTS accounts",
        "DROP TABLE IF EXISTS users",
        "DROP TABLE IF EXISTS customers",
        "SET FOREIGN_KEY_CHECKS = 1",
        
        """CREATE TABLE customers (
            customer_id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            phone_number VARCHAR(20),
            address VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        
        """CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT,
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'customer',
            last_login DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
        )""",
        
        """CREATE TABLE accounts (
            account_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT,
            account_number VARCHAR(20) NOT NULL UNIQUE,
            account_type VARCHAR(20) DEFAULT 'savings',
            balance DECIMAL(15, 2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
        )""",
        
        """CREATE TABLE transactions (
            transaction_id INT AUTO_INCREMENT PRIMARY KEY,
            account_id INT,
            transaction_type VARCHAR(20) NOT NULL,
            amount DECIMAL(15, 2) NOT NULL,
            description TEXT,
            transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
        )"""
    ]

    triggers_sql = [
        """CREATE TRIGGER prevent_negative_balance
           BEFORE UPDATE ON accounts
           FOR EACH ROW
           BEGIN
               IF NEW.balance < 0 THEN
                   SIGNAL SQLSTATE '45000'
                   SET MESSAGE_TEXT = 'Insufficient funds: Balance cannot be negative.';
               END IF;
           END"""
    ]

    procedures_sql = [
        "DROP PROCEDURE IF EXISTS Deposit",
        """CREATE PROCEDURE Deposit(
            IN p_account_id INT,
            IN p_amount DECIMAL(15, 2)
        )
        BEGIN
            DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                ROLLBACK;
                RESIGNAL;
            END;

            START TRANSACTION;

            UPDATE accounts 
            SET balance = balance + p_amount 
            WHERE account_id = p_account_id;

            INSERT INTO transactions (account_id, transaction_type, amount, description)
            VALUES (p_account_id, 'deposit', p_amount, 'Deposit');

            COMMIT;
        END""",
        
        "DROP PROCEDURE IF EXISTS Withdraw",
        """CREATE PROCEDURE Withdraw(
            IN p_account_id INT,
            IN p_amount DECIMAL(15, 2),
            OUT p_success BOOLEAN
        )
        BEGIN
            DECLARE current_bal DECIMAL(15, 2);
            
            DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                ROLLBACK;
                SET p_success = FALSE;
                RESIGNAL;
            END;

            START TRANSACTION;

            SELECT balance INTO current_bal FROM accounts WHERE account_id = p_account_id FOR UPDATE;

            IF current_bal >= p_amount THEN
                UPDATE accounts 
                SET balance = balance - p_amount 
                WHERE account_id = p_account_id;

                INSERT INTO transactions (account_id, transaction_type, amount, description)
                VALUES (p_account_id, 'withdrawal', p_amount, 'Withdrawal');

                SET p_success = TRUE;
                COMMIT;
            ELSE
                SET p_success = FALSE;
                ROLLBACK;
            END IF;
        END""",
        
        "DROP PROCEDURE IF EXISTS TransferFunds",
        """CREATE PROCEDURE TransferFunds(
            IN p_from_account_id INT,
            IN p_to_account_id INT,
            IN p_amount DECIMAL(15, 2),
            OUT p_success BOOLEAN
        )
        BEGIN
            DECLARE from_bal DECIMAL(15, 2);

            DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                ROLLBACK;
                SET p_success = FALSE;
                RESIGNAL;
            END;

            START TRANSACTION;

            SELECT balance INTO from_bal FROM accounts WHERE account_id = p_from_account_id FOR UPDATE;

            IF from_bal >= p_amount THEN
                UPDATE accounts 
                SET balance = balance - p_amount 
                WHERE account_id = p_from_account_id;

                INSERT INTO transactions (account_id, transaction_type, amount, description)
                VALUES (p_from_account_id, 'transfer_out', p_amount, CONCAT('Transfer to account ', p_to_account_id));

                UPDATE accounts 
                SET balance = balance + p_amount 
                WHERE account_id = p_to_account_id;

                INSERT INTO transactions (account_id, transaction_type, amount, description)
                VALUES (p_to_account_id, 'transfer_in', p_amount, CONCAT('Transfer from account ', p_from_account_id));

                SET p_success = TRUE;
                COMMIT;
            ELSE
                SET p_success = FALSE;
                ROLLBACK;
            END IF;
        END"""
    ]

    try:
        # Use the engine from database.py which connects to the now-existing DB
        with engine.connect() as conn:
            # Execute Tables
            for stmt in tables_sql:
                print(f"Executing: {stmt[:50]}...")
                conn.execute(text(stmt))
                conn.commit()
            
            # Execute Triggers
            for stmt in triggers_sql:
                print(f"Executing Trigger: {stmt[:50]}...")
                # Triggers often require simple execution without delimiters if strictly one statement in python
                conn.execute(text(stmt))
                conn.commit()
            
            # Execute Procedures
            for stmt in procedures_sql:
                print(f"Executing Procedure: {stmt[:50]}...")
                conn.execute(text(stmt))
                conn.commit()
                
        print("Database initialized successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    init_db()
