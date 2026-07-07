# routers/admin.py
import io
import json
import zipfile
import requests

from datetime import datetime, date
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Any
from pydantic import BaseModel, HttpUrl

from app.utils.auth import requer_admin
from app.db.database import db


router = APIRouter(prefix="/admin", tags=["Admin"])

COLECOES_EXPORT = ["clientes", "servicos", "agendamentos"]
COLECAO_IMPORTADOS = "dados_importados"


class ImportarRequest(BaseModel):
    url: HttpUrl


def _serializavel(valor: Any) -> Any:
    if isinstance(valor, (datetime, date)):
        return valor.isoformat()
    if isinstance(valor, dict):
        return {k: _serializavel(v) for k, v in valor.items()}
    if isinstance(valor, list):
        return [_serializavel(v) for v in valor]
    if hasattr(valor, "isoformat"):
        return valor.isoformat()
    return valor


def _exportar_colecao(nome: str) -> list[dict]:
    docs = db.collection(nome).stream()
    saida: list[dict] = []
    for doc in docs:
        dados = doc.to_dict() or {}
        if nome == "clientes":
            dados.pop("senha", None)
        dados["id"] = doc.id
        saida.append(_serializavel(dados))
    return saida


@router.get("/exportar")
async def exportar_dados(admin_user: dict = Depends(requer_admin)):
    try:
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for nome in COLECOES_EXPORT:
                conteudo = json.dumps(
                    _exportar_colecao(nome),
                    ensure_ascii=False,
                    indent=2,
                )
                zf.writestr(f"{nome}.json", conteudo)

        buffer.seek(0)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        return StreamingResponse(
            buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="jamesbarber-export-{timestamp}.zip"'
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao exportar: {e}")


@router.post("/importar")
async def importar_dados(dados: ImportarRequest, admin_user: dict = Depends(requer_admin)):
    try:
        resp = requests.get(str(dados.url), timeout=15)
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Falha ao acessar URL: {e}")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail=f"URL retornou status {resp.status_code}",
        )

    try:
        payload = resp.json()
    except ValueError:
        raise HTTPException(status_code=400, detail="Conteúdo da URL não é JSON válido")

    itens = payload if isinstance(payload, list) else [payload]

    batch = db.batch()
    importados: list[dict] = []
    importado_em = datetime.now().isoformat()
    origem = str(dados.url)

    for item in itens:
        if not isinstance(item, dict):
            item = {"valor": item}
        registro = {
            **item,
            "_origem": origem,
            "_importado_em": importado_em,
        }
        ref = db.collection(COLECAO_IMPORTADOS).document()
        batch.set(ref, registro)
        importados.append({"id": ref.id, **registro})

    batch.commit()

    return {
        "status": "ok",
        "total": len(importados),
        "itens": importados,
    }


@router.get("/importados")
async def listar_importados(admin_user: dict = Depends(requer_admin)):
    try:
        docs = db.collection(COLECAO_IMPORTADOS).stream()
        saida: list[dict] = []
        for doc in docs:
            d = doc.to_dict() or {}
            d["id"] = doc.id
            saida.append(_serializavel(d))
        return saida
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/importados")
async def limpar_importados(admin_user: dict = Depends(requer_admin)):
    try:
        docs = list(db.collection(COLECAO_IMPORTADOS).stream())
        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        if docs:
            batch.commit()
        return {"status": "ok", "deletados": len(docs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
