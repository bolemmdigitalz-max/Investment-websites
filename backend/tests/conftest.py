import os
import sys

import pytest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Must be configured before ``server`` is imported.
os.environ.setdefault("JWT_SECRET_KEY", "unit-test-secret-key-that-is-long-enough")
os.environ.setdefault("SQLALCHEMY_DATABASE_URI", "sqlite://")
os.environ.setdefault("ADMIN_ACCOUNT", "root")

import server  # noqa: E402
from models import UserModel  # noqa: E402
from security import get_sha256  # noqa: E402


@pytest.fixture()
def app():
    server.app.config.update(TESTING=True)
    with server.app.app_context():
        server.db.drop_all()
        server.db.create_all()
        server.db.session.add(UserModel("root", 0, get_sha256("root")))
        server.db.session.add(UserModel("test", 1, get_sha256("test")))
        server.db.session.add(UserModel("alice", 2, get_sha256("alice")))
        server.db.session.commit()
        yield server.app
        server.db.session.remove()
        server.db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def _login(client, account, password):
    response = client.post("/api/token", json={"account": account, "password": password})
    assert response.status_code == 200, response.get_data(as_text=True)
    return {"Authorization": "Bearer " + response.get_json()["access_token"]}


@pytest.fixture()
def admin_headers(client):
    return _login(client, "root", "root")


@pytest.fixture()
def user_headers(client):
    return _login(client, "test", "test")


@pytest.fixture()
def alice_headers(client):
    return _login(client, "alice", "alice")
