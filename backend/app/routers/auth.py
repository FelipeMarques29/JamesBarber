# routers/auth.py
import hashlib
import math
import secrets
import string
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as firebase_auth
from app.db.database import db
from app.models.auth import LoginRequest, RecuperarSenha, RedefinirSenha
from google.cloud.firestore_v1.base_query import FieldFilter

security = HTTPBearer()

router = APIRouter(prefix="/auth", tags=["Auth"])

# Intervalo mínimo entre solicitações de recuperação de senha (5 minutos).
INTERVALO_RECUPERACAO_SENHA = 5 * 60
# Coleção que guarda o horário da última solicitação por (e-mail + dispositivo).
COLECAO_LIMITE_RECUPERACAO = "recuperacao_senha_limites"


def _gerar_senha_temporaria(tamanho: int = 10) -> str:
    alfabeto = string.ascii_letters + string.digits
    return "".join(secrets.choice(alfabeto) for _ in range(tamanho))


def _chave_limite(email: str, device_id: str | None) -> str:
    """ID determinístico e seguro para o Firestore a partir de e-mail + dispositivo."""
    base = f"{email.strip().lower()}|{device_id or 'sem-dispositivo'}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()

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
                # True quando a senha atual é temporária e precisa ser trocada.
                "deve_trocar_senha": bool(dados_usuario.get("deve_trocar_senha", False)),
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

        doc = None
        for item in query:
            doc = item
            break

        if doc is None:
            raise HTTPException(status_code=404, detail="E-mail não cadastrado")

        agora = datetime.now(timezone.utc)

        # Controle de 5 minutos por (e-mail + dispositivo), persistido no banco.
        limite_ref = db.collection(COLECAO_LIMITE_RECUPERACAO).document(
            _chave_limite(dados.email, dados.device_id)
        )
        limite_doc = limite_ref.get()
        if limite_doc.exists:
            ultima = limite_doc.to_dict().get("ultima_recuperacao_senha")
            if ultima is not None:
                # Firestore devolve datetimes tz-aware; garante comparação segura.
                if ultima.tzinfo is None:
                    ultima = ultima.replace(tzinfo=timezone.utc)
                decorrido = (agora - ultima).total_seconds()
                if decorrido < INTERVALO_RECUPERACAO_SENHA:
                    segundos_restantes = math.ceil(INTERVALO_RECUPERACAO_SENHA - decorrido)
                    raise HTTPException(
                        status_code=429,
                        detail=(
                            "Aguarde antes de solicitar uma nova senha. "
                            f"Tente novamente em {segundos_restantes} segundos."
                        ),
                        headers={"Retry-After": str(segundos_restantes)},
                    )

        senha_temporaria = _gerar_senha_temporaria()

        # A senha de login é gerenciada pelo Firebase Auth (não pelo Firestore),
        # então a nova senha temporária precisa ser aplicada lá para valer no login.
        try:
            usuario_auth = firebase_auth.get_user_by_email(dados.email)
            firebase_auth.update_user(usuario_auth.uid, password=senha_temporaria)
        except firebase_auth.UserNotFoundError:
            raise HTTPException(status_code=404, detail="E-mail não cadastrado")

        # Marca que a senha atual é temporária: no próximo login o usuário
        # será levado à tela para definir uma nova senha.
        doc.reference.update({"deve_trocar_senha": True})

        # Registra o horário desta solicitação por (e-mail + dispositivo).
        limite_ref.set({
            "email": dados.email,
            "device_id": dados.device_id,
            "ultima_recuperacao_senha": agora,
        })

        return {
            "status": "Senha temporária gerada com sucesso",
            "senha_temporaria": senha_temporaria,
            "mensagem": "Use esta senha para entrar e troque-a em seguida."
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/redefinir-senha")
async def redefinir_senha(
    dados: RedefinirSenha,
    credenciais: HTTPAuthorizationCredentials = Depends(security),
):
    """Define a nova senha do usuário autenticado (após entrar com a temporária)."""
    try:
        try:
            decoded = firebase_auth.verify_id_token(credenciais.credentials)
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido ou expirado.")

        uid = decoded.get("uid")
        email = decoded.get("email")
        if not uid or not email:
            raise HTTPException(status_code=401, detail="Token sem usuário associado.")

        # Aplica a nova senha no Firebase Auth (fonte de verdade do login).
        firebase_auth.update_user(uid, password=dados.nova_senha)

        # Remove a marcação de senha temporária no perfil do Firestore.
        query = db.collection("clientes").where(
            filter=FieldFilter("email", "==", email)
        ).stream()
        for doc in query:
            doc.reference.update({"deve_trocar_senha": False})
            break

        return {"status": "Senha redefinida com sucesso"}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))