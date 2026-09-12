const $ = (selector) => document.querySelector(selector);
const form = $('#recipeForm');
const ingredients = $('#ingredients');
const submitButton = $('#submitButton');
const resultPanel = $('#resultPanel');
const emptyState = $('#emptyState');
const loadingState = $('#loadingState');
const resultContent = $('#resultContent');
const formError = $('#formError');
let currentRecipe = null;

$('#menuButton').addEventListener('click', () => {
  const open = $('#navLinks').classList.toggle('open');
  $('#menuButton').setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => $('#navLinks').classList.remove('open')));

const savedTheme = localStorage.getItem('fridge-theme');
if (savedTheme === 'dark') document.body.classList.add('dark');
updateThemeButton();
$('#themeButton').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('fridge-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  updateThemeButton();
});
function updateThemeButton(){ $('#themeButton').textContent = document.body.classList.contains('dark') ? '☀️' : '🌙'; }
ingredients.addEventListener('input', () => $('#charCount').textContent = `${ingredients.value.length} / 300`);
$('#resetButton').addEventListener('click', () => { currentRecipe=null; resultContent.hidden=true; emptyState.hidden=false; form.reset(); ingredients.focus(); window.location.hash='generator'; });
$('#copyButton').addEventListener('click', async () => {
  if (!currentRecipe) return;
  const text = recipeToText(currentRecipe);
  try { await navigator.clipboard.writeText(text); $('#copyButton').textContent='복사 완료!'; setTimeout(()=>$('#copyButton').textContent='결과 복사',1500); }
  catch { alert('복사하지 못했습니다. 브라우저 권한을 확인해 주세요.'); }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault(); hideError();
  const ingredientValue = ingredients.value.trim();
  if (!ingredientValue) return showError('보유 재료를 한 가지 이상 입력해 주세요.');
  const payload = {
    ingredients: ingredientValue,
    time: $('#time').value,
    difficulty: $('#difficulty').value,
    tools: [...document.querySelectorAll('input[name="tools"]:checked')].map(el => el.value),
    exclude: $('#exclude').value.trim(),
    servings: Number($('#servings').value)
  };
  setLoading(true);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const slowNotice = setTimeout(() => $('#loadingMessage').textContent='조금 더 시간이 필요해요. 잠시만 기다려 주세요.', 8000);
  try {
    const response = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload), signal:controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `요청 처리 중 오류가 발생했습니다. (${response.status})`);
    validateRecipe(data.recipe);
    currentRecipe = data.recipe;
    renderRecipe(data.recipe);
  } catch (error) {
    const message = error.name === 'AbortError' ? '응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.' : (error.message || '잠시 후 다시 시도해 주세요.');
    showError(message);
    emptyState.hidden = false;
  } finally { clearTimeout(timeout); clearTimeout(slowNotice); setLoading(false); }
});
function setLoading(isLoading){ submitButton.disabled=isLoading; resultPanel.setAttribute('aria-busy',String(isLoading)); loadingState.hidden=!isLoading; if(isLoading){emptyState.hidden=true;resultContent.hidden=true;$('#loadingMessage').textContent='재료의 조합을 살펴보는 중입니다.';} }
function showError(message){ formError.textContent=message; formError.hidden=false; formError.scrollIntoView({behavior:'smooth',block:'center'}); }
function hideError(){ formError.hidden=true; }
function validateRecipe(r){ if(!r || !r.title || !Array.isArray(r.steps) || !Array.isArray(r.ingredients)) throw new Error('AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.'); }
function fillList(selector, items){ const el=$(selector); el.innerHTML=''; (items||[]).forEach(item=>{const li=document.createElement('li'); li.textContent=item; el.appendChild(li);}); }
function renderRecipe(r){
  $('#recipeTitle').textContent=r.title; $('#recipeSummary').textContent=r.summary;
  $('#recipeTime').textContent=`⏱ ${r.time}`; $('#recipeDifficulty').textContent=`👩‍🍳 ${r.difficulty}`; $('#recipeServings').textContent=`🍽 ${r.servings}인분`;
  fillList('#ingredientList',r.ingredients); fillList('#stepList',r.steps); fillList('#substitutionList',r.substitutions);
  $('#leftoverTip').textContent=r.leftover_tip; $('#caution').textContent=r.caution;
  emptyState.hidden=true; loadingState.hidden=true; resultContent.hidden=false;
  resultPanel.scrollIntoView({behavior:'smooth',block:'start'});
}
function recipeToText(r){ return `${r.title}\n${r.summary}\n\n[재료]\n- ${r.ingredients.join('\n- ')}\n\n[조리 순서]\n${r.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\n[대체 재료]\n- ${r.substitutions.join('\n- ')}\n\n팁: ${r.leftover_tip}\n주의: ${r.caution}`; }