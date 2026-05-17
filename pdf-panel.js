(function () {
  "use strict";

  const PANEL_ID = "cpdf-panel";
  const TRIGGER_ID = "cpdf-trigger";
  const OVERLAY_ID = "cpdf-overlay";
  let panelOpen = false;

  const state = { range:"all", format:"pdf", theme:"light", thinking:false, scale:"1.0", pageSize:"A4", filename:"", title:"" };

  const sty = document.createElement("style");
  sty.textContent = [
    "#gpt-pdf-container{display:none!important}",
  ].join("\n");
  document.head.appendChild(sty);


  // Global registry: close all open popups except the one being opened
  const openPopups = new Set();
  function closeAllPopups(except) { openPopups.forEach(fn => { if (fn !== except) fn(); }); }

  const C = {
    ghostBtn: "inline-flex items-center justify-center relative isolate shrink-0 can-focus select-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none border-transparent transition font-base duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] h-8 w-8 rounded-md _fill_10ocf_9 _ghost_10ocf_96",
    primaryBtn: "inline-flex items-center justify-center relative isolate shrink-0 can-focus select-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none border-transparent transition font-base duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] h-9 px-4 py-2 rounded-lg min-w-[5rem] whitespace-nowrap _fill_10ocf_9 _primary_10ocf_44",
    row: "flex items-center justify-between gap-lg py-md",
    lblWrap: "flex min-w-0 flex-1 flex-col justify-center gap-1",
    lbl: "text-body text-primary",
    desc: "text-body text-muted",
    ctrl: "flex shrink-0 items-center",
    head: "text-heading-semibold text-primary",
    divide: "divide-y divide-alpha-1",
    segW: "relative inline-flex w-fit items-stretch h-control rounded bg-segment-track p-px",
    segT: "absolute rounded-[calc(var(--cds-radius)-1px)] bg-segment-thumb transition-[left,width] duration-base ease-snap motion-reduce:transition-none top-px bottom-px [box-shadow:inset_0_0_0_1px_var(--cds-border),0_1px_2px_0_rgb(0_0_0/0.05)]",
    segB: "cds-reset relative z-[1] inline-flex h-full items-center justify-center gap-1.5 select-none border-0 bg-transparent outline-none rounded-[calc(var(--cds-radius)-2px)] text-body hover:text-primary data-[checked]:text-primary disabled:opacity-50 disabled:hover:text-current transition-shadow duration-fast focus-visible:shadow-focus text-muted",
    segBI: "cds-reset relative z-[1] inline-flex h-full items-center justify-center gap-1.5 select-none border-0 bg-transparent outline-none rounded-[calc(var(--cds-radius)-2px)] text-body hover:text-primary data-[checked]:text-primary disabled:opacity-50 disabled:hover:text-current transition-shadow duration-fast focus-visible:shadow-focus text-muted aspect-square",
    swT: "cds-reset relative inline-flex shrink-0 rounded-full border-0 outline-none bg-switch-track hover:bg-switch-track-hover data-[checked]:bg-fill-accent data-[checked]:hover:bg-fill-accent-hover disabled:opacity-50 disabled:hover:bg-switch-track focus-visible:shadow-focus h-switch w-[calc(var(--cds-switch-h,20px)*1.8)] p-[2px]",
    swK: "block rounded-full bg-switch-knob shadow-sm transition-transform duration-snap ease-overshoot motion-reduce:transition-none size-[calc(var(--cds-switch-h,20px)-4px)] data-[checked]:translate-x-[calc(var(--cds-switch-h,20px)*0.8)]",
    input: "cds-input cds-reset h-control pl-sm rounded bg-fill-field focus-visible:bg-surface-popover has-[:focus-visible]:bg-surface-popover backdrop-blur-sm shadow-field-ring data-[invalid]:shadow-field-invalid text-body text-primary transition duration-fast pr-sm placeholder:text-muted outline-none enabled:[&:hover:not(:focus):not([data-invalid])]:shadow-field-hover focus-visible:shadow-focus disabled:opacity-50 w-56",
    cbxBtn: "cds-reset inline-flex h-control min-w-0 cursor-default items-center gap-1.5 rounded bg-transparent pl-sm pr-0.5 text-body text-primary outline-none transition duration-fast hover:bg-fill-ghost-hover focus-visible:shadow-focus",
    cbxChev: "pointer-events-none flex size-icon shrink-0 items-center justify-center text-muted",
  };

  const SVG = {
    dl: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2.5a.5.5 0 0 1 .5.5v8.793l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 0 1 .708-.708L9.5 11.793V3a.5.5 0 0 1 .5-.5M3.5 13a.5.5 0 0 1 .5.5V16a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-2.5a.5.5 0 0 1 1 0V16a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16v-2.5a.5.5 0 0 1 .5-.5"/></svg>`,
    x: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="m4.09 4.22.06-.07a.75.75 0 0 1 .98-.07l.07.06L10 8.94l4.8-4.8a.75.75 0 0 1 1.13.98l-.06.07L11.06 10l4.81 4.8a.75.75 0 0 1-.98 1.13l-.07-.06L10 11.06l-4.8 4.81a.75.75 0 0 1-1.13-.98l.06-.07L8.94 10 4.13 5.2a.75.75 0 0 1-.07-.98z"/></svg>`,
    chev: `<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06"/></svg>`,
  };
  // Anthropicons font glyphs
  const ICON_FONT = "font-family:var(--font-anthropicons,Anthropicons-Variable);font-feature-settings:'liga' 0;font-optical-sizing:auto;font-style:normal;font-variation-settings:normal;line-height:1;width:1em;height:1em;display:flex;align-items:center;justify-content:center;flex-shrink:0;user-select:none;font-size:20px;font-weight:433.3";
  const GLYPH = { sun: "", moon: "", sys: "" };

  function h(tag, a, ch) {
    const el = document.createElement(tag);
    if (a) for (const [k,v] of Object.entries(a)) {
      if (k==="style"&&typeof v==="object") Object.assign(el.style,v);
      else if (k==="cls") el.className=v;
      else if (k.startsWith("on")&&typeof v==="function") el.addEventListener(k.slice(2).toLowerCase(),v);
      else el.setAttribute(k,v);
    }
    if (ch!=null) {
      if (typeof ch==="string") el.textContent=ch;
      else if (Array.isArray(ch)) ch.forEach(c=>c&&el.appendChild(typeof c==="string"?document.createTextNode(c):c));
      else el.appendChild(ch);
    }
    return el;
  }

  function seg(opts, val, cb, iconOnly) {
    const w = h("div",{cls:C.segW,role:"radiogroup"});
    const th = h("div",{cls:C.segT,"aria-hidden":"true"});
    w.appendChild(th);
    const bs = [];
    opts.forEach(o=>{
      const b = h("button",{type:"button",role:"radio","aria-label":o.label,cls:iconOnly?C.segBI:C.segB,style:iconOnly?{}:{flex:"1",padding:"0 var(--cds-pad-md,12px)",whiteSpace:"nowrap"}});
      if (o.glyph) {
        const ic = h("span",{"data-cds":"Icon","aria-hidden":"true",style:ICON_FONT});
        ic.textContent = o.glyph;
        b.appendChild(ic);
      } else if (o.text) b.textContent=o.text;
      if (o.value===val){b.setAttribute("data-checked","");b.setAttribute("aria-checked","true");b.tabIndex=0;}
      else{b.setAttribute("aria-checked","false");b.tabIndex=-1;}
      b.addEventListener("click",()=>{
        cb(o.value);
        bs.forEach(x=>{if(x===b){x.setAttribute("data-checked","");x.setAttribute("aria-checked","true");x.tabIndex=0;}else{x.removeAttribute("data-checked");x.setAttribute("aria-checked","false");x.tabIndex=-1;}});
        pos();
      });
      w.appendChild(b);bs.push(b);
    });
    function pos(){requestAnimationFrame(()=>{const a=w.querySelector("[data-checked]");if(a){th.style.left=a.offsetLeft+"px";th.style.width=a.offsetWidth+"px";}});}
    new ResizeObserver(pos).observe(w);
    return w;
  }

  function sw(val, cb) {
    const b = h("button",{type:"button",role:"switch",cls:C.swT,"aria-checked":String(val)});
    if(val)b.setAttribute("data-checked","");
    const k = h("span",{cls:C.swK});if(val)k.setAttribute("data-checked","");
    b.appendChild(k);
    b.addEventListener("click",()=>{
      const n=b.getAttribute("aria-checked")!=="true";
      b.setAttribute("aria-checked",String(n));
      [b,k].forEach(el=>n?el.setAttribute("data-checked",""):el.removeAttribute("data-checked"));
      cb(n);
    });
    return b;
  }

  // Custom combobox — dropdown uses Claude's native Tailwind classes, fixed position
  function cbx(opts, val, cb) {
    const wrap = h("div",{style:{position:"relative"}});
    let isOpen=false, cur=val, raf=0;

    // Trigger — exact class from Chat font selector
    const btn = h("button",{type:"button",cls:C.cbxBtn,"aria-expanded":"false","aria-haspopup":"dialog",tabindex:"0"});
    const lab = h("span",{cls:"truncate"});
    // Chevron — using Anthropicons glyph  (same as "What best describes your work?" selector)
    const chevWrap = h("span",{"aria-hidden":"true",cls:"mr-0.5 shrink-0 text-muted transition-colors"});
    const chevIcon = h("span",{"data-cds":"Icon","aria-hidden":"true",style:ICON_FONT});
    chevIcon.textContent = "";
    chevWrap.appendChild(chevIcon);
    btn.appendChild(lab); btn.appendChild(chevWrap);

    // Dropdown — appended to body, uses Claude native classes
    const dd = h("div",{
      cls:"cds-root bg-surface-popover rounded-xl",
      "data-density":"comfortable",
      role:"listbox",
      style:{
        position:"fixed", zIndex:"100",
        padding:"6px 0", minWidth:"140px",
        maxHeight:"280px", overflowY:"auto",
        opacity:"0", pointerEvents:"none",
        transition:"opacity .1s ease",
        boxShadow:"var(--cds-shadow-popover, 0 8px 24px rgb(0 0 0/.12), 0 2px 6px rgb(0 0 0/.08))",
      },
    });
    document.body.appendChild(dd);

    function render(){
      dd.innerHTML="";
      opts.forEach(o=>{
        // Each item: flex row, h-control height, pad-sm horizontal, rounded, hover effect
        const it = h("div",{
          role:"option",
          cls:"flex items-center justify-between gap-sm px-md py-sm cursor-pointer rounded-md mx-1 text-body transition duration-fast hover:bg-fill-ghost-hover",
          "aria-selected": o.value===cur?"true":"false",
          style:{ color: o.value===cur ? "var(--cds-fill-accent,#2a78d6)" : "var(--cds-text-primary)" },
        });
        it.appendChild(h("span",{cls:"truncate"},o.label));
        if (o.value===cur) {
          // Checkmark using Anthropicons glyph
          const ck = h("span",{"data-cds":"Icon","aria-hidden":"true",style:ICON_FONT+";font-size:16px;color:var(--cds-fill-accent,#2a78d6)"});
          ck.textContent = ""; // checkmark glyph
          it.appendChild(ck);
        }
        it.addEventListener("click",e=>{
          e.stopPropagation(); cur=o.value; cb(o.value);
          lab.textContent=o.label; close(); render();
        });
        dd.appendChild(it);
      });
    }

    function pos(){
      const r=btn.getBoundingClientRect();
      const dh=dd.scrollHeight;
      const spaceBelow=window.innerHeight-r.bottom-8;
      const spaceAbove=r.top-8;
      let top, maxH;
      if(spaceBelow>=Math.min(dh,280)||spaceBelow>=spaceAbove){
        top=r.bottom+4; maxH=Math.min(280,spaceBelow);
      } else {
        top=r.top-Math.min(dh,spaceAbove)-4; maxH=Math.min(280,spaceAbove);
      }
      dd.style.top=top+"px";
      dd.style.right=(window.innerWidth-r.right)+"px";
      dd.style.left="auto";
      dd.style.minWidth=Math.max(r.width+16,140)+"px";
      dd.style.maxHeight=maxH+"px";
    }

    function track(){
      if(!isOpen)return;
      pos();
      raf=requestAnimationFrame(track);
    }

    function open(){closeAllPopups(close);isOpen=true;openPopups.add(close);render();pos();dd.style.opacity="1";dd.style.pointerEvents="auto";btn.setAttribute("aria-expanded","true");raf=requestAnimationFrame(track);}
    function close(){isOpen=false;openPopups.delete(close);dd.style.opacity="0";dd.style.pointerEvents="none";btn.setAttribute("aria-expanded","false");cancelAnimationFrame(raf);}

    btn.addEventListener("click",e=>{e.stopPropagation();isOpen?close():open();});
    document.addEventListener("click",()=>{if(isOpen)close();});

    lab.textContent=(opts.find(o=>o.value===val)||{}).label||"";
    render();
    wrap.appendChild(btn);
    return wrap;
  }

  function row(label, ctrl, desc) {
    const r = h("div",{role:"group",cls:C.row});
    const lw = h("div",{cls:C.lblWrap});
    lw.appendChild(h("div",{cls:C.lbl},label));
    if(desc) lw.appendChild(h("div",{cls:C.desc},desc));
    r.appendChild(lw);
    r.appendChild(h("div",{cls:C.ctrl},ctrl));
    return r;
  }

  function build() {
    // Use exact same wrapper as settings page: cds-root text-primary data-density=comfortable
    const p = h("div",{
      id:PANEL_ID,role:"dialog","aria-label":"Export chat","aria-modal":"true",
      cls:"cds-root text-primary",
      "data-density":"comfortable","data-mode":"light",
      style:{
        position:"fixed",zIndex:"50",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
        width:"min(480px,calc(100vw - 32px))",maxHeight:"calc(100vh - 64px)",overflowY:"auto",
        background:"var(--cds-surface-popover,#fff)",borderRadius:"16px",
        boxShadow:"var(--cds-shadow-popover,0 8px 24px rgb(0 0 0/.12),0 2px 6px rgb(0 0 0/.08))",
        padding:"24px 28px",
        fontSize:"var(--cds-text-body,14px)",lineHeight:"var(--cds-leading-body,20px)",
        opacity:"0",pointerEvents:"none",transition:"opacity .15s,transform .15s",
      },
    });

    // Detect dark mode
    if (document.documentElement.getAttribute("data-mode")==="dark") p.setAttribute("data-mode","dark");

    // Header
    const hdr = h("div",{style:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"8px"}});
    hdr.appendChild(h("h2",{cls:C.head,style:{margin:"0",fontSize:"18px",lineHeight:"24px"}},"Export Chat"));
    const xBtn = h("button",{type:"button",cls:C.ghostBtn,"aria-label":"Close",style:{margin:"-4px -4px 0 0"},onClick:()=>toggle(false)});
    xBtn.innerHTML=`<div style="width:20px;height:20px;display:flex;align-items:center;justify-content:center">${SVG.x}</div>`;
    hdr.appendChild(xBtn);
    p.appendChild(hdr);

    const rows = h("div",{cls:C.divide});

    // Range
    rows.appendChild(row("Range",
      seg([{value:"all",label:"All Msg",text:"All Msg"},{value:"claude",label:"Claude Only",text:"Claude Only"},{value:"select",label:"Select",text:"Select"}],
        state.range, v=>(state.range=v))
    ));

    // Format
    rows.appendChild(row("Format",
      seg([{value:"pdf",label:"PDF",text:"PDF"},{value:"md",label:"Markdown",text:"Markdown"},{value:"json",label:"JSON",text:"JSON"}],
        state.format, v=>(state.format=v))
    ));

    // Theme — Anthropicons font icons, exact same as Appearance switcher
    rows.appendChild(row("Theme",
      seg([{value:"light",label:"Light",glyph:GLYPH.sun},{value:"dark",label:"Dark",glyph:GLYPH.moon},{value:"auto",label:"Auto",glyph:GLYPH.sys}],
        state.theme, v=>(state.theme=v), true)
    ));

    // Thinking: toggle expand/collapse button + switch
    const thinkCtrl = h("div",{cls:"flex shrink-0 items-center gap-sm"});
    let thinkExpanded = false;
    const ecBtn = h("button",{type:"button",cls:C.ghostBtn,"aria-label":"Expand all thinking",style:{width:"28px",height:"28px",minWidth:"0"}});
    function updateEcBtn(){
      ecBtn.innerHTML = "";
      const ic = h("span",{"data-cds":"Icon","aria-hidden":"true",style:ICON_FONT+";font-size:16px"});
      ic.textContent = thinkExpanded ? "" : "";
      ecBtn.appendChild(ic);
      ecBtn.setAttribute("aria-label", thinkExpanded ? "Collapse all thinking" : "Expand all thinking");
    }
    updateEcBtn();
    ecBtn.addEventListener("click",()=>{
      thinkExpanded = !thinkExpanded;
      updateEcBtn();
      console.log("Thinking expanded:", thinkExpanded);
    });
    thinkCtrl.appendChild(ecBtn);
    thinkCtrl.appendChild(sw(state.thinking, v=>(state.thinking=v)));
    rows.appendChild(row("Include Thinking", thinkCtrl));

    // Scale
    rows.appendChild(row("Scale",
      cbx(["0.5","0.6","0.7","0.8","0.9","1.0","1.1","1.2","1.3","1.4","1.5"].map(v=>({value:v,label:v==="1.0"?"1.0× (Default)":v+"×"})),
        state.scale, v=>(state.scale=v))
    ));

    // Page Size
    rows.appendChild(row("Page Size",
      cbx(["A3","A4","A5","Letter","Legal","Continuous"].map(v=>({value:v,label:v})),
        state.pageSize, v=>(state.pageSize=v))
    ));

    // File Name
    const fn = h("input",{"data-cds":"TextInput",cls:C.input,type:"text",placeholder:"chat-export","aria-label":"File name"});
    fn.value=state.filename;fn.addEventListener("input",e=>(state.filename=e.target.value));
    rows.appendChild(row("File Name",fn));

    // Document Title
    const dt = h("input",{"data-cds":"TextInput",cls:C.input,type:"text",placeholder:"Optional","aria-label":"Document title"});
    dt.value=state.title;dt.addEventListener("input",e=>(state.title=e.target.value));
    rows.appendChild(row("Document Title",dt));

    p.appendChild(rows);

    // Footer: About (left) + Export (right)
    const ft = h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"20px"}});

    // About button + up-popover
    const aboutWrap = h("div",{style:{position:"relative"}});
    const aboutBtn = h("button",{type:"button",cls:C.ghostBtn.replace("w-8","").replace("h-8",""),
      style:{height:"32px",width:"auto",padding:"0 8px",gap:"4px",fontSize:"var(--cds-text-body,14px)"},
      "aria-label":"About"});
    aboutBtn.textContent = "About";

    const aboutDD = h("div",{
      cls:"cds-root bg-surface-popover rounded-xl",
      "data-density":"comfortable",
      style:{
        position:"fixed", zIndex:"100",
        padding:"8px 0", minWidth:"200px",
        opacity:"0", pointerEvents:"none",
        transition:"opacity .1s ease",
        boxShadow:"var(--cds-shadow-popover, 0 8px 24px rgb(0 0 0/.12), 0 2px 6px rgb(0 0 0/.08))",
      },
    });
    document.body.appendChild(aboutDD);

    const aboutLinks = [
      {label:"🚀 Request a Feature", url:"https://digitaltools.featurebase.app/en"},
      {label:"⭐ Rate on Chrome Store", url:"https://chromewebstore.google.com/detail/claude-to-pdf/mneopldolfcfoefkmedgdclnabpjkegk/reviews"},
      {label:"✉️ Support: wondercat0778@outlook.com", url:"mailto:wondercat0778@outlook.com"},
    ];
    aboutLinks.forEach(lnk => {
      const a = h("a",{
        href:lnk.url, target:"_blank", rel:"noreferrer noopener",
        cls:"flex items-center gap-sm px-md py-sm cursor-pointer rounded-md mx-1 text-body text-primary transition duration-fast hover:bg-fill-ghost-hover",
        style:{textDecoration:"none",display:"flex",whiteSpace:"nowrap"},
      }, lnk.label);
      aboutDD.appendChild(a);
    });

    let aboutOpen = false;
    function posAbout(){
      const r = aboutBtn.getBoundingClientRect();
      aboutDD.style.left = r.left + "px";
      aboutDD.style.bottom = (window.innerHeight - r.top + 4) + "px";
      aboutDD.style.top = "auto";
    }
    let aboutRaf = 0;
    function trackAbout(){ if(!aboutOpen)return; posAbout(); aboutRaf=requestAnimationFrame(trackAbout); }
    function openAbout(){ closeAllPopups(closeAbout); aboutOpen=true; openPopups.add(closeAbout); posAbout(); aboutDD.style.opacity="1"; aboutDD.style.pointerEvents="auto"; aboutRaf=requestAnimationFrame(trackAbout); }
    function closeAbout(){ aboutOpen=false; openPopups.delete(closeAbout); aboutDD.style.opacity="0"; aboutDD.style.pointerEvents="none"; cancelAnimationFrame(aboutRaf); }
    aboutBtn.addEventListener("click",e=>{e.stopPropagation();aboutOpen?closeAbout():openAbout();});
    document.addEventListener("click",()=>{if(aboutOpen)closeAbout();});

    aboutWrap.appendChild(aboutBtn);
    ft.appendChild(aboutWrap);
    ft.appendChild(h("button",{type:"button",cls:C.primaryBtn,onClick:()=>{console.log("Export:",JSON.parse(JSON.stringify(state)));toggle(false);}},"Export"));
    p.appendChild(ft);
    return p;
  }

  function ensureOv(){
    let o=document.getElementById(OVERLAY_ID);
    if(!o){o=h("div",{id:OVERLAY_ID,style:{position:"fixed",inset:"0",zIndex:"49",background:"var(--cds-backdrop,rgb(0 0 0/.4))",opacity:"0",pointerEvents:"none",transition:"opacity .15s"},onClick:()=>toggle(false)});document.body.appendChild(o);}
    return o;
  }

  function toggle(open){
    panelOpen=typeof open==="boolean"?open:!panelOpen;
    let p=document.getElementById(PANEL_ID);
    if(!p){p=build();document.body.appendChild(p);}
    const ov=ensureOv();
    if(panelOpen){
      sync();
      // Match dark mode
      const mode=document.documentElement.getAttribute("data-mode")||"light";
      p.setAttribute("data-mode",mode);
      ov.style.opacity="1";ov.style.pointerEvents="auto";
      p.style.opacity="1";p.style.pointerEvents="auto";p.style.transform="translate(-50%,-50%) scale(1)";
    } else {
      ov.style.opacity="0";ov.style.pointerEvents="none";
      p.style.opacity="0";p.style.pointerEvents="none";p.style.transform="translate(-50%,-50%) scale(.97)";
      closeAllPopups();
    }
  }

  function sync(){
    const el=document.querySelector('[data-testid="chat-title-button"]')||document.querySelector('[data-testid="page-header"] .truncate.text-text-300');
    const t=el?.textContent?.trim()||document.title?.replace(/ [-–] Claude$/,"").trim()||"";
    if(t&&t!=="Claude"){state.title=t;state.filename=t;const ins=document.querySelectorAll(`#${PANEL_ID} input[data-cds="TextInput"]`);if(ins[0])ins[0].value=t;if(ins[1])ins[1].value=t;}
  }

  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&panelOpen)toggle(false);});

  function inject(){
    if(document.getElementById(TRIGGER_ID))return;
    const a=document.querySelector('[data-testid="chat-actions"]')||document.querySelector('[data-testid="wiggle-controls-actions"]');
    if(!a)return;
    const b=h("button",{id:TRIGGER_ID,type:"button",cls:C.ghostBtn,"aria-label":"Export chat",onClick:()=>toggle()});
    b.innerHTML=`<div style="width:20px;height:20px;display:flex;align-items:center;justify-content:center">${SVG.dl}</div>`;
    a.prepend(b);
  }

  let dbt=0;
  new MutationObserver(()=>{clearTimeout(dbt);dbt=setTimeout(inject,120);}).observe(document.body,{childList:true,subtree:true});
  inject();
})();
