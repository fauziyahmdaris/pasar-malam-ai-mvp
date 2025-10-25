
create function decrement_stock (product_id_in uuid, quantity_in int)
returns void as $$
  update products
  set stock_quantity = stock_quantity - quantity_in
  where id = product_id_in;
$$ language sql;
