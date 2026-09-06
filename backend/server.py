import json
import os
import threading
from datetime import datetime, timedelta, timezone
from http import HTTPStatus

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (JWTManager, create_access_token, get_jwt,
                                get_jwt_identity, jwt_required,
                                unset_jwt_cookies)
from marshmallow import ValidationError

from constants import GROUP_COLUMNS, GROUP_LABELS, MAX_INVESTMENT
from db import db
from models import DonationModel, UserModel
from schemas import DonationSchema, UserSchema
from security import get_sha256
from utils.parser import parse_personal_donation, parse_user_instances

donationSchema = DonationSchema()
userSchema = UserSchema()
admin_account = os.environ.get("ADMIN_ACCOUNT")

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
SQLALCHEMY_DATABASE_URI = os.environ.get("SQLALCHEMY_DATABASE_URI")
if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable must be set")
if not SQLALCHEMY_DATABASE_URI:
    raise RuntimeError("SQLALCHEMY_DATABASE_URI environment variable must be set")
if not admin_account:
    print("WARNING: ADMIN_ACCOUNT is not set; no account will have admin rights")

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}
jwt = JWTManager(app)
CORS(app)
db.init_app(app)

_tables_ready = False
_tables_lock = threading.Lock()


@app.before_request
def create_tables():
    """
    Lazily create the tables on the first request.

    Replaces ``before_first_request`` which was deprecated in Flask 2.2 and
    removed in Flask 2.3.
    """
    global _tables_ready
    if _tables_ready:
        return
    with _tables_lock:
        if not _tables_ready:
            db.create_all()
            _tables_ready = True


def is_admin(account) -> bool:
    return admin_account is not None and account == admin_account


@app.route('/api/token', methods=["POST"])
def create_token():
    '''
    Log in with account and password.
    If the user is authenticated, return the jwt token.
    '''
    try:
        payload = request.get_json(silent=True) or {}
        account = payload.get("account")
        password = payload.get("password")
        if not isinstance(account, str) or not isinstance(password, str):
            return {"msg": "Wrong account or password"}, HTTPStatus.UNAUTHORIZED

        user_instance = UserModel.find_by_account(account=account)
        if user_instance is None or get_sha256(password) != user_instance.password:
            return {"msg": "Wrong account or password"}, HTTPStatus.UNAUTHORIZED

        access_token = create_access_token(identity=account)
        return {"msg": "Success", "access_token": access_token}, HTTPStatus.OK
    except Exception as e:
        print(e)
        return {"msg": "Wrong account or password"}, HTTPStatus.UNAUTHORIZED


@app.route("/api/logout", methods=["POST"])
def logout():
    '''
    Log out API
    '''
    response = jsonify({"msg": "logout successful"})
    unset_jwt_cookies(response)
    return response


@app.route("/api/validate", methods=["POST"])
@jwt_required()
def validate_token():
    '''
    Check if the given user and jwt token are all authenticated.
    A token that is about to expire is transparently refreshed by
    ``refresh_expiring_jwts`` below.
    '''
    try:
        account = get_jwt_identity()
        if not UserModel.find_by_account(account=account):
            return {"msg": "Unknown account"}, HTTPStatus.FORBIDDEN
        return {"msg": "Success"}, HTTPStatus.OK

    except Exception as e:
        print(e)
        return {"msg": "Invalid"}, HTTPStatus.FORBIDDEN


@app.after_request
def refresh_expiring_jwts(response):
    '''
    Refresh a jwt token that is about to expire (< 30 minutes left) by
    attaching a new ``access_token`` to the JSON body of the response.
    '''
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
            data = response.get_json(silent=True)
            if type(data) is dict:
                data["access_token"] = access_token
                response.data = json.dumps(data)
        return response
    except (RuntimeError, KeyError):
        # Case where there is not a valid JWT. Just return the original respone
        return response


@app.route('/api/submit/donation', methods=['POST'])
@jwt_required()
def submit_donation_request():
    '''
    API to receive the donation request.
    '''
    try:
        account = get_jwt_identity()
        user_obj = UserModel.find_by_account(account=account)
        if user_obj is None:
            return {"msg": "Unknown account"}, HTTPStatus.FORBIDDEN

        formData = donationSchema.load(request.form)
        formData["account"] = account

        # A user is not allowed to invest in his/her own group.
        own_group = GROUP_COLUMNS.get(user_obj.category)
        if own_group is not None:
            formData[own_group] = 0

        accum = sum(formData[column] for column in GROUP_COLUMNS.values())
        if accum > MAX_INVESTMENT:
            return {"msg": f"Over {MAX_INVESTMENT}"}, HTTPStatus.FORBIDDEN

        donation_obj = DonationModel(**formData)
        donation_obj.save_to_db()

        return jsonify({
            "msg": "Submit successfully!",
            "task_id": donation_obj.submitUUID,
        }), HTTPStatus.OK

    except ValidationError as e:
        print(e)
        return jsonify({"msg": "Invalid donation value", "errors": e.messages}), \
            HTTPStatus.BAD_REQUEST

    except Exception as e:
        print(e)
        return jsonify({"msg": "Internal Server Error!"}), HTTPStatus.INTERNAL_SERVER_ERROR


@app.route('/api/dashboard/donation', methods=['GET'])
@jwt_required()
def get_donation_sum():
    '''
    API to get donation sum
    '''
    try:
        cum = {column: 0 for column in GROUP_COLUMNS.values()}

        for user_instance in UserModel.find_all_users():
            donation_object = DonationModel.find_latest_by_account(account=user_instance.account)
            if donation_object is None:
                continue
            for k, v in parse_personal_donation(donation_object).items():
                if k in cum:
                    cum[k] += v

        data = [
            {'name': GROUP_LABELS[group], 'dollars': cum[column]}
            for group, column in GROUP_COLUMNS.items()
        ]
        return jsonify({"msg": "Success", "data": data}), HTTPStatus.OK

    except Exception as e:
        print(e)
        return jsonify({"msg": "Internal Server Error!"}), HTTPStatus.INTERNAL_SERVER_ERROR


@app.route('/api/personal/donation', methods=['GET'])
@jwt_required()
def fetch_personal_donation():
    '''
    API to fetch the latest personal donation. Users that have not submitted
    anything yet get a record filled with zeros.
    '''
    try:
        account = get_jwt_identity()
        donation_object = DonationModel.find_latest_by_account(account=account)
        record = parse_personal_donation(donation_object)
        return jsonify({"msg": "Success", "record": record}), HTTPStatus.OK

    except Exception as e:
        print(e)
        return jsonify({"msg": "Internal Server Error!"}), HTTPStatus.INTERNAL_SERVER_ERROR


@app.route('/api/admin/createuser', methods=['POST'])
@jwt_required()
def create_user():
    '''
    Enable admin to create new user.
    '''
    try:
        account = get_jwt_identity()
        if not is_admin(account):
            return {"msg": "Not admin"}, HTTPStatus.FORBIDDEN

        formData = userSchema.load(request.form)
        if UserModel.find_by_account(account=formData["account"]) is not None:
            return {"msg": "Duplicated account"}, HTTPStatus.FORBIDDEN

        userObj = UserModel(**formData)
        userObj.save_to_db()
        return {"msg": "Success"}, HTTPStatus.OK

    except ValidationError as e:
        print(e)
        return {"msg": "Invalid user data", "errors": e.messages}, HTTPStatus.BAD_REQUEST

    except Exception as e:
        print(e)
        db.session.rollback()
        return {"msg": "Internal Server Error!"}, HTTPStatus.INTERNAL_SERVER_ERROR


def _change_password(user_account, new_password):
    if not user_account or not new_password:
        return {"msg": "Please provide account and password"}, HTTPStatus.BAD_REQUEST
    if UserModel.find_by_account(account=user_account) is None:
        return {"msg": "Does not exist"}, HTTPStatus.FORBIDDEN
    UserModel.reset_password(account=user_account, password=get_sha256(new_password))
    return {"msg": "Success"}, HTTPStatus.OK


@app.route('/api/admin/changepwd', methods=['POST'])
@jwt_required()
def change_user_password():
    '''
    Enable admin to change any user's password.
    '''
    try:
        account = get_jwt_identity()
        if not is_admin(account):
            return {"msg": "Not admin"}, HTTPStatus.FORBIDDEN
        return _change_password(request.form.get("account"), request.form.get("password"))

    except Exception as e:
        print(e)
        db.session.rollback()
        return {"msg": "Internal Server Error!"}, HTTPStatus.INTERNAL_SERVER_ERROR


@app.route('/api/admin/listuser', methods=['GET'])
@jwt_required()
def list_current_users():
    '''
    Enable admin to get a list of registered users.
    '''
    try:
        account = get_jwt_identity()
        if not is_admin(account):
            return {"msg": "Not admin"}, HTTPStatus.FORBIDDEN

        user_instances = UserModel.find_all_users()
        return {"currentUsers": parse_user_instances(user_instances)}, HTTPStatus.OK

    except Exception as e:
        print(e)
        return {"msg": "Internal Server Error!"}, HTTPStatus.INTERNAL_SERVER_ERROR


@app.route('/api/personal/listuser', methods=['GET'])
@jwt_required()
def list_current_users_personal():
    '''
    Enable self to get a list of him/herself.
    '''
    try:
        account = get_jwt_identity()
        user_instance = UserModel.find_by_account(account=account)
        if user_instance is None:
            return {"msg": "Unknown account"}, HTTPStatus.UNAUTHORIZED
        return {"currentUsers": parse_user_instances([user_instance])}, HTTPStatus.OK

    except Exception as e:
        print(e)
        return {"msg": "Internal Server Error!"}, HTTPStatus.INTERNAL_SERVER_ERROR


@app.route('/api/personal/changepwd', methods=['POST'])
@jwt_required()
def change_user_password_personal():
    '''
    Enable self to change his/her own password.
    '''
    try:
        account = get_jwt_identity()
        if not UserModel.find_by_account(account=account):
            return {"msg": "Unknown account"}, HTTPStatus.UNAUTHORIZED
        user_account = request.form.get("account")
        if user_account != account:
            return {"msg": "Not yourself"}, HTTPStatus.FORBIDDEN
        return _change_password(user_account, request.form.get("password"))

    except Exception as e:
        print(e)
        db.session.rollback()
        return {"msg": "Internal Server Error!"}, HTTPStatus.INTERNAL_SERVER_ERROR


@app.route('/api/admin/verify', methods=['GET'])
@jwt_required()
def is_user_admin():
    '''
    Return if the given account is admin or not.
    '''
    try:
        account = get_jwt_identity()
        if not is_admin(account):
            return {"msg": "Not admin", "isAdmin": False}, HTTPStatus.OK
        return {"msg": "Is admin", "isAdmin": True}, HTTPStatus.OK

    except Exception as e:
        print(e)
        return {"msg": "Internal Server Error!"}, HTTPStatus.INTERNAL_SERVER_ERROR


@app.route('/api/version', methods=['GET'])
def get_version():
    '''
    Return the api version
    '''
    return {"version": "v0.2.0"}, HTTPStatus.OK


if __name__ == '__main__':
    app.debug = False
    app.run(host="0.0.0.0", port=5000)
