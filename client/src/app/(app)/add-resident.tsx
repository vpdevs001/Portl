import { InviteMembersScreen } from '@/features/invite/components/InviteMembersScreen';
import { RoleGate } from '@/components/RoleGate';

export default function AddResidentRoute() {
  return (
    <RoleGate roles={['society_admin']}>
      <InviteMembersScreen variant="app" />
    </RoleGate>
  );
}
