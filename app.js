const tg = window.Telegram?.WebApp || null; 
tg?.expand();

const App = window.App = (() => {
  const state = { plan:'monthly', amount:189 };
  function selectPlan(plan, amount){
    state.plan = plan; state.amount = amount;
    ['tile-week','tile-month','tile-quarter'].forEach(id=>document.getElementById(id).classList.remove('sel'));
    if(plan==='weekly') document.getElementById('tile-week').classList.add('sel');
    if(plan==='monthly') document.getElementById('tile-month').classList.add('sel');
    if(plan==='quarterly') document.getElementById('tile-quarter').classList.add('sel');
    tg?.HapticFeedback?.selectionChanged();
  }
  function goPayment(){
    tg?.sendData(JSON.stringify({
      type:"PLAN_SELECTED",
      plan:state.plan,
      amount:state.amount,
      ts:Date.now()
    }));
    tg?.close?.();
  }
  return {selectPlan, goPayment};
})();
