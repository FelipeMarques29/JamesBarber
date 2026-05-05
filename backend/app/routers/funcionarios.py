from fastapi import APIRouter, HTTPException
from app.models.funcionarios import FuncionarioCreate, FuncionarioResponse
from app.database import db
from datetime import datetime

router = APIRouter(prefix="/funcionarios", tags=["Funcionários"])

@router.post("/", response_model=FuncionarioResponse)
async def cadastrar_funcionario(dados: FuncionarioCreate):
    try:
        existente = db.collection("funcionarios").where("funcionario_email", "==", dados.funcionario_email).get()
        if existente:
            raise HTTPException(status_code=400, detail="E-mail já cadastrado")
        
        novo_funcionario = db.collection("funcionarios").add({
            "funcionario_nome": dados.funcionario_nome,
            "funcionario_email": dados.funcionario_email,
            "funcionario_senha": dados.funcionario_senha,
            "funcionario_telefone": dados.funcionario_telefone,
            "funcionario_funcao": dados.funcionario_funcao, # Aqui vai 'barbeiro', 'limpeza' ou 'balcao'
            "ativo": True
        })
        return {"id": novo_funcionario[1].id, "status": "Funcionário cadastrado com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def listar():
    docs = db.collection("funcionarios").where("role", "==", "barbeiro").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]