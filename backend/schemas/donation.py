from marshmallow import Schema, fields
from marshmallow.decorators import post_load
from marshmallow.validate import Range

from constants import MAX_INVESTMENT
from security import get_uuid


def _amount():
    # ``load_default`` fills in missing form fields with 0 so that a partial
    # form never violates the NOT NULL constraints of the donation table.
    # ``Range`` rejects negative values that would otherwise inflate the
    # remaining budget of a user.
    return fields.Int(load_default=0, validate=Range(min=0, max=MAX_INVESTMENT))


class DonationSchema(Schema):
    group_one = _amount()
    group_two = _amount()
    group_three = _amount()
    group_four = _amount()
    group_five = _amount()
    group_six = _amount()
    group_seven = _amount()
    group_nine = _amount()
    group_ten = _amount()
    group_eleven = _amount()
    group_twelve = _amount()
    group_thirteen = _amount()

    @post_load
    def add_uuid(self, data, **kwargs):
        data["submitUUID"] = get_uuid()
        return data
