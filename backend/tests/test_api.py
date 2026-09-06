from constants import GROUP_COLUMNS, MAX_INVESTMENT

ALL_GROUPS = list(GROUP_COLUMNS.values())


def full_form(amount=1000, **overrides):
    form = {column: str(amount) for column in ALL_GROUPS}
    form.update({k: str(v) for k, v in overrides.items()})
    return form


# --------------------------------------------------------------------------- auth

def test_version_is_public(client):
    assert client.get("/api/version").status_code == 200


def test_login_success(client):
    r = client.post("/api/token", json={"account": "root", "password": "root"})
    assert r.status_code == 200
    assert "access_token" in r.get_json()


def test_login_wrong_password(client):
    r = client.post("/api/token", json={"account": "root", "password": "nope"})
    assert r.status_code == 401


def test_login_unknown_user(client):
    r = client.post("/api/token", json={"account": "ghost", "password": "x"})
    assert r.status_code == 401


def test_login_garbage_body(client):
    assert client.post("/api/token", data="not json").status_code == 401
    assert client.post("/api/token", json={"account": ["a"], "password": 1}).status_code == 401


def test_protected_routes_require_token(client):
    for method, path in [
        ("post", "/api/validate"),
        ("post", "/api/submit/donation"),
        ("get", "/api/dashboard/donation"),
        ("get", "/api/personal/donation"),
        ("post", "/api/admin/createuser"),
        ("post", "/api/admin/changepwd"),
        ("get", "/api/admin/listuser"),
        ("get", "/api/personal/listuser"),
        ("post", "/api/personal/changepwd"),
        ("get", "/api/admin/verify"),
    ]:
        assert getattr(client, method)(path).status_code == 401, path


def test_validate(client, user_headers):
    assert client.post("/api/validate", headers=user_headers).status_code == 200


def test_admin_verify(client, admin_headers, user_headers):
    assert client.get("/api/admin/verify", headers=admin_headers).get_json()["isAdmin"] is True
    assert client.get("/api/admin/verify", headers=user_headers).get_json()["isAdmin"] is False


# ---------------------------------------------------------------------- donations

def test_personal_donation_before_any_submission_is_zero(client, user_headers):
    r = client.get("/api/personal/donation", headers=user_headers)
    assert r.status_code == 200
    assert r.get_json()["record"] == {column: 0 for column in ALL_GROUPS}


def test_submit_and_fetch_donation(client, user_headers):
    r = client.post("/api/submit/donation", data=full_form(1000), headers=user_headers)
    assert r.status_code == 200, r.get_data(as_text=True)

    record = client.get("/api/personal/donation", headers=user_headers).get_json()["record"]
    # user ``test`` belongs to group 1, so group_one is forced to 0
    assert record["group_one"] == 0
    assert all(record[c] == 1000 for c in ALL_GROUPS if c != "group_one")


def test_submit_partial_form_defaults_missing_groups_to_zero(client, alice_headers):
    r = client.post("/api/submit/donation", data={"group_one": "5"}, headers=alice_headers)
    assert r.status_code == 200, r.get_data(as_text=True)
    record = client.get("/api/personal/donation", headers=alice_headers).get_json()["record"]
    assert record["group_one"] == 5
    assert all(record[c] == 0 for c in ALL_GROUPS if c != "group_one")


def test_submit_over_max_is_rejected(client, user_headers):
    r = client.post("/api/submit/donation", data=full_form(0, group_two=MAX_INVESTMENT + 1),
                    headers=user_headers)
    assert r.status_code == 400  # single field exceeds range

    r = client.post("/api/submit/donation",
                    data=full_form(0, group_two=MAX_INVESTMENT, group_three=1),
                    headers=user_headers)
    assert r.status_code == 403  # total exceeds max


def test_submit_negative_is_rejected(client, user_headers):
    r = client.post("/api/submit/donation", data=full_form(0, group_two=-5000),
                    headers=user_headers)
    assert r.status_code == 400


def test_submit_non_integer_is_rejected(client, user_headers):
    r = client.post("/api/submit/donation", data=full_form(0, group_two="abc"),
                    headers=user_headers)
    assert r.status_code == 400


def test_dashboard_sums_latest_submission_per_user(client, user_headers, alice_headers):
    # first submission of ``test`` is superseded by the second one
    assert client.post("/api/submit/donation", data=full_form(0, group_three=999),
                       headers=user_headers).status_code == 200
    assert client.post("/api/submit/donation", data=full_form(0, group_three=100),
                       headers=user_headers).status_code == 200
    assert client.post("/api/submit/donation", data=full_form(0, group_three=50, group_one=7),
                       headers=alice_headers).status_code == 200

    r = client.get("/api/dashboard/donation", headers=user_headers)
    assert r.status_code == 200
    data = {item["name"]: item["dollars"] for item in r.get_json()["data"]}
    assert set(data) == {str(g) for g in GROUP_COLUMNS}
    assert data["3"] == 150
    assert data["1"] == 7
    assert data["2"] == 0


# -------------------------------------------------------------------------- admin

def test_admin_list_users(client, admin_headers, user_headers):
    r = client.get("/api/admin/listuser", headers=admin_headers)
    assert r.status_code == 200
    accounts = {u["account"] for u in r.get_json()["currentUsers"]}
    assert accounts == {"root", "test", "alice"}

    assert client.get("/api/admin/listuser", headers=user_headers).status_code == 403


def test_admin_create_user(client, admin_headers, user_headers):
    form = {"account": "bob", "category": "2", "password": "pw"}
    assert client.post("/api/admin/createuser", data=form, headers=admin_headers).status_code == 200
    assert client.post("/api/admin/createuser", data=form, headers=admin_headers).status_code == 403
    assert client.post("/api/admin/createuser", data={"account": "x"},
                       headers=admin_headers).status_code == 400
    assert client.post("/api/admin/createuser", data={**form, "account": "eve"},
                       headers=user_headers).status_code == 403

    # the new user can log in
    r = client.post("/api/token", json={"account": "bob", "password": "pw"})
    assert r.status_code == 200


def test_admin_change_password(client, admin_headers):
    r = client.post("/api/admin/changepwd", data={"account": "test", "password": "new"},
                    headers=admin_headers)
    assert r.status_code == 200

    def login(pw):
        return client.post("/api/token", json={"account": "test", "password": pw})

    assert login("new").status_code == 200
    assert login("test").status_code == 401

    r = client.post("/api/admin/changepwd", data={"account": "ghost", "password": "new"},
                    headers=admin_headers)
    assert r.status_code == 403

    r = client.post("/api/admin/changepwd", data={"account": "test"}, headers=admin_headers)
    assert r.status_code == 400


# ----------------------------------------------------------------------- personal

def test_personal_list_user(client, user_headers):
    r = client.get("/api/personal/listuser", headers=user_headers)
    assert r.status_code == 200
    assert r.get_json()["currentUsers"] == [{"account": "test", "group": 1}]


def test_personal_change_password(client, user_headers):
    other = client.post("/api/personal/changepwd", data={"account": "alice", "password": "h4x"},
                        headers=user_headers)
    assert other.status_code == 403

    mine = client.post("/api/personal/changepwd", data={"account": "test", "password": "test2"},
                       headers=user_headers)
    assert mine.status_code == 200
    relogin = client.post("/api/token", json={"account": "test", "password": "test2"})
    assert relogin.status_code == 200
