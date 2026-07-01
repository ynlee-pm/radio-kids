# 라디오 만드는 밤

라디오 만들기 소모임이 회차마다 주제를 정하고, 음악을 추천하고, 서로 논의하는 감성 웹사이트 (프로토타입).

## 여는 방법

브라우저에서 바로 열거나, 로컬 서버로 실행합니다.

    python3 -m http.server 8080

그 다음 http://localhost:8080/ 접속.

## 구조

- `index.html` — 홈(온에어 데스크): 이번 회차 + 추천곡 + 지난 회차 + 다음 주제 티저
- `episode.html?vol=N` — 회차 상세: 추천곡 리스트 + 곡 추천 폼 + 논의(댓글)
- `topics.html` — 다음 주제 정하기: 제안 + 하트 투표
- `assets/` — 스타일, 데이터 계층(시드 + localStorage), 페이지별 스크립트, 폰트

## 참고

- 데이터는 브라우저 `localStorage`에만 저장됩니다(서버 없음). 초기화하려면 콘솔에서
  `localStorage.removeItem("radioclub.v1"); localStorage.removeItem("radioclub.voted");`
- 제목 폰트: GraceSerif 2.0 (self-host) / 본문: Pretendard (CDN)
