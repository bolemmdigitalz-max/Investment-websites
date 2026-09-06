from constants import GROUP_COLUMNS


def parse_personal_donation(donation_instance):
    """
    Turn a ``DonationModel`` into a ``{column: amount}`` dict.
    ``None`` (user has not submitted yet) yields an all-zero record.
    """
    response = {}
    for column in GROUP_COLUMNS.values():
        value = getattr(donation_instance, column, None) if donation_instance else None
        response[column] = int(value) if value is not None else 0
    return response


def parse_list_to_value_label_form(list_of_item: list):
    output = []
    for item in list_of_item:
        output.append({"value": item, "label": item})
    return output


def parse_user_instances(user_instances):
    response = []
    for user_instance in user_instances:
        response.append(parse_user_instance(user_instance))
    return response


def parse_user_instance(user_instance):
    response = {}
    response['account'] = user_instance.account
    response['group'] = user_instance.category
    return response
