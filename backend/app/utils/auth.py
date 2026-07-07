from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from google.cloud.firestore import FieldFilter

from app.db.database import db

security = HTTPBearer()

def verificar_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        # firebase_admin valida a assinatura do JWT (Google) e sua expiração
        decoded_token = auth.verify_id_token(token)
        
        # Obriga que o e-mail esteja verificado no Firebase Auth
        if not decoded_token.get("email_verified"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="E-mail não verificado. Por favor, verifique seu e-mail para acessar o sistema.",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return decoded_token
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido ou expirado. Erro: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def obter_usuario_atual(decoded_token: dict = Depends(verificar_token)) -> dict:
    email = decoded_token.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sem e-mail associado."
        )
    
    query = db.collection("clientes").where(filter=FieldFilter("email", "==", email)).get()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não cadastrado no banco de dados do JamesBarber."
        )
        
    usuario = query[0].to_dict()
    usuario["id"] = query[0].id
    return usuario

def requer_funcionario(usuario: dict = Depends(obter_usuario_atual)) -> dict:
    status_usuario = usuario.get("status")
    if status_usuario not in ["funcionario", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: Requer privilégios de Funcionário ou Admin."
        )
    return usuario

def requer_admin(usuario: dict = Depends(obter_usuario_atual)) -> dict:
    if usuario.get("status") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: Requer privilégios de Administrador."
        )
    return usuario
