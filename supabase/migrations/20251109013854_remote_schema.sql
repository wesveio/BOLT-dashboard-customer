drop extension if exists "pg_net";

revoke delete on table "customer"."accounts" from "service_role";

revoke insert on table "customer"."accounts" from "service_role";

revoke references on table "customer"."accounts" from "service_role";

revoke select on table "customer"."accounts" from "service_role";

revoke trigger on table "customer"."accounts" from "service_role";

revoke truncate on table "customer"."accounts" from "service_role";

revoke update on table "customer"."accounts" from "service_role";

drop view if exists "dashboard"."accounts";

drop function if exists "dashboard"."create_account"(p_vtex_account_name text, p_company_name text, p_plan_type text, p_status text);

drop function if exists "dashboard"."delete_account"(p_account_id uuid);

drop function if exists "dashboard"."get_account_by_vtex_name"(p_vtex_account_name text);

drop function if exists "public"."get_user_profiles"(p_customer_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_device_type text, p_status text, p_limit integer);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.accept_user_invitation(p_token uuid)
 RETURNS TABLE(invitation_id uuid, user_id uuid, email text, account_id uuid, role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_invitation dashboard.user_invitations%ROWTYPE;
  v_user_id UUID;
BEGIN
  -- Get invitation by token
  SELECT * INTO v_invitation
  FROM dashboard.user_invitations
  WHERE dashboard.user_invitations.token = p_token
    AND dashboard.user_invitations.accepted_at IS NULL
    AND dashboard.user_invitations.expires_at > NOW();
  
  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  -- Check if user already exists with this email - qualify column references
  IF EXISTS (
    SELECT 1 FROM dashboard.users u
    WHERE u.email = v_invitation.email
      AND u.account_id = v_invitation.account_id
  ) THEN
    RAISE EXCEPTION 'User already exists with this email';
  END IF;
  
  -- Create user
  INSERT INTO dashboard.users (
    account_id,
    email,
    role,
    first_name,
    last_name,
    name
  )
  VALUES (
    v_invitation.account_id,
    v_invitation.email,
    v_invitation.role,
    NULL,
    NULL,
    NULL
  )
  RETURNING dashboard.users.id INTO v_user_id;
  
  -- Mark invitation as accepted - qualify column references
  UPDATE dashboard.user_invitations
  SET accepted_at = NOW(),
      updated_at = NOW()
  WHERE dashboard.user_invitations.id = v_invitation.id;
  
  -- Return results
  RETURN QUERY
  SELECT 
    v_invitation.id,
    v_user_id,
    v_invitation.email,
    v_invitation.account_id,
    v_invitation.role;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_custom_api_key(p_account_id uuid, p_name text, p_description text, p_key_hash text, p_key_prefix text, p_key_suffix text, p_created_by uuid)
 RETURNS TABLE(id uuid, account_id uuid, key_type text, name text, description text, key_prefix text, key_suffix text, created_at timestamp with time zone, updated_at timestamp with time zone, created_by uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_key_id UUID;
BEGIN
  INSERT INTO dashboard.api_keys (
    account_id,
    key_type,
    name,
    description,
    key_hash,
    key_prefix,
    key_suffix,
    created_by
  )
  VALUES (
    p_account_id,
    'custom',
    p_name,
    p_description,
    p_key_hash,
    p_key_prefix,
    p_key_suffix,
    p_created_by
  )
  RETURNING id INTO v_key_id;
  
  RETURN QUERY
  SELECT 
    k.id,
    k.account_id,
    k.key_type,
    k.name,
    k.description,
    k.key_prefix,
    k.key_suffix,
    k.created_at,
    k.updated_at,
    k.created_by
  FROM dashboard.api_keys k
  WHERE k.id = v_key_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_api_key(p_key_id uuid, p_account_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_deleted BOOLEAN := false;
BEGIN
  DELETE FROM dashboard.api_keys k
  WHERE k.id = p_key_id
    AND k.account_id = p_account_id
    AND k.key_type = 'custom';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$function$
;


