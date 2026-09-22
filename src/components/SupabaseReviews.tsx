"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import RatingSummary from "@/components/RatingSummary";
import ReviewForm from "@/components/ReviewForm";

type PublicReview = { id:number; user_id:string; rating:number; title:string; comment:string; created_at:string; display_name?:string };
type Props = { placeSlug:string };

export default function SupabaseReviews({ placeSlug }:Props) {
  const [reviews,setReviews]=useState<PublicReview[]>([]);
  const [loading,setLoading]=useState(true);
  const [errorMessage,setErrorMessage]=useState("");

  const loadReviews=useCallback(async()=>{
    setLoading(true); setErrorMessage("");
    const {data,error}=await supabase.from("reviews").select("id, user_id, rating, title, comment, created_at").eq("place_slug",placeSlug).eq("approved",true).order("created_at",{ascending:false});
    if(error){setErrorMessage(error.message);setLoading(false);return;}
    const items=data??[];
    const userIds=[...new Set(items.map(item=>item.user_id))];
    let names=new Map<string,string>();
    if(userIds.length){
      const {data:profiles}=await supabase.from("profiles").select("id, display_name").in("id",userIds);
      names=new Map((profiles??[]).map(profile=>[profile.id,profile.display_name||"Utente registrato"]));
    }
    setReviews(items.map(item=>({...item,display_name:names.get(item.user_id)||"Utente registrato"})));
    setLoading(false);
  },[placeSlug]);

  useEffect(()=>{loadReviews();},[loadReviews]);
  const average=reviews.length?reviews.reduce((sum,item)=>sum+item.rating,0)/reviews.length:0;

  return <>
    <RatingSummary average={average} count={reviews.length}/>
    <section><h2>Recensioni approvate</h2>
      {loading&&<p>Caricamento recensioni...</p>}
      {errorMessage&&<p style={{color:"#7f1d1d"}}>{errorMessage}</p>}
      {!loading&&!errorMessage&&reviews.length===0&&<p>Non sono ancora presenti recensioni approvate.</p>}
      <div style={{display:"grid",gap:"16px"}}>{reviews.map(review=><article key={review.id} style={reviewStyle}>
        <h3>{review.title}</h3><p>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</p><p>{review.comment}</p>
        <small><strong>{review.display_name}</strong> · {new Intl.DateTimeFormat("it-IT").format(new Date(review.created_at))}</small>
      </article>)}</div>
    </section>
    <ReviewForm placeSlug={placeSlug} onReviewSubmitted={loadReviews}/>
  </>;
}
const reviewStyle={padding:"18px",border:"1px solid #d6d6d6",borderRadius:"10px",background:"#fff"};
