from datetime import datetime, timedelta, timezone

import pytest

from app.routers.agendamentos import validar_conclusao_agendamento


def test_admin_pode_concluir_agendamento_no_mesmo_dia():
    agora = datetime(2026, 7, 31, 15, 0, tzinfo=timezone.utc)
    agendamento = {"data_hora": datetime(2026, 7, 31, 14, 0, tzinfo=timezone.utc)}
    usuario = {"status": "admin"}

    validar_conclusao_agendamento(usuario, agendamento, agora=agora)


def test_nao_admin_nao_pode_concluir_agendamento():
    agora = datetime(2026, 7, 31, 15, 0, tzinfo=timezone.utc)
    agendamento = {"data_hora": datetime(2026, 7, 31, 14, 0, tzinfo=timezone.utc)}
    usuario = {"status": "funcionario"}

    with pytest.raises(Exception):
        validar_conclusao_agendamento(usuario, agendamento, agora=agora)


def test_admin_nao_pode_concluir_agendamento_em_outro_dia():
    agora = datetime(2026, 7, 31, 15, 0, tzinfo=timezone.utc)
    agendamento = {"data_hora": datetime(2026, 8, 1, 14, 0, tzinfo=timezone.utc)}
    usuario = {"status": "admin"}

    with pytest.raises(Exception):
        validar_conclusao_agendamento(usuario, agendamento, agora=agora)
