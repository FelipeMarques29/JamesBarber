from pydantic import BaseModel, EmailStr
from datetime import datetime


class ClienteCreate (BaseModel):
    nome: str
    telefone: str
    email: EmailStr #valida email
    
class ClienteResponse(BaseModel):
    id: str
    nome: str
    email: EmailStr
    telefone: str
    status: str
    funcao: str | None

class JornadaUpdate(BaseModel):
    jornada_inicio: str | None = None
    jornada_fim: str | None = None
    almoco_inicio: str | None = None
    almoco_fim: str | None = None