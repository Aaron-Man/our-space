-- 为 orders 表添加 custom_order_id 字段
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS custom_order_id text;

-- 为现有订单生成随机的 custom_order_id
UPDATE public.orders 
SET custom_order_id = LPAD(FLOOR(RANDOM() * 90000000 + 10000000)::text, 8, '0')
WHERE custom_order_id IS NULL;
