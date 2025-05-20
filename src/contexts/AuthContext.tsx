import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';

// Define the profile type
interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null; // Add profile to the context type
  loading: boolean;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile data
  const fetchProfile = async (userId: string) => {
    try {
      console.log(`Fetching profile for user: ${userId}`);
      
      // First try to get the profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Only try to create a profile if it doesn't exist
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating one...');
          
          // Insert a new profile with the user ID
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              first_name: '',
              last_name: '',
              avatar_url: null,
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating profile:', createError);
            toast({
              title: 'Profile Error',
              description: 'Failed to create your profile. You may need to log out and back in.',
              variant: 'destructive',
            });
            return;
          }
          
          console.log('Profile created successfully');
          setProfile(newProfile as Profile);
          return;
        }
        
        // Handle other errors
        console.error('Error fetching profile:', error);
        toast({
          title: 'Profile Error',
          description: 'Could not retrieve your profile information',
          variant: 'destructive',
        });
        return;
      }

      // If profile exists, set it
      if (data) {
        console.log('Profile loaded successfully');
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      toast({
        title: 'Profile Error',
        description: 'An unexpected error occurred while loading your profile',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sessionData) => {
        console.log('Auth state changed:', event);
        setSession(sessionData);
        setUser(sessionData?.user ?? null);
        
        // Fetch profile when user signs in
        if (sessionData?.user) {
          // Use setTimeout to avoid potential auth state deadlocks
          setTimeout(() => {
            fetchProfile(sessionData.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        if (event === 'SIGNED_IN') {
          toast({
            title: 'Signed in successfully',
            description: 'Welcome back!',
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: 'Signed out successfully',
            description: 'You have been logged out.',
          });
        } else if (event === 'USER_UPDATED') {
          toast({
            title: 'Profile updated',
            description: 'Your profile has been updated successfully.',
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: sessionData } }) => {
      setSession(sessionData);
      setUser(sessionData?.user ?? null);
      
      // Fetch profile for existing session
      if (sessionData?.user) {
        fetchProfile(sessionData.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          // Auto-confirm emails for development - makes signup easier
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: 'Signup failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        toast({
          title: 'Signup successful',
          description: 'Please check your email to confirm your account.',
        });
      } else {
        toast({
          title: 'Signup successful',
          description: 'Your account has been created successfully.',
        });
      }

      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: 'Signup failed',
        description: authError.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      return { error: authError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Special handling for unconfirmed emails
        if (error.message.toLowerCase().includes('email not confirmed')) {
          toast({
            title: 'Email not confirmed',
            description: 'Please check your inbox and confirm your email before logging in.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Login failed',
            description: error.message,
            variant: 'destructive',
          });
        }
        return { error };
      }

      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: 'Login failed',
        description: authError.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      return { error: authError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: 'Password reset failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Password reset email sent',
        description: 'Check your email for the password reset link.',
      });

      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: 'Password reset failed',
        description: authError.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      return { error: authError };
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
