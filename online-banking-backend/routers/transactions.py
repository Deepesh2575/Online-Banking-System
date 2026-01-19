from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

import database, schemas, models, dependencies

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"],
    dependencies=[Depends(dependencies.get_current_active_user)]
)

def check_account_ownership(db: Session, account_id: int, user_id: int):
    """
    Helper function to verify that an account belongs to the logged-in user.
    """
    account = db.query(models.Account).filter(models.Account.account_id == account_id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Account with ID {account_id} not found.")
    
    # Fetch the customer associated with the user
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user or account.customer_id != user.customer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform operations on this account.")
    return account

@router.post("/deposit", response_model=schemas.Msg)
def deposit_funds(
    request: schemas.DepositWithdrawRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user)
):
    """
    Deposits funds into a specified account by calling the `Deposit` stored procedure.
    - Validates that the user owns the account.
    """
    check_account_ownership(db, request.account_id, current_user.user_id)
    
    try:
        # Call the stored procedure
        db.execute(
            text("CALL Deposit(:account_id, :amount)"),
            {"account_id": request.account_id, "amount": request.amount}
        )
        db.commit()
        return {"message": f"Successfully deposited {request.amount} into account {request.account_id}."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An error occurred during the deposit: {e}")

@router.post("/withdraw", response_model=schemas.Msg)
def withdraw_funds(
    request: schemas.DepositWithdrawRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user)
):
    """
    Withdraws funds from a specified account by calling the `Withdraw` stored procedure.
    - Validates that the user owns the account.
    - Checks the output of the stored procedure to confirm success.
    """
    check_account_ownership(db, request.account_id, current_user.user_id)
    
    try:
        # The stored procedure has an OUT parameter `success`
        result = db.execute(
            text("CALL Withdraw(:account_id, :amount, @success)"),
            {"account_id": request.account_id, "amount": request.amount}
        )
        # Fetch the value of the OUT parameter
        success_row = db.execute(text("SELECT @success")).fetchone()
        
        db.commit()

        if success_row and success_row[0] == 1:
            return {"message": f"Successfully withdrew {request.amount} from account {request.account_id}."}
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Withdrawal failed. Check for insufficient funds.")
            
    except Exception as e:
        db.rollback()
        # Propagate specific exceptions from the procedure call if possible
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An error occurred during the withdrawal: {e}")

@router.post("/transfer", response_model=schemas.Msg)
def transfer_funds(
    request: schemas.TransferRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user)
):
    """
    Transfers funds between two accounts by calling the `TransferFunds` stored procedure.
    - Validates that the user owns the 'from' account.
    - Checks the output of the stored procedure to confirm success.
    """
    if request.from_account_id == request.to_account_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot transfer funds to the same account.")

    check_account_ownership(db, request.from_account_id, current_user.user_id)
    
    # Check if the destination account exists
    to_account = db.query(models.Account).filter(models.Account.account_id == request.to_account_id).first()
    if not to_account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Destination account with ID {request.to_account_id} not found.")

    try:
        # Call the stored procedure with the OUT parameter
        result = db.execute(
            text("CALL TransferFunds(:from_id, :to_id, :amount, @success)"),
            {
                "from_id": request.from_account_id,
                "to_id": request.to_account_id,
                "amount": request.amount
            }
        )
        success_row = db.execute(text("SELECT @success")).fetchone()
        
        db.commit()

        if success_row and success_row[0] == 1:
            return {"message": f"Successfully transferred {request.amount} from account {request.from_account_id} to {request.to_account_id}."}
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transfer failed. Check for insufficient funds in the source account.")

    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An error occurred during the transfer: {e}")

@router.get("/{account_id}", response_model=List[schemas.Transaction])
def get_account_transactions(
    account_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user)
):
    """
    Retrieves the last 20 transactions for a specific account.
    - Ensures the user owns the account before returning the history.
    """
    check_account_ownership(db, account_id, current_user.user_id)
    
    transactions = db.query(models.Transaction)\
        .filter(models.Transaction.account_id == account_id)\
        .order_by(models.Transaction.transaction_date.desc())\
        .limit(20)\
        .all()
        
    return transactions
