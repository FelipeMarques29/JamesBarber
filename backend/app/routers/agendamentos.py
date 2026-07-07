from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
from google.cloud.firestore import FieldFilter
from google.cloud import firestore

from app.db.database import db
from app.utils.auth import obter_usuario_atual
from app.models.agendamentos import AgendamentoCreate, AgendamentoUpdate

router = APIRouter(prefix="/agendamentos", tags=["Agendamentos"])

# horário de Brasília (-03:00) — usado para gerar/exibir horários ao usuário
BRT = timezone(timedelta(hours=-3))


def normalizar_data(dt) -> datetime:
    if dt is None:
        return None
    if hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def para_brt(dt) -> datetime:
    """Converte qualquer datetime para horário de Brasília (assume UTC se vier sem tz)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(BRT)


@router.post("/")
async def criar_agendamento(dados: AgendamentoCreate, user: dict = Depends(obter_usuario_atual)):
    try:
        # Busca única para validação
        barbeiro_doc = db.collection("clientes").document(dados.barbeiro_id).get()
        cliente_doc = db.collection("clientes").document(dados.cliente_id).get()
        servico_doc = db.collection("servicos").document(dados.servico_id).get()

        if not barbeiro_doc.exists or not cliente_doc.exists or not servico_doc.exists:
            raise HTTPException(status_code=404, detail="Dados de cadastro não encontrados.")

        barbeiro = barbeiro_doc.to_dict()
        cliente = cliente_doc.to_dict()
        servico = servico_doc.to_dict()

        if barbeiro.get("funcao") != "barbeiro":
            raise HTTPException(status_code=400, detail="Usuário não é barbeiro.")

        duracao = 30
        inicio_novo = normalizar_data(dados.data_hora)
        fim_novo = inicio_novo + timedelta(minutes=duracao)

        # Validação de conflito
        agendamentos_barbeiro = (
            db.collection("agendamentos")
            .where(filter=FieldFilter("barbeiro_id", "==", dados.barbeiro_id))
            .where(filter=FieldFilter("status", "in", ["Agendado", "Em andamento"]))
            .stream()
        )

        for doc in agendamentos_barbeiro:
            ag = doc.to_dict()
            inicio_existente = normalizar_data(ag.get("data_hora"))
            fim_existente = inicio_existente + timedelta(minutes=ag.get("duracao_minutos", 30))
            if inicio_novo < fim_existente and fim_novo > inicio_existente:
                raise HTTPException(status_code=409, detail="Conflito de horário.")

        agora = datetime.now(timezone.utc)

        # Inserção com dados desnormalizados para evitar leituras futuras
        ref = db.collection("agendamentos").add({
            "barbeiro_id": dados.barbeiro_id,
            "barbeiro_nome": barbeiro.get("nome"),
            "cliente_id": dados.cliente_id,
            "cliente_nome": cliente.get("nome"),
            "servico_id": dados.servico_id,
            "servico_nome": servico.get("nome"),
            "duracao_minutos": duracao,
            "data_hora": dados.data_hora,
            "data_string": inicio_novo.strftime("%Y-%m-%d"),  # Novo campo para busca otimizada
            "valor_total": servico.get("preco"),
            "status": "Agendado",
            "criado_em": agora,
            "atualizado_em": agora,  # necessário para o filtro incremental (atualizado_apos)
        })

        return {"id": ref[1].id, "status": "Agendamento criado!"}

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def listar_agendamentos(
    barbeiro_id: str | None = None,
    cliente_id: str | None = None,
    status: str | None = None,
    limite: int = 50,
    data_inicio: str | None = None,  # Frontend envia a data de corte se precisar
    data_fim: str | None = None,     # Frontend envia o teto (útil para "agendamentos do dia")
    atualizado_apos: str | None = None,
    user: dict = Depends(obter_usuario_atual),
):
    try:
        query = db.collection("agendamentos")

        # 1. Filtros de Data
        if atualizado_apos:
            # Rota de Cache: Traz apenas o que mudou recentemente
            corte = datetime.fromisoformat(atualizado_apos)
            query = query.where(filter=FieldFilter("atualizado_em", ">=", corte))
        else:
            # Rota Normal: Usa as datas passadas pelo Angular (se existirem)
            if data_inicio:
                inicio = datetime.fromisoformat(data_inicio)
                query = query.where(filter=FieldFilter("data_hora", ">=", inicio))
            if data_fim:
                fim = datetime.fromisoformat(data_fim)
                query = query.where(filter=FieldFilter("data_hora", "<=", fim))

        # 2. Filtros de Entidade
        if barbeiro_id: 
            query = query.where(filter=FieldFilter("barbeiro_id", "==", barbeiro_id))
        if cliente_id: 
            query = query.where(filter=FieldFilter("cliente_id", "==", cliente_id))
        if status: 
            query = query.where(filter=FieldFilter("status", "==", status))

        # 3. Ordenação e Limite direto no banco de dados (Economiza $)
        campo_ordenacao = "atualizado_em" if atualizado_apos else "data_hora"
        
        query = query.order_by(campo_ordenacao, direction=firestore.Query.DESCENDING)
        query = query.limit(limite)

        # Executa a leitura apenas dos documentos necessários
        agendamentos = [{**doc.to_dict(), "id": doc.id} for doc in query.stream()]

        return agendamentos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agendamento_id}")
async def buscar_agendamento(agendamento_id: str, user: dict = Depends(obter_usuario_atual)):
    doc = db.collection("agendamentos").document(agendamento_id).get()
    if not doc.exists: raise HTTPException(status_code=404, detail="Não encontrado.")
    return {**doc.to_dict(), "id": doc.id}


@router.patch("/{agendamento_id}")
async def atualizar_agendamento(agendamento_id: str, dados: AgendamentoUpdate, user: dict = Depends(obter_usuario_atual)):
    # Lógica similar à de criação, mantendo a consistência dos dados desnormalizados
    ref = db.collection("agendamentos").document(agendamento_id)
    campos = dados.model_dump(exclude_none=True)
    campos["atualizado_em"] = datetime.now(timezone.utc)
    ref.update(campos)
    return {"mensagem": "Atualizado!"}


@router.delete("/{agendamento_id}")
async def cancelar_agendamento(agendamento_id: str, user: dict = Depends(obter_usuario_atual)):
    ref = db.collection("agendamentos").document(agendamento_id)
    ref.update({"status": "Cancelado", "atualizado_em": datetime.now(timezone.utc)})
    return {"mensagem": "Cancelado!"}


@router.get("/barbeiro/{barbeiro_id}/horarios-livres")
async def horarios_livres(barbeiro_id: str, data: str):
    try:
        dia = datetime.strptime(data, "%Y-%m-%d").date()
        inicio_dia = datetime(dia.year, dia.month, dia.day, 8, 0, tzinfo=BRT)
        fim_dia = datetime(dia.year, dia.month, dia.day, 18, 0, tzinfo=BRT)

        agendamentos = (
            db.collection("agendamentos")
            .where(filter=FieldFilter("barbeiro_id", "==", barbeiro_id))
            .where(filter=FieldFilter("status", "in", ["Agendado", "Em andamento"]))
            .stream()
        )

        ocupados: list[tuple[datetime, datetime]] = []
        for doc in agendamentos:
            ag = doc.to_dict()
            data_hora = para_brt(ag.get("data_hora"))

            if data_hora and data_hora.date() == dia:
                duracao = ag.get("duracao_minutos", 30)
                ocupados.append((data_hora, data_hora + timedelta(minutes=duracao)))

        slots_livres = []
        slot = inicio_dia
        while slot < fim_dia:
            slot_fim = slot + timedelta(minutes=30)
            conflito = any(slot < fim and slot_fim > inicio for inicio, fim in ocupados)
            if not conflito:
                slots_livres.append(slot.strftime("%H:%M"))
            slot = slot_fim

        return {"data": data, "barbeiro_id": barbeiro_id, "horarios_livres": slots_livres}

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))