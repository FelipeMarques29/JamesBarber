from fastapi import APIRouter
from app.db.database import db

router = APIRouter(prefix="/servicos", tags=["Serviços"])

@router.get("/")
async def listar_servicos():
    docs = db.collection("servicos").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]