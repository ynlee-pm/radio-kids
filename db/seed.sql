-- Optional seed. created_by는 null(=admin만 관리). Run once after schema.
with e12 as (
  insert into episodes (vol, title, intro, cover_color)
  values (12, '비 오는 날의 창가에서', '창밖으로 빗소리가 번지는 오후. 각자의 방에서 같은 비를 듣는 우리가 고른, 조금 젖은 노래들.', '#5B6B74')
  returning id
)
insert into tracks (episode_id, artist, song, reason, url)
select id, x.artist, x.song, x.reason, x.url from e12, (values
  ('Nujabes','Feather','빗소리랑 제일 잘 어울려요','https://www.youtube.com/results?search_query=Nujabes+Feather'),
  ('김사월','봄눈','창가에 앉아 듣기 좋은','https://www.youtube.com/results?search_query=김사월+봄눈'),
  ('Bill Evans','Peace Piece','비 오면 자동재생됨','https://www.youtube.com/results?search_query=Bill+Evans+Peace+Piece')
) as x(artist,song,reason,url);

insert into episodes (vol, title, intro, cover_color) values
 (11, '첫차의 온도', '아무도 없는 새벽 정류장, 첫차를 기다리며 듣고 싶은 노래.', '#7A6A55'),
 (10, '늦여름 밤 산책', '더위가 한풀 꺾인 밤, 이어폰 한 쪽만 꽂고 걷고 싶은.', '#4E5A4A');

insert into topics (title, description) values
 ('출근길 BGM', '지하철·버스에서 하루를 여는 노래'),
 ('울고 싶은 밤', '펑펑 울어도 되는, 위로가 되는 곡'),
 ('여름의 끝', '8월 말의 그 아쉬운 공기');
