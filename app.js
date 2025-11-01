/* app.js */
(() => {
  'use strict';

  // Telegram WebApp nesnesi
  const tg = window.Telegram?.WebApp || null;

  // Basit guard: Telegram dışından açılırsa uyar
  document.addEventListener('DOMContentLoaded', () => {
    if (!tg) {
      alert("Please open this page from the Wawehub bot button inside Telegram.");
      return;
    }

    tg.expand?.();

    // Bir kez APP_OPEN ping’i gönder
    if (!sessionStorage.getItem('app_open_sent')) {
      try {
        tg.sendData?.(JSON.stringify({ type: "APP_OPEN", ts: Date.now() }));
        sessionStorage.setItem('app_open_sent', '1');
      } catch (e) {}
    }

    initUI();
  });

  // ---- UI ve Akış ----
  function initUI(){
    // Sayfalar / Progress
    const pagePlan = document.getElementById('page-plan');
    const pagePay  = document.getElementById('page-pay');
    const pageDone = document.getElementById('page-done');
    const dots = [
      document.getElementById('step1'),
      document.getElementById('step2'),
      document.getElementById('step3')
    ];

    const setStep = (n) => dots.forEach((d,i)=>d.classList.toggle('active', i<n));
    const show = (el) => [pagePlan,pagePay,pageDone].forEach(e=>e.classList.add('hide')) || el.classList.remove('hide');

    // Plan seçimi
    const cards = Array.from(document.querySelectorAll('#cards .card'));
    let selected = document.querySelector('#cards .card.selected') || cards[0];
    let stateTx = null;

    cards.forEach(c => {
      c.addEventListener('click', () => {
        if (selected) selected.classList.remove('selected');
        c.classList.add('selected');
        selected = c;
        tg?.HapticFeedback?.selectionChanged();
      }, {passive:true});
    });

    // Continue → Payment
    const continueBtn = document.getElementById('continueBtn');
    continueBtn?.addEventListener('click', () => {
      const plan   = selected.dataset.plan;
      const amount = Number(selected.dataset.amount);

      document.getElementById('summary').innerHTML =
        `<b>Selected:</b> ${plan} • <b>${amount} USDT</b>`;
      document.getElementById('amt').textContent = amount.toString();

      try {
        tg?.sendData?.(JSON.stringify({ type:"PLAN_SELECTED", plan, amount, ts:Date.now() }));
      } catch(e){}

      setStep(2); show(pagePay);
    });

    // Payment helpers
    const payStatus = document.getElementById('payStatus');
    const addrEl    = document.getElementById('addr');

    function copyAddr(){
      const addr = addrEl.textContent.trim();
      navigator.clipboard.writeText(addr).then(()=>{
        payStatus.textContent = "Wallet address copied.";
      });
    }

    // TX prompt + basit doğrulama
    function txLooksOk(tx){ return typeof tx==='string' && tx.trim().length>=16; }
    function sendTx(){
      const tx = prompt("Paste your TX ID (hash):");
      if(!tx) return;
      if(!txLooksOk(tx)) { payStatus.textContent="Invalid TX format."; return; }
      stateTx = tx.trim();
      payStatus.textContent = "TX saved (draft). You can confirm below.";
      try {
        tg?.sendData?.(JSON.stringify({ type:"WAWEHUB_PAYMENT_DRAFT", txid:stateTx, ts:Date.now() }));
      } catch(e){}
      tg?.HapticFeedback?.impactOccurred?.("light");
    }

    // Confirm & Send → Confirmation
    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn?.addEventListener('click', () => {
      if(!stateTx){
        payStatus.textContent="Please send your TX ID first.";
        return;
      }
      const plan   = selected.dataset.plan;
      const amount = Number(selected.dataset.amount);
      const payload = {
        type: "WAWEHUB_PAYMENT_FINAL",
        plan, amount,
        method: "USDT_TRC20",
        address: addrEl.textContent.trim(),
        txid: stateTx,
        user: tg?.initDataUnsafe?.user || null,
        ts: Date.now()
      };
      try { tg?.sendData?.(JSON.stringify(payload)); } catch(e){}

      // Özet doldur
      document.getElementById('finalSummary').innerHTML =
        `<b>Plan:</b> ${plan} — <b>${amount} USDT</b><br/>
         <b>Network:</b> USDT (TRC20)<br/>
         <b>Wallet:</b> <code>${payload.address}</code><br/>
         <b>TX:</b> <code>${stateTx}</code>`;

      setStep(3); show(pageDone);
    });

    // Done → Close
    const doneBtn = document.getElementById('doneBtn');
    doneBtn?.addEventListener('click', () => tg?.close?.());

    // Support floating
    const supportBtn = document.getElementById('supportBtn');
    supportBtn?.addEventListener('click', () => {
      const url = 'https://t.me/wawehubsupport';
      if (tg?.openTelegramLink) tg.openTelegramLink(url);
      else window.open(url, '_blank');
    });

    // Global expose (HTML içindeki onclick'ler için)
    window.copyAddr = copyAddr;
    window.sendTx   = sendTx;
  }
})();
