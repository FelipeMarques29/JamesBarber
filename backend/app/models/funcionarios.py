from pydantic import BaseModel, EmailStr
from typing import Literal


class FuncionarioLogin(BaseModel):
    funcionario_email: EmailStr #valida email
    funcionario_senha: str
    
class FuncionarioCreate(FuncionarioLogin):
    funcionario_nome: str
    funcionario_funcao: Literal["barbeiro", "limpeza", "balcao"]
    funcionario_telefone: str
    
class FuncionarioResponse(BaseModel):
    id: str
    funcionario_email: EmailStr
    funcionario_nome: str
    funcionario_funcao: str
    funcionario_telefone: str