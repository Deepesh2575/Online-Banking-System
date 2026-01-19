from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# ==================================
# Base and Response Schemas
# ==================================

class AccountBase(BaseModel):
    account_id: int
    account_number: str
    account_type: str
    balance: float

class Account(AccountBase):
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    role: Optional[str] = 'customer'

class User(UserBase):
    user_id: int
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserWithAccounts(User):
    accounts: List[Account] = []

class Transaction(BaseModel):
    transaction_id: int
    transaction_type: str
    amount: float
    transaction_date: datetime
    description: Optional[str] = None

    class Config:
        from_attributes = True

# ==================================
# Request Body Schemas
# ==================================

class UserCreate(BaseModel):
    first_name: str = Field(..., min_length=2)
    last_name: str = Field(..., min_length=2)
    email: EmailStr
    username: str = Field(..., min_length=4)
    password: str = Field(..., min_length=8)
    initial_deposit: float = Field(0.0, ge=0)

class UserLogin(BaseModel):
    username: str
    password: str

class DepositWithdrawRequest(BaseModel):
    account_id: int
    amount: float = Field(..., gt=0, description="Amount must be positive")

class TransferRequest(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float = Field(..., gt=0, description="Amount must be positive")

# ==================================
# Token/Session Schemas
# ==================================

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class Msg(BaseModel):
    message: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserWithAccounts
