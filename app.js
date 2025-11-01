const tg = window.Telegram?.WebApp || null; tg?.expand();

const App = window.App = (() => {
  const state = { plan:'monthly', amount:189, chain:'TRC20', asset:'USDT', address:null, txid:null };

  const p1=document.getElementById('p1'), p2=document.getElementById('p2'), p3=document.getElementById('p3');
  const pgPlan=document.getElementById('page-plan'), pgPay=document.getElementById('page-pay'), pgDone=document.getElementById('page-done');

  function setStep(n){ [p1,p2,p3].forEach((d,i)=>d.classList.toggle('active', i<n)); }
  function show(el){ [pgPlan,pgPay,pgDone].forEach(e=>e.classList.add('hide')); el.classList.remove('hide'); }

  function selectPlan(plan,amount){
    state.plan=plan; state.amount=amount;
    ['tile-week','tile-month','tile-quarter'].forEach(id=>document.getElementById(id).classList.remove('sel'));
    if(plan==='weekly') document.getElementById('tile-week').classList.add('sel');
    if(plan==='monthly') document.getElementById('tile-month').classList.add('sel');
    if(plan==='quarterly') document.getElementById('tile-quarter').classList.add('sel');
    document.getElementById('chosenPlanText').textContent = `Selected: ${plan} — ${amount} USDT`;
    document.getElementById('payStatus').textContent="";
    tg?.HapticFeedback?.selectionChanged();
  }

  function goPayment(){ if(!state.plan) selectPlan('monthly',189); setStep(2); show(pgPay); }
  function backToPlan(){ setStep(1); show(pgPlan); }

  function copyAddr(){
    const addr=document.getElementById('addr').textContent.trim();
    navigator.clipboard.writeText(addr).then(()=>document.getElementById('payStatus').textContent="Wallet address copied.");
  }

  function txLooksOk(tx){ return typeof tx==='string' && tx.trim().length>=16; }

  function sendTx(){
    state.address=document.getElementById('addr').textContent.trim();
    const tx=prompt("Paste your TX ID (hash):"); if(!tx) return;
    if(!txLooksOk(tx)) { document.getElementById('payStatus').textContent="Invalid TX format."; return; }
    state.txid=tx.trim();
    const payload={type:"WAWEHUB_PAYMENT_DRAFT",...state,user:tg?.initDataUnsafe?.user||null,ts:Date.now()};
    try{ tg?.sendData(JSON.stringify(payload)); }catch(_){}
    document.getElementById('payStatus').textContent="TX sent to bot (draft). You can still edit before confirming.";
  }

  function goConfirm(){
    if(!state.txid){ document.getElementById('payStatus').textContent="Please send your TX ID first."; return; }
    setStep(3);
    const payload={type:"WAWEHUB_PAYMENT_FINAL",...state,user:tg?.initDataUnsafe?.user||null,ts:Date.now()};
    try{ tg?.sendData(JSON.stringify(payload)); }catch(_){}
    document.getElementById('summary').innerHTML =
      `<b>Plan:</b> ${state.plan} — <b>${state.amount} USDT</b><br/>
       <b>Network:</b> ${state.asset} (${state.chain})<br/>
       <b>Wallet:</b> <code>${state.address||document.getElementById('addr').textContent.trim()}</code><br/>
       <b>TX:</b> <code>${state.txid}</code>`;
    show(pgDone);
  }

  function backToPay(){ setStep(2); show(pgPay); }
  function closeApp(){ tg?.close?.(); }

  // init
  setStep(1); selectPlan('monthly',189);

  return { selectPlan, goPayment, backToPlan, copyAddr, sendTx, goConfirm, backToPay, closeApp };
})();
