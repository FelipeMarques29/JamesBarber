from fastapi import APIRouter, HTTPException
from app.database import db
from datetime import datetime

from app.models.clientes import CadastroCliente, ClienteLogin
from app.utils.hash import Hash

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.post("/")
async def criar_cliente(dados: CadastroCliente):
    try:
        senha_cripto = Hash.gerar_hash(dados.cliente_senha)
        existente = db.collection("clientes").where("cliente_email", "==", dados.cliente_email).get()
        
        if existente:
            raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")
        
        cadastro_cliente = db.collection("clientes").add({
            "cliente_nome": dados.cliente_nome,
            "cliente_telefone": dados.cliente_telefone,
            "cliente_email": dados.cliente_email,
            "cliente_senha": senha_cripto,
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

@router.post("/login")
async def login_cliente(dados: ClienteLogin):
    try:
        query = db.collection("clientes").where("cliente_email", "==", dados.cliente_email).stream()
        
        cliente_encontrado = None
        for doc in query:
            cliente_encontrado = doc.to_dict()
            cliente_encontrado["id"] = doc.id
            
        if not cliente_encontrado:
            raise HTTPException(status_code=404, detail="Email não cadastrado")

        if not Hash.verificar_hash(dados.cliente_senha, cliente_encontrado["cliente_senha"]):
            raise HTTPException(status_code=401, detail="Senha incorreta")
        
        cliente_encontrado["cliente_senha"]
        return {"status": "Login realizado com sucessom", "cliente:": cliente_encontrado}
    
    except HTTPException as e:
            raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))