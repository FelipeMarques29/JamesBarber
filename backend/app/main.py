from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import servicos
from app.routers import agendamentos
from app.routers import clientes
from app.routers import auth
from app.routers import admin


app = FastAPI(title="JamesBarber API")

#liberacao do cors para o angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agendamentos.router)
app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(servicos.router)
app.include_router(admin.router)

@app.get("/")
def home():
    return {"message": "JamesBarber API está online!"}

"""
Backend
python -m venv venv 
ou 
py -3.11 -m venv venv (-3.11 seria a sua versao do python. Esse projeto está com a 3.14.2)
pip install -r requirements.txt

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
http://localhost:8000/docs

Frontend
ng serve --host 0.0.0.0
"""