-- Database Schema for Online Banking System
-- Includes Tables, Stored Procedures, and Triggers

CREATE DATABASE IF NOT EXISTS banking_system;
USE banking_system;

-- Disable foreign key checks for dropping tables
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS customers;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Customers Table
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (Linked to Customers)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- 3. Accounts Table
CREATE TABLE accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    account_type VARCHAR(20) DEFAULT 'savings',
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- 4. Transactions Table
CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT,
    transaction_type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'transfer'
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

-- --- TRIGGERS ---

-- Trigger to prevent negative balance
DELIMITER //
CREATE TRIGGER prevent_negative_balance
BEFORE UPDATE ON accounts
FOR EACH ROW
BEGIN
    IF NEW.balance < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient funds: Balance cannot be negative.';
    END IF;
END;
//
DELIMITER ;

-- --- STORED PROCEDURES ---

-- Deposit Procedure
DELIMITER //
CREATE PROCEDURE Deposit(
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

    -- Update balance
    UPDATE accounts 
    SET balance = balance + p_amount 
    WHERE account_id = p_account_id;

    -- Record transaction
    INSERT INTO transactions (account_id, transaction_type, amount, description)
    VALUES (p_account_id, 'deposit', p_amount, 'Deposit');

    COMMIT;
END;
//
DELIMITER ;

-- Withdraw Procedure
DELIMITER //
CREATE PROCEDURE Withdraw(
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
END;
//
DELIMITER ;

-- Transfer Procedure
DELIMITER //
CREATE PROCEDURE TransferFunds(
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
        -- Debit Sender
        UPDATE accounts 
        SET balance = balance - p_amount 
        WHERE account_id = p_from_account_id;

        INSERT INTO transactions (account_id, transaction_type, amount, description)
        VALUES (p_from_account_id, 'transfer_out', p_amount, CONCAT('Transfer to account ', p_to_account_id));

        -- Credit Receiver
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
END;
//
DELIMITER ;
