/* ==========================================
   Wedding Story Book - script.js
   ========================================== */

(function () {
  'use strict';

  /* ---------- 상태 변수 ---------- */
  const spreads     = document.querySelectorAll('.spread');
  const totalCount  = spreads.length;
  let   currentIdx  = 0;
  let   isPlaying   = false;
  let   autoTimer   = null;
  const AUTO_DELAY  = 8000; // 자동 재생 간격 (ms)

  /* ---------- UI 요소 ---------- */
  const prevBtn      = document.getElementById('prevBtn');
  const nextBtn      = document.getElementById('nextBtn');
  const playBtn      = document.getElementById('playBtn');
  const currentLabel = document.getElementById('currentPage');
  const totalLabel   = document.getElementById('totalPages');
  const bgm          = document.getElementById('bgm');

  /* ---------- 초기화 ---------- */
  function init() {
    // 총 페이지 수 표시
    if (totalLabel) totalLabel.textContent = totalCount;

    // 첫 spread 활성화
    showSpread(0, false);

    // 버튼 이벤트 연결
    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);
    playBtn.addEventListener('click', toggleAutoPlay);

    // 키보드 화살표 지원
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goPrev();
      if (e.key === ' ')                                    toggleAutoPlay();
    });
  }

  /* ---------- 페이지 이동 ---------- */
  function showSpread(idx, animate) {
    // 범위 보정
    if (idx < 0)           idx = 0;
    if (idx >= totalCount) idx = totalCount - 1;

    // 이전 active 제거
    spreads.forEach(function (s) {
      s.classList.remove('active');
    });

    // 새 페이지 활성화
    spreads[idx].classList.add('active');

    // page-inner 재등장 애니메이션: 클래스 리셋 트릭
    spreads[idx].querySelectorAll('.page-inner').forEach(function (el) {
      el.style.animation = 'none';
      // reflow 강제 유발 → 애니메이션 재시작
      void el.offsetHeight;
      el.style.animation = '';
    });

    currentIdx = idx;
    updateUI();
  }

  function goNext() {
    if (currentIdx < totalCount - 1) {
      showSpread(currentIdx + 1, true);
    } else {
      // 마지막 페이지 → 자동재생 중이면 정지
      stopAutoPlay();
    }
  }

  function goPrev() {
    if (currentIdx > 0) {
      showSpread(currentIdx - 1, true);
    }
  }

  /* ---------- 버튼 / 인디케이터 상태 갱신 ---------- */
  function updateUI() {
    // 인디케이터
    if (currentLabel) currentLabel.textContent = currentIdx + 1;

    // 이전 버튼 비활성화
    prevBtn.disabled = (currentIdx === 0);

    // 다음 버튼 비활성화 (마지막 페이지)
    nextBtn.disabled = (currentIdx === totalCount - 1);
  }

  /* ---------- 자동 재생 ---------- */
  function startAutoPlay() {
    if (isPlaying) return;
    isPlaying = true;
    playBtn.textContent = '⏸ 정지';

    // BGM 재생 시도 (브라우저 정책상 사용자 클릭 후에만 허용)
    if (bgm) {
      bgm.play().catch(function () {
        // 자동 재생 차단 시 무시
      });
    }

    autoTimer = setInterval(function () {
      if (currentIdx < totalCount - 1) {
        goNext();
      } else {
        stopAutoPlay();
      }
    }, AUTO_DELAY);
  }

  function stopAutoPlay() {
    if (!isPlaying) return;
    isPlaying = false;
    playBtn.textContent = '▶ 자동재생';

    clearInterval(autoTimer);
    autoTimer = null;

    if (bgm && !bgm.paused) {
      bgm.pause();
    }
  }

  function toggleAutoPlay() {
    if (isPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  /* ---------- 실행 ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
