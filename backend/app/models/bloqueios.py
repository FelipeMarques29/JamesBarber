from pydantic import BaseModel
from typing import Optional

class BloqueioCreate(BaseModel):
    data: str  # Formato YYYY-MM-DD
    tipo: str  # "folga" ou "fechado"
    barbeiro_id: Optional[str] = None
    dia_todo: bool = True
    hora_inicio: Optional[str] = None # HH:MM
    hora_fim: Optional[str] = None # HH:MM
