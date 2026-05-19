from fastapi import APIRouter, HTTPException
from app.database import db
from datetime import datetime
from app.models.agendamentos import AgendamentoCreate

router = APIRouter(prefix="/agendamentos", tags=["Agendamentos"])

@router.post("/")
#cria o documento no banco com esse dados
async def criar_agendamento(dados: AgendamentoCreate):
    try:
        novo_agendamento = db.collection("agendamentos").add({
            "barbeiro_id": dados.barbeiro_id,
            "barbeiro_nome": dados.barbeiro_nome,
            "cliente_id": dados.cliente_id,
            "cliente_nome": dados.cliente_nome,
            "data_hora": dados.data_hora,
            "servico_id": dados.servico_id,
            "status": dados.status,
            "valor_total": dados.valor_total,
            "criado_em": datetime.now(),
        })
        return {"id": novo_agendamento[1].id, "status": "Agendamento criado com sucesso!"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def listar_agendamentos():
    docs = db.collection("agendamentos").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]