from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import database, schemas, models, dependencies

router = APIRouter(
    prefix="/accounts",
    tags=["Accounts"],
    dependencies=[Depends(dependencies.get_current_active_user)]
)

@router.get("/", response_model=List[schemas.Account])
def get_user_accounts(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(dependencies.get_current_active_user)
):
    """
    Retrieves all bank accounts associated with the currently authenticated user.
    The dependency `get_current_active_user` ensures this endpoint is protected.
    """
    accounts = db.query(models.Account).filter(models.Account.customer_id == current_user.customer_id).all()
    
    if not accounts:
        # It's not an error to have no accounts, just return an empty list.
        return []
        
    return accounts

@router.get("/{account_id}/balance", response_model=schemas.AccountBase)
def get_account_balance(
    account_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user)
):
    """
    Retrieves the details and balance for a specific account.
    - Ensures the user owns the account before returning data.
    """
    account = db.query(models.Account).filter(models.Account.account_id == account_id).first()

    # Security Check: Ensure the account exists and belongs to the current user
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    
    if account.customer_id != current_user.customer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this account")

    return account
