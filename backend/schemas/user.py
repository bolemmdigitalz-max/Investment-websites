from marshmallow import Schema, fields
from marshmallow.decorators import post_load
from marshmallow.validate import Length, Range

from security import get_sha256


class UserSchema(Schema):
    account = fields.Str(required=True, validate=Length(min=1, max=80))
    category = fields.Int(required=True, validate=Range(min=0))
    password = fields.Str(required=True, validate=Length(min=1, max=80))

    @post_load
    def hash_password(self, data, **kwargs):
        data["password"] = get_sha256(data["password"])
        return data
