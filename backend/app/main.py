from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import servicos
from app.routers import agendamentos
from app.routers import clientes
from app.routers import funcionarios


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
app.include_router(clientes.router)
app.include_router(funcionarios.router)
app.include_router(servicos.router)

@app.get("/")
def home():
    return {"message": "JamesBarber API está online!"}