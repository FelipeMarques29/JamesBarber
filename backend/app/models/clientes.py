from pydantic import BaseModel, EmailStr
from datetime import datetime

class ClienteLogin (BaseModel):
    cliente_email: EmailStr #valida email
    cliente_senha: str

class CadastroCliente (ClienteLogin):
    cliente_nome: str
    cliente_telefone: str
    
