import random
import string
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from datetime import datetime

import database, schemas, models, dependencies

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user_create: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """
    Handles new user registration.
    - Creates a new Customer.
    - Hashes the user's password.
    - Creates a new User linked to the Customer.
    - Creates an initial 'savings' account for the user with an optional initial deposit.
    - All operations are performed in a single transaction.
    """
    hashed_password = pwd_context.hash(user_create.password)

    # Use a transaction to ensure all or nothing
    with db.begin_nested():
        try:
            # 1. Create the customer
            new_customer = models.Customer(
                first_name=user_create.first_name,
                last_name=user_create.last_name,
                email=user_create.email,
            )
            db.add(new_customer)
            db.flush() # Flush to get the customer_id

            # 2. Create the user
            new_user = models.User(
                customer_id=new_customer.customer_id,
                username=user_create.username,
                password_hash=hashed_password,
            )
            db.add(new_user)
            db.flush() # Flush to get the user_id

            # 3. Create the initial savings account
            account_number = ''.join(random.choices(string.digits, k=12))
            initial_account = models.Account(
                customer_id=new_customer.customer_id,
                account_number=account_number,
                account_type='savings',
                balance=user_create.initial_deposit,
            )
            db.add(initial_account)
            
            # If initial deposit is > 0, create a transaction record
            if user_create.initial_deposit > 0:
                db.flush() # Need to flush to get the account_id for the transaction
                deposit_transaction = models.Transaction(
                    account_id=initial_account.account_id,
                    transaction_type='deposit',
                    amount=user_create.initial_deposit,
                    description='Initial account deposit'
                )
                db.add(deposit_transaction)

            db.commit()
            
            # Eagerly load customer data for the response
            db.refresh(new_user, ["customer"])
            return new_user

        except IntegrityError as e:
            db.rollback()
            # Check for unique constraint violation
            if "UNIQUE constraint failed: users.username" in str(e.orig) or "Duplicate entry" in str(e.orig) and "for key 'username'" in str(e.orig):
                 raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists.")
            if "UNIQUE constraint failed: customers.email" in str(e.orig) or "Duplicate entry" in str(e.orig) and "for key 'email'" in str(e.orig):
                 raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")
            if "UNIQUE constraint failed: accounts.account_number" in str(e.orig) or "Duplicate entry" in str(e.orig) and "for key 'account_number'" in str(e.orig):
                 # This is unlikely but good to handle
                 raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate a unique account number. Please try again.")
            # For any other integrity error
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database integrity error: {e.orig}")
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred during registration: {e}")


@router.post("/login", response_model=schemas.LoginResponse)
def login_for_access_token(form_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    """
    Handles user login.
    - Verifies username and password.
    - If valid, creates and returns a JWT token along with user data.
    """
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user or not pwd_context.verify(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last_login time
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # Create JWT token
    access_token = dependencies.create_access_token(data={"sub": user.username})
    
    # Manually build the user response model
    user_details = schemas.User.from_orm(user)
    accounts = [schemas.Account.from_orm(acc) for acc in user.customer.accounts]
    user_with_accounts = schemas.UserWithAccounts(**user_details.dict(), accounts=accounts)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_with_accounts
    }


@router.post("/logout", response_model=schemas.Msg)
def logout():
    """
    User logout. For JWT, this is a symbolic endpoint.
    The client is responsible for deleting the token.
    """
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=schemas.UserWithAccounts)
async def read_users_me(current_user: models.User = Depends(dependencies.get_current_active_user)):
    """
    Returns the details of the currently authenticated user,
    including their associated bank accounts.
    """
    # The dependency already fetches the user. We just need to format the response.
    user_data = schemas.User.from_orm(current_user)
    accounts_data = [schemas.Account.from_orm(acc) for acc in current_user.customer.accounts]
    
    return schemas.UserWithAccounts(**user_data.dict(), accounts=accounts_data)
