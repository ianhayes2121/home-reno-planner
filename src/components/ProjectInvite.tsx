
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProjectInvite = () => {
  const { project } = useProject();
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project || !user || !inviteEmail.trim()) return;
    
    setIsInviting(true);
    try {
      // For now, we'll just simulate success and 
      // inform the user that this feature is in development
      
      toast({
        title: 'Invitation sent',
        description: `An invitation was sent to ${inviteEmail}. Note: This is a simulated response as the invitation system is still in development.`,
      });
      
      setInviteEmail('');
    } catch (error: any) {
      toast({
        title: 'Invitation failed',
        description: error.message || 'Failed to invite user',
        variant: 'destructive'
      });
    } finally {
      setIsInviting(false);
    }
  };

  if (!project) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Collaboration</CardTitle>
        <CardDescription>
          Invite others to collaborate on this project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <div className="flex space-x-2">
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                disabled={isInviting || !inviteEmail.trim()}
                className="bg-basement-blue-600 hover:bg-basement-blue-700"
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Invite
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectInvite;
