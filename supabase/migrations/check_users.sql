-- 检查所有用户的 display_name 字段
SELECT 
  au.id,
  au.email,
  p.display_name,
  p.is_admin,
  p.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY p.created_at DESC;

-- 更新现有用户的 display_name（如果为空）
UPDATE public.profiles 
SET display_name = SPLIT_PART(au.email, '@', 1)
FROM auth.users au
WHERE public.profiles.id = au.id
  AND (public.profiles.display_name IS NULL OR public.profiles.display_name = '');

-- 验证更新结果
SELECT 
  au.id,
  au.email,
  p.display_name,
  p.is_admin
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY p.created_at DESC;
