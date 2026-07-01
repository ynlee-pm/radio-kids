# 라디오키즈

라디오 만들기 소모임이 주제마다 음악을 추천하고 서로 논의하며, 다음 주제를 함께 정하는 감성 웹사이트 (프로토타입).

## 여는 방법

브라우저에서 바로 열거나, 로컬 서버로 실행합니다.

    python3 -m http.server 8080

그 다음 http://localhost:8080/ 접속.

## 구조

- `index.html` — 홈(온에어 데스크): 이번 주제 + 추천곡 + 지난 주제 + 다음 주제 티저
- `episode.html?vol=N` — 주제 상세: 추천곡 리스트(+유튜브 링크) + 곡 추천 폼 + 논의(댓글)
- `topics.html` — 다음 주제 정하기: 제안 + 하트 투표
- `assets/` — 스타일, 데이터 계층(시드 + localStorage), 페이지별 스크립트, 폰트

## 참고

- 데이터는 브라우저 `localStorage`에만 저장됩니다(서버 없음). 초기화하려면 콘솔에서
  `localStorage.removeItem("radioclub.v1"); localStorage.removeItem("radioclub.voted");`
- 곡 추천 시 유튜브 링크를 넣으면 트랙에 "YouTube에서 듣기" 아웃링크(새 탭)가 생깁니다. http(s) 링크만 허용됩니다.
- 제목/강조 폰트: HS봄바람체 2.0 (self-host, GraceSerif 폴백) / 본문: Pretendard (CDN)
