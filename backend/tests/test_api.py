from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_ai_suggestions():
    response = client.post(
        "/api/ai/suggest",
        params={"title": "Deploy TaskPilot on AWS"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "mock"
    assert len(body["subtasks"]) == 3
