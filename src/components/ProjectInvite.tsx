
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectMember {
  id: string;
  email: string;
  role: string;
}

const ProjectInvite = () => {
  const { project } = useProject();
  const { user, session } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch existing project members when project changes
  useEffect(() => {
    if (!project || !user) return;
    
    const fetchMembers = async () => {
      setIsLoading(true);
      try {
        // Get project_users entries
        const { data: projectUsers, error } = await supabase
          .from('project_users')
          .select('user_id, role')
          .eq('project_id', project.id);
          
        if (error) throw error;
        
        if (!projectUsers || projectUsers.length === 0) {
          setMembers([]);
          return;
        }
        
        // For each project_user, get the associated profile data
        const memberPromises = projectUsers.map(async (pu) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', pu.user_id)
            .single();
            
          if (profileError && profileError.code !== 'PGSQL_ERROR') {
            console.error('Error fetching profile:', profileError);
          }
          
          // Get email from profiles or use fallback user ID
          let email = `${pu.user_id.substring(0, 8)}...`;
          
          if (profileData) {
            // If the profile exists, use first_name and last_name to create a display name
            const firstName = profileData.first_name || '';
            const lastName = profileData.last_name || '';
            const displayName = [firstName, lastName].filter(Boolean).join(' ');
            
            if (displayName) {
              email = displayName;
            }
          }
          
          // If this is the current user, add "(You)" to the email
          if (pu.user_id === user.id) {
            email += " (You)";
          }
          
          return {
            id: pu.user_id,
            email,
            role: pu.role
          };
        });
        
        const membersData = await Promise.all(memberPromises);
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching project members:', error);
        toast({
          title: 'Error',
          description: 'Failed to load team members',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMembers();
  }, [project, user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project || !user || !inviteEmail.trim() || !session) return;
    
    setIsInviting(true);
    try {
      // First, check if the user exists with this email
      const { data: userData, error: userError } = await supabase
        .rpc('find_user_id_by_email', { lookup_email: inviteEmail });
      
      if (userError) {
        throw new Error(userError.message || 'Failed to find user');
      }
      
      if (!userData) {
        throw new Error('User not found. Please ask them to sign up first.');
      }
      
      const userId = userData;
      
      // Check if user is already a member
      const isAlreadyMember = members.some(member => member.id === userId);
      if (isAlreadyMember) {
        throw new Error('This user is already a member of the project.');
      }
      
      // Add user to project_users
      const { error: inviteError } = await supabase
        .from('project_users')
        .insert({
          project_id: project.id,
          user_id: userId,
          role: 'member'
        });
      
      if (inviteError) throw inviteError;
      
      // Update members list
      setMembers([...members, { 
        id: userId, 
        email: inviteEmail, 
        role: 'member' 
      }]);
      
      toast({
        title: 'User invited',
        description: `${inviteEmail} has been added to this project.`,
      });
      
      setInviteEmail('');
    } catch (error: any) {
      console.error('Invitation error:', error);
      toast({
        title: 'Invitation failed',
        description: error.message || 'Failed to invite user',
        variant: 'destructive'
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!project || !user || !session) return;
    
    // Don't allow removing yourself
    if (memberId === user.id) {
      toast({
        title: 'Cannot remove yourself',
        description: 'You cannot remove yourself from the project.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Remove user from project_users
      const { error } = await supabase
        .from('project_users')
        .delete()
        .eq('project_id', project.id)
        .eq('user_id', memberId);
      
      if (error) throw error;
      
      // Update members list
      setMembers(members.filter(m => m.id !== memberId));
      
      toast({
        title: 'Member removed',
        description: `${memberEmail} has been removed from the project.`,
      });
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: 'Failed to remove member',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
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
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={isInviting || !inviteEmail.trim() || !session}
                className="bg-basement-blue-600 hover:bg-basement-blue-700"
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : <UserPlus className="h-4 w-4 mr-2" />}
                Invite
              </Button>
            </div>
          </div>
        </form>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Project Members</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : members.length > 0 ? (
            <ul className="space-y-2">
              {members.map(member => (
                <li key={member.id} className="flex items-center justify-between bg-muted/40 p-2 rounded-md">
                  <div>
                    <p className="text-sm font-medium">{member.email}</p>
                    <div className="flex items-center mt-1">
                      <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  {member.id !== user?.id && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveMember(member.id, member.email)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No other members yet. Invite someone to collaborate!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectInvite;
