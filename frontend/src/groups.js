// The investable groups. NOTE: there is intentionally no group eight.
// `key` must match the column names used by the backend API.
const GROUPS = [
  { key: "group_one", number: 1, label: "Group one" },
  { key: "group_two", number: 2, label: "Group two" },
  { key: "group_three", number: 3, label: "Group three" },
  { key: "group_four", number: 4, label: "Group four" },
  { key: "group_five", number: 5, label: "Group five" },
  { key: "group_six", number: 6, label: "Group six" },
  { key: "group_seven", number: 7, label: "Group seven" },
  { key: "group_nine", number: 9, label: "Group nine" },
  { key: "group_ten", number: 10, label: "Group ten" },
  { key: "group_eleven", number: 11, label: "Group eleven" },
  { key: "group_twelve", number: 12, label: "Group twelve" },
  { key: "group_thirteen", number: 13, label: "Group thirteen" },
];

export function emptyAmounts() {
  return Object.fromEntries(GROUPS.map((g) => [g.key, 0]));
}

export function toInt(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
}

export function sumAmounts(amounts) {
  return GROUPS.reduce((sum, g) => sum + toInt(amounts[g.key]), 0);
}

export default GROUPS;
