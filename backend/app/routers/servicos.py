from app.db.database import db
from datetime import datetime
from fastapi import APIRouter, HTTPException
from google.cloud.firestore import FieldFilter

from app.models.servicos import ServicoCreate, ServicoUpdate

router = APIRouter(prefix="/servicos", tags=["Serviços"])


@router.post("/")
async def criar_servico(dados: ServicoCreate):
    try:
        existente = db.collection("servicos").where(filter=FieldFilter("nome", "==", dados.nome)).get()

        if existente:
            raise HTTPException(status_code=400, detail="Já existe um serviço com este nome.")

        ref = db.collection("servicos").add({
            "nome": dados.nome,
            "descricao": dados.descricao,
            "tipo": dados.tipo.value,
            "preco": dados.preco,
            "ativo": True,
            "criado_em": datetime.now()
        })

        novo_id = ref[1].id

        return {
            "id": str(novo_id),
            "status": "Serviço criado com sucesso!"
        }

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def listar_servicos(apenas_ativos: bool = True):
    try:
        if apenas_ativos:
            query = db.collection("servicos").where(filter=FieldFilter("ativo", "==", True)).stream()
        else:
            query = db.collection("servicos").stream()

        servicos = []
        for doc in query:
            dados = doc.to_dict()
            servicos.append({
                "id": doc.id,
                "nome": dados.get("nome"),
                "descricao": dados.get("descricao"),
                "tipo": dados.get("tipo"),
                "preco": dados.get("preco"),
                "ativo": dados.get("ativo")
            })

        return servicos

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{servico_id}")
async def buscar_servico(servico_id: str):
    try:
        doc = db.collection("servicos").document(servico_id).get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Serviço não encontrado.")

        dados = doc.to_dict()

        return {
            "id": doc.id,
            "nome": dados.get("nome"),
            "descricao": dados.get("descricao"),
            "tipo": dados.get("tipo"),
            "preco": dados.get("preco"),
            "ativo": dados.get("ativo")
        }

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{servico_id}")
async def atualizar_servico(servico_id: str, dados: ServicoUpdate):
    try:
        ref = db.collection("servicos").document(servico_id)
        doc = ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Serviço não encontrado.")

        campos = dados.model_dump(exclude_none=True)

        if not campos:
            raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualização.")

        if "tipo" in campos:
            campos["tipo"] = campos["tipo"].value

        campos["atualizado_em"] = datetime.now()
        ref.update(campos)

        return {"mensagem": "Serviço atualizado com sucesso!"}

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{servico_id}")
async def deletar_servico(servico_id: str):
    try:
        ref = db.collection("servicos").document(servico_id)
        doc = ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Serviço não encontrado.")

        ref.delete()

        return {"mensagem": "Serviço deletado com sucesso!"}

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))