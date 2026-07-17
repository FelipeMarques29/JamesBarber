# models/auth.py
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr


class RecuperarSenha(BaseModel):
    email: EmailStr
    # Identificador do dispositivo (gerado no navegador e salvo no localStorage).
    device_id: str | None = None


class RedefinirSenha(BaseModel):
    # Nova senha definida pelo usuário após entrar com a senha temporária.
    nova_senha: str = Field(min_length=6)