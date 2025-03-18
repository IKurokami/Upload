/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _ extends Error{constructor(t){super(`[GoogleGenerativeAI Error]: ${t}`)}}class M extends _{constructor(t,n,o,E){super(t),this.status=n,this.statusText=o,this.errorDetails=E}}class I extends _{}class P extends _{}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const m="https://generativelanguage.googleapis.com",Y="v1beta",B="0.24.0",w="genai-js";var N;(function(e){e.GENERATE_CONTENT="generateContent",e.STREAM_GENERATE_CONTENT="streamGenerateContent",e.COUNT_TOKENS="countTokens",e.EMBED_CONTENT="embedContent",e.BATCH_EMBED_CONTENTS="batchEmbedContents"})(N||(N={}));function F(e){const t=[];return e!=null&&e.apiClient&&t.push(e.apiClient),t.push(`${w}/${B}`),t.join(" ")}async function K(e,t,n=fetch){let o;try{o=await n(e,t)}catch(E){b(E,e)}return o.ok||await y(o,e),o}function b(e,t){let n=e;throw n.name==="AbortError"?(n=new P(`Request aborted when fetching ${t.toString()}: ${e.message}`),n.stack=e.stack):e instanceof M||e instanceof I||(n=new _(`Error fetching from ${t.toString()}: ${e.message}`),n.stack=e.stack),n}async function y(e,t){let n="",o;try{const E=await e.json();n=E.error.message,E.error.details&&(n+=` ${JSON.stringify(E.error.details)}`,o=E.error.details)}catch{}throw new M(`Error fetching from ${t.toString()}: [${e.status} ${e.statusText}] ${n}`,e.status,e.statusText,o)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var s;(function(e){e.UPLOAD="upload",e.LIST="list",e.GET="get",e.DELETE="delete",e.UPDATE="update",e.CREATE="create"})(s||(s={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $={[s.UPLOAD]:"POST",[s.LIST]:"GET",[s.GET]:"GET",[s.DELETE]:"DELETE",[s.UPDATE]:"PATCH",[s.CREATE]:"POST"};class V{constructor(t,n,o){this.task=t,this.apiKey=n,this.requestOptions=o}appendPath(t){this._url.pathname=this._url.pathname+`/${t}`}appendParam(t,n){this._url.searchParams.append(t,n)}toString(){return this._url.toString()}}class A extends V{constructor(t,n,o){var E,r;super(t,n,o),this.task=t,this.apiKey=n,this.requestOptions=o;const i=((E=this.requestOptions)===null||E===void 0?void 0:E.apiVersion)||Y;let a=((r=this.requestOptions)===null||r===void 0?void 0:r.baseUrl)||m;this.task===s.UPLOAD&&(a+="/upload"),a+=`/${i}/files`,this._url=new URL(a)}}function T(e){var t;const n=new Headers;n.append("x-goog-api-client",F(e.requestOptions)),n.append("x-goog-api-key",e.apiKey);let o=(t=e.requestOptions)===null||t===void 0?void 0:t.customHeaders;if(o){if(!(o instanceof Headers))try{o=new Headers(o)}catch(E){throw new I(`unable to convert customHeaders value ${JSON.stringify(o)} to Headers: ${E.message}`)}for(const[E,r]of o.entries()){if(E==="x-goog-api-key")throw new I(`Cannot set reserved header name ${E}`);if(E==="x-goog-api-client")throw new I(`Header name ${E} can only be set using the apiClient field`);n.append(E,r)}}return n}async function c(e,t,n,o=fetch){const E={method:$[e.task],headers:t};n&&(E.body=n);const r=x(e.requestOptions);return r&&(E.signal=r),K(e.toString(),E,o)}function x(e){if((e==null?void 0:e.signal)!==void 0||(e==null?void 0:e.timeout)>=0){const t=new AbortController;return(e==null?void 0:e.timeout)>=0&&setTimeout(()=>t.abort(),e.timeout),e.signal&&e.signal.addEventListener("abort",()=>{t.abort()}),t.signal}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class W{constructor(t,n={}){this.apiKey=t,this._requestOptions=n}async uploadFile(t,n){const o=t,E=new A(s.UPLOAD,this.apiKey,this._requestOptions),r=T(E),i=j();r.append("X-Goog-Upload-Protocol","multipart"),r.append("Content-Type",`multipart/related; boundary=${i}`);const O=X(n),a=JSON.stringify({file:O}),H="--"+i+`\r
Content-Type: application/json; charset=utf-8\r
\r
`+a+`\r
--`+i+`\r
Content-Type: `+n.mimeType+`\r
\r
`,h=`\r
--`+i+"--",v=new Blob([H,o,h]);return(await c(E,r,v)).json()}async listFiles(t,n={}){const o=Object.assign(Object.assign({},this._requestOptions),n),E=new A(s.LIST,this.apiKey,o);t!=null&&t.pageSize&&E.appendParam("pageSize",t.pageSize.toString()),t!=null&&t.pageToken&&E.appendParam("pageToken",t.pageToken);const r=T(E);return(await c(E,r)).json()}async getFile(t,n={}){const o=Object.assign(Object.assign({},this._requestOptions),n),E=new A(s.GET,this.apiKey,o);E.appendPath(l(t));const r=T(E);return(await c(E,r)).json()}async deleteFile(t){const n=new A(s.DELETE,this.apiKey,this._requestOptions);n.appendPath(l(t));const o=T(n);await c(n,o)}}function l(e){if(e.startsWith("files/"))return e.split("files/")[1];if(!e)throw new _(`Invalid fileId ${e}. Must be in the format "files/filename" or "filename"`);return e}function j(){let e="";for(let t=0;t<2;t++)e=e+Math.random().toString().slice(2);return e}function X(e){if(!e.mimeType)throw new I("Must provide a mimeType.");const t={mimeType:e.mimeType,displayName:e.displayName};return e.name&&(t.name=e.name.includes("/")?e.name:`files/${e.name}`),t}var C;(function(e){e.STATE_UNSPECIFIED="STATE_UNSPECIFIED",e.PROCESSING="PROCESSING",e.ACTIVE="ACTIVE",e.FAILED="FAILED"})(C||(C={}));var u;(function(e){e.STRING="string",e.NUMBER="number",e.INTEGER="integer",e.BOOLEAN="boolean",e.ARRAY="array",e.OBJECT="object"})(u||(u={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var S;(function(e){e.LANGUAGE_UNSPECIFIED="language_unspecified",e.PYTHON="python"})(S||(S={}));var d;(function(e){e.OUTCOME_UNSPECIFIED="outcome_unspecified",e.OUTCOME_OK="outcome_ok",e.OUTCOME_FAILED="outcome_failed",e.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded"})(d||(d={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var R;(function(e){e.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",e.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",e.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",e.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",e.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",e.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY"})(R||(R={}));var p;(function(e){e.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",e.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",e.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",e.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",e.BLOCK_NONE="BLOCK_NONE"})(p||(p={}));var L;(function(e){e.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",e.NEGLIGIBLE="NEGLIGIBLE",e.LOW="LOW",e.MEDIUM="MEDIUM",e.HIGH="HIGH"})(L||(L={}));var f;(function(e){e.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",e.SAFETY="SAFETY",e.OTHER="OTHER"})(f||(f={}));var D;(function(e){e.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",e.STOP="STOP",e.MAX_TOKENS="MAX_TOKENS",e.SAFETY="SAFETY",e.RECITATION="RECITATION",e.LANGUAGE="LANGUAGE",e.BLOCKLIST="BLOCKLIST",e.PROHIBITED_CONTENT="PROHIBITED_CONTENT",e.SPII="SPII",e.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",e.OTHER="OTHER"})(D||(D={}));var g;(function(e){e.TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",e.RETRIEVAL_QUERY="RETRIEVAL_QUERY",e.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",e.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",e.CLASSIFICATION="CLASSIFICATION",e.CLUSTERING="CLUSTERING"})(g||(g={}));var U;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.AUTO="AUTO",e.ANY="ANY",e.NONE="NONE"})(U||(U={}));var G;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.MODE_DYNAMIC="MODE_DYNAMIC"})(G||(G={}));export{S as ExecutableCodeLanguage,C as FileState,U as FunctionCallingMode,W as GoogleAIFileManager,d as Outcome,u as SchemaType};
