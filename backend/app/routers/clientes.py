from app.db.database import db
from datetime import datetime
from fastapi import APIRouter, HTTPException
from google.cloud.firestore import FieldFilter
from typing import Literal

from app.models.clientes import ClienteCreate
from app.utils.hash import Hash

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.post("/")
async def criar_cliente(dados: ClienteCreate):
    try:
        senha_cripto = Hash.gerar_hash(dados.senha)
        existente = db.collection("clientes").where(filter=FieldFilter("cliente_email", "==", dados.email)).get()
        
        if existente:
            raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")
        
        cadastro_cliente = db.collection("clientes").add({
            "nome": dados.nome,
            "email": dados.email,
            "senha": senha_cripto,
            "telefone": dados.telefone,
            "status": "cliente",
            "funcao": None,
            "criado_em": datetime.now()
        })
        doc_ref = cadastro_cliente[1] 
        novo_id = doc_ref.id

        # 3. Retorna um dicionário puro
        return {
            "id": str(novo_id), 
            "status": "Cliente Cadastrado com sucesso!"
        }
    
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/")
async def listar_clientes(
    email: str | None = None,
    status: str | None = None,
    funcao: str | None = None,
):
    try:
        query = db.collection("clientes")
        if email:
            query = query.where(filter=FieldFilter("email", "==", email))
        if status:
            query = query.where(filter=FieldFilter("status", "==", status))
        if funcao:
            query = query.where(filter=FieldFilter("funcao", "==", funcao))

        clientes = []
        for doc in query.stream():
            dados = doc.to_dict()
            clientes.append({
                "id": doc.id,
                "nome": dados.get("nome"),
                "email": dados.get("email"),
                "status": dados.get("status"),
                "funcao": dados.get("funcao")
            })
        return clientes
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.patch("/{cliente_id}/promover")
async def promover_cliente(
    cliente_id: str,
    status: Literal["cliente", "funcionario", "admin"],
    funcao: Literal["barbeiro", "limpeza", "balcao"] | None = None ):
    
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
        
        return {"mensagem": f"Usuário atualizado para {status} com sucesso!"}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))