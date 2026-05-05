from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AgendamentoBase (BaseModel):
    barbeiro_id: str
    barbeiro_nome: str
    cliente_id: str
    cliente_nome: str
    data_hora: str  # Ex: "2026-04-25 15:30"
    servico_id: str
    valor_total: float

class AgendamentoCreate(AgendamentoBase):
    status: Optional[str] = "pendente"

class AgendamentoResponse(AgendamentoBase):
    id: str # O ID gerado pelo Firebase
    status: str
    criado_em: datetime