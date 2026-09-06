import ChangePasswordUserList from './ChangePasswordUserList';

export default function UserList({ userlist, token }) {
  return (
    <ChangePasswordUserList
      userlist={userlist}
      token={token}
      endpoint="/api/personal/changepwd"
      title="My account"
      accountPrefix="ID "
    />
  );
}
