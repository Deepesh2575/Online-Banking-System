from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# Note: These models mirror the existing database schema.
# They are used by SQLAlchemy to understand and interact with your tables.

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone_number = Column(String(20))
    address = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="customer", uselist=False)
    accounts = relationship("Account", back_populates="owner")

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default='customer')
    last_login = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    customer = relationship("Customer", back_populates="user")

class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    account_number = Column(String(20), unique=True, nullable=False)
    account_type = Column(String(20), nullable=False, default='savings')
    balance = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("Customer", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.account_id"))
    transaction_type = Column(String(20), nullable=False) # e.g., 'deposit', 'withdrawal', 'transfer'
    amount = Column(Float, nullable=False)
    description = Column(Text)
    transaction_date = Column(DateTime, server_default=func.now())

    account = relationship("Account", back_populates="transactions")
