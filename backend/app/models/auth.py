# models/auth.py
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr


class RecuperarSenha(BaseModel):
    email: EmailStr