import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Trash2, UserPlus, AlertCircle, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectMember {
  id: string;
  email: string;
  role: string;
  isPending?: boolean;
}

const ProjectInvite = () => {
  const { project } = useProject();
  const { user, session } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing project members when project changes
  useEffect(() => {
    if (!project || !user) return;
    
    const fetchMembers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get project_users entries
        const { data: projectUsers, error } = await supabase
          .from('project_users')
          .select('user_id, role, is_pending')
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
            
          if (profileError) {
            console.log(`Error fetching profile for user ${pu.user_id}:`, profileError);
          }
          
          // Get email from user auth data or use fallback user ID
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
            role: pu.role,
            isPending: pu.is_pending
          };
        });
        
        const membersData = await Promise.all(memberPromises);
        setMembers(membersData);
      } catch (error: any) {
        console.error('Error fetching project members:', error);
        setError('Failed to load team members');
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
    
    if (!project || !user || !inviteEmail.trim() || !session) {
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'You must be logged in to invite users.',
          variant: 'destructive'
        });
      }
      return;
    }
    
    setIsInviting(true);
    setError(null);
    try {
      const inviteEmailTrimmed = inviteEmail.trim();
      console.log(`Attempting to invite user with email: ${inviteEmailTrimmed}`);
      
      // Make the request to the edge function with project ID for context
      const response = await fetch(`https://riefbexhwazkcnlpxmyo.supabase.co/functions/v1/getUserByEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          email: inviteEmailTrimmed,
          inviteToProjectId: project.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error from getUserByEmail function:', errorData);
        
        if (response.status === 401) {
          throw new Error('Authentication error. Please log out and back in.');
        } else {
          throw new Error(errorData.error || 'Failed to process invitation');
        }
      }
      
      const data = await response.json();
      const userId = data.id;
      const isNewUser = data.isNewUser;
      
      if (!userId) {
        throw new Error('User ID not returned from lookup');
      }
      
      console.log(`User found/created with ID: ${userId}, isNewUser: ${isNewUser}`);
      
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
          role: 'member',
          is_pending: isNewUser
        });
      
      if (inviteError) throw inviteError;
      
      // Add a new member to the list
      setMembers([...members, { 
        id: userId, 
        email: inviteEmailTrimmed,  // We'll display the email until they set up their profile
        role: 'member',
        isPending: isNewUser
      }]);
      
      toast({
        title: isNewUser ? 'Invitation sent' : 'User added',
        description: isNewUser 
          ? `An invitation email has been sent to ${inviteEmailTrimmed}`
          : `${inviteEmailTrimmed} has been added to this project`,
      });
      
      setInviteEmail('');
    } catch (error: any) {
      console.error('Invitation error:', error);
      setError(error.message || 'Failed to invite user');
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
                disabled={isInviting}
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
            {error && (
              <div className="mt-2 flex items-center text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </form>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Project Members</h3>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ) : members.length > 0 ? (
            <ul className="space-y-2">
              {members.map(member => (
                <li key={member.id} className="flex items-center justify-between bg-muted/40 p-2 rounded-md">
                  <div>
                    <p className="text-sm font-medium">{member.email}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="text-xs">
                        {member.role}
                      </Badge>
                      {member.isPending && (
                        <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                          <Mail className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
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
            <div className="text-center py-6 bg-muted/30 rounded-md">
              <p className="text-sm text-muted-foreground">No other members yet. Invite someone to collaborate!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectInvite;
