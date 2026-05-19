from pydantic import BaseModel, EmailStr
from datetime import datetime


class ClienteCreate (BaseModel):
    nome: str
    telefone: str
    email: EmailStr #valida email
    senha: str
    
class ClienteResponse(BaseModel):
    id: str
    nome: str
    email: EmailStr
    telefone: str
    status: str
    funcao: str | None