from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class TipoServico(str, Enum):
    corte = "corte"
    barba = "barba"
    corte_barba = "corte_barba"
    hidratacao = "hidratacao"
    coloracao = "coloracao"
    sobrancelha = "sobrancelha"


class ServicoCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None
    tipo: TipoServico
    preco: float = Field(gt=0, description="Preço deve ser maior que zero")
    duracao_minutos: int = Field(gt=0, description="Duração em minutos")


class ServicoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    tipo: Optional[TipoServico] = None
    preco: Optional[float] = Field(default=None, gt=0)
    duracao_minutos: Optional[int] = Field(default=None, gt=0)
    ativo: Optional[bool] = None


class ServicoResponse(BaseModel):
    id: str
    nome: str
    descricao: Optional[str]
    tipo: TipoServico
    preco: float
    duracao_minutos: int
    ativo: bool