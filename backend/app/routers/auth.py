# routers/auth.py
from fastapi import APIRouter, HTTPException
from app.db.database import db
from app.models.auth import Login
from app.utils.hash import Hash
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
async def login(dados: Login):
    try:
        # 1. Busca na coleção de clientes
        query = db.collection("clientes").where(filter=FieldFilter("email", "==", dados.email)).stream()

        usuario = None
        for doc in query:
            usuario = doc.to_dict()
            usuario["id"] = doc.id

        # 2. Se não achou
        if not usuario:
            raise HTTPException(status_code=404, detail="E-mail não cadastrado")

        # 3. Valida a senha
        if not Hash.verificar_hash(dados.senha, usuario["senha"]):
            raise HTTPException(status_code=401, detail="Senha incorreta")

        # 4. Remove a senha do retorno
        usuario.pop("senha", None)

        return {
            "status": "Login realizado com sucesso",
            "tipo": usuario["status"],  # "cliente", "funcionario" ou "admin"
            "usuario": usuario
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))