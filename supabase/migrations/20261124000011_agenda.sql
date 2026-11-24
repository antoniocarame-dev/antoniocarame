-- Agenda libre: eventos personales y de todo el día
alter type tipo_evento add value if not exists 'personal';
alter type tipo_evento add value if not exists 'otro';
alter table public.eventos add column if not exists todo_el_dia boolean not null default false;
