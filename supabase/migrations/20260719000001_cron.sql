create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'nagarseva-escalation-sweep-every-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://ljmvjpgahfandooxqoej.supabase.co/functions/v1/escalation-sweep',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'e601fa189e4a4360a2c919f7661c0864'
    ),
    body := '{}'::jsonb
  );
  $$
);