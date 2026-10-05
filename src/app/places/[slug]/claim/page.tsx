"use client";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

export default function ClaimPlacePage(){
 const params=useParams<{slug:string}>(); const slug=params.slug;
 const [role,setRole]=useState("owner"),[email,setEmail]=useState(""),[phone,setPhone]=useState(""),[message,setMessage]=useState(""),[file,setFile]=useState<File|null>(null),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setStatus("");if(!file)return setStatus("Allega una prova privata.");setBusy(true);
  const {data:{user}}=await supabase.auth.getUser(); if(!user){setBusy(false);return setStatus("Accedi prima di inviare la richiesta.");}
  const ext=file.name.split('.').pop()||'bin'; const path=`${user.id}/${slug}/${crypto.randomUUID()}.${ext}`;
  const up=await supabase.storage.from("place-claim-proofs").upload(path,file,{upsert:false}); if(up.error){setBusy(false);return setStatus(up.error.message);}
  const res=await supabase.from("place_claims").insert({place_slug:slug,user_id:user.id,claimant_role:role,business_email:email.trim()||null,business_phone:phone.trim()||null,message:message.trim()||null,proof_path:path});
  setBusy(false); setStatus(res.error?res.error.message:"Richiesta inviata. Sarà esaminata dagli amministratori.");
 }
 return <main style={{maxWidth:700,margin:"0 auto",padding:30}}><Link href={`/places/${slug}`}>← Torna al locale</Link><h1>Rivendica questo locale</h1><p>La prova è privata e visibile solo agli amministratori.</p><form onSubmit={submit} style={{display:"grid",gap:14}}><label>Ruolo<select value={role} onChange={e=>setRole(e.target.value)}><option value="owner">Proprietario</option><option value="manager">Responsabile</option><option value="authorized_representative">Rappresentante autorizzato</option></select></label><label>Email aziendale<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Telefono aziendale<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><label>Messaggio<textarea rows={5} value={message} onChange={e=>setMessage(e.target.value)}/></label><label>Prova privata<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button disabled={busy}>{busy?"Invio...":"Invia richiesta"}</button></form>{status&&<p><strong>{status}</strong></p>}</main>;
}
