
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
      // First, let's check if the user exists
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', inviteEmail)
        .single();

      if (userError) {
        // User doesn't exist, we'll need to create an invitation
        // For now, we'll show a message - in a real app you'd send an email
        toast({
          title: 'User not found',
          description: 'We can\'t find a user with that email. Please ask them to sign up first.',
          variant: 'destructive'
        });
        return;
      }

      // Check if invitation already exists
      const { data: existingInvite, error: existingInviteError } = await supabase
        .from('project_users')
        .select('id')
        .eq('project_id', project.id)
        .eq('user_id', userData.id)
        .single();

      if (!existingInviteError && existingInvite) {
        toast({
          title: 'Already invited',
          description: 'This user already has access to this project.',
          variant: 'destructive'
        });
        return;
      }

      // Add the user to the project
      const { error } = await supabase
        .from('project_users')
        .insert({
          project_id: project.id,
          user_id: userData.id,
          role: 'member'
        });

      if (error) {
        console.error('Error inviting user:', error);
        throw error;
      }

      toast({
        title: 'User invited',
        description: `${inviteEmail} has been invited to this project.`,
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
