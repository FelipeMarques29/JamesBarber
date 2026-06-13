from app.db.database import db
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
from google.cloud.firestore import FieldFilter

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
async def criar_agendamento(dados: AgendamentoCreate):
    try:
        barbeiro_doc = db.collection("clientes").document(dados.barbeiro_id).get()
        if not barbeiro_doc.exists:
            raise HTTPException(status_code=404, detail="Barbeiro não encontrado.")
        barbeiro = barbeiro_doc.to_dict()
        if barbeiro.get("funcao") != "barbeiro":
            raise HTTPException(status_code=400, detail="O usuário informado não é um barbeiro.")

        cliente_doc = db.collection("clientes").document(dados.cliente_id).get()
        if not cliente_doc.exists:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")
        cliente = cliente_doc.to_dict()

        servico_doc = db.collection("servicos").document(dados.servico_id).get()
        if not servico_doc.exists:
            raise HTTPException(status_code=404, detail="Serviço não encontrado.")
        servico = servico_doc.to_dict()

        duracao = 30  # todo serviço ocupa um horário fixo de 30 min
        inicio_novo = normalizar_data(dados.data_hora)
        fim_novo = inicio_novo + timedelta(minutes=duracao)

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
                raise HTTPException(
                    status_code=409,
                    detail=f"Barbeiro já possui agendamento neste horário. Próximo horário disponível: {para_brt(fim_existente).strftime('%d/%m/%Y às %H:%M')}."
                )

        ref = db.collection("agendamentos").add({
            "barbeiro_id": dados.barbeiro_id,
            "barbeiro_nome": barbeiro.get("nome"),
            "cliente_id": dados.cliente_id,
            "cliente_nome": cliente.get("nome"),
            "servico_id": dados.servico_id,
            "servico_nome": servico.get("nome"),
            "duracao_minutos": duracao,
            "data_hora": dados.data_hora,
            "valor_total": servico.get("preco"),
            "status": "Agendado",
            "criado_em": datetime.now()
        })

        novo_id = ref[1].id
        return {"id": str(novo_id), "status": "Agendamento criado com sucesso!"}

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def listar_agendamentos(
    barbeiro_id: str | None = None,
    cliente_id: str | None = None,
    status: str | None = None
):
    try:
        query = db.collection("agendamentos")

        if barbeiro_id:
            query = query.where(filter=FieldFilter("barbeiro_id", "==", barbeiro_id))
        if cliente_id:
            query = query.where(filter=FieldFilter("cliente_id", "==", cliente_id))
        if status:
            query = query.where(filter=FieldFilter("status", "==", status))

        agendamentos = []
        for doc in query.stream():
            ag = doc.to_dict()
            agendamentos.append({
                "id": doc.id,
                "barbeiro_id": ag.get("barbeiro_id"),
                "barbeiro_nome": ag.get("barbeiro_nome"),
                "cliente_id": ag.get("cliente_id"),
                "cliente_nome": ag.get("cliente_nome"),
                "servico_id": ag.get("servico_id"),
                "servico_nome": ag.get("servico_nome"),
                "data_hora": ag.get("data_hora"),
                "duracao_minutos": ag.get("duracao_minutos"),
                "valor_total": ag.get("valor_total"),
                "status": ag.get("status"),
                "criado_em": ag.get("criado_em"),
            })

        return agendamentos

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agendamento_id}")
async def buscar_agendamento(agendamento_id: str):
    try:
        doc = db.collection("agendamentos").document(agendamento_id).get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado.")

        ag = doc.to_dict()
        return {
            "id": doc.id,
            "barbeiro_id": ag.get("barbeiro_id"),
            "barbeiro_nome": ag.get("barbeiro_nome"),
            "cliente_id": ag.get("cliente_id"),
            "cliente_nome": ag.get("cliente_nome"),
            "servico_id": ag.get("servico_id"),
            "servico_nome": ag.get("servico_nome"),
            "data_hora": ag.get("data_hora"),
            "duracao_minutos": ag.get("duracao_minutos"),
            "valor_total": ag.get("valor_total"),
            "status": ag.get("status"),
            "criado_em": ag.get("criado_em"),
        }

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{agendamento_id}")
async def atualizar_agendamento(agendamento_id: str, dados: AgendamentoUpdate):
    try:
        ref = db.collection("agendamentos").document(agendamento_id)
        doc = ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado.")

        campos = dados.model_dump(exclude_none=True)

        if not campos:
            raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualização.")

        if "data_hora" in campos:
            ag_atual = doc.to_dict()
            barbeiro_id = ag_atual.get("barbeiro_id")
            duracao = ag_atual.get("duracao_minutos", 30)
            inicio_novo = normalizar_data(campos["data_hora"])
            fim_novo = inicio_novo + timedelta(minutes=duracao)

            agendamentos_barbeiro = (
                db.collection("agendamentos")
                .where(filter=FieldFilter("barbeiro_id", "==", barbeiro_id))
                .where(filter=FieldFilter("status", "in", ["Agendado", "Em andamento"]))
                .stream()
            )

            for outro in agendamentos_barbeiro:
                if outro.id == agendamento_id:
                    continue

                ag = outro.to_dict()
                inicio_existente = normalizar_data(ag.get("data_hora"))
                fim_existente = inicio_existente + timedelta(minutes=ag.get("duracao_minutos", 30))

                if inicio_novo < fim_existente and fim_novo > inicio_existente:
                    raise HTTPException(
                        status_code=409,
                        detail=f"Barbeiro já possui agendamento neste horário. Próximo horário disponível: {para_brt(fim_existente).strftime('%d/%m/%Y às %H:%M')}."
                    )

        if "status" in campos:
            campos["status"] = campos["status"].value

        campos["atualizado_em"] = datetime.now()
        ref.update(campos)

        return {"mensagem": "Agendamento atualizado com sucesso!"}

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{agendamento_id}")
async def cancelar_agendamento(agendamento_id: str):
    try:
        ref = db.collection("agendamentos").document(agendamento_id)
        doc = ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado.")

        ag = doc.to_dict()

        if ag.get("status") == "Concluído":
            raise HTTPException(status_code=400, detail="Não é possível cancelar um agendamento já concluído.")

        ref.update({
            "status": "Cancelado",
            "atualizado_em": datetime.now()
        })

        return {"mensagem": "Agendamento cancelado com sucesso!"}

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


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