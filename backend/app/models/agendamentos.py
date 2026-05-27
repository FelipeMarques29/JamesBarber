from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class StatusAgendamento(str, Enum):
    agendado = "Agendado"
    em_andamento = "Em andamento"
    concluido = "Concluído"
    cancelado = "Cancelado"

class AgendamentoCreate(BaseModel):
    barbeiro_id: str
    cliente_id: str
    servico_id: str
    data_hora: datetime = Field(description="ISO 8601, ex: 2026-04-26T14:00:00")

class AgendamentoResponse(BaseModel):
    id: str
    barbeiro_id: str
    barbeiro_nome: str
    cliente_id: str
    cliente_nome: str
    servico_id: str
    data_hora: datetime
    status: StatusAgendamento
    valor_total: float
    criado_em: datetime


class AgendamentoUpdate(BaseModel):
    status: Optional[StatusAgendamento] = None
    data_hora: Optional[datetime] = None