from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from google.cloud.firestore import FieldFilter
from typing import Literal

from google.cloud import firestore

from app.db.database import db
from app.models.clientes import ClienteCreate, JornadaUpdate
from app.utils.auth import obter_usuario_atual, requer_admin
from app.utils.cache import cache_barbeiros

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.get("/total")
async def total_clientes(current_user: dict = Depends(obter_usuario_atual)):
    try:
        query = db.collection("clientes")
        count_query = query.count()
        results = count_query.get()
        return {"total": results[0][0].value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def criar_cliente(dados: ClienteCreate):
    try:
        existente = db.collection("clientes").where(filter=FieldFilter("email", "==", dados.email)).get()
        
        if existente:
            raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")
        
        cadastro_cliente = db.collection("clientes").add({
            "nome": dados.nome,
            "email": dados.email,
            "telefone": dados.telefone,
            "status": "cliente",
            "funcao": None,
            "criado_em": datetime.now()
        })

        doc_ref = cadastro_cliente[1]
        novo_id = doc_ref.id

        return {
            "id": str(novo_id),
            "status": "Cliente cadastrado com sucesso!"
        }

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/")
async def listar_clientes(
    email: str | None = None,
    status: str | None = None,
    funcao: str | None = None,
    limit: int = 50,
    start_after: str | None = None,
    current_user: dict = Depends(obter_usuario_atual),
):
    try:
        # BLOQUEIO DE SEGURANÇA:
        # Se o usuário é apenas um "cliente", ele só pode buscar por barbeiros
        if current_user.get("status") == "cliente" and funcao != "barbeiro":
            raise HTTPException(status_code=403, detail="Acesso negado: Você não tem permissão para listar todos os usuários.")

        if funcao == "barbeiro" and not email and not status and not start_after:
            cached = cache_barbeiros.get("lista_barbeiros")
            if cached:
                return cached

        query = db.collection("clientes")
        if email:
            query = query.where(filter=FieldFilter("email", "==", email))
        if status:
            query = query.where(filter=FieldFilter("status", "==", status))
        if funcao:
            query = query.where(filter=FieldFilter("funcao", "==", funcao))

        query = query.order_by("criado_em", direction=firestore.Query.DESCENDING)

        if start_after:
            last_doc = db.collection("clientes").document(start_after).get()
            if last_doc.exists:
                query = query.start_after(last_doc)

        query = query.limit(limit)

        clientes = []
        for doc in query.stream():
            dados = doc.to_dict()
            clientes.append({
                "id": doc.id,
                "nome": dados.get("nome"),
                "email": dados.get("email"),
                "telefone": dados.get("telefone", ""),
                "status": dados.get("status"),
                "funcao": dados.get("funcao"),
                "jornada_inicio": dados.get("jornada_inicio"),
                "jornada_fim": dados.get("jornada_fim"),
                "almoco_inicio": dados.get("almoco_inicio"),
                "almoco_fim": dados.get("almoco_fim")
            })

        if funcao == "barbeiro" and not email and not status and not start_after:
            cache_barbeiros.set("lista_barbeiros", clientes)

        return clientes
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.patch("/{cliente_id}/promover")
async def promover_cliente(
    cliente_id: str,
    status: Literal["cliente", "funcionario", "admin"],
    funcao: Literal["barbeiro", "limpeza", "balcao"] | None = None,
    admin_user: dict = Depends(requer_admin)
):
    
    try:
        ref = db.collection("clientes").document(cliente_id)
        doc = ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")
        
        if status == "funcionario" and not funcao:
            raise HTTPException(status_code=400, detail="Informe a função do funcionário.")
        
        ref.update({
            "status": status,
            "funcao": funcao if status == "funcionario" else None
        })
        
        cache_barbeiros.clear()
        
        return {"mensagem": f"Usuário atualizado para {status} com sucesso!"}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{cliente_id}/jornada")
async def atualizar_jornada(
    cliente_id: str,
    dados: JornadaUpdate,
    admin_user: dict = Depends(requer_admin)
):
    try:
        ref = db.collection("clientes").document(cliente_id)
        doc = ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Cliente/Funcionário não encontrado.")
            
        usuario = doc.to_dict()
        if usuario.get("status") not in ["funcionario", "admin"]:
            raise HTTPException(status_code=400, detail="O usuário não é um funcionário.")

        atualizacao = {}
        if dados.jornada_inicio is not None: atualizacao["jornada_inicio"] = dados.jornada_inicio
        if dados.jornada_fim is not None: atualizacao["jornada_fim"] = dados.jornada_fim
        if dados.almoco_inicio is not None: atualizacao["almoco_inicio"] = dados.almoco_inicio
        if dados.almoco_fim is not None: atualizacao["almoco_fim"] = dados.almoco_fim

        if atualizacao:
            ref.update(atualizacao)

        cache_barbeiros.clear()

        return {"mensagem": "Jornada atualizada com sucesso!"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))