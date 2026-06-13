# JamesBarber 💈

SISTEMA DE AGENDAMENTO PARA BARBEARIA

## TECNOLOGIAS

**Backend:** Python, FastAPI, Uvicorn
**Frontend:** Angular
**BD** Firebase

## PRÉ-REQUISITOS

- Python 3.14
- Node.js 22.15
- Angular CLI

## Backend

### 1. Instalar as dependências

cd backend
py -3.14 -m venv venv

cd app
pip install -r requirements.txt

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
http://localhost:8000/docs

## Frontend

cd frontend
npm install
ng serve --host 0.0.0.0
http://localhost:4200/
