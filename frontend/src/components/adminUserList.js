import ChangePasswordUserList from './ChangePasswordUserList';

export default function AdminUserList({ userlist, token }) {
  return (
    <ChangePasswordUserList
      userlist={userlist}
      token={token}
      endpoint="/api/admin/changepwd"
      title="User list"
    />
  );
}
