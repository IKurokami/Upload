import{j as r,a as s,r as l,l as d}from"./index-RCUVdnZG.js";import{P as o}from"./input-BkS6dkE6.js";function v({className:t,...e}){return r.jsx("textarea",{"data-slot":"textarea",className:s("border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",t),...e})}var u="Label",n=l.forwardRef((t,e)=>r.jsx(o.label,{...t,ref:e,onMouseDown:a=>{var i;a.target.closest("button, input, select, textarea")||((i=t.onMouseDown)==null||i.call(t,a),!a.defaultPrevented&&a.detail>1&&a.preventDefault())}}));n.displayName=u;var c=n;function b({className:t,...e}){return r.jsx(c,{"data-slot":"label",className:s("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",t),...e})}const g=d("relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",{variants:{variant:{default:"bg-card text-card-foreground",destructive:"text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90"}},defaultVariants:{variant:"default"}});function p({className:t,variant:e,...a}){return r.jsx("div",{"data-slot":"alert",role:"alert",className:s(g({variant:e}),t),...a})}function j({className:t,...e}){return r.jsx("div",{"data-slot":"alert-title",className:s("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",t),...e})}function w({className:t,...e}){return r.jsx("div",{"data-slot":"alert-description",className:s("text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",t),...e})}export{p as A,b as L,v as T,j as a,w as b};
