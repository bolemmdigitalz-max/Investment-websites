"""Shared constants for the investment backend."""

# Maximum total amount a single user may invest.
MAX_INVESTMENT = 20000000

# Mapping of group number -> donation column name.
# NOTE: there is intentionally no group eight.
GROUP_COLUMNS = {
    1: 'group_one',
    2: 'group_two',
    3: 'group_three',
    4: 'group_four',
    5: 'group_five',
    6: 'group_six',
    7: 'group_seven',
    9: 'group_nine',
    10: 'group_ten',
    11: 'group_eleven',
    12: 'group_twelve',
    13: 'group_thirteen',
}

# Mapping of group number -> label shown on the dashboard.
GROUP_LABELS = {group: str(group) for group in GROUP_COLUMNS}
