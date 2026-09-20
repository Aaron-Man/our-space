// supabase/functions/manage-users/index.ts
// Edge Function for secure user management

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Verify the requester is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user has admin role (you can customize this logic)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      throw new Error('Not an admin')
    }

    const { action, email, password, userId } = await req.json()

    let result

    switch (action) {
      case 'list':
        // List all users
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        if (listError) throw listError
        
        // Get profiles for additional info
        const userIds = users.users.map(u => u.id)
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, display_name, email')
          .in('id', userIds)
        
        const usersWithProfiles = users.users.map(user => {
          const profile = profiles?.find(p => p.id === user.id)
          return {
            ...user,
            display_name: profile?.display_name || user.email?.split('@')[0] || '未命名',
          }
        })
        
        result = { users: usersWithProfiles }
        break

      case 'create':
        if (!email || !password) {
          throw new Error('Email and password are required')
        }
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        })
        
        if (createError) throw createError
        
        // Create profile for new user
        if (newUser.user) {
          await supabaseAdmin.from('profiles').insert({
            id: newUser.user.id,
            display_name: email.split('@')[0],
            is_admin: false,
          })
        }
        
        result = { user: newUser.user, message: 'User created successfully' }
        break

      case 'delete':
        if (!userId) {
          throw new Error('User ID is required')
        }
        
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteError) throw deleteError
        
        result = { message: 'User deleted successfully' }
        break

      case 'update':
        if (!userId) {
          throw new Error('User ID is required')
        }
        
        const updates: any = {}
        if (email) updates.email = email
        if (password) updates.password = password
        
        const { data: updatedUser, error: updateError } = 
          await supabaseAdmin.auth.admin.updateUserById(userId, updates)
        
        if (updateError) throw updateError
        
        result = { user: updatedUser.user, message: 'User updated successfully' }
        break

      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
