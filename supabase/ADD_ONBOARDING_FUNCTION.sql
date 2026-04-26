-- Function to create an agency securely from client side
CREATE OR REPLACE FUNCTION public.create_agency(agency_name TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_agency_id UUID;
  v_admin_role_id UUID;
  v_slug TEXT;
BEGIN
  -- Generate a slug from the name
  v_slug := lower(regexp_replace(agency_name, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Ensure unique basic slug (naive simple approach)
  v_slug := v_slug || '-' || floor(random() * 10000)::text;

  -- Insert the new agency
  INSERT INTO public.agencies (name, slug)
  VALUES (agency_name, v_slug)
  RETURNING id INTO v_agency_id;

  -- Ensure roles are created
  PERFORM public.fn_bootstrap_agency_roles(v_agency_id);

  -- Get Admin Role ID
  SELECT id INTO v_admin_role_id FROM public.roles WHERE agency_id = v_agency_id AND name = 'Admin' LIMIT 1;

  -- Add the creator to memberships as Admin
  INSERT INTO public.memberships (user_id, agency_id, role_id, organization_id, role)
  VALUES (auth.uid(), v_agency_id, v_admin_role_id, v_agency_id, 'Admin');

  -- Update profile for legacy compatibility
  UPDATE public.profiles 
  SET agency_id = v_agency_id, role = 'admin' 
  WHERE id = auth.uid();

  RETURN v_agency_id;
END;
$$;

-- Grant permissions so users can actually call it
GRANT EXECUTE ON FUNCTION public.create_agency(TEXT) TO authenticated;
