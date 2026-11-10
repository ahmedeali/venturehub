(() => {
const cfg=window.VENTUREHUB_CONFIG||{};
const live=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase);
const db=live?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const $=id=>document.getElementById(id);
const storeKey="venturehub_ideas_v1";
let user=null, ideas=[], authMode="signup", activeIdea=null, replyTo=null;
const seed=[
{id:"seed1",title:"Neighbourhood food, delivered smarter",category:"Food & Drink",stage:"Exploring",plan:"A platform connecting independent home chefs and small food producers with nearby customers. Start with a curated group of vendors in one city, then expand based on demand. Revenue could come from a modest transaction fee and optional vendor subscriptions.",costs:"£8,000",revenue:"£3,500",help:"Product design, local partnerships",author:"Maya Chen",created_at:new Date(Date.now()-86400000*2).toISOString(),comments:[{id:"c1",author:"Omar",text:"Have you considered starting with one neighbourhood to validate delivery costs?",created_at:new Date(Date.now()-3600000).toISOString(),parent_id:null},{id:"c2",author:"Maya Chen",text:"Yes — a small pilot is the plan. Great point!",created_at:new Date().toISOString(),parent_id:"c1"}]},
{id:"seed2",title:"A practical money-skills club for teens",category:"Education",stage:"Planning",plan:"A subscription-based learning club that teaches teenagers budgeting, saving, and basic entrepreneurship through short projects and group challenges. Partner with schools and youth organisations for the first cohort.",costs:"£5,500",revenue:"£2,200",help:"Education partners, curriculum feedback",author:"Daniel Brooks",created_at:new Date(Date.now()-86400000*5).toISOString(),comments:[]},
{id:"seed3",title:"Refill stations for everyday essentials",category:"Sustainability",stage:"Building",plan:"Compact refill stations for detergents and household essentials in apartment communities. Residents bring reusable containers, while building managers receive a share of recurring sales. The pilot will test three residential buildings.",costs:"£18,000",revenue:"£6,000",help:"Retail operations, sustainability advice",author:"Aisha Rahman",created_at:new Date(Date.now()-86400000*9).toISOString(),comments:[]}
];
function loadLocal(){try{ideas=JSON.parse(localStorage.getItem(storeKey))||seed; if(!localStorage.getItem(storeKey))saveLocal()}catch{ideas=seed}}
function saveLocal(){localStorage.setItem(storeKey,JSON.stringify(ideas))}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function openModal(id){$(id).classList.remove("hidden");document.body.style.overflow="hidden"}
function closeModals(){$$(".modal").forEach(m=>m.classList.add("hidden"));document.body.style.overflow=""}
function $$(s){return [...document.querySelectorAll(s)]}
function dateLabel(d){return new Intl.DateTimeFormat("en",{month:"short",day:"numeric"}).format(new Date(d))}
function commentCount(i){return (i.comments||[]).length}
function render(){
 const q=$("searchInput").value.trim().toLowerCase(),cat=$("categoryFilter").value,sort=$("sortFilter").value;
 let list=ideas.filter(i=>(!cat||i.category===cat)&&(!q||[i.title,i.plan,i.category,i.author].join(" ").toLowerCase().includes(q)));
 if(sort==="discussed")list.sort((a,b)=>commentCount(b)-commentCount(a));else list.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 $("ideaCount").textContent=ideas.length;
 $("ideaFeed").innerHTML=list.length?list.map(i=>`<article class="idea-card"><div class="idea-meta"><span class="category-pill">${esc(i.category)}</span><span>${esc(i.stage||"Exploring")}</span><span>·</span><span>${dateLabel(i.created_at)}</span></div><h3>${esc(i.title)}</h3><p class="idea-description">${esc(i.plan)}</p><div class="idea-numbers"><div><span>STARTUP COSTS</span><b>${esc(i.costs)}</b></div><div><span>PROJECTED MONTHLY REVENUE</span><b>${esc(i.revenue)}</b></div></div><div class="idea-footer"><span class="idea-author">Shared by <b>${esc(i.author)}</b></span><div class="idea-actions"><button class="link-btn" data-open="${esc(i.id)}">◷ ${commentCount(i)} comments</button><button class="link-btn" data-open="${esc(i.id)}">Join discussion →</button></div></div></article>`).join(""):`<div class="idea-card"><h3>No ideas found just yet.</h3><p class="idea-description">Try another search or be the first to share an idea in this category.</p></div>`;
}
async function refreshLive(){
 if(!live)return;
 const {data,error}=await db.from("ideas").select("*, profiles(full_name), comments(id)").eq("status","published").order("created_at",{ascending:false});
 if(error){console.error(error);toast("Could not load ideas. Check your Supabase setup.");return}
 ideas=(data||[]).map(x=>({...x,author:x.profiles?.full_name||"Community member",comments:(x.comments||[])}));render();
}
function setUser(u){user=u;$("loginBtn").classList.toggle("hidden",!!u);$("joinBtn").classList.toggle("hidden",!!u);$("userAvatar").classList.toggle("hidden",!u);if(u){$("userAvatar").textContent=(u.user_metadata?.full_name||u.email||"U").slice(0,1).toUpperCase()}}
function authOpen(mode){authMode=mode;$("authTitle").textContent=mode==="signup"?"Join the community.":"Welcome back."; $("authName").parentElement.classList.toggle("hidden",mode!=="signup");$("authSubmit").textContent=mode==="signup"?"Create account":"Log in";$("authSwitch").innerHTML=mode==="signup"?'Already a member? <button type="button">Log in</button>':'New to VentureHub? <button type="button">Create account</button>';openModal("authModal")}
async function authSubmit(e){e.preventDefault();const email=$("authEmail").value,password=$("authPassword").value,name=$("authName").value.trim();
 if(live){let result;if(authMode==="signup")result=await db.auth.signUp({email,password,options:{data:{full_name:name}}});else result=await db.auth.signInWithPassword({email,password});if(result.error){toast(result.error.message);return}if(authMode==="signup"&&!result.data.session){toast("Check your email to confirm your account.");closeModals();return}setUser(result.data.user);toast(authMode==="signup"?"Welcome to VentureHub!":"You're logged in.");closeModals();await refreshLive();}
 else {if(authMode==="signup"&&!name){toast("Please enter your name.");return}user={id:"demo-"+email,email,user_metadata:{full_name:name||email.split("@")[0]}};localStorage.setItem("venturehub_demo_user",JSON.stringify(user));setUser(user);closeModals();toast("Demo session started. Data stays in this browser.");}
}
async function submitIdea(e){e.preventDefault();if(!user){closeModals();authOpen("signup");toast("Join the community to publish an idea.");return}
 const payload={title:$("ideaName").value.trim(),category:$("ideaCategory").value,stage:$("ideaStage").value,plan:$("ideaPlan").value.trim(),costs:$("ideaCosts").value.trim(),revenue:$("ideaRevenue").value.trim(),help:$("ideaHelp").value.trim(),author:user.user_metadata?.full_name||user.email,created_at:new Date().toISOString(),comments:[]};
 if(live){const {data,error}=await db.from("ideas").insert({title:payload.title,category:payload.category,stage:payload.stage,plan:payload.plan,startup_costs:payload.costs,projected_monthly_revenue:payload.revenue,help_needed:payload.help,author_id:user.id}).select().single();if(error){toast(error.message);return}payload.id=data.id;payload.costs=data.startup_costs;payload.revenue=data.projected_monthly_revenue;payload.created_at=data.created_at;ideas.unshift(payload);await refreshLive();}
 else{payload.id="idea-"+Date.now();ideas.unshift(payload);saveLocal()}
 $("ideaForm").reset();closeModals();render();toast("Your idea is now on the board!");}
async function openIdea(id){activeIdea=ideas.find(i=>String(i.id)===String(id));if(!activeIdea)return;replyTo=null;
 if(live){const {data,error}=await db.from("comments").select("*, profiles(full_name)").eq("idea_id",id).order("created_at");if(!error)activeIdea.comments=(data||[]).map(c=>({...c,author:c.profiles?.full_name||"Community member"}))}
 renderDetail();openModal("detailModal")}
function renderDetail(){
 const i=activeIdea,comments=i.comments||[];
 $("detailContent").innerHTML=`<div class="eyebrow">${esc(i.category)} · ${esc(i.stage||"Exploring")}</div><h2>${esc(i.title)}</h2><p class="idea-author">Shared by <b>${esc(i.author)}</b> · ${dateLabel(i.created_at)}</p><h4>THE BUSINESS PLAN</h4><p class="detail-plan">${esc(i.plan)}</p><div class="detail-finance"><div><span>ESTIMATED STARTUP COSTS</span><b>${esc(i.costs||i.startup_costs)}</b></div><div><span>PROJECTED MONTHLY REVENUE</span><b>${esc(i.revenue||i.projected_monthly_revenue)}</b></div></div><p class="detail-plan"><b>Looking for:</b> ${esc(i.help||i.help_needed||"Open to feedback and collaboration.")}</p><h4>COMMUNITY DISCUSSION (${comments.length})</h4><div class="comment-list">${renderComments(comments,null)}</div><form class="comment-form" id="commentForm"><input id="commentInput" placeholder="${user?"Add a thoughtful comment...":"Join to comment"}" required><button class="btn btn-dark" type="submit">Post</button></form>${user?.is_admin?`<button class="link-btn" id="deleteIdea">Remove this idea (admin)</button>`:""}`;
 $("commentForm").addEventListener("submit",postComment);const del=$("deleteIdea");if(del)del.addEventListener("click",()=>deleteIdea(i.id));
}
function renderComments(comments,parent,depth=0){return comments.filter(c=>(c.parent_id||null)===(parent||null)).map(c=>`<div class="comment ${depth?"reply":""}"><strong>${esc(c.author||"Community member")}</strong><small>${dateLabel(c.created_at)}</small><p>${esc(c.text)}</p><button class="link-btn" data-reply="${esc(c.id)}">Reply</button>${renderComments(comments,c.id,depth+1)}</div>`).join("")}
async function postComment(e){e.preventDefault();if(!user){toast("Please log in to join the discussion.");closeModals();authOpen("signup");return}const textVal=$("commentInput").value.trim();if(!textVal)return;
 if(live){const {error}=await db.from("comments").insert({idea_id:activeIdea.id,author_id:user.id,body:textVal,parent_id:replyTo});if(error){toast(error.message);return}await openIdea(activeIdea.id);toast("Comment posted.");}
 else{activeIdea.comments=activeIdea.comments||[];activeIdea.comments.push({id:"c-"+Date.now(),author:user.user_metadata.full_name||user.email,text:textVal,created_at:new Date().toISOString(),parent_id:replyTo});saveLocal();replyTo=null;renderDetail();toast("Comment added.");}}
async function deleteIdea(id){if(!confirm("Remove this idea? This cannot be undone."))return;if(live){const {error}=await db.from("ideas").delete().eq("id",id);if(error){toast(error.message);return}}ideas=ideas.filter(i=>String(i.id)!==String(id));saveLocal();closeModals();render();toast("Idea removed.");}
async function init(){ $("year").textContent=new Date().getFullYear();loadLocal();render();const demo=localStorage.getItem("venturehub_demo_user");if(demo&&!live){try{setUser(JSON.parse(demo))}catch{}}
 if(live){const {data}=await db.auth.getSession();setUser(data.session?.user||null);db.auth.onAuthStateChange((_event,session)=>setUser(session?.user||null));await refreshLive();}
 $("loginBtn").onclick=()=>authOpen("login");$("joinBtn").onclick=()=>authOpen("signup");$("heroPublish").onclick=$("publishBtn").onclick=$("sidePublish").onclick=()=>{if(!user){authOpen("signup");return}openModal("ideaModal")};
 $("authForm").addEventListener("submit",authSubmit);$("ideaForm").addEventListener("submit",submitIdea);$("authSwitch").addEventListener("click",()=>authOpen(authMode==="signup"?"login":"signup"));
 $$(".modal [data-close]").forEach(x=>x.addEventListener("click",closeModals));$("userAvatar").onclick=async()=>{if(live)await db.auth.signOut();user=null;localStorage.removeItem("venturehub_demo_user");setUser(null);toast("You have logged out.");};
 $("searchInput").addEventListener("input",render);$("categoryFilter").addEventListener("change",render);$("sortFilter").addEventListener("change",render);
 $("ideaFeed").addEventListener("click",e=>{const b=e.target.closest("[data-open]");if(b)openIdea(b.dataset.open)});
 $("detailContent").addEventListener("click",e=>{const b=e.target.closest("[data-reply]");if(b){replyTo=b.dataset.reply;$("commentInput").focus();$("commentInput").placeholder="Write a reply..."}});
}
init();
})();