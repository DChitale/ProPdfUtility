document.addEventListener("DOMContentLoaded",()=>{let{PDFDocument:e,rgb:t,StandardFonts:a,degrees:i}=PDFLib,r=document.getElementById("tool-grid"),l=document.getElementById("tool-workspace-container"),o=document.getElementById("tool-workspace"),n=document.getElementById("current-tool-title"),s=document.getElementById("back-to-tools"),d=document.getElementById("darkModeToggle"),c=document.getElementById("loader"),p=document.getElementById("loader-message"),u=document.getElementById("alert-container"),g=document.getElementById("drag-drop-overlay"),m=[{id:"merge-pdf",name:"Merge PDF",description:"Combine multiple PDF files into one single document."},{id:"split-pdf",name:"Split PDF",description:"Extract a range of pages or split each page into a separate PDF."},{id:"compress-pdf",name:"Compress PDF",description:"Reduce PDF file size (basic optimization & metadata removal)."},{id:"add-watermark",name:"Add Watermark",description:"Overlay text or image watermarks onto your PDF."},{id:"rotate-pdf",name:"Rotate PDF",description:"Rotate all or selected pages in your PDF document."},{id:"protect-pdf",name:"Protect PDF",description:"Encrypt and add a password to your PDF file."},{id:"unlock-pdf",name:"Unlock PDF",description:"Remove password protection from a PDF (password required)."},{id:"pdf-to-image",name:"PDF to Image",description:"Convert PDF pages to PNG, JPG, or WEBP images."},{id:"image-to-pdf",name:"Image to PDF",description:"Convert JPG, PNG, and other images into a PDF file."},{id:"reorder-pdf",name:"Reorder PDF Pages",description:"Visually rearrange pages in your PDF document."},{id:"add-page-numbers",name:"Add Page Numbers",description:"Insert page numbers into your PDF header or footer."},{id:"extract-images",name:"Extract Images from PDF",description:"Pull out images embedded within a PDF file (supports common formats)."},{id:"edit-metadata",name:"Edit PDF Metadata",description:"Modify title, author, subject, keywords of a PDF."},{id:"html-to-pdf",name:"HTML to PDF",description:"Convert simple HTML content to a PDF document."},{id:"esign-pdf",name:"eSign PDF",description:"Sign your PDF document digitally using touch, mouse, or image."},];function f(){y(),w(),D(),s.addEventListener("click",v)}function y(){r.innerHTML="",m.forEach(e=>{let t=document.createElement("div");t.className="tool-card",t.innerHTML=`
                <h2>${e.name}</h2>
                <p>${e.description}</p>
                <button data-tool-id="${e.id}">Open Tool</button>
            `,t.querySelector("button").addEventListener("click",()=>h(e)),r.appendChild(t)})}function v(){l.style.display="none",r.style.display="grid",n.textContent="",o.innerHTML="",S=null}function h(e){r.style.display="none",l.style.display="block",n.textContent=e.name,o.innerHTML="";let t=_[e.id];t?t(o):(o.innerHTML=`<p>Tool "${e.name}" is under development.</p>`,$(`Tool "${e.name}" is under development.`,"info"))}function w(){let e=localStorage.getItem("theme");"dark"===e&&(document.documentElement.setAttribute("data-theme","dark"),d.checked=!0),d.addEventListener("change",()=>{d.checked?(document.documentElement.setAttribute("data-theme","dark"),localStorage.setItem("theme","dark")):(document.documentElement.removeAttribute("data-theme"),localStorage.setItem("theme","light"))})}function b(e="Processing..."){p.textContent=e,c.style.display="flex"}function P(){c.style.display="none"}function $(e,t="info",a=5e3){let i=document.createElement("div");i.className=`alert ${t}`,i.textContent=e,u.appendChild(i),setTimeout(()=>{i.style.animationName="hideAlert",i.style.animationDuration="0.5s",i.style.animationFillMode="forwards",setTimeout(()=>i.remove(),500)},a-500)}let S=null;function D(){["dragenter","dragover","dragleave","drop"].forEach(e=>{document.body.addEventListener(e,E,!1)}),["dragenter","dragover"].forEach(e=>{document.body.addEventListener(e,()=>{"block"===l.style.display&&S&&g.classList.add("active")},!1)}),["dragleave","drop"].forEach(e=>{document.body.addEventListener(e,()=>{g.classList.remove("active")},!1)}),document.body.addEventListener("drop",x,!1)}function E(e){e.preventDefault(),e.stopPropagation()}function x(e){if(!S)return;let t=e.dataTransfer,a=t.files;a.length>0&&S(a)}async function L(e){return new Promise((t,a)=>{let i=new FileReader;i.onload=()=>t(i.result),i.onerror=a,i.readAsArrayBuffer(e)})}function k(e,t,a="Download File"){let i=URL.createObjectURL(e),r=document.createElement("a");return r.href=i,r.download=t,r.textContent=a,r.className="tool-button",r.style.display="inline-block",r.style.marginTop="1rem",r.style.marginRight="0.5rem",r.addEventListener("click",()=>{setTimeout(()=>URL.revokeObjectURL(i),100)}),r}function F(e,t,a=e.multiple){let i;i=e.files.length>0?Array.from(e.files).map(e=>e.name).join(", "):"No files selected.";let r=t.querySelector(".file-list-display");r||((r=document.createElement("p")).className="file-list-display",r.style.marginTop="0.5rem",r.style.fontSize="0.9em",e.nextSibling?t.insertBefore(r,e.nextSibling):t.appendChild(r)),r.textContent=`Selected: ${i}`}let _={async "merge-pdf"(t){t.innerHTML=`
                <div class="form-group">
                    <label for="merge-files">Select PDF files to merge (order matters):</label>
                    <input type="file" id="merge-files" accept=".pdf" multiple>
                    <div class="file-list"></div>
                </div>
                <button id="merge-action" class="tool-button">Merge PDFs</button>
                <div id="merge-result"></div>
            `;let a=t.querySelector("#merge-files"),i=t.querySelector(".file-list"),r=t.querySelector("#merge-action"),l=t.querySelector("#merge-result");S=e=>{a.files=e,o()};let o=()=>{i.innerHTML="",Array.from(a.files).forEach(e=>{let t=document.createElement("div");t.className="file-list-item",t.textContent=e.name,i.appendChild(t)}),0===a.files.length&&(i.innerHTML='<p class="file-list-display" style="margin-top: 0.5rem; font-size: 0.9em;">No files selected.</p>')};a.addEventListener("change",o),r.addEventListener("click",async()=>{if(a.files.length<2){$("Please select at least two PDF files to merge.","error");return}b("Merging PDFs..."),l.innerHTML="";try{let t=await e.create();for(let i of a.files){let r=await L(i),o=await e.load(r,{ignoreEncryption:!0}),n=await t.copyPages(o,o.getPageIndices());n.forEach(e=>t.addPage(e))}let s=await t.save(),d=new Blob([s],{type:"application/pdf"}),c=k(d,"merged.pdf","Download Merged PDF");l.appendChild(c),$("PDFs merged successfully!","success")}catch(p){console.error("Error merging PDFs:",p),$(`Error merging PDFs: ${p.message}`,"error")}finally{P()}})},async "split-pdf"(t){t.innerHTML=`
                <div class="form-group">
                    <label for="split-file">Select PDF file to split:</label>
                    <input type="file" id="split-file" accept=".pdf">
                    <div class="file-list-container"></div> <!-- Container for file name display -->
                </div>
                <div class="form-group">
                    <label for="split-ranges">Page ranges (e.g., 1-3, 5, 7-end):</label>
                    <input type="text" id="split-ranges" placeholder="1-3, 5, 7-end">
                </div>
                 <div class="form-group">
                    <input type="checkbox" id="split-individual-pages" name="split-individual-pages">
                    <label for="split-individual-pages" style="display:inline; font-weight:normal;">Split all pages into individual PDFs</label>
                </div>
                <button id="split-action" class="tool-button">Split PDF</button>
                <div id="split-result"></div>
            `;let a=t.querySelector("#split-file"),i=t.querySelector(".file-list-container"),r=t.querySelector("#split-ranges"),l=t.querySelector("#split-individual-pages"),o=t.querySelector("#split-action"),n=t.querySelector("#split-result");S=e=>{e.length>0&&(a.files=e,F(a,i))},a.addEventListener("change",()=>F(a,i)),o.addEventListener("click",async()=>{if(!a.files[0]){$("Please select a PDF file.","error");return}let t=l.checked,i=r.value;if(!t&&!i){$('Please enter page ranges or check "Split all pages".',"error");return}b("Splitting PDF..."),n.innerHTML="";try{let o=await L(a.files[0]),s=await e.load(o,{ignoreEncryption:!0}),d=s.getPageCount();if(t){for(let c=0;c<d;c++){let p=await e.create(),[u]=await p.copyPages(s,[c]);p.addPage(u);let g=await p.save(),m=new Blob([g],{type:"application/pdf"}),f=k(m,`${a.files[0].name.replace(".pdf","")}_page_${c+1}.pdf`,`Download Page ${c+1}`);n.appendChild(f),(c+1)%3==0&&n.appendChild(document.createElement("br"))}$("PDF split into individual pages successfully!","success")}else{let y=new Set;if(i.split(",").forEach(e=>{if((e=e.trim()).includes("-")){let[t,a]=e.split("-"),i=parseInt(t.trim(),10),r="end"===a.trim().toLowerCase()?d:parseInt(a.trim(),10);for(let l=i;l<=r;l++)l>=1&&l<=d&&y.add(l-1)}else{let o=parseInt(e.trim(),10);o>=1&&o<=d&&y.add(o-1)}}),0===y.size){$("No valid pages found in ranges.","error"),P();return}let v=await e.create(),h=Array.from(y).sort((e,t)=>e-t),w=await v.copyPages(s,h);w.forEach(e=>v.addPage(e));let S=await v.save(),D=new Blob([S],{type:"application/pdf"}),E=k(D,`${a.files[0].name.replace(".pdf","")}_split.pdf`,"Download Split PDF");n.appendChild(E),$("PDF split according to ranges successfully!","success")}}catch(x){console.error("Error splitting PDF:",x),$(`Error splitting PDF: ${x.message}`,"error")}finally{P()}})},"compress-pdf"(t){t.innerHTML=`
                <p><strong>Basic PDF Optimization</strong></p>
                <div class="form-group">
                    <label for="compress-file">Select PDF file:</label>
                    <input type="file" id="compress-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div class="form-group">
                    <input type="checkbox" id="remove-metadata-compress" checked>
                    <label for="remove-metadata-compress" style="display:inline; font-weight:normal;">Remove metadata (Title, Author, etc.)</label>
                </div>
                <button id="compress-action" class="tool-button">Optimize PDF</button>
                <div id="compress-result"></div>
                <p><small>Note: Client-side PDF compression is limited. This tool re-saves the document and optionally removes metadata, which can reduce file size. For advanced compression, server-side tools are usually needed.</small></p>
            `;let a=t.querySelector("#compress-file"),i=t.querySelector(".file-list-container"),r=t.querySelector("#remove-metadata-compress"),l=t.querySelector("#compress-action"),o=t.querySelector("#compress-result");S=e=>{e.length>0&&(a.files=e,F(a,i))},a.addEventListener("change",()=>F(a,i)),l.addEventListener("click",async()=>{if(!a.files[0]){$("Please select a PDF file.","error");return}b("Optimizing PDF..."),o.innerHTML="";try{let t=await L(a.files[0]),i=t.byteLength,l=await e.load(t,{ignoreEncryption:!0});r.checked&&(l.setTitle(""),l.setAuthor(""),l.setSubject(""),l.setKeywords([]),l.setProducer("Pro PDF Utility"),l.setCreator(""));let n=await l.save(),s=n.byteLength,d=i>0?((i-s)/i*100).toFixed(2):0,c=new Blob([n],{type:"application/pdf"}),p=k(c,`optimized_${a.files[0].name}`,"Download Optimized PDF");o.appendChild(p),o.appendChild(document.createElement("p")).textContent=`Original size: ${(i/1024).toFixed(2)} KB. New size: ${(s/1024).toFixed(2)} KB. Reduction: ${d}%`,$("PDF optimization attempted.","success")}catch(u){console.error("Error optimizing PDF:",u),$(`Error optimizing PDF: ${u.message}`,"error")}finally{P()}})},async "add-watermark"(r){r.innerHTML=`
                <div class="form-group">
                    <label for="watermark-file">Select PDF file:</label>
                    <input type="file" id="watermark-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div class="form-group">
                    <label for="watermark-text">Watermark Text:</label>
                    <input type="text" id="watermark-text" value="CONFIDENTIAL">
                </div>
                <div class="form-group">
                    <label for="watermark-size">Font Size:</label>
                    <input type="number" id="watermark-size" value="50">
                </div>
                <div class="form-group">
                    <label for="watermark-opacity">Opacity (0.0 - 1.0):</label>
                    <input type="number" id="watermark-opacity" value="0.3" step="0.1" min="0" max="1">
                </div>
                 <div class="form-group">
                    <label for="watermark-angle">Rotation Angle (degrees):</label>
                    <input type="number" id="watermark-angle" value="45" step="1">
                </div>
                <button id="watermark-action" class="tool-button">Add Watermark</button>
                <div id="watermark-result"></div>
            `;let l=r.querySelector("#watermark-file"),o=r.querySelector(".file-list-container"),n=r.querySelector("#watermark-text"),s=r.querySelector("#watermark-size"),d=r.querySelector("#watermark-opacity"),c=r.querySelector("#watermark-angle"),p=r.querySelector("#watermark-action"),u=r.querySelector("#watermark-result");S=e=>{e.length>0&&(l.files=e,F(l,o))},l.addEventListener("change",()=>F(l,o)),p.addEventListener("click",async()=>{if(!l.files[0]){$("Please select a PDF file.","error");return}let r=n.value;if(!r){$("Please enter watermark text.","error");return}let o=parseInt(s.value),p=parseFloat(d.value),g=parseInt(c.value);b("Adding watermark..."),u.innerHTML="";try{let m=await L(l.files[0]),f=await e.load(m,{ignoreEncryption:!0}),y=await f.embedFont(a.HelveticaBold),v=f.getPages();for(let h of v){let{width:w,height:S}=h.getSize(),D=y.widthOfTextAtSize(r,o);h.drawText(r,{x:(w-D)/2,y:S/2-o/3,size:o,font:y,color:t(.75,.75,.75),opacity:p,rotate:i(g)})}let E=await f.save(),x=new Blob([E],{type:"application/pdf"}),F=k(x,`watermarked_${l.files[0].name}`,"Download Watermarked PDF");u.appendChild(F),$("Watermark added successfully!","success")}catch(_){console.error("Error adding watermark:",_),$(`Error adding watermark: ${_.message}`,"error")}finally{P()}})},"rotate-pdf"(t){t.innerHTML=`
                <div class="form-group">
                    <label for="rotate-file">Select PDF file:</label>
                    <input type="file" id="rotate-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div class="form-group">
                    <label for="rotate-pages">Pages to rotate (e.g., all, 1, 3-5, 1,3,5):</label>
                    <input type="text" id="rotate-pages" value="all">
                </div>
                <div class="form-group">
                    <label for="rotate-angle">Rotation Angle:</label>
                    <select id="rotate-angle">
                        <option value="90">90\xb0 Clockwise</option>
                        <option value="180">180\xb0</option>
                        <option value="270">270\xb0 Clockwise (90\xb0 Anti-Clockwise)</option>
                    </select>
                </div>
                <button id="rotate-action" class="tool-button">Rotate PDF</button>
                <div id="rotate-result"></div>
            `;let a=t.querySelector("#rotate-file"),r=t.querySelector(".file-list-container"),l=t.querySelector("#rotate-pages"),o=t.querySelector("#rotate-angle"),n=t.querySelector("#rotate-action"),s=t.querySelector("#rotate-result");S=e=>{e.length>0&&(a.files=e,F(a,r))},a.addEventListener("change",()=>F(a,r)),n.addEventListener("click",async()=>{if(!a.files[0]){$("Please select a PDF file.","error");return}let t=l.value.trim(),r=parseInt(o.value,10);if(!t){$("Please specify pages to rotate.","error");return}b("Rotating PDF pages..."),s.innerHTML="";try{let n=await L(a.files[0]),d=await e.load(n,{ignoreEncryption:!0}),c=d.getPageCount(),p=new Set;if("all"===t.toLowerCase())for(let u=0;u<c;u++)p.add(u);else t.split(",").forEach(e=>{if((e=e.trim()).includes("-")){let[t,a]=e.split("-"),i=parseInt(t.trim(),10),r="end"===a.trim().toLowerCase()?c:parseInt(a.trim(),10);if(!isNaN(i)&&!isNaN(r))for(let l=i;l<=r;l++)l>=1&&l<=c&&p.add(l-1)}else{let o=parseInt(e.trim(),10);!isNaN(o)&&o>=1&&o<=c&&p.add(o-1)}});if(0===p.size){$("No valid pages selected for rotation.","warning"),P();return}Array.from(p).forEach(e=>{let t=d.getPage(e),a=t.getRotation().angle;t.setRotation(i((a+r)%360))});let g=await d.save(),m=new Blob([g],{type:"application/pdf"});s.appendChild(k(m,`rotated_${a.files[0].name}`)),$("PDF pages rotated successfully!","success")}catch(f){console.error("Error rotating PDF:",f),$(`Error rotating PDF: ${f.message}`,"error")}finally{P()}})},"protect-pdf"(t){t.innerHTML=`
                <div class="form-group">
                    <label for="protect-file">Select PDF file:</label>
                    <input type="file" id="protect-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div class="form-group">
                    <label for="protect-user-password">User Password (to open):</label>
                    <input type="password" id="protect-user-password">
                </div>
                <div class="form-group">
                    <label for="protect-owner-password">Owner Password (to change permissions, optional, defaults to user password if empty):</label>
                    <input type="password" id="protect-owner-password">
                </div>
                <p><strong>Permissions (applied with Owner Password):</strong></p>
                <div class="form-group">
                    <input type="checkbox" id="perm-printing" checked><label for="perm-printing" style="display:inline;font-weight:normal;"> Allow Printing</label><br>
                    <input type="checkbox" id="perm-modifying"><label for="perm-modifying" style="display:inline;font-weight:normal;"> Allow Modifying Document</label><br>
                    <input type="checkbox" id="perm-copying" checked><label for="perm-copying" style="display:inline;font-weight:normal;"> Allow Copying Content</label><br>
                    <input type="checkbox" id="perm-annotating"><label for="perm-annotating" style="display:inline;font-weight:normal;"> Allow Annotating & Form Filling</label><br>
                    <!-- More granular permissions if desired -->
                </div>
                <button id="protect-action" class="tool-button">Protect PDF</button>
                <div id="protect-result"></div>
            `;let a=t.querySelector("#protect-file"),i=t.querySelector(".file-list-container"),r=t.querySelector("#protect-user-password"),l=t.querySelector("#protect-owner-password"),o=t.querySelector("#protect-action"),n=t.querySelector("#protect-result");S=e=>{e.length>0&&(a.files=e,F(a,i))},a.addEventListener("change",()=>F(a,i)),o.addEventListener("click",async()=>{if(!a.files[0]||!r.value){$("Please select a file and enter at least a user password.","error");return}b("Protecting PDF..."),n.innerHTML="";try{let i=await L(a.files[0]),o=await e.load(i,{ignoreEncryption:!0}),s={printing:t.querySelector("#perm-printing").checked?"highResolution":"none",modifying:t.querySelector("#perm-modifying").checked,copying:t.querySelector("#perm-copying").checked,annotating:t.querySelector("#perm-annotating").checked,fillingForms:t.querySelector("#perm-annotating").checked,accessibility:!0,assembling:t.querySelector("#perm-modifying").checked},d=l.value||r.value,c=await o.save({userPassword:r.value,ownerPassword:d,permissions:s}),p=new Blob([c],{type:"application/pdf"});n.appendChild(k(p,`protected_${a.files[0].name}`)),$("PDF Protected.","success")}catch(u){console.error("Error protecting PDF:",u),$(`Error protecting PDF: ${u.message}`,"error")}finally{P()}})},async "unlock-pdf"(t){t.innerHTML=`
               <div class="form-group">
                   <label for="unlock-file">Select Protected PDF file:</label>
                   <input type="file" id="unlock-file" accept=".pdf">
                   <div class="file-list-container"></div>
               </div>
               <div class="form-group">
                   <label for="unlock-password">Password (User or Owner):</label>
                   <input type="password" id="unlock-password">
               </div>
               <button id="unlock-action" class="tool-button">Unlock PDF</button>
               <div id="unlock-result"></div>
           `;let a=t.querySelector("#unlock-file"),i=t.querySelector(".file-list-container"),r=t.querySelector("#unlock-password"),l=t.querySelector("#unlock-action"),o=t.querySelector("#unlock-result");S=e=>{e.length>0&&(a.files=e,F(a,i))},a.addEventListener("change",()=>F(a,i)),l.addEventListener("click",async()=>{if(!a.files[0]||!r.value){$("Please select a file and enter the password.","error");return}b("Unlocking PDF..."),o.innerHTML="";try{let t=await L(a.files[0]),i=await e.load(t,{ownerPassword:r.value,userPassword:r.value}),l=await i.save(),n=new Blob([l],{type:"application/pdf"});o.appendChild(k(n,`unlocked_${a.files[0].name}`)),$("PDF Unlocked successfully!","success")}catch(s){s.message&&(s.message.toLowerCase().includes("password")||s.message.toLowerCase().includes("encrypted"))?$("Incorrect password or PDF uses an unsupported encryption method.","error"):$(`Error unlocking PDF: ${s.message}`,"error"),console.error("Unlock error:",s)}finally{P()}})},async "pdf-to-image"(e){e.innerHTML=`
                <div class="form-group">
                    <label for="pti-file">Select PDF file:</label>
                    <input type="file" id="pti-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div class="form-group">
                    <label for="pti-format">Image Format:</label>
                    <select id="pti-format">
                        <option value="image/png">PNG</option>
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/webp">WEBP</option>
                    </select>
                </div>
                 <div class="form-group">
                    <label for="pti-quality">Quality (for JPEG/WEBP, 0.1 - 1.0):</label>
                    <input type="number" id="pti-quality" value="0.9" step="0.05" min="0.1" max="1.0">
                </div>
                <div class="form-group">
                    <label for="pti-scale">Scale/Resolution (e.g., 1.5 = 150% DPI):</label>
                    <input type="number" id="pti-scale" value="1.5" step="0.1" min="0.5" max="5.0">
                </div>
                <button id="pti-action" class="tool-button">Convert to Images</button>
                <div id="pti-result" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 1rem;"></div>
            `;let t=e.querySelector("#pti-file"),a=e.querySelector(".file-list-container"),i=e.querySelector("#pti-format"),r=e.querySelector("#pti-quality"),l=e.querySelector("#pti-scale"),o=e.querySelector("#pti-action"),n=e.querySelector("#pti-result");function s(){r.disabled="image/png"===i.value,r.closest(".form-group").style.display="image/png"===i.value?"none":"block"}S=e=>{e.length>0&&(t.files=e,F(t,a))},t.addEventListener("change",()=>F(t,a)),i.addEventListener("change",s),s(),o.addEventListener("click",async()=>{if(!t.files[0]){$("Please select a PDF file.","error");return}let e=i.value,a=parseFloat(r.value),o=parseFloat(l.value),s=e.split("/")[1];"jpeg"===s&&(s="jpg"),b("Converting PDF to images..."),n.innerHTML="";try{let d=await L(t.files[0]),c=pdfjsLib.getDocument({data:d,cMapUrl:"https://unpkg.com/pdfjs-dist@3.11.174/cmaps/",cMapPacked:!0}),p=await c.promise,u=p.numPages;for(let g=1;g<=u;g++){let m=await p.getPage(g),f=m.getViewport({scale:o}),y=document.createElement("canvas"),v=y.getContext("2d");y.height=f.height,y.width=f.width;let h={canvasContext:v,viewport:f};await m.render(h).promise;let w;w="image/png"===e?y.toDataURL(e):y.toDataURL(e,a);let S=await (await fetch(w)).blob(),D=k(S,`page_${g}.${s}`,`Download Page ${g} (${s.toUpperCase()})`),E=document.createElement("img");E.src=w,E.style.maxWidth="150px",E.style.maxHeight="200px",E.style.border="1px solid #ccc";let x=document.createElement("div");x.style.textAlign="center",x.appendChild(E),x.appendChild(document.createElement("br")),x.appendChild(D),n.appendChild(x)}$(`PDF converted to ${u} image(s) successfully!`,"success")}catch(F){console.error("Error converting PDF to image:",F),$(`Error converting PDF to image: ${F.message}. Ensure pdf.worker.min.js is accessible.`,"error")}finally{P()}})},async "image-to-pdf"(t){t.innerHTML=`
                <div class="form-group">
                    <label for="itp-files">Select image files (JPG, PNG, WEBP):</label>
                    <input type="file" id="itp-files" accept="image/jpeg, image/png, image/webp" multiple>
                    <div class="file-list"></div> <!-- For listing selected images -->
                </div>
                <button id="itp-action" class="tool-button">Convert to PDF</button>
                <div id="itp-result"></div>
            `;let a=t.querySelector("#itp-files"),i=t.querySelector(".file-list"),r=t.querySelector("#itp-action"),l=t.querySelector("#itp-result");S=e=>{a.files=e,o()};let o=()=>{i.innerHTML="",Array.from(a.files).forEach(e=>{let t=document.createElement("div");t.className="file-list-item",t.textContent=e.name,i.appendChild(t)}),0===a.files.length&&(i.innerHTML='<p class="file-list-display" style="margin-top: 0.5rem; font-size: 0.9em;">No files selected.</p>')};a.addEventListener("change",o),r.addEventListener("click",async()=>{if(0===a.files.length){$("Please select at least one image file.","error");return}b("Converting images to PDF..."),l.innerHTML="";try{let t=await e.create();for(let i of a.files){let r=await L(i),o;if("image/png"===i.type)o=await t.embedPng(r);else if("image/jpeg"===i.type)o=await t.embedJpg(r);else if("image/webp"===i.type){let n=new Image,s=URL.createObjectURL(i);await new Promise((e,t)=>{n.onload=e,n.onerror=t,n.src=s}),URL.revokeObjectURL(s);let d=document.createElement("canvas");d.width=n.width,d.height=n.height;let c=d.getContext("2d");c.drawImage(n,0,0);let p=d.toDataURL("image/png"),u=await fetch(p).then(e=>e.arrayBuffer());o=await t.embedPng(u)}else{$(`Unsupported image type: ${i.name} (${i.type})`,"error");continue}let g=t.addPage([o.width,o.height]);g.drawImage(o,{x:0,y:0,width:o.width,height:o.height})}if(0===t.getPageCount()){$("No valid images were processed.","error"),P();return}let m=await t.save(),f=new Blob([m],{type:"application/pdf"}),y=k(f,"images_converted.pdf","Download PDF from Images");l.appendChild(y),$("Images converted to PDF successfully!","success")}catch(v){console.error("Error converting images to PDF:",v),$(`Error converting images to PDF: ${v.message}`,"error")}finally{P()}})},"reorder-pdf"(t){t.innerHTML=`
                <div class="form-group">
                    <label for="reorder-file">Select PDF file:</label>
                    <input type="file" id="reorder-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div id="reorder-preview-area" style="display: flex; flex-wrap: wrap; gap: 10px; border: 1px solid #ccc; padding: 10px; min-height: 100px; background: var(--primary-bg); margin-bottom: 1rem;">
                    <p>Page previews will appear here. Drag to reorder.</p>
                </div>
                <button id="reorder-action" class="tool-button" style="display:none;">Save Reordered PDF</button>
                <div id="reorder-result"></div>
                <p><small>Note: Drag and drop page previews to change their order. Larger PDFs may take time to render previews.</small></p>
            `;let a=t.querySelector("#reorder-file"),i=t.querySelector(".file-list-container"),r=t.querySelector("#reorder-preview-area"),l=t.querySelector("#reorder-action"),o=t.querySelector("#reorder-result"),n=null,s=[];async function d(){if(F(a,i),a.files[0]){b("Loading PDF for reordering..."),r.innerHTML="<p>Loading previews...</p>",l.style.display="none",o.innerHTML="",s=[];try{n=await L(a.files[0]);let e=pdfjsLib.getDocument({data:n.slice(0)}),t=await e.promise;r.innerHTML="";for(let d=1;d<=t.numPages;d++){s.push(d-1);let c=await t.getPage(d),f=c.getViewport({scale:.3}),y=document.createElement("canvas");y.className="reorder-page-thumbnail",y.draggable=!0,y.dataset.originalIndex=d-1,y.style.border="1px solid #999",y.style.margin="5px",y.style.cursor="grab",y.width=f.width,y.height=f.height;let v=y.getContext("2d"),h={canvasContext:v,viewport:f};await c.render(h).promise;let w=document.createElement("div");w.textContent=`Page ${d}`,w.style.fontSize="0.8em",w.style.textAlign="center";let S=document.createElement("div");S.style.display="inline-block",S.appendChild(y),S.appendChild(w),r.appendChild(S),y.addEventListener("dragstart",p),y.addEventListener("dragover",u),y.addEventListener("drop",g),y.addEventListener("dragend",m)}l.style.display="block",$("PDF loaded. Drag pages to reorder.","info")}catch(D){console.error("Error loading PDF for reorder:",D),$(`Error loading PDF: ${D.message}`,"error"),r.innerHTML="<p>Error loading PDF previews.</p>"}finally{P()}}}S=e=>{e.length>0&&(a.files=e,d())},a.addEventListener("change",d);let c=null;function p(e){c=e.target,e.dataTransfer.effectAllowed="move",e.dataTransfer.setData("text/html",e.target.outerHTML),setTimeout(()=>{e.target.style.opacity="0.5"},0)}function u(e){return e.preventDefault(),e.dataTransfer.dropEffect="move",!1}function g(e){if(e.preventDefault(),"reorder-page-thumbnail"===e.target.className&&e.target!==c){let t=e.target.getBoundingClientRect(),a=e.target.parentElement,i=c.parentElement;e.clientX<t.left+t.width/2?a.parentNode.insertBefore(i,a):a.parentNode.insertBefore(i,a.nextSibling)}c&&(c.style.opacity="1"),c=null}function m(e){e.target.style.opacity="1",c=null,function e(){let t=[],a=r.querySelectorAll(".reorder-page-thumbnail");a.forEach(e=>{t.push(parseInt(e.dataset.originalIndex,10))}),s=t,a.forEach((e,t)=>{let a=e.nextElementSibling;a&&(a.textContent=`New Pos: ${t+1} (Orig: ${parseInt(e.dataset.originalIndex,10)+1})`)})}()}l.addEventListener("click",async()=>{if(!n||0===s.length){$("No PDF loaded or no pages to reorder.","error");return}b("Reordering PDF..."),o.innerHTML="";try{let t=await e.load(n),i=await e.create(),r=await i.copyPages(t,s);r.forEach(e=>i.addPage(e));let l=await i.save(),d=new Blob([l],{type:"application/pdf"});o.appendChild(k(d,`reordered_${a.files[0].name}`)),$("PDF pages reordered successfully!","success")}catch(c){console.error("Error reordering PDF:",c),$(`Error reordering PDF: ${c.message}`,"error")}finally{P()}})},"add-page-numbers"(i){i.innerHTML=`
                <div class="form-group">
                    <label for="apn-file">Select PDF file:</label>
                    <input type="file" id="apn-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div class="form-group">
                    <label for="apn-start-page">Start numbering from physical page:</label>
                    <input type="number" id="apn-start-page" value="1" min="1">
                </div>
                <div class="form-group">
                    <label for="apn-start-number">Starting number to display:</label>
                    <input type="number" id="apn-start-number" value="1" min="1">
                </div>
                <div class="form-group">
                    <label for="apn-position">Position:</label>
                    <select id="apn-position">
                        <option value="footer-center">Footer Center</option>
                        <option value="footer-left">Footer Left</option>
                        <option value="footer-right">Footer Right</option>
                        <option value="header-center">Header Center</option>
                        <option value="header-left">Header Left</option>
                        <option value="header-right">Header Right</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="apn-margin">Margin (from edge, in points):</label>
                    <input type="number" id="apn-margin" value="36" min="0"> <!-- 72 points = 1 inch -->
                </div>
                <div class="form-group">
                    <label for="apn-font-size">Font Size (points):</label>
                    <input type="number" id="apn-font-size" value="10" min="1">
                </div>
                <div class="form-group">
                    <label for="apn-format">Number Format (use {page} for current number, {total} for total pages):</label>
                    <input type="text" id="apn-format" value="Page {page} of {total}">
                </div>
                <button id="apn-action" class="tool-button">Add Page Numbers</button>
                <div id="apn-result"></div>
            `;let r=i.querySelector("#apn-file"),l=i.querySelector(".file-list-container"),o=i.querySelector("#apn-start-page"),n=i.querySelector("#apn-start-number"),s=i.querySelector("#apn-position"),d=i.querySelector("#apn-margin"),c=i.querySelector("#apn-font-size"),p=i.querySelector("#apn-format"),u=i.querySelector("#apn-action"),g=i.querySelector("#apn-result");S=e=>{e.length>0&&(r.files=e,F(r,l))},r.addEventListener("change",()=>F(r,l)),u.addEventListener("click",async()=>{if(!r.files[0]){$("Please select a PDF file.","error");return}b("Adding page numbers..."),g.innerHTML="";try{let i=await L(r.files[0]),l=await e.load(i,{ignoreEncryption:!0}),u=await l.embedFont(a.Helvetica),m=l.getPageCount(),f=parseInt(o.value,10),y=parseInt(n.value,10),v=s.value,h=parseInt(d.value,10),w=parseInt(c.value,10),S=p.value,D=l.getPages();for(let E=0;E<m;E++){if(E+1<f)continue;let x=D[E],{width:F,height:_}=x.getSize(),C=S.replace("{page}",y.toString()).replace("{total}",m.toString()),q=u.widthOfTextAtSize(C,w),T,M,[H,R]=v.split("-");M="header"===H?_-h-w:h,T="left"===R?h:"center"===R?(F-q)/2:F-h-q,x.drawText(C,{x:T,y:M,size:w,font:u,color:t(.1,.1,.1)}),y++}let I=await l.save(),A=new Blob([I],{type:"application/pdf"});g.appendChild(k(A,`numbered_${r.files[0].name}`)),$("Page numbers added successfully!","success")}catch(N){console.error("Error adding page numbers:",N),$(`Error adding page numbers: ${N.message}`,"error")}finally{P()}})},"extract-images"(e){e.innerHTML=`
                <div class="form-group">
                    <label for="extract-img-file">Select PDF file:</label>
                    <input type="file" id="extract-img-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <button id="extract-img-action" class="tool-button">Extract Images</button>
                <div id="extract-img-result" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 1rem;"></div>
                <p><small>Note: Client-side image extraction accuracy depends on PDF structure and image encoding. Supports common formats like JPEG and some raw image types via canvas. Some complex or obscurely embedded images might not be extracted or might appear distorted.</small></p>
            `;let t=e.querySelector("#extract-img-file"),a=e.querySelector(".file-list-container"),i=e.querySelector("#extract-img-action"),r=e.querySelector("#extract-img-result"),l=0;async function o(e,t,a,i){try{let o=new Blob([e],{type:t}),n=t.split("/")[1]||"bin",s=`p${a}_img${i}.${n}`,d=k(o,s,`Download ${s}`),c=document.createElement("img");c.style.maxWidth="150px",c.style.maxHeight="200px",c.style.border="1px solid #ccc",c.style.objectFit="contain",c.onload=()=>URL.revokeObjectURL(c.src),c.onerror=()=>{c.alt=`Preview not available (${t})`,c.src="",c.style.width="150px",c.style.height="100px",c.style.display="flex",c.style.alignItems="center",c.style.justifyContent="center",c.style.backgroundColor="#f0f0f0",c.textContent="No Preview"},c.src=URL.createObjectURL(o);let p=document.createElement("div");p.style.textAlign="center",p.appendChild(c),p.appendChild(document.createElement("br")),p.appendChild(d),r.appendChild(p),l++}catch(u){console.warn(`Could not process image p${a}_img${i}:`,u)}}S=e=>{e.length>0&&(t.files=e,F(t,a))},t.addEventListener("change",()=>F(t,a)),i.addEventListener("click",async()=>{if(!t.files[0]){$("Please select a PDF file.","error");return}b("Extracting images..."),r.innerHTML="",l=0;try{let e=await L(t.files[0]),a=await pdfjsLib.getDocument({data:e.slice(0),cMapUrl:"https://unpkg.com/pdfjs-dist@3.11.174/cmaps/",cMapPacked:!0}).promise;for(let i=0;i<a.numPages;i++){let n=await a.getPage(i+1),s=await n.getOperatorList(),d=new Set,c=0;for(let p=0;p<s.fnArray.length;p++){let u=s.fnArray[p],g=s.argsArray[p];if(u===pdfjsLib.OPS.paintImageXObject||u===pdfjsLib.OPS.paintImageXObjectRepeat){let m=g[0];if(d.has(m))continue;d.add(m),c++;try{let f=await n.commonObjs.get(m);if(f&&f.data){let y="image/unknown",v=f.data;if(f.kind===pdfjsLib.ImageKind.JPEG?y="image/jpeg":f.kind===pdfjsLib.ImageKind.JPX?y="image/png":(f.smask||f.mask)&&(y="image/png"),f.kind!==pdfjsLib.ImageKind.JPEG||"image/png"===y){let h=document.createElement("canvas");h.width=f.width,h.height=f.height;let w=h.getContext("2d");if(f.kind===pdfjsLib.ImageKind.RGBA_32BPP&&v.length===f.width*f.height*4){let S=w.createImageData(f.width,f.height);S.data.set(v),w.putImageData(S,0,0)}else if(f.kind===pdfjsLib.ImageKind.RGB_24BPP&&v.length===f.width*f.height*3){let D=w.createImageData(f.width,f.height),E=0;for(let x=0;x<D.data.length;x+=4)D.data[x]=v[E++],D.data[x+1]=v[E++],D.data[x+2]=v[E++],D.data[x+3]=255;w.putImageData(D,0,0)}else w.drawImage(f,0,0);let k=h.toDataURL(y),F=await (await fetch(k)).blob();await o(F,y,i+1,c);continue}await o(v,y,i+1,c)}}catch(_){console.warn(`Could not get or process image resource ${m} on page ${i+1}:`,_)}}}}l>0?$(`${l} image(s) extracted (or attempted). Some complex images might not be extracted correctly.`,"success"):$("No directly extractable images found or supported by this basic method.","info")}catch(C){console.error("Error extracting images:",C),$(`Error extracting images: ${C.message}`,"error")}finally{P()}})},"edit-metadata"(t){t.innerHTML=`
               <div class="form-group">
                   <label for="meta-file">Select PDF file:</label>
                   <input type="file" id="meta-file" accept=".pdf">
                   <div class="file-list-container"></div>
               </div>
               <div id="meta-fields" style="max-height: 300px; overflow-y:auto; border: 1px solid #ccc; padding:10px; margin-bottom:1rem;"></div>
               <button id="meta-save" class="tool-button" style="display:none;">Save Metadata</button>
               <div id="meta-result"></div>
           `;let a=t.querySelector("#meta-file"),i=t.querySelector(".file-list-container"),r=t.querySelector("#meta-fields"),l=t.querySelector("#meta-save"),o=t.querySelector("#meta-result"),n=null;async function s(){if(F(a,i),a.files[0]){b("Loading metadata..."),r.innerHTML="",l.style.display="none",o.innerHTML="",n=null;try{let t=await L(a.files[0]);n=await e.load(t,{ignoreEncryption:!0,updateMetadata:!1});let s={Title:n.getTitle()||"",Author:n.getAuthor()||"",Subject:n.getSubject()||"",Keywords:n.getKeywords()||"",Creator:n.getCreator()||"",Producer:n.getProducer()||"",CreationDate:n.getCreationDate()?.toLocaleString()||"N/A",ModificationDate:n.getModificationDate()?.toLocaleString()||"N/A"};for(let d in s)r.innerHTML+=`
                           <div class="form-group">
                               <label for="meta-${d.toLowerCase()}">${d}:</label>
                               <input type="text" id="meta-${d.toLowerCase()}" data-key="${d}" 
                                      value="${s[d]}" 
                                      ${d.includes("Date")||"Producer"===d?"disabled":""}>
                           </div>`;l.style.display="block",$("Metadata loaded. Edit fields and save.","info")}catch(c){$(`Error loading metadata: ${c.message}`,"error"),console.error("Metadata load error:",c)}finally{P()}}}S=e=>{e.length>0&&(a.files=e,s())},a.addEventListener("change",s),l.addEventListener("click",async()=>{if(n){b("Saving metadata...");try{n.setTitle(t.querySelector("#meta-title").value),n.setAuthor(t.querySelector("#meta-author").value),n.setSubject(t.querySelector("#meta-subject").value);let e=t.querySelector("#meta-keywords").value;n.setKeywords(e.split(",").map(e=>e.trim()).filter(e=>e)),n.setCreator(t.querySelector("#meta-creator").value);let i=await n.save({updateMetadata:!0}),r=new Blob([i],{type:"application/pdf"});o.appendChild(k(r,`meta_updated_${a.files[0].name}`)),$("Metadata updated successfully!","success")}catch(l){$(`Error saving metadata: ${l.message}`,"error"),console.error("Metadata save error:",l)}finally{P()}}})},"html-to-pdf"(e){e.innerHTML=`
                <div class="form-group">
                    <label for="html-input">Enter HTML content (with inline or &lt;style&gt; CSS):</label>
                    <textarea id="html-input" rows="10" placeholder="<h1>Hello World</h1><p style='color:blue;'>This is a test.</p>"></textarea>
                </div>
                <button id="html-to-pdf-action" class="tool-button">Convert HTML to PDF</button>
                <div id="html-to-pdf-result"></div>
                <p><small>Note: Uses browser's print-to-PDF functionality via an iframe. Complex CSS or external resources might not render perfectly. Best for simple, self-contained HTML.</small></p>
                <iframe id="html-render-iframe" style="width:1px; height:1px; position:absolute; left:-9999px; border:none;"></iframe>

            `;let t=e.querySelector("#html-input"),a=e.querySelector("#html-to-pdf-action"),i=e.querySelector("#html-to-pdf-result"),r=e.querySelector("#html-render-iframe");S=null,a.addEventListener("click",async()=>{let e=t.value;if(!e.trim()){$("Please enter some HTML content.","error");return}b("Converting HTML to PDF..."),i.innerHTML="";try{let a=r.contentWindow.document;a.open(),a.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Print Content</title></head><body>'+e+"</body></html>"),a.close(),await new Promise(e=>setTimeout(e,500)),r.contentWindow.focus(),r.contentWindow.print(),$('Print dialog opened. Please select "Save as PDF".',"info"),i.innerHTML='<p>Your browser\'s print dialog should have appeared. Choose "Save as PDF" to generate the PDF.</p>'}catch(l){console.error("Error converting HTML to PDF:",l),$(`Error during HTML to PDF conversion: ${l.message}`,"error")}finally{P()}})},"esign-pdf"(t){t.innerHTML=`
                <div class="form-group">
                    <label for="esign-file">Select PDF to Sign:</label>
                    <input type="file" id="esign-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                
                <div id="esign-options" style="display:none;">
                    <div class="form-group">
                        <label>Signature Method:</label>
                        <select id="esign-method">
                            <option value="draw">Draw Signature</option>
                            <option value="type">Type Signature</option>
                            <option value="upload">Upload Signature Image</option>
                        </select>
                    </div>

                    <div id="esign-draw-pad" class="esign-method-panel">
                        <label>Draw your signature below:</label>
                        <canvas id="signature-canvas" width="400" height="150" style="border:1px solid #ccc; background-color: #fff; touch-action: none;"></canvas>
                        <button id="clear-signature-button" class="tool-button" style="width:auto; margin-top:5px; background-color: #757575;">Clear</button>
                    </div>
                    <div id="esign-type-pad" class="esign-method-panel" style="display:none;">
                        <label for="typed-signature-text">Type your name/signature:</label>
                        <input type="text" id="typed-signature-text" placeholder="Your Name">
                        <label for="typed-signature-font">Font:</label>
                        <select id="typed-signature-font">
                            <option value="Times New Roman, Times, serif">Times New Roman</option>
                            <option value="Arial, Helvetica, sans-serif">Arial</option>
                            <option value="Courier New, Courier, monospace">Courier New</option>
                            <option value="'Brush Script MT', cursive">Brush Script MT</option>
                            <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                            <option value="'Lucida Handwriting', cursive">Lucida Handwriting</option>
                            <option value="'Sacramento', cursive">Sacramento (Google Font - needs import or local)</option>
                        </select>
                    </div>
                    <div id="esign-upload-pad" class="esign-method-panel" style="display:none;">
                        <label for="signature-image-upload">Upload signature image (PNG, JPG, WEBP with transparent background preferred for PNG/WEBP):</label>
                        <input type="file" id="signature-image-upload" accept="image/png, image/jpeg, image/webp">
                        <img id="signature-image-preview" src="#" alt="Signature preview" style="max-width:200px; max-height:100px; display:none; margin-top:5px; border: 1px solid #eee;"/>
                    </div>

                    <div class="form-group">
                        <label for="esign-page-num">Page to Sign (1-indexed):</label>
                        <input type="number" id="esign-page-num" value="1" min="1">
                    </div>
                     <div class="form-group">
                        <label>Signature Position (Approximate):</label>
                         <select id="esign-position">
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="center">Center</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="esign-scale">Signature Scale (e.g., 0.5 = 50% of original size):</label>
                        <input type="number" id="esign-scale" value="0.5" step="0.1" min="0.1" max="2.0">
                    </div>
                    <button id="esign-apply-action" class="tool-button">Apply Signature & Download</button>
                </div>
                <div id="esign-result"></div>
            `;let a=t.querySelector("#esign-file"),i=t.querySelector(".file-list-container"),r=t.querySelector("#esign-options"),l=t.querySelector("#esign-method"),o=t.querySelector("#esign-draw-pad"),n=t.querySelector("#esign-type-pad"),s=t.querySelector("#esign-upload-pad"),d=t.querySelector("#signature-canvas"),c=t.querySelector("#typed-signature-text"),p=t.querySelector("#typed-signature-font"),u=t.querySelector("#signature-image-upload"),g=t.querySelector("#signature-image-preview"),m=t.querySelector("#clear-signature-button"),f=t.querySelector("#esign-page-num"),y=t.querySelector("#esign-position"),v=t.querySelector("#esign-scale"),h=t.querySelector("#esign-apply-action"),w=t.querySelector("#esign-result"),D=null,E=d.getContext("2d"),x=!1,_,C;async function q(){if(F(a,i),!a.files[0]){r.style.display="none",D=null;return}try{b("Loading PDF..."),D=await L(a.files[0]);let t=await e.load(D.slice(0),{ignoreEncryption:!0});f.max=t.getPageCount(),f.value=Math.min(parseInt(f.value,10)||1,t.getPageCount()),r.style.display="block",$("PDF loaded. Configure signature.","info")}catch(l){$(`Error loading PDF: ${l.message}`,"error"),r.style.display="none",D=null}finally{P()}}function T(e,t){var a=e.getBoundingClientRect();return{x:t.touches[0].clientX-a.left,y:t.touches[0].clientY-a.top}}function M(e,t){var a=e.getBoundingClientRect();return{x:t.clientX-a.left,y:t.clientY-a.top}}E.lineWidth=2.5,E.lineJoin="round",E.lineCap="round",E.strokeStyle="black",S=e=>{e.length>0&&(a.files=e,q())},a.addEventListener("change",q),l.addEventListener("change",()=>{o.style.display="draw"===l.value?"block":"none",n.style.display="type"===l.value?"block":"none",s.style.display="upload"===l.value?"block":"none"}),d.addEventListener("mousedown",e=>{let t=M(d,e);x=!0,_=t.x,C=t.y,E.beginPath()},!1),d.addEventListener("mousemove",e=>{if(!x)return;let t=M(d,e);E.moveTo(_,C),E.lineTo(t.x,t.y),E.stroke(),_=t.x,C=t.y},!1),d.addEventListener("mouseup",()=>x=!1,!1),d.addEventListener("mouseout",()=>x=!1,!1),d.addEventListener("touchstart",e=>{e.preventDefault();let t=T(d,e);x=!0,_=t.x,C=t.y,E.beginPath()},!1),d.addEventListener("touchmove",e=>{if(e.preventDefault(),!x)return;let t=T(d,e);E.moveTo(_,C),E.lineTo(t.x,t.y),E.stroke(),_=t.x,C=t.y},!1),d.addEventListener("touchend",()=>x=!1,!1),m.addEventListener("click",()=>{E.clearRect(0,0,d.width,d.height)}),u.addEventListener("change",e=>{if(e.target.files&&e.target.files[0]){let t=new FileReader;t.onload=e=>{g.src=e.target.result,g.style.display="block"},t.readAsDataURL(e.target.files[0])}else g.style.display="none",g.src="#"}),h.addEventListener("click",async()=>{if(!D){$("Please select a PDF file first.","error");return}let t=parseInt(f.value,10),i=parseFloat(v.value);if(isNaN(t)||t<1){$("Please enter a valid page number.","error");return}if(isNaN(i)||i<=0){$("Please enter a valid signature scale > 0.","error");return}b("Applying signature..."),w.innerHTML="";try{let r=await e.load(D.slice(0),{ignoreEncryption:!0});if(t>r.getPageCount()){$(`Page ${t} does not exist. PDF has ${r.getPageCount()} pages.`,"error"),P();return}let o=r.getPage(t-1),n,s={width:150,height:75};if("draw"===l.value){let g=document.createElement("canvas");if(g.width=d.width,g.height=d.height,d.toDataURL()===g.toDataURL()){$("Please draw a signature or choose another method.","error"),P();return}let m=await fetch(d.toDataURL("image/png")).then(e=>e.arrayBuffer());s=(n=await r.embedPng(m)).scale(i)}else if("type"===l.value){let h=c.value,S=p.value;if(!h.trim()){$("Please type a signature.","error"),P();return}let E=document.createElement("canvas"),x=E.getContext("2d");x.font=`60px ${S}`;let F=x.measureText(h);E.width=F.width+40,E.height=100,x.font=`60px ${S}`,x.fillStyle="black",x.textBaseline="middle",x.textAlign="center",x.fillText(h,E.width/2,E.height/2);let _=await fetch(E.toDataURL("image/png")).then(e=>e.arrayBuffer());s=(n=await r.embedPng(_)).scale(i)}else if("upload"===l.value){if(!u.files[0]){$("Please upload a signature image.","error"),P();return}let C=await L(u.files[0]),q=u.files[0].type;if("image/png"===q)n=await r.embedPng(C);else if("image/jpeg"===q)n=await r.embedJpg(C);else if("image/webp"===q){let T=new Image,M=URL.createObjectURL(new Blob([C]));await new Promise((e,t)=>{T.onload=e,T.onerror=t,T.src=M}),URL.revokeObjectURL(M);let H=document.createElement("canvas");H.width=T.width,H.height=T.height,H.getContext("2d").drawImage(T,0,0);let R=await fetch(H.toDataURL("image/png")).then(e=>e.arrayBuffer());n=await r.embedPng(R)}else{$("Unsupported image type for upload. Use PNG, JPG, or WEBP.","error"),P();return}s=n.scale(i)}let{width:I,height:A}=o.getSize(),N,B,U=.05*Math.min(I,A);switch(y.value){case"bottom-right":N=I-s.width-U,B=U;break;case"bottom-left":N=U,B=U;break;case"top-right":N=I-s.width-U,B=A-s.height-U;break;case"top-left":N=U,B=A-s.height-U;break;default:N=(I-s.width)/2,B=(A-s.height)/2}o.drawImage(n,{x:N,y:B,width:s.width,height:s.height});let z=await r.save(),j=new Blob([z],{type:"application/pdf"});w.appendChild(k(j,`signed_${a.files[0].name}`)),$("Signature applied successfully!","success")}catch(O){console.error("Error applying signature:",O),$(`Error applying signature: ${O.message}`,"error")}finally{P()}})}};f()});