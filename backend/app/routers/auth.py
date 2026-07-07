# routers/auth.py
import secrets
import string

from fastapi import APIRouter, HTTPException
from app.db.database import db
from app.models.auth import LoginRequest, RecuperarSenha
from app.utils.hash import Hash
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/auth", tags=["Auth"])


def _gerar_senha_temporaria(tamanho: int = 10) -> str:
    alfabeto = string.ascii_letters + string.digits
    return "".join(secrets.choice(alfabeto) for _ in range(tamanho))

@router.post("/login")
async def login(dados: LoginRequest):
    try:
        # Firebase Auth já validou a senha no frontend
        # backend só busca o perfil
        query = db.collection("clientes").where(
            filter=FieldFilter("email", "==", dados.email)
        ).get()

        if not query:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        doc = query[0]
        dados_usuario = doc.to_dict()

        return {
            "status": "ok",
            "tipo": dados_usuario.get("status"),
            "usuario": {
                "id": doc.id,
                "nome": dados_usuario.get("nome"),
                "email": dados_usuario.get("email"),
                "telefone": dados_usuario.get("telefone"),
                "status": dados_usuario.get("status"),
                "funcao": dados_usuario.get("funcao"),
            }
        }

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recuperar-senha")
async def recuperar_senha(dados: RecuperarSenha):
    try:
        query = db.collection("clientes").where(
            filter=FieldFilter("email", "==", dados.email)
        ).stream()

        doc_ref = None
        for doc in query:
            doc_ref = doc.reference
            break

        if doc_ref is None:
            raise HTTPException(status_code=404, detail="E-mail não cadastrado")

        senha_temporaria = _gerar_senha_temporaria()
        doc_ref.update({"senha": Hash.gerar_hash(senha_temporaria)})

        return {
            "status": "Senha temporária gerada com sucesso",
            "senha_temporaria": senha_temporaria,
            "mensagem": "Use esta senha para entrar e troque-a em seguida."
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))