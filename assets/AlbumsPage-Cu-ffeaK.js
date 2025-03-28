import{c as T,R as Be,j as e,g as f,h as H,D as ze,i as We,B as b,k as Ge,l as G,r as l,a as Ve,b as q,m as E,e as k,P as N,d as D,n as He,o as qe,u as y,p as Ue,q as Ye,S as Qe,s as Ke,F as Xe,t as Ze,v as Je,w as U,L as et}from"./index-D37lV9WB.js";import{C as O,b as P,c as S,e as Y,a as I,d as Q}from"./card-D_AMUyVy.js";import{I as K}from"./input-4jV8SkSw.js";import{S as tt,a as at}from"./scroll-area-Or0-xtEm.js";import{U as ot,o as rt,r as st,d as nt}from"./db-BOYuZ1Cb.js";import{A as lt,X as it}from"./x-D05OOoTP.js";import{B as ct}from"./badge-BjmkDd0M.js";import{E as V}from"./eye-NfHiQlw3.js";/**
 * @license lucide-react v0.477.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dt=[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"12",cy:"5",r:"1",key:"gxeob9"}],["circle",{cx:"12",cy:"19",r:"1",key:"lyex9k"}]],ut=T("EllipsisVertical",dt);/**
 * @license lucide-react v0.477.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gt=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]],ft=T("Search",gt);/**
 * @license lucide-react v0.477.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mt=[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]],pt=T("Trash2",mt),X=Be.forwardRef(({children:t,className:a,...o},r)=>e.jsxs("button",{ref:r,className:f("group relative w-auto cursor-pointer overflow-hidden rounded-full border bg-background p-2 px-6 text-center font-semibold",a),...o,children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"h-2 w-2 rounded-full bg-primary transition-all duration-300 group-hover:scale-[100.8]"}),e.jsx("span",{className:"inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0",children:t})]}),e.jsxs("div",{className:"absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-primary-foreground opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100",children:[e.jsx("span",{children:t}),e.jsx(lt,{})]})]}));X.displayName="InteractiveHoverButton";const xt=({album:t,onRename:a,onDelete:o})=>e.jsx("div",{className:"relative group h-full",children:e.jsxs(O,{className:"flex flex-col h-full",children:[e.jsx(P,{className:"flex flex-row items-center justify-between pb-2",children:e.jsxs("div",{className:"flex flex-col w-full overflow-hidden",children:[e.jsx(S,{className:"text-lg truncate w-full",title:t.albumName,children:t.albumName}),e.jsxs(Y,{children:["Created at: ",new Date(t.createdAt).toLocaleDateString()]})]})}),e.jsx(I,{className:"pt-2 flex-grow",children:e.jsxs("p",{className:"text-sm flex items-center",children:[e.jsx(ct,{variant:"secondary",className:"mr-1",children:t.imageUrls.length})," ","images"]})}),e.jsxs(Q,{className:"pt-2 flex justify-between items-center mt-auto",children:[e.jsx(H,{to:`/albums/${t.id}`,className:"flex-1 mr-2",children:e.jsx(X,{className:"w-full",children:"View Album"})}),e.jsxs(ze,{children:[e.jsx(We,{asChild:!0,children:e.jsx(b,{variant:"ghost",size:"sm",className:"h-8 w-8 p-0",children:e.jsx(ut,{className:"h-4 w-4"})})}),e.jsxs(Ge,{align:"end",children:[e.jsxs(G,{onClick:()=>a(t.id),children:[e.jsx(tt,{className:"mr-2 h-4 w-4"}),"Rename"]}),e.jsxs(G,{onClick:()=>o(t.id),className:"text-red-600",children:[e.jsx(pt,{className:"mr-2 h-4 w-4"}),"Delete"]})]})]})]})]})});var M="Dialog",[Z,J]=q(M),[ht,m]=Z(M),ee=t=>{const{__scopeDialog:a,children:o,open:r,defaultOpen:s,onOpenChange:n,modal:i=!0}=t,c=l.useRef(null),u=l.useRef(null),[g=!1,p]=Ve({prop:r,defaultProp:s,onChange:n});return e.jsx(ht,{scope:a,triggerRef:c,contentRef:u,contentId:E(),titleId:E(),descriptionId:E(),open:g,onOpenChange:p,onOpenToggle:l.useCallback(()=>p(w=>!w),[p]),modal:i,children:o})};ee.displayName=M;var te="DialogTrigger",ae=l.forwardRef((t,a)=>{const{__scopeDialog:o,...r}=t,s=m(te,o),n=y(a,s.triggerRef);return e.jsx(N.button,{type:"button","aria-haspopup":"dialog","aria-expanded":s.open,"aria-controls":s.contentId,"data-state":L(s.open),...r,ref:n,onClick:D(t.onClick,s.onOpenToggle)})});ae.displayName=te;var F="DialogPortal",[vt,oe]=Z(F,{forceMount:void 0}),re=t=>{const{__scopeDialog:a,forceMount:o,children:r,container:s}=t,n=m(F,a);return e.jsx(vt,{scope:a,forceMount:o,children:l.Children.map(r,i=>e.jsx(k,{present:o||n.open,children:e.jsx(qe,{asChild:!0,container:s,children:i})}))})};re.displayName=F;var C="DialogOverlay",se=l.forwardRef((t,a)=>{const o=oe(C,t.__scopeDialog),{forceMount:r=o.forceMount,...s}=t,n=m(C,t.__scopeDialog);return n.modal?e.jsx(k,{present:r||n.open,children:e.jsx(Dt,{...s,ref:a})}):null});se.displayName=C;var Dt=l.forwardRef((t,a)=>{const{__scopeDialog:o,...r}=t,s=m(C,o);return e.jsx(Ye,{as:Qe,allowPinchZoom:!0,shards:[s.contentRef],children:e.jsx(N.div,{"data-state":L(s.open),...r,ref:a,style:{pointerEvents:"auto",...r.style}})})}),v="DialogContent",ne=l.forwardRef((t,a)=>{const o=oe(v,t.__scopeDialog),{forceMount:r=o.forceMount,...s}=t,n=m(v,t.__scopeDialog);return e.jsx(k,{present:r||n.open,children:n.modal?e.jsx(jt,{...s,ref:a}):e.jsx(Nt,{...s,ref:a})})});ne.displayName=v;var jt=l.forwardRef((t,a)=>{const o=m(v,t.__scopeDialog),r=l.useRef(null),s=y(a,o.contentRef,r);return l.useEffect(()=>{const n=r.current;if(n)return Ue(n)},[]),e.jsx(le,{...t,ref:s,trapFocus:o.open,disableOutsidePointerEvents:!0,onCloseAutoFocus:D(t.onCloseAutoFocus,n=>{var i;n.preventDefault(),(i=o.triggerRef.current)==null||i.focus()}),onPointerDownOutside:D(t.onPointerDownOutside,n=>{const i=n.detail.originalEvent,c=i.button===0&&i.ctrlKey===!0;(i.button===2||c)&&n.preventDefault()}),onFocusOutside:D(t.onFocusOutside,n=>n.preventDefault())})}),Nt=l.forwardRef((t,a)=>{const o=m(v,t.__scopeDialog),r=l.useRef(!1),s=l.useRef(!1);return e.jsx(le,{...t,ref:a,trapFocus:!1,disableOutsidePointerEvents:!1,onCloseAutoFocus:n=>{var i,c;(i=t.onCloseAutoFocus)==null||i.call(t,n),n.defaultPrevented||(r.current||(c=o.triggerRef.current)==null||c.focus(),n.preventDefault()),r.current=!1,s.current=!1},onInteractOutside:n=>{var u,g;(u=t.onInteractOutside)==null||u.call(t,n),n.defaultPrevented||(r.current=!0,n.detail.originalEvent.type==="pointerdown"&&(s.current=!0));const i=n.target;((g=o.triggerRef.current)==null?void 0:g.contains(i))&&n.preventDefault(),n.detail.originalEvent.type==="focusin"&&s.current&&n.preventDefault()}})}),le=l.forwardRef((t,a)=>{const{__scopeDialog:o,trapFocus:r,onOpenAutoFocus:s,onCloseAutoFocus:n,...i}=t,c=m(v,o),u=l.useRef(null),g=y(a,u);return Ke(),e.jsxs(e.Fragment,{children:[e.jsx(Xe,{asChild:!0,loop:!0,trapped:r,onMountAutoFocus:s,onUnmountAutoFocus:n,children:e.jsx(Ze,{role:"dialog",id:c.contentId,"aria-describedby":c.descriptionId,"aria-labelledby":c.titleId,"data-state":L(c.open),...i,ref:g,onDismiss:()=>c.onOpenChange(!1)})}),e.jsxs(e.Fragment,{children:[e.jsx(At,{titleId:c.titleId}),e.jsx(Ct,{contentRef:u,descriptionId:c.descriptionId})]})]})}),$="DialogTitle",ie=l.forwardRef((t,a)=>{const{__scopeDialog:o,...r}=t,s=m($,o);return e.jsx(N.h2,{id:s.titleId,...r,ref:a})});ie.displayName=$;var ce="DialogDescription",de=l.forwardRef((t,a)=>{const{__scopeDialog:o,...r}=t,s=m(ce,o);return e.jsx(N.p,{id:s.descriptionId,...r,ref:a})});de.displayName=ce;var ue="DialogClose",ge=l.forwardRef((t,a)=>{const{__scopeDialog:o,...r}=t,s=m(ue,o);return e.jsx(N.button,{type:"button",...r,ref:a,onClick:D(t.onClick,()=>s.onOpenChange(!1))})});ge.displayName=ue;function L(t){return t?"open":"closed"}var fe="DialogTitleWarning",[yt,me]=He(fe,{contentName:v,titleName:$,docsSlug:"dialog"}),At=({titleId:t})=>{const a=me(fe),o=`\`${a.contentName}\` requires a \`${a.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${a.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${a.docsSlug}`;return l.useEffect(()=>{t&&(document.getElementById(t)||console.error(o))},[o,t]),null},bt="DialogDescriptionWarning",Ct=({contentRef:t,descriptionId:a})=>{const r=`Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${me(bt).contentName}}.`;return l.useEffect(()=>{var n;const s=(n=t.current)==null?void 0:n.getAttribute("aria-describedby");a&&s&&(document.getElementById(a)||console.warn(r))},[r,t,a]),null},pe=ee,wt=ae,xe=re,he=se,ve=ne,De=ie,Rt=de,B=ge,je="AlertDialog",[_t,va]=q(je,[J]),h=J(),Ne=t=>{const{__scopeAlertDialog:a,...o}=t,r=h(a);return e.jsx(pe,{...r,...o,modal:!0})};Ne.displayName=je;var Et="AlertDialogTrigger",Ot=l.forwardRef((t,a)=>{const{__scopeAlertDialog:o,...r}=t,s=h(o);return e.jsx(wt,{...s,...r,ref:a})});Ot.displayName=Et;var Pt="AlertDialogPortal",ye=t=>{const{__scopeAlertDialog:a,...o}=t,r=h(a);return e.jsx(xe,{...r,...o})};ye.displayName=Pt;var St="AlertDialogOverlay",Ae=l.forwardRef((t,a)=>{const{__scopeAlertDialog:o,...r}=t,s=h(o);return e.jsx(he,{...s,...r,ref:a})});Ae.displayName=St;var j="AlertDialogContent",[It,Tt]=_t(j),be=l.forwardRef((t,a)=>{const{__scopeAlertDialog:o,children:r,...s}=t,n=h(o),i=l.useRef(null),c=y(a,i),u=l.useRef(null);return e.jsx(yt,{contentName:j,titleName:Ce,docsSlug:"alert-dialog",children:e.jsx(It,{scope:o,cancelRef:u,children:e.jsxs(ve,{role:"alertdialog",...n,...s,ref:c,onOpenAutoFocus:D(s.onOpenAutoFocus,g=>{var p;g.preventDefault(),(p=u.current)==null||p.focus({preventScroll:!0})}),onPointerDownOutside:g=>g.preventDefault(),onInteractOutside:g=>g.preventDefault(),children:[e.jsx(Je,{children:r}),e.jsx(Mt,{contentRef:i})]})})})});be.displayName=j;var Ce="AlertDialogTitle",we=l.forwardRef((t,a)=>{const{__scopeAlertDialog:o,...r}=t,s=h(o);return e.jsx(De,{...s,...r,ref:a})});we.displayName=Ce;var Re="AlertDialogDescription",_e=l.forwardRef((t,a)=>{const{__scopeAlertDialog:o,...r}=t,s=h(o);return e.jsx(Rt,{...s,...r,ref:a})});_e.displayName=Re;var kt="AlertDialogAction",Ee=l.forwardRef((t,a)=>{const{__scopeAlertDialog:o,...r}=t,s=h(o);return e.jsx(B,{...s,...r,ref:a})});Ee.displayName=kt;var Oe="AlertDialogCancel",Pe=l.forwardRef((t,a)=>{const{__scopeAlertDialog:o,...r}=t,{cancelRef:s}=Tt(Oe,o),n=h(o),i=y(a,s);return e.jsx(B,{...n,...r,ref:i})});Pe.displayName=Oe;var Mt=({contentRef:t})=>{const a=`\`${j}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${j}\` by passing a \`${Re}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${j}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`;return l.useEffect(()=>{var r;document.getElementById((r=t.current)==null?void 0:r.getAttribute("aria-describedby"))||console.warn(a)},[a,t]),null},Ft=Ne,$t=ye,Lt=Ae,Bt=be,zt=Ee,Wt=Pe,Gt=we,Vt=_e;function Ht({...t}){return e.jsx(Ft,{"data-slot":"alert-dialog",...t})}function qt({...t}){return e.jsx($t,{"data-slot":"alert-dialog-portal",...t})}function Ut({className:t,...a}){return e.jsx(Lt,{"data-slot":"alert-dialog-overlay",className:f("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",t),...a})}function Yt({className:t,...a}){return e.jsxs(qt,{children:[e.jsx(Ut,{}),e.jsx(Bt,{"data-slot":"alert-dialog-content",className:f("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",t),...a})]})}function Qt({className:t,...a}){return e.jsx("div",{"data-slot":"alert-dialog-header",className:f("flex flex-col gap-2 text-center sm:text-left",t),...a})}function Kt({className:t,...a}){return e.jsx("div",{"data-slot":"alert-dialog-footer",className:f("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",t),...a})}function Xt({className:t,...a}){return e.jsx(Gt,{"data-slot":"alert-dialog-title",className:f("text-lg font-semibold",t),...a})}function Zt({className:t,...a}){return e.jsx(Vt,{"data-slot":"alert-dialog-description",className:f("text-muted-foreground text-sm",t),...a})}function Jt({className:t,...a}){return e.jsx(zt,{className:f(U(),t),...a})}function ea({className:t,...a}){return e.jsx(Wt,{className:f(U({variant:"outline"}),t),...a})}const ta=({isOpen:t,onClose:a,onDelete:o})=>e.jsx(Ht,{open:t,onOpenChange:a,children:e.jsxs(Yt,{children:[e.jsxs(Qt,{children:[e.jsx(Xt,{children:"Are you sure?"}),e.jsx(Zt,{children:"This action cannot be undone. This will permanently delete the album and all its data."})]}),e.jsxs(Kt,{children:[e.jsx(ea,{children:"Cancel"}),e.jsx(Jt,{onClick:o,children:"Delete"})]})]})});function aa({...t}){return e.jsx(pe,{"data-slot":"dialog",...t})}function oa({...t}){return e.jsx(xe,{"data-slot":"dialog-portal",...t})}function ra({className:t,...a}){return e.jsx(he,{"data-slot":"dialog-overlay",className:f("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",t),...a})}function sa({className:t,children:a,...o}){return e.jsxs(oa,{"data-slot":"dialog-portal",children:[e.jsx(ra,{}),e.jsxs(ve,{"data-slot":"dialog-content",className:f("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",t),...o,children:[a,e.jsxs(B,{className:"ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",children:[e.jsx(it,{}),e.jsx("span",{className:"sr-only",children:"Close"})]})]})]})}function na({className:t,...a}){return e.jsx("div",{"data-slot":"dialog-header",className:f("flex flex-col gap-2 text-center sm:text-left",t),...a})}function la({className:t,...a}){return e.jsx("div",{"data-slot":"dialog-footer",className:f("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",t),...a})}function ia({className:t,...a}){return e.jsx(De,{"data-slot":"dialog-title",className:f("text-lg leading-none font-semibold",t),...a})}const ca=({isOpen:t,onClose:a,albumName:o,onRename:r,setAlbumName:s})=>e.jsx(aa,{open:t,onOpenChange:a,children:e.jsxs(sa,{children:[e.jsx(na,{children:e.jsx(ia,{children:"Rename Album"})}),e.jsx("div",{className:"py-4",children:e.jsx(K,{value:o,onChange:n=>s(n.target.value),placeholder:"Enter new album name"})}),e.jsxs(la,{children:[e.jsx(b,{variant:"outline",onClick:a,children:"Cancel"}),e.jsx(b,{onClick:r,children:"Save"})]})]})}),Da=()=>{const[t,a]=l.useState([]),[o,r]=l.useState(!0),[s,n]=l.useState(null),[i,c]=l.useState(!1),[u,g]=l.useState(""),[p,w]=l.useState(""),[z,Se]=l.useState([]),R=async()=>{r(!0);try{const _=(await rt()).transaction(["htmlFiles"],"readonly").objectStore("htmlFiles").getAll();_.onsuccess=()=>{const Le=_.result||[];a(Le),r(!1)},_.onerror=()=>{console.error("Error loading albums from IndexedDB"),r(!1),alert("Failed to load albums.  Check the console for details.")}}catch(d){console.error("IndexedDB error:",d),alert("Failed to access albums database.  Check the console for details."),r(!1)}};l.useEffect(()=>{R()},[]),l.useEffect(()=>{const d=t.filter(x=>x.albumName.toLowerCase().includes(p.toLowerCase()));Se(d)},[p,t]);const Ie=d=>{const x=t.find(W=>W.id===d);x&&(g(x.albumName),n(d),c(!0))},Te=d=>{n(d),A(!0)},[ke,A]=l.useState(!1),Me=async()=>{if(s!==null)try{await nt(s),await R(),A(!1)}catch(d){console.error("Error deleting album:",d),alert("Failed to delete album. Please check the console for details."),A(!1)}},Fe=async()=>{if(s===null||!u.trim())return;if(t.some(x=>x.albumName.toLowerCase()===u.toLowerCase()&&x.id!==s)){alert("Album name already exists. Please choose a different name.");return}try{await st(s,u),await R(),c(!1)}catch(x){console.error("Error renaming album:",x),alert("Failed to rename album. Please check the console for details."),c(!1)}},$e=d=>{w(d.target.value)};return o?e.jsx("div",{className:"container mx-auto p-4 max-w-4xl",children:e.jsxs(O,{children:[e.jsx(P,{children:e.jsxs(S,{className:"text-2xl font-bold flex items-center gap-2",children:[e.jsx(V,{size:24}),"Albums"]})}),e.jsxs(I,{className:"p-4 flex justify-center items-center",children:[e.jsx(et,{className:"h-6 w-6 animate-spin mr-2"})," Loading albums..."]})]})}):e.jsxs("div",{className:"container mx-auto p-4 max-w-4xl",children:[e.jsxs(O,{children:[e.jsxs(P,{children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs(S,{className:"text-2xl font-bold flex items-center gap-2",children:[e.jsx(V,{size:24}),"Albums"]}),e.jsxs("div",{className:"relative",children:[e.jsx(K,{type:"text",placeholder:"Search albums...",value:p,onChange:$e,className:"pr-10"}),e.jsx(ft,{className:"absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"})]})]}),e.jsx(Y,{children:"View and manage your saved albums."})]}),e.jsx(I,{className:"p-4",children:e.jsx(at,{className:"w-full h-[500px] rounded-md",children:e.jsx("div",{className:"grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-flow-row auto-rows-fr",children:z.length>0?z.map(d=>e.jsx(xt,{album:d,onRename:Ie,onDelete:Te},d.id)):e.jsx("div",{className:"col-span-full text-center py-8",children:"No matching albums found."})})})}),e.jsx(Q,{className:"p-4 border-t",children:e.jsx(H,{to:"/upload",children:e.jsxs(b,{variant:"outline",children:[e.jsx(ot,{size:16,className:"mr-2"}),"Back to Uploader"]})})})]}),e.jsx(ca,{isOpen:i,onClose:()=>c(!1),albumName:u,onRename:Fe,setAlbumName:g}),e.jsx(ta,{isOpen:ke,onClose:()=>A(!1),onDelete:Me})]})};export{Da as default};
