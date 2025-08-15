
/*! login_fix.js (versão 1) — adiciona handlers de login e mensagens visíveis */
(function(){
  const $ = (id) => document.getElementById(id);
  function msg(t){
    let el = $("authMsg");
    if (!el){
      el = document.createElement("div");
      el.id = "authMsg";
      el.style.cssText = "max-width:900px;margin:8px auto;padding:8px 12px;border-radius:8px;background:#fff3cd;color:#614700;display:none";
      document.body.prepend(el);
    }
    el.textContent = t || "";
    el.style.display = t ? "block" : "none";
  }
  function showApp(){
    const L = $("loginView"), A = $("appView");
    if (L) L.style.display = "none";
    if (A) A.style.display = "block";
  }
  function showLogin(){
    const L = $("loginView"), A = $("appView");
    if (L) L.style.display = "block";
    if (A) A.style.display = "none";
  }
  function ensureIds(){
    // tenta achar inputs de email/senha se IDs não existirem
    if (!$("email")){
      const e = document.querySelector('input[type="email"], input[name*="email" i]');
      if (e) e.id = "email";
    }
    if (!$("senha")){
      const p = document.querySelector('input[type="password"], input[name*="senha" i], input[name*="password" i]');
      if (p) p.id = "senha";
    }
    if (!$("btnLogin")){
      const b = Array.from(document.querySelectorAll("button, input[type=submit], input[type=button]"))
        .find(x => /entrar/i.test(x.textContent||x.value||""));
      if (b) b.id = "btnLogin";
    }
    if (!$("loginView")){
      const f = document.querySelector("form")?.closest("section,div") || document.body;
      if (f) f.id = "loginView";
    }
    if (!$("appView")){
      const app = document.querySelector("#lista, #app, main, .app");
      if (app){ app.id = "appView"; app.style.display = "none"; }
    }
  }

  function attach(){
    ensureIds();
    if (!(window.firebase && firebase.auth)) {
      console.warn("Firebase Auth não encontrado. Verifique a ordem dos scripts.");
      msg("Firebase Auth não carregado. Confirme a ordem dos scripts no HTML.");
      return;
    }

    firebase.auth().onAuthStateChanged((user)=>{
      if (user){ msg("Login OK. Carregando..."); showApp(); }
      else { showLogin(); }
    });

    const btn = $("btnLogin");
    if (btn){
      btn.addEventListener("click", async ()=>{
        try{
          msg("");
          const em = ($("email")?.value || "").trim();
          const pw = ($("senha")?.value || "").trim();
          if (!em || !pw){ msg("Informe e-mail e senha."); return; }
          await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
          await firebase.auth().signInWithEmailAndPassword(em, pw);
        }catch(e){
          console.error(e);
          const map = {
            "auth/operation-not-allowed": "E-mail/Senha não habilitado no Console.",
            "auth/user-not-found": "Usuário não encontrado.",
            "auth/wrong-password": "Senha incorreta.",
            "auth/invalid-email": "E-mail inválido.",
            "auth/too-many-requests": "Muitas tentativas. Tente mais tarde.",
            "auth/network-request-failed": "Falha de rede."
          };
          msg(map[e?.code] || (e?.message || String(e)));
        }
      });
    }

    const btnAnon = $("btnAnon");
    if (btnAnon){
      btnAnon.addEventListener("click", async ()=>{
        try{
          msg("");
          await firebase.auth().signInAnonymously();
        }catch(e){
          console.error(e);
          msg("Falha no login anônimo: " + (e?.message || String(e)));
        }
      });
    }

    // Debug overlay
    if (location.search.includes("debug=1")){
      const box = document.createElement('div');
      box.style.cssText="position:fixed;right:8px;bottom:8px;background:#eef;border:1px solid #99f;padding:8px;border-radius:8px;font:12px/1.4 sans-serif;z-index:99999";
      box.innerHTML = "<b>Debug Auth</b><br>host="+location.host+"<br>projeto="+(firebase.app().options.projectId||'?');
      document.body.appendChild(box);
      firebase.auth().onAuthStateChanged(u=>{
        box.innerHTML = "<b>Debug Auth</b><br>host="+location.host+"<br>projeto="+(firebase.app().options.projectId||'?')+"<br>uid="+(u?u.uid:"(deslogado)");
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
  else attach();
})();
