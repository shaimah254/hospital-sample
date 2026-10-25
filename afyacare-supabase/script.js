const menuToggle=document.getElementById('menuToggle'),mobileMenu=document.getElementById('mobileMenu');
menuToggle.addEventListener('click',()=>{const open=mobileMenu.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));menuToggle.textContent=open?'×':'☰';});
mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');menuToggle.textContent='☰';}));
const modal=document.getElementById('modalBackdrop'),modalTitle=document.getElementById('modalTitle'),modalText=document.getElementById('modalText');
function showModal(title,copy){modalTitle.textContent=title;modalText.textContent=copy;modal.classList.add('open');document.getElementById('modalClose').focus();}
function closeModal(){modal.classList.remove('open');}
document.getElementById('modalClose').addEventListener('click',closeModal);document.getElementById('modalOkay').addEventListener('click',closeModal);modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
document.querySelectorAll('.read-tip').forEach(btn=>btn.addEventListener('click',()=>showModal(btn.dataset.title,btn.dataset.copy)));
document.querySelectorAll('.doctor-btn').forEach(btn=>btn.addEventListener('click',()=>{document.getElementById('department').value=btn.dataset.doctor.includes('Brian')?'Pediatrics':btn.dataset.doctor.includes('Wanjiku')?"Maternity & Women's Health":'General Medicine';document.getElementById('appointment').scrollIntoView({behavior:'smooth'});document.getElementById('fullName').focus({preventScroll:true});}));
const today=new Date();const localDate=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);document.querySelectorAll('input[type="date"]').forEach(el=>el.min=localDate);
function announce(el,msg,isError=false){el.textContent=msg;el.classList.toggle('error',isError);el.classList.add('show');}
document.getElementById('quickBooking').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.target);document.getElementById('department').value=data.get('department');document.getElementById('preferredDate').value=data.get('date');document.getElementById('appointment').scrollIntoView({behavior:'smooth'});announce(document.getElementById('quickNotice'),'Your selections are ready below. Add your contact details and consent to send your request.');});

// Configure this with the deployed Supabase Edge Function URL. It is safe to put the function URL here; NEVER put a service-role key in browser code.
const APPOINTMENT_FUNCTION_URL = 'PASTE_YOUR_SUPABASE_FUNCTION_URL_HERE';
const appointmentForm=document.getElementById('appointmentForm');
appointmentForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const notice=document.getElementById('formNotice');
  const submitButton=appointmentForm.querySelector('button[type="submit"]');
  if(APPOINTMENT_FUNCTION_URL.includes('PASTE_YOUR')){announce(notice,'Setup incomplete: add your deployed Supabase function URL in script.js before testing.',true);return;}
  const payload={
    fullName:document.getElementById('fullName').value.trim(),
    phone:document.getElementById('phone').value.trim(),
    department:document.getElementById('department').value,
    preferredDate:document.getElementById('preferredDate').value,
    consent:document.getElementById('privacyConsent').checked
  };
  if(!payload.consent){announce(notice,'Please confirm the contact-use consent before submitting.',true);return;}
  submitButton.disabled=true;submitButton.textContent='Sending request…';notice.classList.remove('show','error');
  try{
    const response=await fetch(APPOINTMENT_FUNCTION_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||'Unable to submit right now. Please try again later.');
    announce(notice,'Thank you. Your request has been sent to reception. This is a request only; the hospital must confirm your appointment.');
    appointmentForm.reset();
  }catch(error){announce(notice,error.message||'Something went wrong. Please try again later.',true);}
  finally{submitButton.disabled=false;submitButton.textContent='Submit appointment request →';}
});
const quotes=[['“The team took time to listen and explain each step. I felt respected and supported throughout my visit.”','— Sample patient feedback'],['“The appointment process was simple, and the staff made our family feel welcome.”','— Sample family feedback'],['“I appreciated the clear explanations and the kind approach from the care team.”','— Sample patient feedback']];
let quoteIndex=0;function renderQuote(){document.getElementById('quoteText').textContent=quotes[quoteIndex][0];document.getElementById('quoteAuthor').textContent=quotes[quoteIndex][1]}document.getElementById('nextQuote').addEventListener('click',()=>{quoteIndex=(quoteIndex+1)%quotes.length;renderQuote()});document.getElementById('prevQuote').addEventListener('click',()=>{quoteIndex=(quoteIndex+quotes.length-1)%quotes.length;renderQuote()});
document.getElementById('year').textContent=new Date().getFullYear();
