/* ==========================================
   Wedding Story Book — script.js
   StPageFlip 기반
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {

  /* ── DOM ── */
  const prevBtn    = document.getElementById('prevBtn');
  const nextBtn    = document.getElementById('nextBtn');
  const playBtn    = document.getElementById('playBtn');
  const currentLbl = document.getElementById('currentPage');
  const totalLbl   = document.getElementById('totalPages');
  const bgm        = document.getElementById('bgm');

  /* ── 상수 ── */
  const AUTO_MS  = 8000;

  /* ── StPageFlip 인스턴스 ── */
  let pageFlip  = null;

  /* ── 자동재생 상태 ── */
  let isPlaying = false;
  let autoTimer = null;

  /* ============================================================
     헬퍼: 뷰포트 기준으로 책 크기 계산
     StPageFlip 은 고정 px 값이 필요 — 화면 크기에 맞게 계산
     ============================================================ */
  function calcBookSize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 한 페이지 너비 = 뷰포트의 약 42% (양면 펼치면 84%), 최대 500px
    const pageW = Math.min(Math.floor(vw * 0.42), 500);
    // 높이 = 페이지 너비의 1.4배, 뷰포트 높이 80% 이하
    const pageH = Math.min(Math.floor(pageW * 1.4), Math.floor(vh * 0.78));

    return { width: pageW, height: pageH };
  }

  /* ============================================================
     1. StPageFlip 초기화
     ============================================================ */
  function initPageFlip() {
    const { width, height } = calcBookSize();

    pageFlip = new St.PageFlip(document.getElementById('book'), {
      width          : width,
      height         : height,
      size           : 'fixed',
      showCover      : true,       // 첫/마지막 page(hard)를 단면 표지로 표시
      maxShadowOpacity: 0.6,
      swipeDistance  : 30,         // 스와이프 감도
      clickEventForward : true,    // 클릭으로도 넘기기
      usePortrait    : false,      // 항상 펼침 모드
      startPage      : 0,
      drawShadow     : true,
      flippingTime   : 800,        // 넘김 속도 (ms)
      useMouseEvents : true,
    });

    // HTML에서 .page 요소 로드
    pageFlip.loadFromHTML(document.querySelectorAll('#book .page'));

    // 총 스프레드 수 표시
    // StPageFlip pageCount = 전체 page 수 (16장) → 스프레드는 8
    const spreadCount = Math.ceil(pageFlip.getPageCount() / 2);
    if (totalLbl) totalLbl.textContent = spreadCount;

    const LAST_PAGE = pageFlip.getPageCount() - 1;
    const bookContainer = document.querySelector('.book-container');

    let prevPageIdx = 0;

    pageFlip.on('changeState', (e) => {
      if (e.data !== 'flipping') return;

      const cur = pageFlip.getCurrentPageIndex();
      bookContainer.classList.add('cover-state-ready');

      if (cur === 0) {
        if (prevPageIdx === 0) {
          // 앞표지에서 앞으로 출발 → 중앙으로
          bookContainer.classList.remove('cover-state');
          bookContainer.classList.remove('back-cover-state');
        } else {
          // 다른 페이지에서 앞표지로 돌아가는 중 → 왼쪽으로
          bookContainer.classList.add('cover-state');
          bookContainer.classList.remove('back-cover-state');
        }
        return;
      }

      // cur===13(LAST_PAGE-2): 마지막 내용 → 뒷표지로 넘기는 순간
      if (cur === LAST_PAGE - 2 && prevPageIdx === LAST_PAGE - 2) {
        bookContainer.classList.add('back-cover-state');
        bookContainer.classList.remove('cover-state');
        return;
      }

      // cur===15(LAST_PAGE): 뒷표지에서 뒤로 출발 → 중앙으로
      if (cur === LAST_PAGE) {
        bookContainer.classList.remove('back-cover-state');
        bookContainer.classList.remove('cover-state');
        return;
      }

      // 중간 페이지 → 중앙 유지
      bookContainer.classList.remove('cover-state');
      bookContainer.classList.remove('back-cover-state');
    });

    pageFlip.on('flip', (e) => {
      updateIndicator(e.data);
      updateButtons();
      bookContainer.classList.add('cover-state-ready');
      prevPageIdx = e.data;

      if (e.data === 0) {
        bookContainer.classList.add('cover-state');
        bookContainer.classList.remove('back-cover-state');
      } else if (e.data === LAST_PAGE) {
        bookContainer.classList.add('back-cover-state');
        bookContainer.classList.remove('cover-state');
      } else {
        bookContainer.classList.remove('cover-state');
        bookContainer.classList.remove('back-cover-state');
      }
    });

    // 초기 UI
    updateIndicator(0);
    updateButtons();

    // 시작 시 표지 상태 클래스 추가
    bookContainer.classList.add('cover-state');
  }

  /* ============================================================
     2. 인디케이터 & 버튼 상태
     ============================================================ */
  function updateIndicator(pageIdx) {
    // pageIdx = StPageFlip 의 현재 페이지 번호 (0-based, 단면 기준)
    // 표지(0)는 spread 1, 이후 2장씩 spread 증가
    const spread = pageIdx === 0 ? 1 : Math.floor(pageIdx / 2) + 1;
    if (currentLbl) currentLbl.textContent = spread;
  }

  function updateButtons() {
    if (!pageFlip) return;
    const cur   = pageFlip.getCurrentPageIndex();
    const total = pageFlip.getPageCount();
    if (prevBtn) prevBtn.disabled = (cur <= 0);
    if (nextBtn) nextBtn.disabled = (cur >= total - 1);
  }

  /* ============================================================
     1. StPageFlip 즉시 초기화
     ============================================================ */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      initPageFlip();
    });
  });
  if (prevBtn) prevBtn.addEventListener('click', () => {
    if (pageFlip) pageFlip.flipPrev();
  });

  if (nextBtn) nextBtn.addEventListener('click', () => {
    if (pageFlip) pageFlip.flipNext();
  });

  /* ============================================================
     5. 자동재생
     ============================================================ */
  function startAutoPlay() {
    if (isPlaying || !pageFlip) return;
    isPlaying = true;
    if (playBtn) playBtn.textContent = '⏸ 정지';
    if (bgm) bgm.play().catch(() => {});

    autoTimer = setInterval(() => {
      if (!pageFlip) return;
      const cur   = pageFlip.getCurrentPageIndex();
      const total = pageFlip.getPageCount();
      if (cur < total - 1) {
        pageFlip.flipNext();
      } else {
        stopAutoPlay();
      }
    }, AUTO_MS);
  }

  function stopAutoPlay() {
    if (!isPlaying) return;
    isPlaying = false;
    if (playBtn) playBtn.textContent = '▶ 자동재생';
    clearInterval(autoTimer);
    autoTimer = null;
    if (bgm && !bgm.paused) bgm.pause();
  }

  if (playBtn) playBtn.addEventListener('click', () => {
    isPlaying ? stopAutoPlay() : startAutoPlay();
  });

  /* ============================================================
     6. 키보드
     ============================================================ */
  document.addEventListener('keydown', (e) => {
    if (!pageFlip) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        pageFlip.flipNext();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        pageFlip.flipPrev();
        break;
      case ' ':
        e.preventDefault();
        isPlaying ? stopAutoPlay() : startAutoPlay();
        break;
    }
  });

  /* ============================================================
     7. 창 크기 변경 시 재초기화
     ============================================================ */
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (!pageFlip) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const { width, height } = calcBookSize();
      pageFlip.update({ width, height });
    }, 300);
  });

});
