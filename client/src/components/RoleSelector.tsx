import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { Shield, Users, User } from 'lucide-react';

/**
 * A component for displaying the current user role (admin, rescue team, or user).
 * The role is determined at login and cannot be manually changed.
 */
const RoleSelector = () => {
  const { userType, user } = useAuth();

  if (!user) {
    return null; // Don't show anything if user is not logged in
  }

  // Get the appropriate icon based on user role
  const RoleIcon = user.role === 'admin' 
    ? Shield 
    : user.role === 'rescue-team' 
      ? Users 
      : User;

  return (
    <div className="flex flex-col items-center">
      {/* Current logged in status */}
      <Card className="w-full max-w-xs mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              user.role === 'admin' 
                ? 'bg-red-100 text-destructive' 
                : user.role === 'rescue-team' 
                  ? 'bg-blue-100 text-secondary' 
                  : 'bg-gray-100 text-primary'
            }`}>
              <RoleIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{user.role === 'admin' ? 'Administrator' : user.role === 'rescue-team' ? 'Rescue Team' : 'User'}</p>
              <p className="text-sm text-muted-foreground">{user.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelector; 