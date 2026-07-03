let session=[], pos=0, answers={}, mode='', currentTitle='';
const STORAGE_KEY='quizAspirantkaStateV2';
const DONE_KEY='quizAspirantkaDoneV1';

const CATEGORIES=[
  {key:'bezpieczenstwo', name:'Bezpieczeństwo pożarowe obiektów i budynków', from:3, to:10},
  {key:'srodki', name:'Środki gaśnicze, neutralizatory i sorbenty', from:11, to:13},
  {key:'sprzet', name:'Wyposażenie techniczne i sprzęt', from:14, to:26},
  {key:'operator', name:'Prawa i obowiązki operatora pojazdu / sprzętu pożarniczego', from:27, to:27},
  {key:'gasnicze', name:'Taktyka działań gaśniczych', from:28, to:50},
  {key:'tech_chem_podstawowe', name:'Ratownictwo techniczne i chemiczne — jednostki podstawowe', from:51, to:68},
  {key:'tech_chem_spec', name:'Ratownictwo techniczne i chemiczne — grupy specjalistyczne', from:69, to:73},
  {key:'poszukiwawcze_podstawowe', name:'Działania poszukiwawczo-ratownicze — jednostki podstawowe', from:74, to:85},
  {key:'poszukiwawcze_spec', name:'Działania poszukiwawczo-ratownicze — grupy specjalistyczne', from:86, to:87},
  {key:'wodne_podstawowe', name:'Ratownictwo wodne — jednostki podstawowe', from:88, to:92},
  {key:'wodno_nurkowe', name:'Ratownictwo wodno-nurkowe — grupy specjalistyczne', from:93, to:96},
  {key:'medyczne', name:'Ratownictwo medyczne', from:97, to:105},
  {key:'wysokosciowe_podstawowe', name:'Ratownictwo wysokościowe — jednostki podstawowe', from:106, to:126},
  {key:'wysokosciowe_spec', name:'Ratownictwo wysokościowe — grupy specjalistyczne', from:127, to:131},
  {key:'wysokosciowe', name:'Wysokościowe — razem', from:106, to:131},
  {key:'lacznosc', name:'Łączność', from:132, to:138},
  {key:'sk', name:'Praca stanowisk kierowania', from:139, to:145}
];

document.getElementById('totalBadge').textContent=META.count;
document.getElementById('imgBadge').textContent=META.images;
updateSavedPanel();

function hideAll(){['menu','savePanel','allSetup','categorySetup','quiz','result','review'].forEach(id=>document.getElementById(id).classList.add('hidden'));}
function backMenu(){hideAll();document.getElementById('menu').classList.remove('hidden');updateSavedPanel();}
function showAllSetup(){hideAll();document.getElementById('allSetup').classList.remove('hidden');document.getElementById('startNum').focus();}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function prepQuestion(q, shuffleAnswers=true){let opts=q.options.map((o,i)=>({...o,orig:i})); const visualOnly=q.images&&q.images.length&&q.options.every(o=>(o.text||'').trim()===''); if(shuffleAnswers && !q.lockOrder && !visualOnly) opts=shuffle(opts); return {...q, optionsView:opts};}
function prepQuestionWithOrder(q, order){const opts=order.map(orig=>({...q.options[orig], orig})).filter(Boolean); return {...q, optionsView:opts.length?opts:q.options.map((o,i)=>({...o,orig:i}))};}
function questionByDisplay(display){return QUESTIONS.find(q=>String(q.display)===String(display));}

function getDoneSet(){try{return new Set(JSON.parse(localStorage.getItem(DONE_KEY)||'[]'));}catch(e){return new Set();}}
function saveDoneSet(set){localStorage.setItem(DONE_KEY, JSON.stringify([...set]));}
function markDone(display){const done=getDoneSet();done.add(String(display));saveDoneSet(done);}
function doneCountFor(list){const done=getDoneSet();return list.filter(q=>done.has(String(q.display))).length;}

function saveSession(){
  if(!session.length) return;
  const payload={
    mode, title:currentTitle, pos, answers,
    savedAt:new Date().toISOString(),
    session:session.map(q=>({display:q.display, order:(q.optionsView||[]).map(o=>o.orig)}))
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  updateSavedPanel();
}
function loadSaved(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch(e){return null;}}
function updateSavedPanel(){
  const panel=document.getElementById('savePanel');
  const info=document.getElementById('saveInfo');
  const saved=loadSaved();
  if(!panel || !info) return;
  const menuVisible=!document.getElementById('menu').classList.contains('hidden');
  if(saved && saved.session && saved.session.length && menuVisible){
    const answered=Object.keys(saved.answers||{}).length;
    const d=saved.savedAt ? new Date(saved.savedAt).toLocaleString('pl-PL') : '';
    info.textContent=`Zapisany test: ${saved.title||saved.mode||'test'} · miejsce ${Number(saved.pos||0)+1}/${saved.session.length} · odpowiedzi: ${answered}/${saved.session.length} · zapis: ${d}`;
    panel.classList.remove('hidden');
  }else{
    panel.classList.add('hidden');
  }
}
function resumeSaved(){
  const saved=loadSaved();
  if(!saved || !saved.session || !saved.session.length){alert('Brak zapisanego testu.');return;}
  session=saved.session.map(item=>{
    const q=questionByDisplay(item.display);
    return q ? prepQuestionWithOrder(q, item.order||[]) : null;
  }).filter(Boolean);
  pos=Math.min(Number(saved.pos||0), Math.max(0,session.length-1));
  answers=saved.answers||{};
  mode=saved.mode||'saved';
  currentTitle=saved.title||'Zapisany test';
  showQuiz(false);
}
function clearSaved(){localStorage.removeItem(STORAGE_KEY);updateSavedPanel();alert('Zapis testu został usunięty.');}

function startRandom(){mode='random'; currentTitle='Losowe 30 pytań'; session=shuffle(QUESTIONS).slice(0,30).map(q=>prepQuestion(q,true)); pos=0; answers={}; showQuiz();}
function startAllFrom(){let val=(document.getElementById('startNum').value||'1').trim().toLowerCase();let idx=0;if(val){idx=QUESTIONS.findIndex(q=>String(q.display).toLowerCase()===val); if(idx<0 && /^\d+$/.test(val)){const n=parseInt(val,10); idx=QUESTIONS.findIndex(q=>Number(q.num)>=n);} if(idx<0) idx=0;} mode='all'; currentTitle='Wszystkie pytania od nr '+QUESTIONS[idx].display; session=QUESTIONS.slice(idx).map(q=>prepQuestion(q,true)); pos=0; answers={}; showQuiz();}
function showQuiz(shouldSave=true){hideAll();document.getElementById('quiz').classList.remove('hidden');renderQ();if(shouldSave) saveSession();}

function showCategories(){
  hideAll();
  document.getElementById('categorySetup').classList.remove('hidden');
  const box=document.getElementById('categoryList');
  box.innerHTML='';
  CATEGORIES.forEach(cat=>{
    const list=QUESTIONS.filter(q=>q.page>=cat.from && q.page<=cat.to);
    if(!list.length) return;
    const done=doneCountFor(list);
    const div=document.createElement('div');
    div.className='category-card';
    div.innerHTML=`<div><b>${esc(cat.name)}</b><p class="small">Pytania: ${list.length} · przerobione: ${done}/${list.length} · strony PDF: ${cat.from}${cat.from===cat.to?'':'–'+cat.to}</p></div><div class="row"><button onclick="startCategory('${cat.key}','all')">Wszystkie</button><button class="secondary" onclick="startCategory('${cat.key}','random')">30 losowych</button></div>`;
    box.appendChild(div);
  });
}
function startCategory(key, variant){
  const cat=CATEGORIES.find(c=>c.key===key);
  if(!cat) return;
  let list=QUESTIONS.filter(q=>q.page>=cat.from && q.page<=cat.to);
  if(variant==='random') list=shuffle(list).slice(0, Math.min(30,list.length));
  mode='category';
  currentTitle=(variant==='random'?'30 losowych · ':'')+cat.name;
  session=list.map(q=>prepQuestion(q,true));
  pos=0; answers={}; showQuiz();
}

function renderQ(){const q=session[pos];document.getElementById('qCounter').textContent=`Pytanie ${pos+1}/${session.length} · nr ${q.display}`;document.getElementById('qPage').textContent=`(strona PDF: ${q.page}${currentTitle?' · '+currentTitle:''})`;document.getElementById('bar').style.width=((pos+1)/session.length*100)+'%';document.getElementById('qText').textContent=q.question;const im=document.getElementById('qImages');im.innerHTML='';q.images.forEach(src=>{const img=document.createElement('img');img.src=src;img.alt='Grafika do pytania '+q.display;im.appendChild(img);});const ans=document.getElementById('answers');ans.innerHTML='';const given=answers[pos];q.optionsView.forEach((o,i)=>{const b=document.createElement('button');b.className='answer';b.innerHTML=`<span class="letter">${String.fromCharCode(65+i)}.</span> ${esc(o.text)}`;b.onclick=()=>choose(i); if(given!==undefined){if(o.orig===q.answer)b.classList.add('correct'); if(i===Number(given) && o.orig!==q.answer)b.classList.add('wrong'); if(i===Number(given))b.classList.add('selected');}ans.appendChild(b);});const fb=document.getElementById('feedback');if(given===undefined){fb.classList.add('hidden');}else{const ok=q.optionsView[given].orig===q.answer;fb.className='feedback '+(ok?'ok':'no');fb.innerHTML=ok?'Dobrze.':'Źle. Poprawna odpowiedź: <b>'+esc(correctText(q))+'</b>';fb.classList.remove('hidden');}document.getElementById('nextBtn').textContent=pos===session.length-1?'Wynik':'Dalej';}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function choose(i){if(answers[pos]!==undefined)return;answers[pos]=i;markDone(session[pos].display);saveSession();renderQ();}
function correctText(q){const ov=q.optionsView.find(o=>o.orig===q.answer);return ov?(ov.text||ov.letter||String.fromCharCode(65+ov.orig)):'';}
function nextQ(){if(pos<session.length-1){pos++;renderQ();saveSession();}else finishQuiz();}
function prevQ(){if(pos>0){pos--;renderQ();saveSession();}}
function finishQuiz(){hideAll();const done=Object.keys(answers).length;let good=0;session.forEach((q,i)=>{if(answers[i]!==undefined && q.optionsView[answers[i]]?.orig===q.answer)good++;});const pct=done?Math.round(good/done*100):0;const res=document.getElementById('result');res.innerHTML=`<h2>Wynik</h2><p class="small">${esc(currentTitle||'Test')}</p><div class="result-grid"><div class="stat"><b>${good}</b>dobrze</div><div class="stat"><b>${done-good}</b>źle</div><div class="stat"><b>${done}</b>odpowiedziano</div><div class="stat"><b>${pct}%</b>skuteczność</div></div><div class="row"><button onclick="repeatWrong()" class="secondary">Powtórz błędne</button><button onclick="showSessionReview()" class="secondary">Przegląd tego testu</button><button onclick="backMenu()">Menu</button><button class="ghost" onclick="clearSaved()">Usuń zapis testu</button></div>`;res.classList.remove('hidden');saveSession();}
function repeatWrong(){const wrong=session.filter((q,i)=>answers[i]===undefined || q.optionsView[answers[i]]?.orig!==q.answer); if(!wrong.length){alert('Brak błędnych pytań.');return;} session=wrong.map(q=>prepQuestion(QUESTIONS.find(x=>x.display===q.display),true)); pos=0; answers={}; mode='repeatWrong'; currentTitle='Powtórka błędnych'; showQuiz();}
function showSessionReview(){hideAll();document.getElementById('review').classList.remove('hidden');renderReview(session.map(q=>q.display));}
function showReview(){hideAll();document.getElementById('review').classList.remove('hidden');renderReview();}
function renderReview(onlyDisplays=null){const box=document.getElementById('reviewList');const filter=(document.getElementById('filter').value||'').toLowerCase();const done=getDoneSet();box.innerHTML='';let list=QUESTIONS;if(onlyDisplays) list=QUESTIONS.filter(q=>onlyDisplays.includes(q.display));if(filter) list=list.filter(q=>String(q.display).toLowerCase().includes(filter)||q.question.toLowerCase().includes(filter)||q.options.some(o=>o.text.toLowerCase().includes(filter)));list.forEach(q=>{const d=document.createElement('details');const ans=q.options[q.answer]?.text||q.options[q.answer]?.letter||'';const status=done.has(String(q.display))?' · przerobione':'';d.innerHTML=`<summary>Nr ${esc(q.display)}${status} · ${esc(q.question.slice(0,160))}${q.question.length>160?'...':''}</summary><p>${esc(q.question)}</p><div class="images">${q.images.map(src=>`<img src="${src}" alt="Grafika do pytania ${esc(q.display)}">`).join('')}</div><ol type="A">${q.options.map((o,i)=>`<li class="${i===q.answer?'correct-text':''}">${esc(o.text||o.letter||String.fromCharCode(65+i))}</li>`).join('')}</ol><p>Poprawna odpowiedź: <span class="correct-text">${esc(ans)}</span></p>`;box.appendChild(d);});if(!list.length) box.innerHTML='<p class="small">Brak wyników dla podanego filtra.</p>';}
