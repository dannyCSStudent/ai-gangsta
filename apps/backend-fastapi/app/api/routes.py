# app/api/routes.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "Gangsta AI Backend is alive"}
