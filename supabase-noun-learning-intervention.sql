-- Derived intervention automation: repeated study questions can surface a recommendation.
-- It never changes academic records and creates at most one open alert per course/key.
create or replace function public.noun_bot_learning_intervention()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
  alert_key_value text;
begin
  if new.course_code is null or new.student_phone is null then return new; end if;
  select count(*) into recent_count
  from public.student_study_questions q
  where q.tenant_id = new.tenant_id
    and q.student_phone = new.student_phone
    and q.course_code = new.course_code
    and q.created_at >= now() - interval '7 days';

  if recent_count >= 3 then
    alert_key_value := 'learning-intervention:' || lower(new.course_code) || ':' || to_char(current_date, 'YYYY-MM-DD');
    insert into public.student_alerts(tenant_id,student_phone,alert_key,severity,title,body,source_type,course_code,metadata)
    values(new.tenant_id,new.student_phone,alert_key_value,'RECOMMENDATION',
      'A little more support may help with ' || new.course_code,
      'You have asked several study questions about this course recently. A focused revision session or human academic support may help.',
      'learning_signal',new.course_code,jsonb_build_object('recent_question_count',recent_count))
    on conflict (tenant_id,student_phone,alert_key) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_noun_bot_learning_intervention on public.student_study_questions;
create trigger trg_noun_bot_learning_intervention
after insert on public.student_study_questions
for each row execute function public.noun_bot_learning_intervention();
